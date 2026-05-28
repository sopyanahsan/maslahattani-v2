import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashMutationDto, CashMutationType, AuditCashDto } from './dto/cash-mutation.dto';
import { QueryCashMutationDto } from './dto/query-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // GET CASH BOX (Total kas retail)
  // ============================================

  async getCashBox(shopId: string) {
    // Get all cash boxes for this shop
    const cashBoxes = await this.prisma.cashBox.findMany({
      where: { shopId },
      orderBy: { label: 'asc' },
    });

    // Auto-create default cash box if none exist
    if (cashBoxes.length === 0) {
      const created = await this.prisma.cashBox.create({
        data: { shopId, categoryId: null, label: 'Kas Utama', balance: 0 },
      });
      return {
        shopId,
        balance: created.balance,
        lastAudit: created.lastAudit,
        lastAuditBalance: created.lastAuditBalance,
        cashBoxes: [created],
      };
    }

    const totalBalance = cashBoxes.reduce((sum, cb) => sum + cb.balance, 0);

    return {
      shopId,
      balance: totalBalance,
      lastAudit: cashBoxes[0]?.lastAudit,
      lastAuditBalance: null,
      cashBoxes,
    };
  }

  // ============================================
  // CASH MUTATION (Cash In / Cash Out)
  // ============================================

  async createMutation(dto: CashMutationDto) {
    // Find or create CashBox for this category
    let cashBox = await this.prisma.cashBox.findFirst({
      where: { shopId: dto.shopId, categoryId: dto.categoryId || null },
    });

    if (!cashBox) {
      const categoryLabel = dto.categoryId
        ? (await this.prisma.cashBoxCategory.findUnique({ where: { id: dto.categoryId } }))?.name || 'Kas'
        : 'Kas Utama';
      cashBox = await this.prisma.cashBox.create({
        data: { shopId: dto.shopId, categoryId: dto.categoryId || null, label: categoryLabel, balance: 0 },
      });
    }

    // Validate cash out doesn't exceed balance
    if (dto.type === CashMutationType.CASH_OUT && dto.amount > cashBox.balance) {
      throw new BadRequestException(
        `Saldo "${cashBox.label}" tidak mencukupi. Saldo: Rp ${cashBox.balance.toLocaleString('id-ID')}`,
      );
    }

    const newBalance =
      dto.type === CashMutationType.CASH_IN
        ? cashBox.balance + dto.amount
        : cashBox.balance - dto.amount;

    // Update cash box + persist mutation record
    const [, mutation] = await this.prisma.$transaction([
      this.prisma.cashBox.update({
        where: { id: cashBox.id },
        data: { balance: newBalance },
      }),
      this.prisma.cashMutation.create({
        data: {
          shopId: dto.shopId,
          categoryId: dto.categoryId || null,
          type: dto.type,
          amount: dto.amount,
          balanceBefore: cashBox.balance,
          balanceAfter: newBalance,
          category: dto.category || null,
          notes: dto.notes || null,
        },
      }),
    ]);

    return {
      success: true,
      message:
        dto.type === CashMutationType.CASH_IN
          ? `Pemasukan Rp ${dto.amount.toLocaleString('id-ID')} ke "${cashBox.label}" berhasil.`
          : `Pengeluaran Rp ${dto.amount.toLocaleString('id-ID')} dari "${cashBox.label}" berhasil.`,
      mutation,
    };
  }

  // ============================================
  // AUDIT CASH (Verifikasi saldo fisik)
  // ============================================

  async auditCash(dto: AuditCashDto) {
    let cashBox = await this.prisma.cashBox.findFirst({
      where: { shopId: dto.shopId, categoryId: null },
    });

    if (!cashBox) {
      throw new NotFoundException('Cash box tidak ditemukan untuk toko ini.');
    }

    const systemBalance = cashBox.balance;
    const variance = dto.actualBalance - systemBalance;

    // Update cash box with audit info
    await this.prisma.cashBox.update({
      where: { id: cashBox.id },
      data: {
        balance: dto.actualBalance,
        lastAudit: new Date(),
        lastAuditBalance: dto.actualBalance,
      },
    });

    return {
      success: true,
      message: variance === 0 ? 'Saldo cocok!' : `Selisih Rp ${Math.abs(variance).toLocaleString('id-ID')}`,
      audit: {
        systemBalance,
        actualBalance: dto.actualBalance,
        variance,
        status: variance === 0 ? 'MATCH' : variance > 0 ? 'SURPLUS' : 'SELISIH',
        auditedAt: new Date(),
        notes: dto.notes,
      },
    };
  }

  // ============================================
  // GET PAYMENT HISTORY (from transactions)
  // ============================================

  async getPaymentHistory(query: QueryCashMutationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) where.shopId = query.shopId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          transaction: {
            select: { transactionNumber: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Summary per method
    const summary = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: summary.map((s) => ({
        method: s.method,
        totalAmount: s._sum.amount || 0,
        count: s._count,
      })),
    };
  }

  // ============================================
  // GET TOTAL KAS RETAIL (Summary)
  // ============================================

  async getCashMutationHistory(query: QueryCashMutationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.cashMutation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cashMutation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getKasSummary(shopId: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: 'COMPLETED' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Total by method
    const byMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const cashBox = await this.prisma.cashBox.findFirst({ where: { shopId } });

    const totalCash = byMethod.find((m) => m.method === 'CASH')?._sum.amount || 0;
    const totalQRIS = byMethod.find((m) => m.method === 'QRIS')?._sum.amount || 0;
    const totalTransfer = byMethod.find((m) => m.method === 'TRANSFER')?._sum.amount || 0;
    const totalHutang = byMethod.find((m) => m.method === 'HUTANG')?._sum.amount || 0;

    return {
      cashBoxBalance: cashBox?.balance || 0,
      lastAudit: cashBox?.lastAudit || null,
      breakdown: {
        cash: totalCash,
        qris: totalQRIS,
        transfer: totalTransfer,
        hutang: totalHutang,
        total: totalCash + totalQRIS + totalTransfer,
      },
      totalTransactions: byMethod.reduce((sum, m) => sum + m._count, 0),
    };
  }
}
