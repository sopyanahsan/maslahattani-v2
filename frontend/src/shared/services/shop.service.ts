import api from './api';
import type { ShopDto } from './auth.service';

export interface ShopListItem extends ShopDto {
  ownerId?: string | null;
  parentShopId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    users: number;
    products: number;
    transactions: number;
  };
}

export interface ShopDetail extends ShopListItem {
  owner?: { id: string; email: string; username?: string | null } | null;
  parentShop?: { id: string; name: string } | null;
  childShops?: { id: string; name: string }[];
  settings?: {
    language: string;
    receiptConfig: string | null;
  } | null;
}

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

export interface SelectShopResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  shop: ShopDto;
}

const shopService = {
  /**
   * List cabang yang bisa diakses user saat ini.
   * - SUPER_ADMIN: semua cabang
   * - User lain: hanya cabang shopId-nya
   */
  async list(): Promise<ShopListItem[]> {
    const { data } = await api.get<ShopListItem[]>('/shops');
    return data;
  },

  async findOne(id: string): Promise<ShopDetail> {
    const { data } = await api.get<ShopDetail>(`/shops/${id}`);
    return data;
  },

  async create(payload: CreateShopPayload): Promise<ShopListItem> {
    const { data } = await api.post<ShopListItem>('/shops', payload);
    return data;
  },

  async update(id: string, payload: UpdateShopPayload): Promise<ShopListItem> {
    const { data } = await api.patch<ShopListItem>(`/shops/${id}`, payload);
    return data;
  },

  /**
   * Pilih cabang aktif. Backend re-issue JWT dengan claim shopId baru.
   * Caller (shop.store) bertanggungjawab update auth.store tokens.
   */
  async selectShop(id: string): Promise<SelectShopResponse> {
    const { data } = await api.post<SelectShopResponse>(`/shops/select/${id}`);
    return data;
  },
};

export default shopService;
