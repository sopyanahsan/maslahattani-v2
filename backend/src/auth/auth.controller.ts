import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterKasirDto, VerifyOtpDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { LoginPinDto, ChangePinDto } from './dto/login-pin.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailCodeDto } from './dto/email-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard, Roles } from './guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SkipSubscription } from '../subscription/skip-subscription.decorator';
import { Role } from '@prisma/client';

@ApiTags('Auth')
@Controller('api/auth')
@SkipSubscription()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register-kasir')
  @ApiOperation({ summary: 'Register kasir baru via email (Step 1: kirim OTP)' })
  async registerKasir(@Body() dto: RegisterKasirDto) {
    return this.authService.registerKasir(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verifikasi OTP dan buat akun kasir (Step 2)' })
  async verifyOtp(@Body() dto: VerifyOtpDto & { password: string }) {
    return this.authService.verifyOtpAndCreateKasir(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login (email/username + password + optional OTP)' })
  async login(@Body() dto: LoginDto, @Request() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (invalidate session)' })
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (kirim OTP ke email)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password dengan OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id, req.user.shopId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (untuk akun fresh yang mustChangePassword=true)' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.newPassword);
  }

  @Post('change-password-with-old')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password with old password verification (self-service)' })
  async changePasswordWithOld(@Request() req: any, @Body() dto: { currentPassword: string; newPassword: string }) {
    return this.authService.changePasswordWithOld(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password for Google-only users (no old password required)' })
  async setPassword(@Request() req: any, @Body() dto: { newPassword: string }) {
    return this.authService.setPasswordForGoogleUser(req.user.id, dto.newPassword);
  }

  @Post('login-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login kasir dengan username + PIN (4-6 digit)' })
  async loginWithPin(@Body() dto: LoginPinDto, @Request() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginWithPin(dto, ipAddress, userAgent);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Register via Google (Firebase ID Token)' })
  async loginWithGoogle(@Body() body: { idToken: string }, @Request() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginWithGoogle(body.idToken, ipAddress, userAgent);
  }

  @Post('change-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ganti PIN kasir (auth required, verify PIN lama)' })
  async changePin(@Request() req: any, @Body() dto: ChangePinDto) {
    return this.authService.changePin(req.user.id, dto);
  }

  @Post('set-new-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set PIN baru (untuk kasir fresh yang mustChangePin=true, tanpa verifikasi PIN lama)' })
  async setNewPin(@Request() req: any, @Body() dto: { newPin: string }) {
    return this.authService.setNewPin(req.user.id, dto.newPin);
  }

  // ============================================
  // EMAIL VERIFICATION (Kasir)
  // ============================================

  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim/kirim ulang kode verifikasi email ke kasir' })
  async sendVerification(@Request() req: any) {
    return this.emailVerificationService.generateAndSendCode(req.user.id);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifikasi email kasir dengan kode 6 digit' })
  async verifyEmail(@Request() req: any, @Body() dto: VerifyEmailCodeDto) {
    return this.emailVerificationService.verifyCode(req.user.id, dto.code);
  }

  @Get('email-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cek status verifikasi email' })
  async emailStatus(@Request() req: any) {
    const verified = await this.emailVerificationService.isEmailVerified(req.user.id);
    return { verified };
  }

  @Post('toggle-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable/disable 2FA OTP untuk akun sendiri' })
  async toggleOtp(@Request() req: any, @Body() dto: { enabled: boolean }) {
    return this.authService.toggleOtp(req.user.id, dto.enabled);
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profil (username, fullName, phone, dll)' })
  async updateProfile(@Request() req: any, @Body() dto: { username?: string; fullName?: string; phone?: string; address?: string }) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  // ============================================
  // AUDIT LOG (Super Admin only)
  // ============================================

  @Get('activity-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity logs (Super Admin only, paginated)' })
  async getActivityLogs(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const take = Math.min(Number(limit) || 50, 100);
    const skip = ((Number(page) || 1) - 1) * take;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.username || log.user?.email || '-',
        userRole: log.user?.role || '-',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
    };
  }
}
