import api from './api';

// ============================================
// Types
// ============================================

export interface SettingsResponse {
  shop: { id: string; name: string; address: string; phone: string; parentShopId?: string | null };
  settings: { language: string; receiptConfig?: string | null } | null;
  branches: { id: string; name: string; address: string; phone: string }[];
}

export interface UpdateLanguagePayload {
  shopId: string;
  language: string;
}

export interface UpdateReceiptConfigPayload {
  shopId: string;
  autoPrint?: boolean;
  mergeReceipts?: boolean;
  footerMessage?: string;
}

export interface UpdateShopPayload {
  name?: string;
  address?: string;
  phone?: string;
}

// ============================================
// Service functions
// ============================================

const settingsService = {
  async getSettings(shopId: string): Promise<SettingsResponse> {
    const { data } = await api.get<SettingsResponse>('/settings', { params: { shopId } });
    return data;
  },

  async updateLanguage(payload: UpdateLanguagePayload): Promise<any> {
    const { data } = await api.put('/settings/language', payload);
    return data;
  },

  async updateReceiptConfig(payload: UpdateReceiptConfigPayload): Promise<any> {
    const { data } = await api.put('/settings/receipt-config', payload);
    return data;
  },

  async updateShop(shopId: string, payload: UpdateShopPayload): Promise<any> {
    const { data } = await api.put(`/settings/shop/${shopId}`, payload);
    return data;
  },

  // ============================================
  // BRILink Category Config (Metode Kas)
  // ============================================

  async getBrilinkCategories(shopId: string): Promise<Record<string, any>> {
    const { data } = await api.get<Record<string, any>>(
      '/settings/brilink-categories',
      { params: { shopId } },
    );
    return data;
  },

  async updateBrilinkCategories(
    shopId: string,
    config: Record<string, any>,
  ): Promise<Record<string, any>> {
    const { data } = await api.patch<Record<string, any>>(
      '/settings/brilink-categories',
      config,
      { params: { shopId } },
    );
    return data;
  },
};

export default settingsService;
