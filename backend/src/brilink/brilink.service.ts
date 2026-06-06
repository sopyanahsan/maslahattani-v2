import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CreateBrilinkTransactionDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
  QueryBrilinkTransactionsDto,
} from './dto';

/** Human-readable label per category, used for mutation/ledger descriptions. */
const CATEGORY_LABELS: Record<string, string> = {
  TRANSFER_BRI: 'Transfer BRI',
  TRANSFER_OTHER: 'Transfer Antar Bank',
  TARIK_TUNAI: 'Tarik Tunai',
  TOPUP_PULSA: 'Pulsa',
  TOPUP_DATA: 'Paket Data',
  TOPUP_EWALLET: 'E-Wallet',
  TOPUP_PLN: 'Token PLN',
};

@Injectable()
export class BrilinkService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  // ============================================
  // TRANSACTIONS
  // ============================================

  async listTransactions(query: QueryBrilinkTransactionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) where.shopId = query.shopId;
    if (query.category) where.category = query.category;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.brilinkTransaction.findMany({
        where,
        include: {
          cashier: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkTransaction.count({ where }),
    ]);

    return {
      data: data.map((trx) => ({
        id: trx.id,
        refNumber: trx.refNumber,
        category: trx.category,
        customerName: trx.customerName,
        customerPhone: trx.customerPhone,
        destination: trx.destination,
        amount: trx.amount,
        fee: trx.fee,
        total: trx.total,
        status: trx.status,
        shopId: trx.shopId,
        cashierId: trx.cashierId,
        cashierName: trx.cashier?.username || trx.cashier?.email || '-',
        createdAt: trx.createdAt.toISOString(),
        updatedAt: trx.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createTransaction(
    dto: CreateBrilinkTransactionDto,
    shopId: string,
    cashierId: string,
  ) {
    // Enforce brilinkEnabled toggle
    const shopSettings = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { brilinkEnabled: true },
    });
    if (shopSettings && !shopSettings.brilinkEnabled) {
      throw new BadRequestException(
        'Modul BRILink dinonaktifkan oleh admin. Hubungi admin untuk mengaktifkan.',
      );
    }

    // Calculate fee from matching fee rules (by category + nominal range)
    const feeRules = await this.prisma.brilinkFee.findMany({
      where: {
        shopId,
        category: dto.category,
        isActive: true,
      },
    });

    let fee = 0;
    const matchingRule = feeRules.find(
      (rule) => dto.amount >= rule.minAmount && dto.amount <= rule.maxAmount,
    );

    if (matchingRule) {
      if (matchingRule.feeType === 'FLAT') {
        fee = matchingRule.feeAmount;
      } else {
        fee = Math.round((dto.amount * matchingRule.feePercent) / 100);
      }
    }

    const total = dto.amount + fee;
    const refNumber = this.generateRefNumber();

    // Resolve the BRI account that backs this transaction: default active
    // account first, else the oldest active account for the shop.
    const account = await this.prisma.brilinkAccount.findFirst({
      where: { shopId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    const baseData = {
      shopId,
      cashierId,
      refNumber,
      category: dto.category,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      destination: dto.destination,
      amount: dto.amount,
      fee,
      total,
      status: 'SUCCESS' as const,
    };

    // No BRI account configured yet → record the transaction without touching
    // any ledger so shops that haven't set up an account can still operate.
    if (!account) {
      const transaction = await this.prisma.brilinkTransaction.create({
        data: baseData,
      });

      // Emit real-time event
      this.realtimeGateway.emitBrilinkTransactionCreated(shopId, {
        id: transaction.id,
        refNumber: transaction.refNumber,
        category: transaction.category,
        customerName: transaction.customerName,
        amount: transaction.amount,
        fee: transaction.fee,
        total: transaction.total,
        status: transaction.status,
        cashierName: '',
        createdAt: transaction.createdAt.toISOString(),
      });
      this.realtimeGateway.emitDashboardRefresh(shopId, {
        source: 'brilink_transaction',
        timestamp: new Date().toISOString(),
      });

      return this.buildTransactionResponse(transaction, null);
    }

    // PRD 24.3: every current BRILink category DEBITS the BRI account balance by
    // the nominal `amount` (the `fee` is the agent's cash margin paid by the
    // customer, not deducted from the BRI balance).
    if (account.balance < dto.amount) {
      throw new BadRequestException(
        `Saldo rekening BRI "${account.label}" tidak cukup. ` +
          `Saldo saat ini Rp ${account.balance.toLocaleString('id-ID')}, ` +
          `dibutuhkan Rp ${dto.amount.toLocaleString('id-ID')}.`,
      );
    }

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - dto.amount;
    const label = CATEGORY_LABELS[dto.category] ?? dto.category;

    const [transaction, updatedAccount] = await this.prisma.$transaction([
      this.prisma.brilinkTransaction.create({
        data: { ...baseData, accountId: account.id },
      }),
      this.prisma.brilinkAccount.update({
        where: { id: account.id },
        data: { balance: balanceAfter },
      }),
      this.prisma.brilinkMutation.create({
        data: {
          accountId: account.id,
          type: 'TRX_DEBIT',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          reference: refNumber,
          description: `${label} - ${dto.customerName}`,
          createdById: cashierId,
        },
      }),
    ]);

    // Emit real-time events
    this.realtimeGateway.emitBrilinkTransactionCreated(shopId, {
      id: transaction.id,
      refNumber: transaction.refNumber,
      category: transaction.category,
      customerName: transaction.customerName,
      amount: transaction.amount,
      fee: transaction.fee,
      total: transaction.total,
      status: transaction.status,
      cashierName: '',
      createdAt: transaction.createdAt.toISOString(),
    });
    this.realtimeGateway.emitAccountBalanceChanged(shopId, {
      accountId: account.id,
      label: account.label,
      balanceBefore,
      balanceAfter,
      changeAmount: dto.amount,
      changeType: 'DEBIT',
      reason: `Transaksi BRILink: ${label} - ${dto.customerName}`,
    });
    this.realtimeGateway.emitDashboardRefresh(shopId, {
      source: 'brilink_transaction',
      timestamp: new Date().toISOString(),
    });

    return this.buildTransactionResponse(transaction, updatedAccount);
  }

  private buildTransactionResponse(
    transaction: {
      id: string;
      refNumber: string;
      category: string;
      customerName: string;
      destination: string;
      amount: number;
      fee: number;
      total: number;
      status: string;
    },
    account: {
      id: string;
      label: string;
      balance: number;
      lowBalanceThreshold: number;
    } | null,
  ) {
    return {
      id: transaction.id,
      summary: {
        refNumber: transaction.refNumber,
        category: transaction.category,
        customerName: transaction.customerName,
        destination: transaction.destination,
        amount: transaction.amount,
        fee: transaction.fee,
        total: transaction.total,
        status: transaction.status,
      },
      account: account
        ? {
            id: account.id,
            label: account.label,
            balance: account.balance,
            lowBalanceThreshold: account.lowBalanceThreshold,
            isLowBalance: account.balance <= account.lowBalanceThreshold,
          }
        : null,
    };
  }

  // ============================================
  // STATS
  // ============================================

  async getStats(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allTimeAgg, todayAgg, byCategory] = await Promise.all([
      this.prisma.brilinkTransaction.aggregate({
        where: { shopId, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
      this.prisma.brilinkTransaction.aggregate({
        where: {
          shopId,
          status: 'SUCCESS',
          createdAt: { gte: today },
        },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
      this.prisma.brilinkTransaction.groupBy({
        by: ['category'],
        where: { shopId, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
    ]);

    return {
      totalTransactions: allTimeAgg._count,
      totalAmount: allTimeAgg._sum.amount || 0,
      totalFee: allTimeAgg._sum.fee || 0,
      byCategory: byCategory.map((cat) => ({
        category: cat.category,
        count: cat._count,
        amount: cat._sum.amount || 0,
        fee: cat._sum.fee || 0,
      })),
      todayTransactions: todayAgg._count,
      todayAmount: todayAgg._sum.amount || 0,
      todayFee: todayAgg._sum.fee || 0,
    };
  }

  // ============================================
  // FEE MANAGEMENT
  // ============================================

  async listFees(shopId: string) {
    const fees = await this.prisma.brilinkFee.findMany({
      where: { shopId },
      orderBy: [{ category: 'asc' }, { minAmount: 'asc' }],
    });

    return fees.map((fee) => ({
      id: fee.id,
      shopId: fee.shopId,
      category: fee.category,
      label: fee.label,
      minAmount: fee.minAmount,
      maxAmount: fee.maxAmount,
      feeType: fee.feeType,
      feeAmount: fee.feeAmount,
      feePercent: fee.feePercent,
      isActive: fee.isActive,
      createdAt: fee.createdAt.toISOString(),
      updatedAt: fee.updatedAt.toISOString(),
    }));
  }

  async createFee(dto: CreateBrilinkFeeDto) {
    const fee = await this.prisma.brilinkFee.create({
      data: {
        shopId: dto.shopId,
        category: dto.category,
        label: dto.label,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        feeType: dto.feeType,
        feeAmount: dto.feeAmount,
        feePercent: dto.feePercent,
      },
    });

    return fee;
  }

  async updateFee(id: string, dto: UpdateBrilinkFeeDto) {
    const existing = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Fee rule tidak ditemukan.');
    }

    const updated = await this.prisma.brilinkFee.update({
      where: { id },
      data: dto,
    });

    return updated;
  }

  async deleteFee(id: string) {
    const existing = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Fee rule tidak ditemukan.');
    }

    await this.prisma.brilinkFee.delete({ where: { id } });
    return { success: true, message: 'Fee rule berhasil dihapus.' };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateRefNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BRL-${dateStr}-${rand}`;
  }
}
