/**
 * Plan configuration — defines limits and features per plan.
 * Used by SubscriptionGuard to enforce limits.
 *
 * Tier hierarchy:
 *   STARTER → BRILINK → PRO → BUSINESS
 *
 * Free Trial: 30 hari (1 bulan) tier Starter
 */

export interface PlanConfig {
  label: string;
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
  /** Feature flags */
  brilinkEnabled: boolean;
  ppobEnabled: boolean;
  shiftEnabled: boolean;
  multiUserEnabled: boolean;
  exportEnabled: boolean;
  opnameEnabled: boolean;
  supplierEnabled: boolean;
  transferEnabled: boolean;
  labelPrintEnabled: boolean;
  rackEnabled: boolean;
  apiIntegrationEnabled: boolean;
  /** Grace period in days after expiry */
  graceDays: number;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  TRIAL: {
    label: 'Trial (30 Hari)',
    maxBranches: 1,
    maxUsers: 2,
    maxProducts: 100,
    brilinkEnabled: false,
    ppobEnabled: false,
    shiftEnabled: false,
    multiUserEnabled: false,
    exportEnabled: false,
    opnameEnabled: false,
    supplierEnabled: false,
    transferEnabled: false,
    labelPrintEnabled: false,
    rackEnabled: false,
    apiIntegrationEnabled: false,
    graceDays: 3,
  },
  STARTER: {
    label: 'Starter',
    maxBranches: 1,
    maxUsers: 2, // 1 kasir + 1 admin cabang (opsional)
    maxProducts: 500,
    brilinkEnabled: false,
    ppobEnabled: false,
    shiftEnabled: false,
    multiUserEnabled: false,
    exportEnabled: false,
    opnameEnabled: true,
    supplierEnabled: false,
    transferEnabled: false,
    labelPrintEnabled: false,
    rackEnabled: false,
    apiIntegrationEnabled: false,
    graceDays: 7,
  },
  BRILINK: {
    label: 'BRILink',
    maxBranches: 1,
    maxUsers: 3, // 2 kasir + 1 admin
    maxProducts: 500,
    brilinkEnabled: true,
    ppobEnabled: true,
    shiftEnabled: true,
    multiUserEnabled: false,
    exportEnabled: true,
    opnameEnabled: true,
    supplierEnabled: false,
    transferEnabled: false,
    labelPrintEnabled: false,
    rackEnabled: false,
    apiIntegrationEnabled: false,
    graceDays: 7,
  },
  PRO: {
    label: 'Pro',
    maxBranches: 3,
    maxUsers: 8, // 5 kasir + 3 admin
    maxProducts: -1, // unlimited
    brilinkEnabled: true,
    ppobEnabled: true,
    shiftEnabled: true,
    multiUserEnabled: true,
    exportEnabled: true,
    opnameEnabled: true,
    supplierEnabled: false,
    transferEnabled: false,
    labelPrintEnabled: false,
    rackEnabled: false,
    apiIntegrationEnabled: false,
    graceDays: 7,
  },
  BUSINESS: {
    label: 'Business',
    maxBranches: 10,
    maxUsers: -1, // unlimited
    maxProducts: -1,
    brilinkEnabled: true,
    ppobEnabled: true,
    shiftEnabled: true,
    multiUserEnabled: true,
    exportEnabled: true,
    opnameEnabled: true,
    supplierEnabled: true,
    transferEnabled: true,
    labelPrintEnabled: true,
    rackEnabled: true,
    apiIntegrationEnabled: true,
    graceDays: 14,
  },
};

/**
 * Pricing in Rupiah (murah strategy — volume > margin)
 */
export const PLAN_PRICING: Record<string, { monthly: number; yearly: number; lifetime: number }> = {
  STARTER:  { monthly: 29_000,  yearly: 290_000,  lifetime: 799_000 },
  BRILINK:  { monthly: 49_000,  yearly: 490_000,  lifetime: 1_299_000 },
  PRO:      { monthly: 79_000,  yearly: 790_000,  lifetime: 1_999_000 },
  BUSINESS: { monthly: 149_000, yearly: 1_490_000, lifetime: 3_499_000 },
};

/**
 * Lynk.id payment links (semi-manual — pre-created products on Lynk.id).
 * Format: lynk.id/{username}/{product-slug}
 *
 * INSTRUCTIONS:
 * 1. Go to lynk.id dashboard
 * 2. Create products for each tier+cycle combination
 * 3. Copy the links here
 *
 * Set to empty string '' if not yet configured — app will show bank transfer info instead.
 */
export const LYNK_PAYMENT_LINKS: Record<string, Record<string, string>> = {
  STARTER: {
    MONTHLY: '', // e.g. 'https://lynk.id/posify/starter-bulanan'
    YEARLY: '',
    LIFETIME: '',
  },
  BRILINK: {
    MONTHLY: '',
    YEARLY: '',
    LIFETIME: '',
  },
  PRO: {
    MONTHLY: '',
    YEARLY: '',
    LIFETIME: '',
  },
  BUSINESS: {
    MONTHLY: '',
    YEARLY: '',
    LIFETIME: '',
  },
};

/**
 * Bank transfer info (fallback when Lynk.id link is empty)
 */
export const BANK_TRANSFER_INFO = {
  bankName: 'SeaBank',
  accountNumber: '901XXXXXXXX', // TODO: ganti dengan nomor rekening asli
  accountHolder: 'POSIFY DIGITAL',
  instructions: [
    'Transfer sesuai nominal + kode unik (3 digit terakhir)',
    'Screenshot bukti transfer',
    'Klik "Konfirmasi Pembayaran" dan upload bukti',
    'Lisensi akan aktif dalam 1x24 jam setelah verifikasi',
  ],
};

/**
 * Get subscription end date based on cycle.
 * TRIAL = 30 days
 * MONTHLY = +1 month
 * YEARLY = +1 year
 * LIFETIME = null (never expires)
 */
export function calculateEndDate(
  startDate: Date,
  cycle: string,
  plan: string,
): Date | null {
  if (cycle === 'LIFETIME') return null;

  if (plan === 'TRIAL') {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 30); // 30 hari free trial
    return end;
  }

  if (cycle === 'MONTHLY') {
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + 1);
    return end;
  }

  if (cycle === 'YEARLY') {
    const end = new Date(startDate);
    end.setFullYear(end.getFullYear() + 1);
    return end;
  }

  return null;
}

/**
 * Calculate grace end date (endDate + graceDays).
 */
export function calculateGraceEnd(endDate: Date, plan: string): Date {
  const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.STARTER;
  const grace = new Date(endDate);
  grace.setDate(grace.getDate() + config.graceDays);
  return grace;
}
