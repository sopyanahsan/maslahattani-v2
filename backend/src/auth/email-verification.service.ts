import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly codeExpiryMinutes = 30; // Code valid for 30 minutes

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
      const port = this.configService.get<number>('SMTP_PORT', 587);
      const user = this.configService.get<string>('SMTP_USER', '');
      const pass = this.configService.get<string>('SMTP_PASSWORD', '');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      this.logger.log(`📧 Email verification transporter: ${host}:${port}`);
    }
    return this.transporter;
  }

  /**
   * Generate a 6-digit verification code and save to user record.
   */
  async generateAndSendCode(userId: string): Promise<{ sent: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    if (!user.email) {
      throw new BadRequestException('User tidak memiliki email. Hubungi admin untuk menambahkan email.');
    }

    if (user.emailVerifiedAt) {
      return { sent: false, message: 'Email sudah terverifikasi.' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.codeExpiryMinutes * 60 * 1000);

    // Save to database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: code,
        emailCodeExpiresAt: expiresAt,
      },
    });

    // Send email
    await this.sendVerificationEmail(user.email, code, user.username || 'Kasir');

    return { sent: true, message: `Kode verifikasi telah dikirim ke ${this.maskEmail(user.email)}.` };
  }

  /**
   * Verify the code submitted by the user.
   */
  async verifyCode(userId: string, code: string): Promise<{ verified: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        emailVerificationCode: true,
        emailCodeExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    if (user.emailVerifiedAt) {
      return { verified: true, message: 'Email sudah terverifikasi sebelumnya.' };
    }

    if (!user.emailVerificationCode || !user.emailCodeExpiresAt) {
      throw new BadRequestException('Belum ada kode verifikasi. Silakan minta kode baru.');
    }

    if (user.emailCodeExpiresAt < new Date()) {
      // Clear expired code
      await this.prisma.user.update({
        where: { id: userId },
        data: { emailVerificationCode: null, emailCodeExpiresAt: null },
      });
      throw new BadRequestException('Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.');
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Kode verifikasi salah.');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailCodeExpiresAt: null,
      },
    });

    this.logger.log(`✅ Email verified for user ${userId} (${user.email})`);

    return { verified: true, message: 'Email berhasil diverifikasi!' };
  }

  /**
   * Check if user's email is verified.
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true, email: true, role: true },
    });

    if (!user) return false;

    // Users without email or SUPER_ADMIN/ADMIN don't need verification
    if (!user.email || ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return true;

    return user.emailVerifiedAt !== null;
  }

  /**
   * Send verification email via SMTP.
   */
  private async sendVerificationEmail(email: string, code: string, username: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'Posify');
    const fromEmail = this.configService.get<string>('SMTP_FROM', this.configService.get<string>('SMTP_USER', ''));
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD', '');

    this.logger.log(`📧 Verification code for ${email}: ${code} (expires in ${this.codeExpiryMinutes} min)`);

    if (!smtpUser || !smtpPass) {
      this.logger.warn('⚠️ SMTP not configured. Verification code only logged to console.');
      return;
    }

    try {
      const transport = this.getTransporter();

      await transport.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to: email,
        subject: `${appName} — Verifikasi Email Akun Kasir`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00A19B; font-size: 24px; margin: 0;">${appName}</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Verifikasi Email Kasir</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">Halo <strong>${username}</strong>,</p>
              <p style="color: #475569; font-size: 13px; margin: 0 0 20px;">
                Akun kasir Anda telah dibuat. Untuk mengaktifkan akun, masukkan kode verifikasi berikut saat login pertama kali:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #ffffff; border: 2px solid #00A19B; border-radius: 8px; padding: 16px; display: inline-block;">
                  <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #0f172a;">${code}</span>
                </div>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 16px 0 0;">
                Berlaku selama <strong>${this.codeExpiryMinutes} menit</strong>
              </p>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
              <p style="color: #1e40af; font-size: 11px; margin: 0;">
                📋 <strong>Langkah selanjutnya:</strong><br/>
                1. Login dengan username + PIN yang diberikan admin<br/>
                2. Masukkan kode verifikasi di atas<br/>
                3. Buat PIN baru (hanya Anda yang tahu)
              </p>
            </div>
            <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px;">
              <p style="color: #92400e; font-size: 11px; margin: 0;">
                ⚠️ Dengan memverifikasi email ini, Anda menyetujui bahwa akun ini digunakan secara sah dan bertanggung jawab atas semua aktivitas transaksi yang dilakukan.
              </p>
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
              Email ini dikirim otomatis oleh ${appName}. Jika Anda tidak merasa mendaftar, abaikan email ini.
            </p>
          </div>
        `,
      });

      this.logger.log(`✅ Verification email sent to ${email}`);
    } catch (err: any) {
      this.logger.error(`❌ Failed to send verification email to ${email}: ${err.message}`);
    }
  }

  /**
   * Mask email for privacy (e.g., "user@gmail.com" → "us***@gmail.com")
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const masked = local.length > 2
      ? local.slice(0, 2) + '***'
      : local[0] + '***';
    return `${masked}@${domain}`;
  }
}
