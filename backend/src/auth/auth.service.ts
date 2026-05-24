import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RegisterKasirDto, VerifyOtpDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Role, UserStatus } from '@prisma/client';

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  shopId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
  ) {}

  // ============================================
  // REGISTER KASIR
  // ============================================

  async registerKasir(dto: RegisterKasirDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    // Generate and send OTP
    const otp = this.otpService.generateOtp(dto.email);
    await this.otpService.sendOtp(dto.email, otp);

    return {
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda. Silakan verifikasi.',
    };
  }

  async verifyOtpAndCreateKasir(dto: VerifyOtpDto & { password: string }) {
    // Verify OTP
    const otpResult = this.otpService.verifyOtp(dto.email, dto.otp);
    if (!otpResult.valid) {
      throw new BadRequestException(otpResult.message);
    }

    // Check if email already exists (double-check)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user with KASIR role
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.KASIR,
        status: UserStatus.ACTIVE,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      message: 'Registrasi berhasil!',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier.toLowerCase() },
          { username: dto.identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi admin.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    // Admin must provide OTP (2FA mandatory)
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      if (!dto.otp) {
        // Generate and send OTP for admin login
        const otp = this.otpService.generateOtp(user.email);
        await this.otpService.sendOtp(user.email, otp);
        return {
          success: false,
          requireOtp: true,
          message: 'Kode OTP telah dikirim ke email Anda.',
        };
      }

      // Verify admin OTP
      const otpResult = this.otpService.verifyOtp(user.email, dto.otp);
      if (!otpResult.valid) {
        throw new UnauthorizedException(otpResult.message);
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId || undefined,
    });

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken, ipAddress, userAgent);

    // Update lastLogin
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
      },
    };
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(dto: RefreshTokenDto) {
    // Find session by refresh token
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    if (session.refreshExpiresAt < new Date()) {
      // Delete expired session
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token kedaluwarsa. Silakan login ulang.');
    }

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      shopId: session.user.shopId || undefined,
    });

    // Update session with new tokens
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + parseInt(this.configService.get('JWT_EXPIRATION', '86400')) * 1000),
        refreshExpiresAt: new Date(Date.now() + parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')) * 1000),
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
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
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
    if (!user) {
      return {
        success: true,
        message: 'Jika email terdaftar, kode OTP akan dikirim.',
      };
    }

    // Generate and send OTP
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
    // Verify OTP
    const otpResult = this.otpService.verifyOtp(dto.email, dto.otp);
    if (!otpResult.valid) {
      throw new BadRequestException(otpResult.message);
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastPasswordReset: new Date(),
      },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { success: true, message: 'Password berhasil direset. Silakan login ulang.' };
  }

  // ============================================
  // GET CURRENT USER
  // ============================================

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    return user;
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
    const expiresAt = new Date(Date.now() + parseInt(this.configService.get('JWT_EXPIRATION', '86400')) * 1000);
    const refreshExpiresAt = new Date(Date.now() + parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '2592000')) * 1000);

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
}
