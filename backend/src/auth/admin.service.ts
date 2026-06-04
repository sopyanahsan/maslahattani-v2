import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKasirDto, UpdateKasirDto } from './dto/admin-user.dto';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all users (kasir + admin cabang), optional filter by shopId
   */
  async listKasir(shopId?: string) {
    const where: any = { role: { in: [Role.KASIR, Role.ADMIN, Role.CASHIER_SUPERVISOR] } };
    if (shopId) {
      where.shopId = shopId;
    }

    const kasirList = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        shopId: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: kasirList, total: kasirList.length };
  }

  /**
   * Create new kasir with username + PIN (no email required)
   */
  async createKasir(dto: CreateKasirDto) {
    // Check username exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username.toLowerCase() },
    });
    if (existingUsername) {
      throw new ConflictException('Username sudah digunakan.');
    }

    // Check email if provided
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException('Email sudah terdaftar.');
      }
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(dto.pin, 12);

    // Generate a placeholder password hash (kasir uses PIN, not password)
    const placeholderPassword = await bcrypt.hash(
      `ngalir_${Date.now()}_${Math.random()}`,
      12,
    );

    // Create user. Email is null if not provided — kasir can add later via
    // profile page with OTP verification.
    const kasir = await this.prisma.user.create({
      data: {
        email: dto.email?.toLowerCase() || null,
        username: dto.username.toLowerCase(),
        passwordHash: placeholderPassword,
        pin: pinHash,
        pinChangedAt: new Date(),
        role: dto.role || Role.KASIR,
        status: UserStatus.ACTIVE,
        shopId: dto.shopId || null,
        mustChangePassword: false,
        mustChangePin: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        shopId: true,
        createdAt: true,
      },
    });

    return {
      kasir,
      message: `Kasir "${dto.username}" berhasil dibuat dengan PIN.`,
    };
  }

  /**
   * Update kasir (status, shopId)
   */
  async updateKasir(id: string, dto: UpdateKasirDto) {
    const kasir = await this.prisma.user.findUnique({ where: { id } });

    if (!kasir) {
      throw new NotFoundException('Kasir tidak ditemukan.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status ?? kasir.status,
        shopId: dto.shopId ?? kasir.shopId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        shopId: true,
      },
    });

    return { kasir: updated };
  }

  /**
   * Reset kasir PIN and generate new temp PIN
   */
  async resetKasirPin(id: string) {
    const kasir = await this.prisma.user.findUnique({ where: { id } });

    if (!kasir) {
      throw new NotFoundException('Kasir tidak ditemukan.');
    }

    // Generate random 4-digit PIN
    const newPin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await bcrypt.hash(newPin, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        pin: pinHash,
        pinChangedAt: new Date(),
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({ where: { userId: id } });

    return {
      tempPin: newPin,
      message: `PIN berhasil direset. PIN baru: ${newPin}`,
    };
  }

  /**
   * Reset kasir password and generate new temp password
   */
  async resetKasirPassword(id: string) {
    const kasir = await this.prisma.user.findUnique({ where: { id } });

    if (!kasir) {
      throw new NotFoundException('Kasir tidak ditemukan.');
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        lastPasswordReset: new Date(),
      },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({ where: { userId: id } });

    return {
      tempPassword,
      message: `Password berhasil direset. Password baru: ${tempPassword}`,
    };
  }

  /**
   * Suggest username berdasarkan email (avoid duplicates)
   */
  async suggestUsername(email: string) {
    const suggestions = await this.generateUsernameSuggestions(email);
    return { suggestions };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let username = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }

  private async generateUsernameSuggestions(email: string): Promise<string[]> {
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const suggestions: string[] = [];

    for (let i = 0; i <= 4; i++) {
      const candidate = i === 0 ? base : `${base}${i}`;
      const exists = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) {
        suggestions.push(candidate);
      }
      if (suggestions.length >= 3) break;
    }

    // Add random suffix suggestions
    if (suggestions.length < 3) {
      const randomSuffix = Math.floor(Math.random() * 999);
      suggestions.push(`${base}${randomSuffix}`);
    }

    return suggestions;
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!';
  }
}
