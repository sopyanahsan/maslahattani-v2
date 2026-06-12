import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(private prisma: PrismaService) {}

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

  async inquiry(shopId: string, productCode: string, customerId: string) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const signature = this.createSignature(
        config.privateKey,
        config.merchantCode + productCode + customerId,
      );

      const response = await fetch(`${baseUrl}/transaksi/inquiry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: productCode,
          customer_id: customerId,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(
          errorData?.message || 'Gagal melakukan inquiry. Periksa nomor pelanggan.',
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Tripay inquiry error: ${error.message}`);
      throw new InternalServerErrorException('Gagal melakukan inquiry ke Tripay.');
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
    },
  ) {
    const config = await this.getFullConfig(shopId);
    if (!config || !config.isActive) {
      throw new BadRequestException('Integrasi Tripay belum diaktifkan.');
    }

    const refId = this.generateRefId(shopId);

    try {
      const baseUrl = TRIPAY_BASE[config.mode as keyof typeof TRIPAY_BASE];
      const endpoint =
        dto.type === PpobType.PREPAID
          ? `${baseUrl}/transaksi/pembelian`
          : `${baseUrl}/transaksi/pembayaran`;

      const signature = this.createSignature(
        config.privateKey,
        config.merchantCode + dto.productCode + dto.customerId,
      );

      const payload: Record<string, any> = {
        merchant_ref: refId,
        code: dto.productCode,
        customer_id: dto.customerId,
        signature,
      };

      if (dto.amount) {
        payload.amount = dto.amount;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new BadRequestException(
          responseData?.message || 'Gagal membuat transaksi PPOB.',
        );
      }

      const trxData = responseData.data || responseData;
      const ppobTrx = await this.prisma.ppobTransaction.create({
        data: {
          shopId,
          cashierId,
          refId,
          tripayRef: trxData.reference || trxData.trx_id || null,
          productCode: dto.productCode,
          customerId: dto.customerId,
          customerName: dto.customerName || trxData.customer_name || null,
          customerPhone: dto.customerPhone || null,
          type: dto.type,
          amount: trxData.amount || dto.amount || 0,
          fee: trxData.fee || 0,
          total: trxData.total || (trxData.amount || 0) + (trxData.fee || 0),
          status: 'PROCESSING',
          tripayStatus: trxData.status || 'pending',
          rawResponse: JSON.stringify(trxData),
        },
      });

      return {
        success: true,
        message: 'Transaksi PPOB berhasil dibuat.',
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

  async handleCallback(payload: any, signatureHeader: string) {
    const refId = payload.merchant_ref;
    if (!refId) {
      throw new BadRequestException('Invalid callback: missing merchant_ref');
    }

    const trx = await this.prisma.ppobTransaction.findFirst({
      where: { refId },
    });

    if (!trx) {
      this.logger.warn(`Callback for unknown ref: ${refId}`);
      throw new NotFoundException('Transaction not found for callback.');
    }

    const config = await this.getFullConfig(trx.shopId);
    if (!config) {
      throw new BadRequestException('Shop config not found for callback.');
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', config.privateKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signatureHeader !== expectedSignature) {
      throw new BadRequestException('Invalid callback signature.');
    }

    const newStatus = this.mapTripayStatus(payload.status);
    await this.prisma.ppobTransaction.update({
      where: { id: trx.id },
      data: {
        status: newStatus,
        tripayStatus: payload.status,
        serialNumber: payload.sn || payload.serial_number || null,
        updatedAt: new Date(),
      },
    });

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
        return 'SUCCESS';
      case 'failed':
      case 'gagal':
      case 'expired':
        return 'FAILED';
      case 'pending':
      case 'process':
      case 'processing':
        return 'PROCESSING';
      case 'refund':
      case 'refunded':
        return 'REFUNDED';
      default:
        return 'PROCESSING';
    }
  }
}
