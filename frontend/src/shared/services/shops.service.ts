import api from './api';

// ============================================
// Types
// ============================================

export interface ShopDto {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerId?: string | null;
  parentShopId?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; email: string; username?: string | null } | null;
  parentShop?: { id: string; name: string } | null;
  childShops?: { id: string; name: string }[];
  settings?: { language: string; receiptConfig?: string | null } | null;
  _count?: { users: number; products: number; transactions: number };
}

// ============================================
// Request payloads
// ============================================

export interface CreateShopPayload {
  name: string;
  address: string;
  phone: string;
  parentShopId?: string;
}

export interface UpdateShopPayload {
  name?: string;
  address?: string;
  phone?: string;
}

// ============================================
// Service functions
// ============================================

const shopsService = {
  async list(): Promise<ShopDto[]> {
    const { data } = await api.get<ShopDto[]>('/shops');
    return data;
  },

  async getDetail(id: string): Promise<ShopDto> {
    const { data } = await api.get<ShopDto>(`/shops/${id}`);
    return data;
  },

  async create(payload: CreateShopPayload): Promise<ShopDto> {
    const { data } = await api.post<ShopDto>('/shops', payload);
    return data;
  },

  async update(id: string, payload: UpdateShopPayload): Promise<ShopDto> {
    const { data } = await api.patch<ShopDto>(`/shops/${id}`, payload);
    return data;
  },

  async selectShop(shopId: string): Promise<{ success: boolean; token: string; refreshToken: string; shop: any }> {
    const { data } = await api.post(`/shops/select/${shopId}`);
    return data;
  },
};

export default shopsService;
