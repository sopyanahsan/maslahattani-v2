/**
 * Plan configuration — defines limits and features per plan.
 * Used by SubscriptionGuard to enforce limits.
 */

export interface PlanConfig {
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
  brilinkEnabled: boolean;
  exportEnabled: boolean;
  opnameEnabled: boolean;
  supplierEnabled: boolean;
  transferEnabled: boolean;
  /** Duration in days for trial/monthly/yearly. null = lifetime */
  durationDays: number | null;
  /** Grace period in days after expiry */
  graceDays: number;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  TRIAL: {
    maxBranches: 1,
    maxUsers: 2,
    maxProducts: 50,
    brilinkEnabled: false,
    exportEnabled: false,
    opnameEnabled: false,
    supplierEnabled: false,
    transferEnabled: false,
    durationDays: 14,
    graceDays: 3,
  },
  BASIC: {
    maxBranches: 1,
    maxUsers: 3,
    maxProducts: 500,
    brilinkEnabled: false,
    exportEnabled: false,
    opnameEnabled: true,
    supplierEnabled: false,
    transferEnabled: false,
    durationDays: null, // depends on cycle
    graceDays: 7,
  },
  PRO: {
    maxBranches: 3,
    maxUsers: 10,
    maxProducts: -1, // unlimited
    brilinkEnabled: true,
    exportEnabled: true,
    opnameEnabled: true,
    supplierEnabled: true,
    transferEnabled: true,
    durationDays: null,
    graceDays: 7,
  },
  ENTERPRISE: {
    maxBranches: -1, // unlimited
    maxUsers: -1,
    maxProducts: -1,
    brilinkEnabled: true,
    exportEnabled: true,
    opnameEnabled: true,
    supplierEnabled: true,
    transferEnabled: true,
    durationDays: null,
    graceDays: 14,
  },
};

/**
 * Pricing in Rupiah
 */
export const PLAN_PRICING = {
  BASIC: { monthly: 49_000, yearly: 499_000, lifetime: 400_000 },
  PRO: { monthly: 99_000, yearly: 999_000, lifetime: 700_000 },
  ENTERPRISE: { monthly: 199_000, yearly: 1_999_000, lifetime: 1_200_000 },
};

/**
 * Get subscription end date based on plan and cycle.
 */
export function calculateEndDate(
  startDate: Date,
  cycle: string,
  plan: string,
): Date | null {
  if (cycle === 'LIFETIME') return null;

  if (plan === 'TRIAL') {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 14);
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
  const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.BASIC;
  const grace = new Date(endDate);
  grace.setDate(grace.getDate() + config.graceDays);
  return grace;
}
