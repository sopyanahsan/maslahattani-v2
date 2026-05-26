import api from './api';
import type { UserRole } from './auth.service';

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
  actualQRIS: number;
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
