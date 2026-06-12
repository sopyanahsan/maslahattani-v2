import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateTripayConfigDto, TripayMode, PpobType } from './dto';
import * as crypto from 'crypto';

/**
 * Tripay base URLs (official docs: tripay.id)
 * Sandbox: https://tripay.id/api-sandbox/v2
 * Production: https://tripay.id/api/v2
 */
const TRIPAY_BASE = {
  sandbox: 'https://tripay.id/api-sandbox/v2',
  production: 'https://tripay.id/api/v2',
};

/** Generic Tripay API response shape */
interface TripayResponse {
  success: boolean;
  message?: string;
  data?: any;
  trxid?: number;
  api_trxid?: string;
}

/**
 * PPOB product categories for Tripay
 */
export const PPOB_CATEGORIES = [
  { code: 'pulsa', label: 'Pulsa', icon: 'smartphone', color: 'pink' },
  { code: 'paket-data', label: 'Paket Data', icon: 'wifi', color: 'purple' },
  { code: 'pln', label: 'Token PLN', icon: 'zap', color: 'yellow' },
  { code: 'pln-postpaid', label: 'Tagihan Listrik', icon: 'zap', color: 'amber' },
  { code: 'pdam', label: 'PDAM', icon: 'droplets', color: 'blue' },
  { code: 'bpjs', label: 'BPJS', icon: 'heart-pulse', color: 'green' },
  { code: 'internet', label: 'Internet & TV', icon: 'tv', color: 'indigo' },
  { code: 'emoney', label: 'E-Money', icon: 'wallet', color: 'cyan' },
  { code: 'voucher-game', label: 'Voucher Game', icon: 'gamepad-2', color: 'red' },
  { code: 'telkom', label: 'Telkom/IndiHome', icon: 'phone', color: 'teal' },
] as const;

@Injectable()
export class TripayService {
  private readonly logger = new Logger(TripayService.name);

  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  // ============================================
  // HELPERS: HTTP fetch with typed response
  // ============================================

