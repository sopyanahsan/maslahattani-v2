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
        html: this.buildEmailHtml(appName, username, code),
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

  /**
   * Build the complete HTML email template with logo.
   * Customize: colors, text, logo, and layout here.
   */
  private buildEmailHtml(appName: string, username: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 460px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- HEADER dengan Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #00A19B 0%, #0d9488 100%); padding: 32px 24px; text-align: center;">
              <!-- Logo SVG inline (Toko icon dalam kotak) -->
              <div style="margin: 0 auto 12px; width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; line-height: 56px; text-align: center;">
                <span style="font-size: 28px;">🏪</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${appName}</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.8);">Sistem POS Modern</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 28px 24px;">
              <!-- Greeting -->
              <p style="margin: 0 0 6px; font-size: 15px; color: #334155;">Halo <strong style="color: #0f172a;">${username}</strong> 👋</p>
              <p style="margin: 0 0 24px; font-size: 13px; color: #64748b; line-height: 1.6;">
                Akun kasir Anda telah dibuat oleh admin. Untuk mengaktifkan akun dan mulai bekerja, masukkan kode verifikasi berikut:
              </p>

              <!-- KODE VERIFIKASI -->
              <div style="background: #f8fafc; border: 2px solid #00A19B; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Kode Verifikasi</p>
                <div style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; padding: 8px 0;">
                  ${code}
                </div>
                <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
                  Berlaku <strong>${this.codeExpiryMinutes} menit</strong> sejak email ini dikirim
                </p>
              </div>

              <!-- LANGKAH-LANGKAH -->
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin: 0 0 16px;">
                <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #1e40af;">📋 Cara Aktivasi Akun:</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 4px 0; vertical-align: top; width: 24px;">
                      <span style="display: inline-block; width: 18px; height: 18px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 10px; line-height: 18px; font-weight: 700;">1</span>
                    </td>
                    <td style="padding: 4px 0; font-size: 12px; color: #1e40af;">Login dengan <strong>username + PIN</strong> dari admin</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; vertical-align: top; width: 24px;">
                      <span style="display: inline-block; width: 18px; height: 18px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 10px; line-height: 18px; font-weight: 700;">2</span>
                    </td>
                    <td style="padding: 4px 0; font-size: 12px; color: #1e40af;">Masukkan <strong>kode verifikasi</strong> di atas</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; vertical-align: top; width: 24px;">
                      <span style="display: inline-block; width: 18px; height: 18px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 10px; line-height: 18px; font-weight: 700;">3</span>
                    </td>
                    <td style="padding: 4px 0; font-size: 12px; color: #1e40af;">Buat <strong>PIN baru</strong> (hanya Anda yang tahu)</td>
                  </tr>
                </table>
              </div>

              <!-- DISCLAIMER / KONTRAK -->
              <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin: 0 0 16px;">
                <p style="margin: 0; font-size: 11px; color: #92400e; line-height: 1.5;">
                  ⚠️ <strong>Pernyataan Tanggung Jawab:</strong><br/>
                  Dengan memverifikasi email ini, Anda menyatakan bahwa:<br/>
                  • Identitas yang didaftarkan adalah benar<br/>
                  • Anda bertanggung jawab penuh atas semua aktivitas transaksi pada akun ini<br/>
                  • Penyalahgunaan akun dapat diproses sesuai hukum yang berlaku
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 10px; color: #94a3b8;">
                Email ini dikirim otomatis oleh <strong>${appName}</strong>
              </p>
              <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
                Jika Anda tidak merasa mendaftar, abaikan email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
