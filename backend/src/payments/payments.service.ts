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
    let cashBox = await this.prisma.cashBox.findUnique({
      where: { shopId },
    });

    if (!cashBox) {
      // Auto-create cash box
      cashBox = await this.prisma.cashBox.create({
        data: { shopId, balance: 0 },
      });
    }

    return {
      shopId,
      balance: cashBox.balance,
      lastAudit: cashBox.lastAudit,
      lastAuditBalance: cashBox.lastAuditBalance,
    };
  }

  // ============================================
  // CASH MUTATION (Cash In / Cash Out)
  // ============================================

  async createMutation(dto: CashMutationDto) {
    let cashBox = await this.prisma.cashBox.findUnique({
      where: { shopId: dto.shopId },
    });

    if (!cashBox) {
      cashBox = await this.prisma.cashBox.create({
        data: { shopId: dto.shopId, balance: 0 },
      });
    }

    // Validate cash out doesn't exceed balance
    if (dto.type === CashMutationType.CASH_OUT && dto.amount > cashBox.balance) {
      throw new BadRequestException(
        `Saldo kas tidak mencukupi. Saldo: Rp ${cashBox.balance.toLocaleString('id-ID')}`,
      );
    }

    const newBalance =
      dto.type === CashMutationType.CASH_IN
        ? cashBox.balance + dto.amount
        : cashBox.balance - dto.amount;

    // Update cash box
    await this.prisma.cashBox.update({
      where: { shopId: dto.shopId },
      data: { balance: newBalance },
    });

    return {
      success: true,
      message:
        dto.type === CashMutationType.CASH_IN
          ? `Pemasukan Rp ${dto.amount.toLocaleString('id-ID')} berhasil dicatat.`
          : `Pengeluaran Rp ${dto.amount.toLocaleString('id-ID')} berhasil dicatat.`,
      mutation: {
        type: dto.type,
        amount: dto.amount,
        category: dto.category,
        notes: dto.notes,
        balanceBefore: cashBox.balance,
        balanceAfter: newBalance,
      },
    };
  }

  // ============================================
  // AUDIT CASH (Verifikasi saldo fisik)
  // ============================================

  async auditCash(dto: AuditCashDto) {
    let cashBox = await this.prisma.cashBox.findUnique({
      where: { shopId: dto.shopId },
    });

    if (!cashBox) {
      throw new NotFoundException('Cash box tidak ditemukan untuk toko ini.');
    }

    const systemBalance = cashBox.balance;
    const variance = dto.actualBalance - systemBalance;

    // Update cash box with audit info
    await this.prisma.cashBox.update({
      where: { shopId: dto.shopId },
      data: {
        balance: dto.actualBalance, // Adjust to actual
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

    const cashBox = await this.prisma.cashBox.findUnique({ where: { shopId } });

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
