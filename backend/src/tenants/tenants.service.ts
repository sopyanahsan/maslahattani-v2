import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import * as bcrypt from 'bcryptjs';

export interface RegisterTenantDto {
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
}

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Register a new tenant (from landing page).
   * Creates: Tenant → Subscription (TRIAL) → User (SUPER_ADMIN) → Shop
   * All in one transaction.
   */
  async register(dto: RegisterTenantDto) {
    // Validate
    if (!dto.storeName || !dto.ownerName || !dto.phone || !dto.email || !dto.password) {
      throw new BadRequestException('Semua field wajib diisi.');
    }

    if (dto.password.length < 6) {
      throw new BadRequestException('Password minimal 6 karakter.');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar. Silakan login atau gunakan email lain.');
    }

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { ownerEmail: dto.email },
    });
    if (existingTenant) {
      throw new ConflictException('Email sudah terdaftar sebagai pemilik toko lain.');
    }

    // Generate slug from store name
    const slug = this.generateSlug(dto.storeName);

    // Check slug uniqueness
    const existingSlug = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Nama toko sudah digunakan. Coba nama lain.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create everything in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.storeName,
          slug,
          ownerName: dto.ownerName,
          ownerPhone: dto.phone,
          ownerEmail: dto.email,
        },
      });

      // 2. Create User (SUPER_ADMIN of this tenant)
      const user = await tx.user.create({
        data: {
          email: dto.email,
          username: dto.ownerName.toLowerCase().replace(/\s+/g, '.'),
          passwordHash,
          fullName: dto.ownerName,
          phone: dto.phone,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          tenantId: tenant.id,
          otpEnabled: false,
        },
      });

      // 3. Create default Shop
      const shop = await tx.shop.create({
        data: {
          name: dto.storeName,
          address: '-',
          phone: dto.phone,
          ownerId: user.id,
          tenantId: tenant.id,
        },
      });

      // 4. Link user to shop
      await tx.user.update({
        where: { id: user.id },
        data: { shopId: shop.id },
      });

      // 5. Create ShopSetting (defaults)
      await tx.shopSetting.create({
        data: {
          shopId: shop.id,
          language: 'id',
        },
      });

      // 6. Create default CashBoxCategory (RETAIL)
      const retailCategory = await tx.cashBoxCategory.findFirst({
        where: { code: 'RETAIL' },
      });
      if (!retailCategory) {
        await tx.cashBoxCategory.create({
          data: {
            code: 'RETAIL',
            name: 'Kas Retail',
            isDefault: true,
            isActive: true,
            sortOrder: 0,
          },
        });
      }

      return { tenant, user, shop };
    });

    // 7. Create Trial Subscription (outside transaction for simpler code)
    await this.subscriptionService.createTrialSubscription(result.tenant.id);

    return {
      success: true,
      message: `Selamat! Toko "${dto.storeName}" berhasil didaftarkan. Silakan login.`,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      trial: {
        daysRemaining: 14,
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  /**
   * Generate URL-friendly slug from store name.
   */
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    // Add random suffix to avoid collision
    const rand = Math.random().toString(36).substring(2, 6);
    return `${slug}-${rand}`;
  }
}
