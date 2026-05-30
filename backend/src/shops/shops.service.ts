import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

interface AuthUser {
  id: string;
  email: string | null;
  username?: string | null;
  role: Role;
  shopId?: string | null;
}

@Injectable()
export class ShopsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * List cabang yang bisa diakses user saat ini.
   * - SUPER_ADMIN: semua cabang di sistem
   * - User lain: hanya cabang yang shopId-nya match
   */
  async listAccessible(user: AuthUser) {
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.shop.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { users: true, products: true, transactions: true },
          },
        },
      });
    }

    if (!user.shopId) {
      return [];
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: user.shopId },
      include: {
        _count: {
          select: { users: true, products: true, transactions: true },
        },
      },
    });

    return shop ? [shop] : [];
  }

  /**
   * Detail cabang. SUPER_ADMIN bisa lihat semua, lainnya hanya cabangnya sendiri.
   */
  async findOne(id: string, user: AuthUser) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, username: true } },
        parentShop: { select: { id: true, name: true } },
        childShops: { select: { id: true, name: true } },
        settings: true,
        _count: {
          select: { users: true, products: true, transactions: true },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Cabang tidak ditemukan.');
    }

    if (user.role !== Role.SUPER_ADMIN && user.shopId !== id) {
      throw new ForbiddenException('Anda tidak punya akses ke cabang ini.');
    }

    return shop;
  }

  /**
   * Buat cabang baru. SUPER_ADMIN only.
   * Otomatis bikin ShopSetting + CashBox default.
   */
  async create(dto: CreateShopDto, user: AuthUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Hanya super admin yang bisa membuat cabang.');
    }

    // Validate parentShop kalau diisi
    if (dto.parentShopId) {
      const parent = await this.prisma.shop.findUnique({
        where: { id: dto.parentShopId },
      });
      if (!parent) {
        throw new NotFoundException('Cabang induk tidak ditemukan.');
      }
    }

    const shop = await this.prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: {
          name: dto.name,
          address: dto.address,
          phone: dto.phone,
          parentShopId: dto.parentShopId,
          ownerId: user.id, // super-admin pembuat = default owner; bisa di-reassign nanti
        },
      });

      // Default ShopSetting
      await tx.shopSetting.create({
        data: {
          shopId: newShop.id,
          language: 'id',
          receiptConfig: JSON.stringify({
            autoPrint: true,
            mergeReceipts: false,
            footerMessage: 'Terima kasih sudah berbelanja!',
          }),
        },
      });

      // Default CashBox
      await tx.cashBox.create({
        data: { shopId: newShop.id, balance: 0 },
      });

      return newShop;
    });

    return shop;
  }

  /**
   * Update cabang. SUPER_ADMIN bisa edit semua, ADMIN hanya cabangnya sendiri.
   */
  async update(id: string, dto: UpdateShopDto, user: AuthUser) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new NotFoundException('Cabang tidak ditemukan.');
    }

    const canUpdate =
      user.role === Role.SUPER_ADMIN ||
      (user.role === Role.ADMIN && user.shopId === id);

    if (!canUpdate) {
      throw new ForbiddenException('Anda tidak punya izin untuk mengubah cabang ini.');
    }

    return this.prisma.shop.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  /**
   * Pilih cabang aktif → re-issue JWT dengan claim shopId yang baru.
   *
   * Dipakai untuk:
   * 1. Super-admin selesai login (token awal shopId=null) → pilih cabang → token full
   * 2. Super-admin yang udah login → ganti cabang aktif (context switch)
   *
   * Akses:
   * - SUPER_ADMIN: bisa pilih cabang manapun
   * - Lainnya: hanya cabang yang sudah di-assign (user.shopId == requested id)
   */
  async selectShop(shopId: string, user: AuthUser) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Cabang tidak ditemukan.');
    }

    if (user.role !== Role.SUPER_ADMIN && user.shopId !== shopId) {
      throw new ForbiddenException('Anda tidak punya akses ke cabang ini.');
    }

    // Generate new tokens dengan claim shopId baru
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
        expiresIn: parseInt(this.configService.get('JWT_EXPIRATION', '86400')),
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh',
        expiresIn: parseInt(
          this.configService.get('JWT_REFRESH_EXPIRATION', '2592000'),
        ),
      }),
    ]);

    const expiresAt = new Date(
      Date.now() + parseInt(this.configService.get('JWT_EXPIRATION', '86400')) * 1000,
    );
    const refreshExpiresAt = new Date(
      Date.now() +
        parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')) * 1000,
    );

    // Buat session baru (tidak menghapus session lama supaya kalau user buka di
    // tab lain dengan shop lama tetap jalan; cleanup session bisa via /logout)
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
      },
    });

    return {
      success: true,
      token: accessToken,
      refreshToken,
      shop: {
        id: shop.id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
      },
    };
  }

  /**
   * Helper internal — dipakai dari AuthService.login() untuk hitung shop yg
   * bisa diakses user setelah authenticate. Tidak dipakai dari HTTP layer.
   */
  async getAccessibleShopsForUser(user: AuthUser) {
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.shop.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, address: true, phone: true },
      });
    }

    if (!user.shopId) {
      return [];
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { id: true, name: true, address: true, phone: true },
    });

    return shop ? [shop] : [];
  }

  // ============================================
  // SHOP SETTINGS
  // ============================================

  async getSettings(shopId: string) {
    let settings = await this.prisma.shopSetting.findUnique({ where: { shopId } });
    if (!settings) {
      // Auto-create default settings
      settings = await this.prisma.shopSetting.create({ data: { shopId } });
    }
    return settings;
  }

  async updateSettings(shopId: string, dto: any) {
    // Ensure settings exist
    let settings = await this.prisma.shopSetting.findUnique({ where: { shopId } });
    if (!settings) {
      settings = await this.prisma.shopSetting.create({ data: { shopId } });
    }

    const updated = await this.prisma.shopSetting.update({
      where: { shopId },
      data: {
        brilinkEnabled: dto.brilinkEnabled,
        shiftMode: dto.shiftMode,
        shiftForceCloseOnSwitch: dto.shiftForceCloseOnSwitch,
        shiftCorrectionRequired: dto.shiftCorrectionRequired,
        shiftPhysicalCountRequired: dto.shiftPhysicalCountRequired,
        shiftGuardEnabled: dto.shiftGuardEnabled,
        cashOutApprovalEnabled: dto.cashOutApprovalEnabled,
        paymentCashEnabled: dto.paymentCashEnabled,
        paymentQrisEnabled: dto.paymentQrisEnabled,
        paymentHutangEnabled: dto.paymentHutangEnabled,
        saveBillEnabled: dto.saveBillEnabled,
        discountPerItemEnabled: dto.discountPerItemEnabled,
        discountTotalEnabled: dto.discountTotalEnabled,
        notePerItemEnabled: dto.notePerItemEnabled,
        receiptConfig: dto.receiptConfig,
        language: dto.language,
      },
    });
    return { success: true, settings: updated };
  }
}
