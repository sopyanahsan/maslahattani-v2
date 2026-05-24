import { Injectable } from '@nestjs/common';

interface OtpEntry {
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  // In-memory store (Phase 2: move to Redis)
  private otpStore = new Map<string, OtpEntry>();
  private readonly maxAttempts = 5;
  private readonly otpExpiryMinutes = 10;

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
   * Send OTP via email (Phase 1: log to console, Phase 2: real SMTP)
   */
  async sendOtp(email: string, otp: string): Promise<void> {
    // TODO: Implement real email sending with SMTP
    // For now, log to console for development
    console.log(`📧 [OTP] Email: ${email} | Kode OTP: ${otp}`);
    console.log(`📧 [OTP] OTP berlaku selama ${this.otpExpiryMinutes} menit.`);
  }
}
