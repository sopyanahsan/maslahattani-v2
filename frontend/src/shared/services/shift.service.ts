import api from './api';
import type { UserRole } from './auth.service';

// ============================================
// Cash denominations
// ============================================

/**
 * Breakdown denominasi uang fisik per kategori.
 * Format object dengan key string nominal (rupiah) atau "lainnya":
 *
 *   { "100000": 5, "50000": 3, ..., "100": 0, "lainnya": 5000 }
 *
 * - Setiap key kecuali "lainnya" = nominal lembar/koin (rupiah string),
 *   value = jumlah lembar/koin.
 * - Key "lainnya" = nominal raw (rupiah) untuk koin/recehan/lainnya.
 */
export type CashDenominations = {
  '100000'?: number;
  '50000'?: number;
  '20000'?: number;
  '10000'?: number;
  '5000'?: number;
  '2000'?: number;
  '1000'?: number;
  '500'?: number;
  '200'?: number;
  '100'?: number;
  /** Raw rupiah (bukan count) untuk koin/recehan/lainnya. */
  lainnya?: number;
};

/** Standard denomination keys, dari nominal terbesar ke terkecil. */
export const DENOMINATION_KEYS: ReadonlyArray<keyof CashDenominations> = [
  '100000',
  '50000',
  '20000',
  '10000',
  '5000',
  '2000',
  '1000',
  '500',
  '200',
  '100',
  'lainnya',
];

/**
 * Hitung total rupiah dari breakdown denominasi.
 * - Slot standar: nominal * count
 * - "lainnya": value langsung (sudah dalam rupiah)
 */
export function computeTotalFromDenominations(
  denominations: CashDenominations,
): number {
  let total = 0;
  for (const key of DENOMINATION_KEYS) {
    const value = denominations[key] ?? 0;
    if (typeof value !== 'number' || value < 0) continue;
    if (key === 'lainnya') {
      total += value;
    } else {
      const nominal = parseInt(key as string, 10);
      if (!Number.isNaN(nominal)) {
        total += nominal * value;
      }
    }
  }
  return total;
}

// ============================================
// Shared types (match backend response shape)
// ============================================

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'FINALIZED';

export interface ShiftUserSummary {
  id: string;
  email: string;
  username?: string | null;
  role: UserRole;
}

export interface ShiftShopSummary {
  id: string;
  name: string;
  address?: string;
}

/**
 * Kategori cashbox versi compact yang di-include di shift response.
 * Untuk full CashBoxCategoryDto lihat cashbox-category.service.ts.
 */
export interface ShiftCashBoxCategorySummary {
  id: string;
  code: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
}

/**
 * Per-category snapshot dalam shift. Satu shift bisa punya N row ini
 * (mis: RETAIL + SUBSIDI_PUPUK).
 */
export interface ShiftCashBoxDto {
  id: string;
  shiftId: string;
  categoryId: string;
  category: ShiftCashBoxCategorySummary;

  startingCash: number;
  expectedCash: number;
  actualCash?: number | null;
  varianceCash?: number | null;

  expectedQRIS: number;
  actualQRIS?: number | null;
  varianceQRIS?: number | null;

  /**
   * Breakdown denominasi uang fisik saat tutup shift (opsional).
   * Format: { "100000": 5, "50000": 3, ..., "lainnya": 5000 }
   */
  cashDenominations?: CashDenominations | null;

  createdAt: string;
  updatedAt: string;
}

export interface ShiftDto {
  id: string;
  userId: string;
  shopId: string;
  startTime: string;
  endTime?: string | null;

  status: ShiftStatus;
  notes?: string | null;
  finalizedAt?: string | null;
  finalizedBy?: string | null;

  createdAt: string;
  updatedAt: string;

  user?: ShiftUserSummary;
  shop?: ShiftShopSummary;
  /** Per-category breakdown — selalu di-include dari backend. */
  cashBoxes: ShiftCashBoxDto[];
}

