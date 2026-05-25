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

export interface ShiftDto {
  id: string;
  userId: string;
  shopId: string;
  startTime: string;
  endTime?: string | null;

  expectedCash: number;
  actualCash?: number | null;
  expectedQRIS: number;
  actualQRIS?: number | null;
  variance?: number | null;

  status: ShiftStatus;
  notes?: string | null;
  finalizedAt?: string | null;
  finalizedBy?: string | null;

  createdAt: string;
  updatedAt: string;

  user?: ShiftUserSummary;
  shop?: ShiftShopSummary;
}

// ============================================
// Request payloads
// ============================================

export interface OpenShiftPayload {
  startingCash: number;
  notes?: string;
}

export interface CloseShiftPayload {
  actualCash: number;
  actualQRIS: number;
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

export interface CloseShiftSummary {
  expectedCash: number;
  actualCash: number;
  varianceCash: number;
  expectedQRIS: number;
  actualQRIS: number;
  varianceQRIS: number;
  totalTransactions: number;
}

export interface CloseShiftResponse {
  shift: ShiftDto;
  summary: CloseShiftSummary;
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
