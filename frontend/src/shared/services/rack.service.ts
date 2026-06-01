import api from './api';

// ============================================
// Types
// ============================================

export interface RackZoneDto {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  rackCount: number;
  createdAt: string;
}

export interface RackDto {
  id: string;
  shopId: string;
  zoneId: string;
  zoneName: string;
  code: string;
  name: string | null;
  productCount: number;
  createdAt: string;
}

export interface RackProductDto {
  stockId: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  quantity: number;
}

export interface RackWithProducts {
  rack: { id: string; code: string; name: string | null };
  products: RackProductDto[];
}

// ============================================
// Payloads
// ============================================

export interface CreateRackZonePayload {
  shopId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateRackZonePayload {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateRackPayload {
  shopId: string;
  zoneId: string;
  code: string;
  name?: string;
}

export interface UpdateRackPayload {
  zoneId?: string;
  code?: string;
  name?: string;
}

// ============================================
// Service
// ============================================

const rackService = {
  // --- Zones ---

  async listZones(shopId: string): Promise<RackZoneDto[]> {
    const { data } = await api.get<RackZoneDto[]>('/racks/zones', { params: { shopId } });
    return data;
  },

  async createZone(payload: CreateRackZonePayload): Promise<RackZoneDto> {
    const { data } = await api.post<RackZoneDto>('/racks/zones', payload);
    return data;
  },

  async updateZone(id: string, payload: UpdateRackZonePayload): Promise<RackZoneDto> {
    const { data } = await api.patch<RackZoneDto>(`/racks/zones/${id}`, payload);
    return data;
  },

  async deleteZone(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/racks/zones/${id}`);
    return data;
  },

  // --- Racks ---

  async listRacks(shopId: string, zoneId?: string): Promise<RackDto[]> {
    const { data } = await api.get<RackDto[]>('/racks', { params: { shopId, ...(zoneId ? { zoneId } : {}) } });
    return data;
  },

  async createRack(payload: CreateRackPayload): Promise<RackDto> {
    const { data } = await api.post<RackDto>('/racks', payload);
    return data;
  },

  async updateRack(id: string, payload: UpdateRackPayload): Promise<RackDto> {
    const { data } = await api.patch<RackDto>(`/racks/${id}`, payload);
    return data;
  },

  async deleteRack(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/racks/${id}`);
    return data;
  },

  async getProductsByRack(rackId: string): Promise<RackWithProducts> {
    const { data } = await api.get<RackWithProducts>(`/racks/${rackId}/products`);
    return data;
  },

  // --- Assign product to rack ---

  async assignProductToRack(stockId: string, rackId: string | null): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/racks/assign/${stockId}`, { rackId });
    return data;
  },
};

export default rackService;
