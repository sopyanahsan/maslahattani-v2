import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ShopsService } from '../shops/shops.service';
import { OtpService } from './otp.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { RegisterKasirDto, VerifyOtpDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { LoginPinDto, ChangePinDto } from './dto/login-pin.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Role, UserStatus } from '@prisma/client';

interface TokenPayload {
  sub: string;
  email: string | null;
  role: Role;
  shopId?: string;
  tenantId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private shopsService: ShopsService,
    private firebaseAdmin: FirebaseAdminService,
  ) {}

  // ============================================
  // REGISTER KASIR
  // ============================================

  async registerKasir(dto: RegisterKasirDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const otp = this.otpService.generateOtp(dto.email);
    await this.otpService.sendOtp(dto.email, otp);

    return {
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda. Silakan verifikasi.',
    };
  }

  async verifyOtpAndCreateKasir(dto: VerifyOtpDto & { password: string }) {
    const otpResult = this.otpService.verifyOtp(dto.email, dto.otp);
    if (!otpResult.valid) {
      throw new BadRequestException(otpResult.message);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // NOTE: kasir baru terdaftar tanpa shopId. Admin perlu assign cabang
    // sebelum kasir bisa login (kalau coba login akan dapet 403).
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.KASIR,
        status: UserStatus.ACTIVE,
      },
    });

    return {
      success: true,
      message:
        'Registrasi berhasil! Akun Anda akan aktif setelah admin assign ke cabang.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier.toLowerCase() },
          { username: dto.identifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    // ============================================
    // OTP step (only if user has otpEnabled = true)
    // ============================================
    if (user.otpEnabled) {
      if (!user.email) {
        throw new UnauthorizedException(
          'Akun ini memiliki 2FA aktif tapi tidak punya email. Hubungi super-admin.',
        );
      }
      if (!dto.otp) {
        const otp = this.otpService.generateOtp(user.email);
        await this.otpService.sendOtp(user.email, otp);
        return {
          success: false,
          requireOtp: true,
          message: 'Kode OTP telah dikirim ke email Anda.',
        };
      }

      const otpResult = this.otpService.verifyOtp(user.email, dto.otp);
      if (!otpResult.valid) {
        throw new UnauthorizedException(otpResult.message);
      }
    }

    // ============================================
    // SUPER_ADMIN flow: tidak punya shopId tetap, harus pilih cabang dulu
    // ============================================
    if (user.role === Role.SUPER_ADMIN) {
      // Issue token tanpa shopId — frontend akan redirect ke shop selection,
      // user pilih cabang, lalu POST /api/shops/select/:id buat re-issue token full.
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        shopId: undefined,
      });

      await this.createSession(
        user.id,
        tokens.accessToken,
        tokens.refreshToken,
        ipAddress,
        userAgent,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const shops = await this.shopsService.getAccessibleShopsForUser({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        shopId: null,
      });

      return {
        success: true,
        requireShopSelection: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          shopId: null,
        },
        shops,
      };
    }

    // ============================================
    // Regular user (ADMIN/KASIR/CASHIER_SUPERVISOR): wajib punya shopId
    // ============================================
    if (!user.shopId) {
      throw new ForbiddenException(
        'Akun Anda belum di-assign ke cabang. Hubungi admin untuk aktivasi.',
      );
    }

    // Verify shop still exists (defensive — biasanya FK constraint sudah jamin)
    const shop = await this.prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { id: true, name: true, address: true, phone: true },
    });
    if (!shop) {
      throw new ForbiddenException(
        'Cabang yang di-assign ke akun Anda tidak ditemukan. Hubungi admin.',
      );
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    await this.createSession(
      user.id,
      tokens.accessToken,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        shopId: user.shopId,
        mustChangePassword: user.mustChangePassword,
      },
      shop,
    };
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(dto: RefreshTokenDto) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    if (session.refreshExpiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token kedaluwarsa. Silakan login ulang.');
    }

    // Decode refresh token untuk ambil shopId claim (penting untuk super-admin
    // yang shopId-nya di JWT bukan di User.shopId).
    let oldPayload: { shopId?: string } | null = null;
    try {
      oldPayload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'default-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    // Untuk super-admin: pakai shopId dari JWT claim (cabang yang dipilih).
    // Untuk regular user: pakai User.shopId terbaru dari DB (kalau admin
    // pindahin user antar cabang, refresh akan bawa shopId baru).
    const shopId =
      session.user.role === Role.SUPER_ADMIN
        ? oldPayload?.shopId
        : session.user.shopId || undefined;

    const tokens = await this.generateTokens({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      shopId,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(
          Date.now() + parseInt(this.configService.get('JWT_EXPIRATION', '86400')) * 1000,
        ),
        refreshExpiresAt: new Date(
          Date.now() +
            parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')) * 1000,
        ),
      },
    });

    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: { userId, token },
    });

    return { success: true, message: 'Berhasil logout.' };
  }

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Don't reveal if user exists or not (security)
    if (!user || !user.email) {
      return {
        success: true,
        message: 'Jika email terdaftar, kode OTP akan dikirim.',
      };
    }

    const otp = this.otpService.generateOtp(user.email);
    await this.otpService.sendOtp(user.email, otp);

    return {
      success: true,
      message: 'Jika email terdaftar, kode OTP akan dikirim.',
    };
  }

  // ============================================
  // RESET PASSWORD
  // ============================================

  async resetPassword(dto: ResetPasswordDto) {
    const otpResult = this.otpService.verifyOtp(dto.email, dto.otp);
    if (!otpResult.valid) {
      throw new BadRequestException(otpResult.message);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastPasswordReset: new Date(),
      },
    });

    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { success: true, message: 'Password berhasil direset. Silakan login ulang.' };
  }

  // ============================================
  // LOGIN WITH PIN (Kasir only)
  // ============================================

  async loginWithPin(dto: LoginPinDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Username atau PIN salah.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi admin.');
    }

    // Check if PIN is locked (brute-force protection)
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const remainingMs = user.pinLockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(
        `Terlalu banyak percobaan. Coba lagi dalam ${remainingMin} menit.`,
      );
    }

    // Check user has PIN set
    if (!user.pin) {
      throw new UnauthorizedException(
        'PIN belum diatur. Hubungi admin untuk setup PIN.',
      );
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(dto.pin, user.pin);
    if (!isPinValid) {
      // Increment attempt counter
      const attempts = (user.pinAttempts || 0) + 1;
      const updateData: any = { pinAttempts: attempts };

      // Lock after 5 failed attempts (5 minutes)
      if (attempts >= 5) {
        updateData.pinLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        updateData.pinAttempts = 0;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const remaining = 5 - attempts;
      throw new UnauthorizedException(
        remaining > 0
          ? `Username atau PIN salah. ${remaining} percobaan tersisa.`
          : 'Terlalu banyak percobaan. Akun terkunci 5 menit.',
      );
    }

    // PIN correct — reset attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });

    // Kasir must have shopId
    if (!user.shopId) {
      throw new ForbiddenException(
        'Akun Anda belum di-assign ke cabang. Hubungi admin untuk aktivasi.',
      );
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { id: true, name: true, address: true, phone: true },
    });
    if (!shop) {
      throw new ForbiddenException(
        'Cabang yang di-assign ke akun Anda tidak ditemukan. Hubungi admin.',
      );
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    await this.createSession(
      user.id,
      tokens.accessToken,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        shopId: user.shopId,
        mustChangePin: user.mustChangePin,
        emailVerified: user.emailVerifiedAt !== null,
      },
      shop,
    };
  }

  // ============================================
  // LOGIN WITH GOOGLE (Firebase)
  // ============================================

  async loginWithGoogle(idToken: string, ipAddress?: string, userAgent?: string) {
    // Verify Firebase ID Token
    const decoded = await this.firebaseAdmin.verifyIdToken(idToken);
    if (!decoded) {
      throw new UnauthorizedException('Token Google tidak valid atau expired.');
    }

    const email = decoded.email;
    const name = decoded.name || decoded.email?.split('@')[0] || 'User';
    const picture = decoded.picture || null;

    if (!email) {
      throw new BadRequestException('Akun Google tidak memiliki email.');
    }

    // Find existing user by email
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing user → login directly
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Akun dinonaktifkan. Hubungi admin.');
      }
    } else {
      // New user
      // Check if this is a platform owner email — don't create tenant
      if (this.isPlatformOwner(email)) {
        const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(2, 14), 12);
        user = await this.prisma.user.create({
          data: {
            email,
            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, ''),
            passwordHash,
            fullName: name,
            avatarUrl: picture,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            tenantId: null,
            shopId: null,
            otpEnabled: false,
          },
        });
      } else {
      // Regular user → auto-register as SUPER_ADMIN with trial
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) + '-' + Math.random().toString(36).substring(2, 6);
      const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(2, 14), 12);

      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: name,
            slug,
            ownerName: name,
            ownerEmail: email,
            ownerPhone: '',
          },
        });

        const newUser = await tx.user.create({
          data: {
            email,
            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, ''),
            passwordHash,
            fullName: name,
            avatarUrl: picture,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            tenantId: tenant.id,
            otpEnabled: false,
          },
        });

        // Create empty shop — onboarding wizard will fill name/address/phone
        const shop = await tx.shop.create({
          data: {
            name: '',
            address: '',
            phone: '',
            ownerId: newUser.id,
            tenantId: tenant.id,
          },
        });

        await tx.user.update({
          where: { id: newUser.id },
          data: { shopId: shop.id },
        });

        await tx.shopSetting.create({
          data: { shopId: shop.id, language: 'id' },
        });

        return { tenant, user: newUser, shop };
      });

      // Create trial subscription
      try {
        const { SubscriptionService } = await import('../subscription/subscription.service');
        // Use the injected service if available, or create trial inline
        await this.prisma.subscription.create({
          data: {
            tenantId: result.tenant.id,
            plan: 'TRIAL',
            cycle: 'MONTHLY',
            status: 'TRIAL',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } catch {
        // Silent — subscription creation is non-blocking
      }

      user = result.user;
      } // end else (regular user tenant creation)
    }

    // Generate JWT tokens
    const shop = user.shopId ? await this.prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { id: true, name: true, address: true, phone: true },
    }) : null;

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.role,
      shopId: user.shopId || undefined,
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')),
      },
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        shopId: user.shopId,
        avatarUrl: user.avatarUrl,
      },
      shop,
      isNewUser: !user.lastLogin,
      needsOnboarding: user.tenantId ? (!shop || !shop.name || shop.name === '' || shop.address === '') : false,
      isPlatformOwner: this.isPlatformOwner(user.email || ''),
    };
  }

  /**
   * Check if email is a platform owner.
   * Platform owners are hardcoded in PLATFORM_OWNER_EMAILS env var.
   * This prevents random users from becoming owner via tenantId manipulation.
   */
  private isPlatformOwner(email: string): boolean {
    const ownerEmails = (this.configService.get<string>('PLATFORM_OWNER_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return ownerEmails.includes(email.toLowerCase());
  }

  // ============================================
  // CHANGE PIN
  // ============================================

  async changePin(userId: string, dto: ChangePinDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');
    if (!user.pin) {
      throw new BadRequestException('PIN belum diatur. Hubungi admin.');
    }

    const isOldPinValid = await bcrypt.compare(dto.oldPin, user.pin);
    if (!isOldPinValid) {
      throw new UnauthorizedException('PIN lama salah.');
    }

    const pinHash = await bcrypt.hash(dto.newPin, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: pinHash, pinChangedAt: new Date(), mustChangePin: false },
    });

    return { success: true, message: 'PIN berhasil diubah.' };
  }

  // ============================================
  // SET NEW PIN (for mustChangePin flow — no old PIN required)
  // ============================================

  async setNewPin(userId: string, newPin: string) {
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new BadRequestException('PIN harus 4-6 digit angka.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    if (!user.mustChangePin) {
      throw new BadRequestException(
        'Akun tidak dalam mode wajib ganti PIN. Gunakan endpoint change-pin.',
      );
    }

    const pinHash = await bcrypt.hash(newPin, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: pinHash, pinChangedAt: new Date(), mustChangePin: false },
    });

    return { success: true, message: 'PIN baru berhasil disimpan.' };
  }

  // ============================================
  // CHANGE PASSWORD (for mustChangePassword flow)
  // ============================================

  async changePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        lastPasswordReset: new Date(),
      },
    });
    return { success: true, message: 'Password berhasil diubah.' };
  }

  /**
   * Change password with old password verification (self-service from profile page).
   */
  async changePasswordWithOld(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Password lama salah.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        lastPasswordReset: new Date(),
      },
    });

    return { success: true, message: 'Password berhasil diubah.' };
  }

  /**
   * Set password for Google-only users (no old password verification needed).
   * Only allowed if user has never set a real password (lastPasswordReset = null).
   */
  async setPasswordForGoogleUser(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    if (user.lastPasswordReset) {
      throw new BadRequestException('Anda sudah punya password. Gunakan Ganti Password.');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Password minimal 6 karakter.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, lastPasswordReset: new Date() },
    });

    return { success: true, message: 'Password berhasil di-set. Sekarang bisa login manual.' };
  }

  // ============================================
  // GET CURRENT USER
  // ============================================

  async getMe(userId: string, currentShopId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        role: true,
        status: true,
        shopId: true,
        tenantId: true,
        otpEnabled: true,
        emailVerifiedAt: true,
        lastLogin: true,
        lastPasswordReset: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    // Untuk super-admin, currentShopId datang dari JWT (cabang aktif yg dipilih).
    // Override User.shopId (yang null) supaya frontend tahu konteks saat ini.
    const effectiveShopId =
      user.role === Role.SUPER_ADMIN ? currentShopId ?? null : user.shopId;

    let currentShop: {
      id: string;
      name: string;
      address: string;
      phone: string;
    } | null = null;
    if (effectiveShopId) {
      currentShop = await this.prisma.shop.findUnique({
        where: { id: effectiveShopId },
        select: { id: true, name: true, address: true, phone: true },
      });
    }

    // Fetch subscription status for license badge
    let subscriptionStatus: string | null = null;
    let subscriptionPlan: string | null = null;
    if (user.tenantId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { tenantId: user.tenantId },
        select: { status: true, plan: true },
      });
      if (sub) {
        subscriptionStatus = sub.status;
        subscriptionPlan = sub.plan;
      }
    }

    return {
      ...user,
      shopId: effectiveShopId,
      currentShop,
      emailVerified: user.emailVerifiedAt !== null,
      subscriptionStatus,
      subscriptionPlan,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: parseInt(this.configService.get('JWT_EXPIRATION', '86400')),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    token: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const expiresAt = new Date(
      Date.now() + parseInt(this.configService.get('JWT_EXPIRATION', '86400')) * 1000,
    );
    const refreshExpiresAt = new Date(
      Date.now() +
        parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')) * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  // ============================================
  // TOGGLE OTP (2FA)
  // ============================================

  async toggleOtp(userId: string, enabled: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    // Require email to enable OTP
    if (enabled && !user.email) {
      throw new BadRequestException(
        'Untuk mengaktifkan 2FA, akun harus memiliki email terlebih dahulu.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { otpEnabled: enabled },
    });

    return {
      success: true,
      otpEnabled: enabled,
      message: enabled
        ? '2FA berhasil diaktifkan. Kode OTP akan dikirim ke email saat login.'
        : '2FA dinonaktifkan. Login langsung tanpa OTP.',
    };
  }

  // ============================================
  // UPDATE PROFILE
  // ============================================

  async updateProfile(userId: string, dto: { username?: string; fullName?: string; phone?: string; address?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    // Validate username uniqueness if changing
    if (dto.username && dto.username.toLowerCase() !== user.username?.toLowerCase()) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Username sudah digunakan oleh akun lain.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined && { username: dto.username.toLowerCase() }),
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    return {
      success: true,
      user: updated,
      message: 'Profil berhasil diperbarui.',
    };
  }
}