  private async tripayGet(baseUrl: string, path: string, apiKey: string): Promise<TripayResponse> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const result = (await response.json().catch(() => ({ success: false }))) as TripayResponse;
    return result;
  }

  private async tripayPost(baseUrl: string, path: string, apiKey: string, body: URLSearchParams): Promise<TripayResponse> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body,
    });
    const result = (await response.json().catch(() => ({ success: false }))) as TripayResponse;
    return result;
  }

  // ============================================
  // CONFIG MANAGEMENT
  // ============================================

  async getConfig(shopId: string) {
    const config = await this.prisma.tripayConfig.findUnique({
      where: { shopId },
    });

    if (!config) {
      return {
        apiKey: '',
        privateKey: '',
        merchantCode: '',
        mode: TripayMode.SANDBOX,
        isActive: false,
        lastVerifiedAt: null,
      };
    }

    return {
      apiKey: this.maskSecret(config.apiKey),
      privateKey: this.maskSecret(config.privateKey),
      merchantCode: config.merchantCode,
      mode: config.mode as TripayMode,
      isActive: config.isActive,
      lastVerifiedAt: config.lastVerifiedAt?.toISOString() || null,
    };
  }

  async saveConfig(shopId: string, dto: UpdateTripayConfigDto) {
    const data = {
      apiKey: dto.apiKey,
      privateKey: dto.privateKey,
      merchantCode: dto.merchantCode,
      pin: dto.pin,
      mode: dto.mode || TripayMode.SANDBOX,
      isActive: dto.isActive ?? true,
    };

    const config = await this.prisma.tripayConfig.upsert({
      where: { shopId },
      create: { shopId, ...data },
      update: data,
    });

    return {
      success: true,
      message: 'Konfigurasi Tripay berhasil disimpan.',
      config: {
        merchantCode: config.merchantCode,
        mode: config.mode,
        isActive: config.isActive,
      },
    };
  }

  async verifyConfig(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config) {
      throw new NotFoundException('Konfigurasi Tripay belum diatur.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const result = await this.tripayGet(baseUrl, '/cekserver', config.apiKey);

      if (!result.success) {
        throw new BadRequestException(
          result.message || 'Verifikasi gagal. Periksa API Key dan mode (sandbox/production).',
        );
      }

      await this.prisma.tripayConfig.update({
        where: { shopId },
        data: { lastVerifiedAt: new Date() },
      });

      return { success: true, message: 'Koneksi Tripay berhasil diverifikasi! Server online.' };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay verify error: ${error.message}`);
      throw new BadRequestException(
        'Gagal menghubungi server Tripay. Periksa koneksi internet.',
      );
    }
  }

  // ============================================
  // PPOB PRODUCTS
  // ============================================

  getProductCategories() {
    return PPOB_CATEGORIES;
  }

  async checkBalance(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const result = await this.tripayGet(baseUrl, '/ceksaldo', config.apiKey);

      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil info saldo.');
      }

      return result.data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay checkBalance error: ${error.message}`);
      throw new InternalServerErrorException('Gagal cek saldo Tripay.');
    }
  }

  async getPrepaidCategories(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const result = await this.tripayGet(baseUrl, '/pembelian/kategori', config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil kategori prabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidCategories error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil kategori prabayar.');
    }
  }

  async getPrepaidOperators(shopId: string, categoryId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const path = categoryId ? `/pembelian/operator?category_id=${categoryId}` : '/pembelian/operator';
      const result = await this.tripayGet(baseUrl, path, config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil operator prabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidOperators error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil operator prabayar.');
    }
  }

  async getPrepaidProducts(shopId: string, operatorId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const path = operatorId ? `/pembelian/produk?operator_id=${operatorId}` : '/pembelian/produk';
      const result = await this.tripayGet(baseUrl, path, config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil produk prabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidProducts error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil produk prabayar.');
    }
  }

  async getPostpaidCategories(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const result = await this.tripayGet(baseUrl, '/pembayaran/kategori', config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil kategori pascabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidCategories error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil kategori pascabayar.');
    }
  }

  async getPostpaidOperators(shopId: string, categoryId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const path = categoryId ? `/pembayaran/operator?category_id=${categoryId}` : '/pembayaran/operator';
      const result = await this.tripayGet(baseUrl, path, config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil operator pascabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidOperators error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil operator pascabayar.');
    }
  }

  async getPostpaidProducts(shopId: string, operatorId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const path = operatorId ? `/pembayaran/produk?operator_id=${operatorId}` : '/pembayaran/produk';
      const result = await this.tripayGet(baseUrl, path, config.apiKey);
      if (!result.success) throw new BadRequestException(result.message || 'Gagal mengambil produk pascabayar.');
      return result.data || [];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidProducts error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil produk pascabayar.');
    }
  }

  // ============================================
  // INQUIRY (CEK TAGIHAN)
  // ============================================

  async inquiry(shopId: string, productCode: string, customerId: string, phone?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    if (!config.pin) {
      throw new BadRequestException('PIN transaksi Tripay belum diatur.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const apiTrxId = this.generateRefId(shopId);

      const formData = new URLSearchParams();
      formData.append('product', productCode);
      formData.append('phone', phone || customerId);
      formData.append('no_pelanggan', customerId);
      formData.append('api_trxid', apiTrxId);
      formData.append('pin', config.pin);

      const result = await this.tripayPost(baseUrl, '/transaksi/cek-tagihan', config.apiKey, formData);

      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal cek tagihan. Periksa nomor pelanggan.');
      }

      return {
        ...(result.data || {}),
        order_id: result.data?.tagihan_id || result.data?.id,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay inquiry error: ${error.message}`);
      throw new InternalServerErrorException('Gagal cek tagihan ke Tripay.');
    }
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  async createTransaction(
    shopId: string,
    cashierId: string,
    dto: {
      productCode: string;
      customerId: string;
      type: PpobType;
      customerName?: string;
      customerPhone?: string;
      amount?: number;
      noMeterPln?: string;
      orderId?: string;
    },
  ) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }
    if (!config.pin) {
      throw new BadRequestException('PIN transaksi Tripay belum diatur di konfigurasi.');
    }

    const refId = this.generateRefId(shopId);

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];

      const formData = new URLSearchParams();
      formData.append('pin', config.pin);
      formData.append('api_trxid', refId);

      let endpoint: string;

      if (dto.type === PpobType.PREPAID) {
        endpoint = '/transaksi/pembelian';
        const isPln = dto.productCode.toUpperCase().includes('PLN');
        formData.append('inquiry', isPln ? 'PLN' : 'I');
        formData.append('code', dto.productCode);
        formData.append('phone', dto.customerId);
        if (isPln && dto.noMeterPln) {
          formData.append('no_meter_pln', dto.noMeterPln);
        }
      } else {
        endpoint = '/transaksi/pembayaran';
        if (!dto.orderId) {
          throw new BadRequestException('order_id wajib diisi untuk transaksi pascabayar.');
        }
        formData.append('order_id', dto.orderId);
      }

      const responseData = await this.tripayPost(baseUrl, endpoint, config.apiKey, formData);

      if (!responseData.success) {
        throw new BadRequestException(responseData.message || 'Gagal membuat transaksi PPOB.');
      }

      const trxData = responseData.data || responseData;
      const tripayTrxId = responseData.trxid || trxData.id || null;
      const tripayApiTrxId = responseData.api_trxid || trxData.api_trxid || refId;
      const tripayStatusNum = trxData.status ?? '0';
      const mappedStatus = this.mapTripayStatusNumeric(tripayStatusNum);

      const ppobTrx = await this.prisma.ppobTransaction.create({
        data: {
          shopId,
          cashierId,
          refId,
          tripayRef: String(tripayTrxId || tripayApiTrxId),
          productCode: dto.productCode,
          customerId: dto.customerId,
          customerName: dto.customerName || trxData.target || null,
          customerPhone: dto.customerPhone || dto.customerId,
          type: dto.type,
          amount: parseFloat(String(trxData.harga_default || trxData.amount || dto.amount || 0)),
          fee: parseFloat(String(trxData.harga_markup || trxData.fee || 0)),
          total: parseFloat(String(trxData.total || 0)) || (dto.amount || 0),
          status: mappedStatus,
          tripayStatus: String(tripayStatusNum),
          serialNumber: trxData.token || trxData.sn || null,
          rawResponse: JSON.stringify(responseData),
        },
      });

      return {
        success: true,
        message: responseData.message || 'Transaksi PPOB berhasil dibuat.',
        transaction: ppobTrx,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay createTransaction error: ${error.message}`);
      throw new InternalServerErrorException('Gagal membuat transaksi PPOB ke Tripay.');
    }
  }

  async checkTransactionStatus(shopId: string, trxId: string) {
    const trx = await this.prisma.ppobTransaction.findFirst({
      where: { id: trxId, shopId },
    });
    if (!trx) throw new NotFoundException('Transaksi tidak ditemukan.');

    const config = await this.getFullConfig(shopId);
    if (!config) throw new BadRequestException('Konfigurasi Tripay tidak ditemukan.');

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const result = await this.tripayGet(baseUrl, `/transaksi/detail?reference=${trx.tripayRef}`, config.apiKey);

      if (!result.success) throw new BadRequestException('Gagal memeriksa status transaksi.');

      const tripayTrx = result.data;
      const newStatus = this.mapTripayStatus(tripayTrx?.status);

      await this.prisma.ppobTransaction.update({
        where: { id: trxId },
        data: {
          status: newStatus,
          tripayStatus: tripayTrx?.status || trx.tripayStatus,
          serialNumber: tripayTrx?.sn || tripayTrx?.serial_number || null,
          updatedAt: new Date(),
        },
      });

      return {
        ...trx,
        status: newStatus,
        tripayStatus: tripayTrx?.status,
        serialNumber: tripayTrx?.sn || tripayTrx?.serial_number || null,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay checkStatus error: ${error.message}`);
      throw new InternalServerErrorException('Gagal cek status transaksi.');
    }
  }

  async listTransactions(shopId: string, query: {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59Z');
    }
    if (query.search) {
      where.OR = [
        { customerId: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { productCode: { contains: query.search, mode: 'insensitive' } },
        { refId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.ppobTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.ppobTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // CALLBACK / WEBHOOK
  // ============================================

  async handleCallback(payload: any, _signatureHeader?: string) {
    const apiTrxId: string | undefined = payload.api_trxid;
    const tripayTrxId: string | undefined = payload.trxid;

    if (!apiTrxId && !tripayTrxId) {
      throw new BadRequestException('Invalid callback: missing trxid or api_trxid');
    }

    // Find transaction
    let trx: {
      id: string; shopId: string; refId: string; productCode: string;
      customerId: string; total: number; tripayRef: string | null;
    } | null = null;

    if (apiTrxId) {
      trx = await this.prisma.ppobTransaction.findFirst({ where: { refId: apiTrxId } });
    }
    if (!trx && tripayTrxId) {
      trx = await this.prisma.ppobTransaction.findFirst({ where: { tripayRef: String(tripayTrxId) } });
    }

    if (!trx) {
      this.logger.warn(`Callback for unknown trx: api_trxid=${apiTrxId}, trxid=${tripayTrxId}`);
      return { success: true };
    }

    const newStatus = this.mapTripayStatusNumeric(payload.status);

    await this.prisma.ppobTransaction.update({
      where: { id: trx.id },
      data: {
        status: newStatus,
        tripayStatus: String(payload.status),
        serialNumber: payload.token || null,
        rawResponse: JSON.stringify(payload),
        updatedAt: new Date(),
      },
    });

    // Emit real-time WebSocket event
    this.realtimeGateway.emitPpobTransactionUpdated(trx.shopId, {
      id: trx.id,
      refId: trx.refId,
      productCode: trx.productCode,
      customerId: trx.customerId,
      status: newStatus,
      serialNumber: payload.token || null,
      total: trx.total,
    });

    this.logger.log(`Callback received: api_trxid=${apiTrxId}, status=${payload.status} → ${newStatus}`);
    return { success: true };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getFullConfig(shopId: string) {
    return this.prisma.tripayConfig.findUnique({ where: { shopId } });
  }

  private maskSecret(value: string): string {
    if (!value || value.length < 8) return '****';
    return value.slice(0, 4) + '****' + value.slice(-4);
  }

  private createSignature(privateKey: string, payload: string): string {
    return crypto.createHmac('sha256', privateKey).update(payload).digest('hex');
  }

  private generateRefId(shopId: string): string {
    const now = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PPOB-${shopId.slice(-6).toUpperCase()}-${now}-${random}`;
  }

  private mapTripayStatus(tripayStatus?: string): string {
    switch (String(tripayStatus || '').toLowerCase()) {
      case 'success': case 'sukses': case 'berhasil': case '1': return 'SUCCESS';
      case 'failed': case 'gagal': case 'expired': case '2': return 'FAILED';
      case 'refund': case 'refunded': case '3': return 'REFUNDED';
      case 'pending': case 'process': case 'processing': case '0': default: return 'PROCESSING';
    }
  }

  private mapTripayStatusNumeric(status: string | number): string {
    switch (String(status)) {
      case '1': return 'SUCCESS';
      case '2': return 'FAILED';
      case '3': return 'REFUNDED';
      case '0': default: return 'PROCESSING';
    }
  }
}
