import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface OtpEntry {
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // In-memory store (Phase 2: move to Redis for multi-instance)
  private otpStore = new Map<string, OtpEntry>();
  private readonly maxAttempts = 5;
  private readonly otpExpiryMinutes = 10;

  // Nodemailer transporter (lazy init)
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
      const port = this.configService.get<number>('SMTP_PORT', 587);
      const user = this.configService.get<string>('SMTP_USER', '');
      const pass = this.configService.get<string>('SMTP_PASSWORD', '');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: { user, pass },
      });

      this.logger.log(`📧 SMTP transporter created: ${host}:${port} (user: ${user})`);
    }
    return this.transporter;
  }

  /**
   * Generate 6-digit OTP for email
   */
  generateOtp(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    this.otpStore.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0,
    });

    return code;
  }

  /**
   * Verify OTP for email
   */
  verifyOtp(email: string, code: string): { valid: boolean; message: string } {
    const entry = this.otpStore.get(email.toLowerCase());

    if (!entry) {
      return { valid: false, message: 'OTP tidak ditemukan. Silakan minta OTP baru.' };
    }

    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(email.toLowerCase());
      return { valid: false, message: 'OTP sudah kedaluwarsa. Silakan minta OTP baru.' };
    }

    if (entry.attempts >= this.maxAttempts) {
      this.otpStore.delete(email.toLowerCase());
      return { valid: false, message: 'Terlalu banyak percobaan. Silakan minta OTP baru.' };
    }

    if (entry.code !== code) {
      entry.attempts++;
      return { valid: false, message: `OTP salah. Sisa percobaan: ${this.maxAttempts - entry.attempts}` };
    }

    // OTP valid, remove from store
    this.otpStore.delete(email.toLowerCase());
    return { valid: true, message: 'OTP berhasil diverifikasi.' };
  }

  /**
   * Send OTP via email using Nodemailer + Gmail SMTP.
   * Requires SMTP_USER and SMTP_PASSWORD (App Password) in .env
   */
  async sendOtp(email: string, otp: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SMTP_FROM', this.configService.get<string>('SMTP_USER', ''));
    const appName = this.configService.get<string>('APP_NAME', 'Posify');

    // Always log for debugging
    this.logger.log(`📧 OTP for ${email}: ${otp} (expires in ${this.otpExpiryMinutes} min)`);

    // Check if SMTP is configured
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD', '');

    if (!smtpUser || !smtpPass) {
      this.logger.warn('⚠️ SMTP not configured (SMTP_USER/SMTP_PASSWORD empty). OTP only logged to console.');
      return;
    }

    try {
      const transport = this.getTransporter();

      await transport.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to: email,
        subject: `${appName} — Kode Verifikasi OTP`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00A19B; font-size: 24px; margin: 0;">${appName}</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistem POS Modern</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Kode verifikasi Anda:</p>
              <div style="background: #ffffff; border: 2px solid #00A19B; border-radius: 8px; padding: 16px; display: inline-block;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0;">Berlaku selama <strong>${this.otpExpiryMinutes} menit</strong></p>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 8px;">
              <p style="color: #92400e; font-size: 11px; margin: 0;">
                ⚠️ Jangan bagikan kode ini ke siapapun. Tim ${appName} tidak pernah meminta kode OTP Anda.
              </p>
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
              Email ini dikirim otomatis oleh ${appName}. Jika Anda tidak meminta kode ini, abaikan email ini.
            </p>
          </div>
        `,
      });

      this.logger.log(`✅ OTP email sent to ${email}`);
    } catch (err: any) {
      this.logger.error(`❌ Failed to send OTP email to ${email}: ${err.message}`);
      // Don't throw — OTP is still generated and logged. Failing email should not block the flow.
      // In production with monitoring, this would trigger an alert.
    }
  }
}
