import api from './api';

// ============================================
// Types
// ============================================

export interface SupplierDto {
  id: string;
  shopId: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierListResponse {
  data: SupplierDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderDto {
  id: string;
  orderNumber: string;
  status: POStatus;
  totalAmount: number;
  notes: string | null;
  supplierId: string;
  supplierName: string;
  createdById: string;
  createdByName: string;
  itemCount: number;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface POItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQty: number;
}

export interface PurchaseOrderDetailDto {
  id: string;
  orderNumber: string;
  status: POStatus;
  totalAmount: number;
  notes: string | null;
  supplier: { id: string; name: string; phone: string | null };
  createdBy: { id: string; name: string };
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: POItemDto[];
}

export interface POListResponse {
  data: PurchaseOrderDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateSupplierPayload {
  shopId: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CreatePOItemPayload {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderPayload {
  shopId: string;
  supplierId: string;
  notes?: string;
  items: CreatePOItemPayload[];
}

// ============================================
// Service
// ============================================

interface ListSuppliersParams {
  shopId?: string;
  page?: number;
  limit?: number;
}

interface ListPOParams {
  shopId?: string;
  supplierId?: string;
  status?: POStatus;
  page?: number;
  limit?: number;
}

const supplierService = {
  // === Suppliers ===

  async listSuppliers(params: ListSuppliersParams): Promise<SupplierListResponse> {
    const { data } = await api.get<SupplierListResponse>('/suppliers', { params });
    return data;
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<SupplierDto> {
    const { data } = await api.post<SupplierDto>('/suppliers', payload);
    return data;
  },

  async updateSupplier(id: string, payload: UpdateSupplierPayload): Promise<SupplierDto> {
    const { data } = await api.patch<SupplierDto>(`/suppliers/${id}`, payload);
    return data;
  },

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },

  // === Purchase Orders ===

  async listPurchaseOrders(params: ListPOParams): Promise<POListResponse> {
    const { data } = await api.get<POListResponse>('/suppliers/purchase-orders', { params });
    return data;
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrderDetailDto> {
    const { data } = await api.get<PurchaseOrderDetailDto>(`/suppliers/purchase-orders/${id}`);
    return data;
  },

  async createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
    const { data } = await api.post('/suppliers/purchase-orders', payload);
    return data;
  },

  async markOrdered(id: string) {
    const { data } = await api.post(`/suppliers/purchase-orders/${id}/order`);
    return data;
  },

  async markReceived(id: string, items?: Array<{ itemId: string; receivedQty: number; actualCost?: number }>) {
    const { data } = await api.post(`/suppliers/purchase-orders/${id}/receive`, items ? { items } : {});
    return data;
  },

  async cancelPO(id: string) {
    const { data } = await api.post(`/suppliers/purchase-orders/${id}/cancel`);
    return data;
  },

  // === Price Updates (from PO receive) ===

  async bulkUpdatePrices(updates: Array<{ productId: string; cost: number; price?: number }>) {
    const { data } = await api.post('/products/bulk-update-prices', { updates });
    return data;
  },

  // === Product search (for PO creation) ===

  async searchProducts(shopId: string, search: string): Promise<Array<{ id: string; name: string; sku: string; stock: number }>> {
    const { data } = await api.get('/products', {
      params: { shopId, search, limit: 10 },
    });
    // Map response to simplified format
    return (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stocks?.reduce((sum: number, s: any) => sum + s.quantity, 0) ?? 0,
    }));
  },

  // === Quick create product (from PO flow) ===

  async quickCreateProduct(payload: { shopId: string; name: string; unit?: string; categoryId?: string }) {
    const { data } = await api.post('/products/quick-create', payload);
    return data;
  },

  // === Product categories (for quick add form) ===

  async getProductCategories(shopId: string): Promise<{ data: Array<{ id: string; name: string }> }> {
    const { data } = await api.get('/products/categories', { params: { shopId } });
    return { data: data.data || data || [] };
  },
};

export default supplierService;
