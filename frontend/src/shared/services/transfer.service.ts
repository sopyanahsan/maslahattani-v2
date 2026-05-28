import api from './api';

// ============================================
// Types
// ============================================

export type TransferStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface TransferDto {
  id: string;
  transferNumber: string;
  status: TransferStatus;
  fromShopId: string;
  fromShopName: string;
  toShopId: string;
  toShopName: string;
  requestedById: string;
  requestedByName: string;
  approvedById: string | null;
  approvedByName: string | null;
  notes: string | null;
  approvalNotes: string | null;
  itemCount: number;
  requestedAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface TransferItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQty: number;
}

export interface TransferDetailDto {
  id: string;
  transferNumber: string;
  status: TransferStatus;
  fromShop: { id: string; name: string };
  toShop: { id: string; name: string };
  requestedBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  notes: string | null;
  approvalNotes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: TransferItemDto[];
}

export interface TransferListResponse {
  data: TransferDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateTransferItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateTransferPayload {
  fromShopId: string;
  toShopId: string;
  notes?: string;
  items: CreateTransferItemPayload[];
}

export interface ReceiveItemPayload {
  productId: string;
  receivedQty: number;
}

// ============================================
// Service
// ============================================

interface ListTransfersParams {
  shopId?: string;
  status?: TransferStatus;
  direction?: 'in' | 'out' | 'all';
  page?: number;
  limit?: number;
}

const transferService = {
  async listTransfers(params: ListTransfersParams): Promise<TransferListResponse> {
    const { data } = await api.get<TransferListResponse>('/transfers', { params });
    return data;
  },

  async getTransfer(id: string): Promise<TransferDetailDto> {
    const { data } = await api.get<TransferDetailDto>(`/transfers/${id}`);
    return data;
  },

  async createTransfer(payload: CreateTransferPayload) {
    const { data } = await api.post('/transfers', payload);
    return data;
  },

  async approveTransfer(id: string) {
    const { data } = await api.post(`/transfers/${id}/approve`);
    return data;
  },

  async rejectTransfer(id: string, notes?: string) {
    const { data } = await api.post(`/transfers/${id}/reject`, { notes });
    return data;
  },

  async shipTransfer(id: string) {
    const { data } = await api.post(`/transfers/${id}/ship`);
    return data;
  },

  async receiveTransfer(id: string, items?: ReceiveItemPayload[]) {
    const { data } = await api.post(`/transfers/${id}/receive`, { items });
    return data;
  },

  async cancelTransfer(id: string) {
    const { data } = await api.post(`/transfers/${id}/cancel`);
    return data;
  },
};

export default transferService;
