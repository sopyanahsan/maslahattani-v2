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
  // DELETE / DISABLE SHOP
  // ============================================

  async remove(id: string, user: AuthUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Hanya super admin yang bisa menghapus cabang.');
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, products: true, transactions: true } },
      },
    });

    if (!shop) {
      throw new NotFoundException('Cabang tidak ditemukan.');
    }

    // Prevent deleting the branch user is currently on
    if (user.shopId === id) {
      throw new ConflictException('Tidak bisa menghapus cabang yang sedang aktif. Pindah ke cabang lain dulu.');
    }

    const hasData = (shop._count.transactions > 0) || (shop._count.products > 0) || (shop._count.users > 0);

    if (hasData) {
      // Soft-disable: don't actually delete, just mark as disabled
      // For now we throw a clear error since we don't have isActive field on Shop
      throw new ConflictException(
        `Cabang "${shop.name}" tidak bisa dihapus karena masih punya data (${shop._count.users} kasir, ${shop._count.products} produk, ${shop._count.transactions} transaksi). Kosongkan data atau hubungi developer untuk nonaktifkan.`,
      );
    }

    // Hard delete — cabang benar-benar kosong
    await this.prisma.$transaction(async (tx) => {
      // Delete related settings, cashbox, etc
      await tx.shopSetting.deleteMany({ where: { shopId: id } });
      await tx.cashBox.deleteMany({ where: { shopId: id } });
      await tx.shop.delete({ where: { id } });
    });

    return { success: true, message: `Cabang "${shop.name}" berhasil dihapus.` };
  }

  // ============================================
  // MULTI-BRANCH OVERVIEW (Dashboard Lintas Cabang)
  // ============================================

  async getMultiBranchOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shops = await this.prisma.shop.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { users: true, products: true } },
      },
    });

    const overview = await Promise.all(
      shops.map(async (shop) => {
        // Today's transactions
        const todayTrx = await this.prisma.transaction.aggregate({
          where: { shopId: shop.id, status: 'COMPLETED', createdAt: { gte: today } },
          _sum: { totalPrice: true },
          _count: true,
        });

        // Low stock count (quantity <= 5)
        const lowStock = await this.prisma.stock.count({
          where: { shopId: shop.id, quantity: { lte: 5 }, product: { deletedAt: null } },
        });

        // Kas retail total (all cashboxes)
        const kasRetail = await this.prisma.cashBox.aggregate({
          where: { shopId: shop.id },
          _sum: { balance: true },
        });

        // BRILink total balance
        const kasBrilink = await this.prisma.brilinkAccount.aggregate({
          where: { shopId: shop.id, isActive: true },
          _sum: { balance: true },
        });

        // Active shift (kasir online)
        const activeShifts = await this.prisma.shift.count({
          where: { shopId: shop.id, status: 'OPEN' },
        });

        return {
          id: shop.id,
          name: shop.name,
          address: shop.address,
          phone: shop.phone,
          stats: {
            omzetHariIni: todayTrx._sum.totalPrice || 0,
            trxHariIni: todayTrx._count || 0,
            kasirTotal: shop._count.users,
            kasirAktif: activeShifts,
            produkTotal: shop._count.products,
            stokRendah: lowStock,
            kasRetail: kasRetail._sum.balance || 0,
            kasBrilink: kasBrilink._sum.balance || 0,
          },
        };
      }),
    );

    // Totals
    const totals = {
      omzet: overview.reduce((s, o) => s + o.stats.omzetHariIni, 0),
      trx: overview.reduce((s, o) => s + o.stats.trxHariIni, 0),
      kasRetail: overview.reduce((s, o) => s + o.stats.kasRetail, 0),
      kasBrilink: overview.reduce((s, o) => s + o.stats.kasBrilink, 0),
      stokRendah: overview.reduce((s, o) => s + o.stats.stokRendah, 0),
    };

    return { shops: overview, totals, generatedAt: new Date().toISOString() };
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
        notifSoundEnabled: dto.notifSoundEnabled,
        notifSoundTone: dto.notifSoundTone,
        receiptConfig: dto.receiptConfig,
        language: dto.language,
      },
    });
    return { success: true, settings: updated };
  }
}