// ============================================
// Request payloads
// ============================================

export interface StartingCashByCategoryEntry {
  categoryId: string;
  startingCash: number;
}

export interface OpenShiftPayload {
  startingCashByCategory: StartingCashByCategoryEntry[];
  notes?: string;
}

export interface ActualCashByCategoryEntry {
  categoryId: string;
  actualCash: number;
  /**
   * QRIS aktual (opsional). Kalau tidak dikirim, backend rekonsiliasi
   * otomatis ke nilai expected (variance QRIS = 0).
   */
  actualQRIS?: number;
  /**
   * Optional breakdown denominasi. Kalau di-pass, server validate
   * sum(denominations) === actualCash.
   */
  denominations?: CashDenominations;
}

export interface CloseShiftPayload {
  actualByCategory: ActualCashByCategoryEntry[];
  notes?: string;
}

export interface FinalizeShiftPayload {
  notes?: string;
}

export interface QueryShiftParams {
  shopId?: string;
  userId?: string;
  status?: ShiftStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
}

// ============================================
// Response shapes
// ============================================

export interface OpenShiftResponse {
  shift: ShiftDto;
  message: string;
}

/**
 * Per-category summary saat close shift. Frontend pakai ini untuk render
 * layar "Shift Ditutup" dengan breakdown variance.
 */
export interface CloseShiftCategorySummary {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  startingCash: number;
  expectedCash: number;
  actualCash: number;
  varianceCash: number;
  expectedQRIS: number;
  actualQRIS: number;
  varianceQRIS: number;
}

export interface CloseShiftResponse {
  shift: ShiftDto;
  summary: CloseShiftCategorySummary[];
  totalTransactions: number;
  message: string;
}

export interface CurrentShiftResponse {
  shift: ShiftDto | null;
  transactionCount?: number;
  message?: string;
}

export interface ListShiftsResponse {
  data: ShiftDto[];
  total: number;
}

export interface ShiftDetailTransaction {
  id: string;
  transactionNumber: string;
  totalPrice: number;
  totalCost: number;
  totalDiscount: number;
  status: string;
  createdAt: string;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
  }>;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { id: string; name: string; sku: string };
  }>;
}

export interface ShiftDetailResponse {
  shift: ShiftDto;
  transactions: {
    data: ShiftDetailTransaction[];
    total: number;
  };
}

export interface FinalizeShiftResponse {
  shift: ShiftDto;
  message: string;
}

// ============================================
// Service functions
// ============================================

const shiftService = {
  async openShift(payload: OpenShiftPayload): Promise<OpenShiftResponse> {
    const { data } = await api.post<OpenShiftResponse>('/shifts/open', payload);
    return data;
  },

  async closeShift(
    shiftId: string,
    payload: CloseShiftPayload,
  ): Promise<CloseShiftResponse> {
    const { data } = await api.post<CloseShiftResponse>(
      `/shifts/${shiftId}/close`,
      payload,
    );
    return data;
  },

  async getCurrentShift(): Promise<CurrentShiftResponse> {
    const { data } = await api.get<CurrentShiftResponse>('/shifts/current');
    return data;
  },

  async list(params?: QueryShiftParams): Promise<ListShiftsResponse> {
    const { data } = await api.get<ListShiftsResponse>('/shifts', { params });
    return data;
  },

  async getDetail(shiftId: string): Promise<ShiftDetailResponse> {
    const { data } = await api.get<ShiftDetailResponse>(`/shifts/${shiftId}`);
    return data;
  },

  async finalize(
    shiftId: string,
    payload: FinalizeShiftPayload = {},
  ): Promise<FinalizeShiftResponse> {
    const { data } = await api.post<FinalizeShiftResponse>(
      `/shifts/${shiftId}/finalize`,
      payload,
    );
    return data;
  },
};

export default shiftService;
