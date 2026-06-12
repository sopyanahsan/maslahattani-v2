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
      const response = await fetch(`${baseUrl}/cekserver`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new BadRequestException(
          result.message || 'Verifikasi gagal. Periksa API Key dan mode (sandbox/production).',
        );
      }

      // Update lastVerifiedAt
      await this.prisma.tripayConfig.update({
        where: { shopId },
        data: { lastVerifiedAt: new Date() },
      });

      return { success: true, message: 'Koneksi Tripay berhasil diverifikasi! Server online.' };
    } catch (error) {
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

  /**
   * Cek saldo deposit Tripay
   */
  async checkBalance(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const response = await fetch(`${baseUrl}/ceksaldo`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new BadRequestException(
          result.message || 'Gagal mengambil info saldo.',
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay checkBalance error: ${error.message}`);
      throw new InternalServerErrorException('Gagal cek saldo Tripay.');
    }
  }

  /**
   * Get prepaid categories from Tripay
   */
  async getPrepaidCategories(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const response = await fetch(`${baseUrl}/pembelian/kategori`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil kategori prabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidCategories error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil kategori prabayar.');
    }
  }

  /**
   * Get prepaid operators from Tripay
   */
  async getPrepaidOperators(shopId: string, categoryId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      let url = `${baseUrl}/pembelian/operator`;
      if (categoryId) url += `?category_id=${categoryId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil operator prabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidOperators error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil operator prabayar.');
    }
  }

  /**
   * Get prepaid products from Tripay
   */
  async getPrepaidProducts(shopId: string, operatorId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      let url = `${baseUrl}/pembelian/produk`;
      if (operatorId) url += `?operator_id=${operatorId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil produk prabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPrepaidProducts error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil produk prabayar.');
    }
  }

  /**
   * Get postpaid categories from Tripay
   */
  async getPostpaidCategories(shopId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const response = await fetch(`${baseUrl}/pembayaran/kategori`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil kategori pascabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidCategories error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil kategori pascabayar.');
    }
  }

  /**
   * Get postpaid operators from Tripay
   */
  async getPostpaidOperators(shopId: string, categoryId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      let url = `${baseUrl}/pembayaran/operator`;
      if (categoryId) url += `?category_id=${categoryId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil operator pascabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidOperators error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil operator pascabayar.');
    }
  }

  /**
   * Get postpaid products from Tripay
   */
  async getPostpaidProducts(shopId: string, operatorId?: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      let url = `${baseUrl}/pembayaran/produk`;
      if (operatorId) url += `?operator_id=${operatorId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });

      const result = await response.json().catch(() => ({}));
      if (!result.success) {
        throw new BadRequestException(result.message || 'Gagal mengambil produk pascabayar.');
      }
      return result.data || [];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay getPostpaidProducts error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil produk pascabayar.');
    }
  }

  // ============================================
  // INQUIRY (CEK TAGIHAN)
  // ============================================

  /**
   * Cek Tagihan Pascabayar
   * POST /v2/transaksi/cek-tagihan
   * Params: product, phone, no_pelanggan, api_trxid, pin
   */
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

      // Tripay uses form-urlencoded
      const formData = new URLSearchParams();
      formData.append('product', productCode);
      formData.append('phone', phone || customerId);
      formData.append('no_pelanggan', customerId);
      formData.append('api_trxid', apiTrxId);
      formData.append('pin', config.pin);

      const response = await fetch(`${baseUrl}/transaksi/cek-tagihan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!result.success) {
        throw new BadRequestException(
          result.message || 'Gagal cek tagihan. Periksa nomor pelanggan.',
        );
      }

      // Return data with order_id (tagihan_id) for bayar tagihan step
      return {
        ...result.data,
        order_id: result.data?.tagihan_id || result.data?.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay inquiry error: ${error.message}`);
      throw new InternalServerErrorException('Gagal cek tagihan ke Tripay.');
    }
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Request Transaksi Prabayar (Pembelian)
   * POST /v2/transaksi/pembelian
   * Params: inquiry (PLN|I), code, phone, no_meter_pln?, api_trxid?, pin
   *
   * Bayar Tagihan Pascabayar (Pembayaran)
   * POST /v2/transaksi/pembayaran
   * Params: order_id, api_trxid?, pin
   */
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
      orderId?: string; // For postpaid: order_id from cek tagihan response
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

      // Tripay uses form-urlencoded
      const formData = new URLSearchParams();
      formData.append('pin', config.pin);
      formData.append('api_trxid', refId);

      let endpoint: string;

      if (dto.type === PpobType.PREPAID) {
        // === PRABAYAR (Pembelian) ===
        endpoint = `${baseUrl}/transaksi/pembelian`;

        // inquiry field: "PLN" untuk PLN Prabayar, "I" untuk produk lainnya
        const isPln = dto.productCode.toUpperCase().includes('PLN');
        formData.append('inquiry', isPln ? 'PLN' : 'I');
        formData.append('code', dto.productCode);
        formData.append('phone', dto.customerId);

        if (isPln && dto.noMeterPln) {
          formData.append('no_meter_pln', dto.noMeterPln);
        }
      } else {
        // === PASCABAYAR (Pembayaran) ===
        endpoint = `${baseUrl}/transaksi/pembayaran`;

        if (!dto.orderId) {
          throw new BadRequestException(
            'order_id wajib diisi untuk transaksi pascabayar. Lakukan cek tagihan terlebih dahulu.',
          );
        }
        formData.append('order_id', dto.orderId);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json().catch(() => ({}));

      if (!responseData.success) {
        throw new BadRequestException(
          responseData?.message || 'Gagal membuat transaksi PPOB.',
        );
      }

      // Map response fields
      const trxData = responseData.data || responseData;
      const tripayTrxId = responseData.trxid || trxData.id || null;
      const tripayApiTrxId = responseData.api_trxid || trxData.api_trxid || refId;

      // Determine status from response
      // Tripay status: 0 = Proses, 1 = Sukses, 2 = Gagal, 3 = Refund
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
          amount: parseFloat(trxData.harga_default || trxData.amount || dto.amount || '0'),
          fee: parseFloat(trxData.harga_markup || trxData.fee || '0'),
          total: parseFloat(trxData.total || '0') || (dto.amount || 0),
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
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay createTransaction error: ${error.message}`);
      throw new InternalServerErrorException('Gagal membuat transaksi PPOB ke Tripay.');
    }
  }

  async checkTransactionStatus(shopId: string, trxId: string) {
    const trx = await this.prisma.ppobTransaction.findFirst({
      where: { id: trxId, shopId },
    });

    if (!trx) {
      throw new NotFoundException('Transaksi tidak ditemukan.');
    }

    const config = await this.getFullConfig(shopId);
    if (!config) {
      throw new BadRequestException('Konfigurasi Tripay tidak ditemukan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const response = await fetch(
        `${baseUrl}/transaksi/detail?reference=${trx.tripayRef}`,
        { headers: { Authorization: `Bearer ${config.apiKey}` } },
      );

      if (!response.ok) {
        throw new BadRequestException('Gagal memeriksa status transaksi.');
      }

      const data = await response.json();
      const tripayTrx = data.data;

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
    } catch (error) {
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

    if (query.status) {
      where.status = query.status;
    }

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
      this.prisma.ppobTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ppobTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // CALLBACK / WEBHOOK
  // ============================================

  /**
   * Handle callback from Tripay
   * Tripay sends POST with these fields:
   * - trxid, api_trxid, via, code, produk, target, mtrpln, note, token (SN)
   * - harga, saldo_before_trx, saldo_after_trx, created_at, updated_at
   * - status: 0=Proses, 1=Sukses, 2=Gagal, 3=Refund
   * Pascabayar tambah: id, nama, periode, jumlah_tagihan, admin, jumlah_bayar
   *
   * Expected response: { "success": true }
   */
  async handleCallback(payload: any, _signatureHeader?: string) {
    const apiTrxId = payload.api_trxid;
    const tripayTrxId = payload.trxid;

    if (!apiTrxId && !tripayTrxId) {
      throw new BadRequestException('Invalid callback: missing trxid or api_trxid');
    }

    // Find transaction by our refId (api_trxid) or tripayRef (trxid)
    let trx = null;
    if (apiTrxId) {
      trx = await this.prisma.ppobTransaction.findFirst({
        where: { refId: apiTrxId },
      });
    }
    if (!trx && tripayTrxId) {
      trx = await this.prisma.ppobTransaction.findFirst({
        where: { tripayRef: String(tripayTrxId) },
      });
    }

    if (!trx) {
      this.logger.warn(`Callback for unknown trx: api_trxid=${apiTrxId}, trxid=${tripayTrxId}`);
      // Return success anyway to acknowledge — Tripay won't retry
      return { success: true };
    }

    // Map status: 0=Proses, 1=Sukses, 2=Gagal, 3=Refund
    const newStatus = this.mapTripayStatusNumeric(payload.status);

    // Update our transaction
    await this.prisma.ppobTransaction.update({
      where: { id: trx.id },
      data: {
        status: newStatus,
        tripayStatus: String(payload.status),
        serialNumber: payload.token || null, // SN / token PLN
        rawResponse: JSON.stringify(payload),
        updatedAt: new Date(),
      },
    });

    // Emit real-time WebSocket event to admin/kasir
    this.realtimeGateway.emitPpobTransactionUpdated(trx.shopId, {
      id: trx.id,
      refId: trx.refId,
      productCode: trx.productCode,
      customerId: trx.customerId,
      status: newStatus,
      serialNumber: payload.token || null,
      total: trx.total,
    });

    this.logger.log(
      `Callback received: api_trxid=${apiTrxId}, status=${payload.status} → ${newStatus}`,
    );

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
    return crypto
      .createHmac('sha256', privateKey)
      .update(payload)
      .digest('hex');
  }

  private generateRefId(shopId: string): string {
    const now = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PPOB-${shopId.slice(-6).toUpperCase()}-${now}-${random}`;
  }

  private mapTripayStatus(tripayStatus?: string): string {
    switch (tripayStatus?.toLowerCase()) {
      case 'success':
      case 'sukses':
      case 'berhasil':
      case '1':
        return 'SUCCESS';
      case 'failed':
      case 'gagal':
      case 'expired':
      case '2':
        return 'FAILED';
      case 'pending':
      case 'process':
      case 'processing':
      case '0':
        return 'PROCESSING';
      case 'refund':
      case 'refunded':
      case '3':
        return 'REFUNDED';
      default:
        return 'PROCESSING';
    }
  }

  /**
   * Map Tripay numeric status:
   * 0 = Proses, 1 = Sukses, 2 = Gagal, 3 = Refund
   */
  private mapTripayStatusNumeric(status: string | number): string {
    switch (String(status)) {
      case '1': return 'SUCCESS';
      case '2': return 'FAILED';
      case '3': return 'REFUNDED';
      case '0':
      default: return 'PROCESSING';
    }
  }
}
