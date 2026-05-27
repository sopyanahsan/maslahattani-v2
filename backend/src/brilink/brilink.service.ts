import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BrilinkTransactionCategory,
  BrilinkTransactionStatus,
  BrilinkMutationType,
} from '@prisma/client';
import {
  QueryBrilinkTransactionDto,
  QueryBrilinkDashboardDto,
  CreateBrilinkTransactionDto,
  CreateBrilinkAccountDto,
  UpdateBrilinkAccountDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
} from './dto';

// ============================================================
// Helpers: timezone-aware period range (Asia/Jakarta)
// ============================================================

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today': {
      const start = today;
      const end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
      return { start, end };
    }
    case 'week': {
      const day = today.getDay(); // 0=Sun
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case 'year': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    case 'month':
    default: {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

function getPreviousPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const end = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
      return { start: yesterday, end };
    }
    case 'week': {
      const day = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - ((day + 6) % 7));
      const prevSunday = new Date(thisMonday);
      prevSunday.setDate(thisMonday.getDate() - 1);
      prevSunday.setHours(23, 59, 59, 999);
      const prevMonday = new Date(prevSunday);
      prevMonday.setDate(prevSunday.getDate() - 6);
      prevMonday.setHours(0, 0, 0, 0);
      return { start: prevMonday, end: prevSunday };
    }
    case 'year': {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    case 'month':
    default: {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

function formatDeltaPercent(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${Math.round(delta)}%`;
}

@Injectable()
export class BrilinkService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // DASHBOARD — summary KPIs + trends
  // ============================================================

  async getDashboardSummary(shopId: string, period: string = 'month') {
    const { start, end } = getPeriodRange(period);
    const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period);

    const baseWhere = {
      shopId,
      status: BrilinkTransactionStatus.SUCCESS,
      createdAt: { gte: start, lte: end },
    };

    const prevWhere = {
      shopId,
      status: BrilinkTransactionStatus.SUCCESS,
      createdAt: { gte: prevStart, lte: prevEnd },
    };

    // Current period aggregates
    const [currentAgg, prevAgg] = await Promise.all([
      this.prisma.brilinkTransaction.aggregate({
        where: baseWhere,
        _sum: { amount: true, fee: true, total: true },
        _count: true,
      }),
      this.prisma.brilinkTransaction.aggregate({
        where: prevWhere,
        _sum: { amount: true, fee: true, total: true },
        _count: true,
      }),
    ]);

    const currentVolume = currentAgg._sum.amount || 0;
    const currentFee = currentAgg._sum.fee || 0;
    const currentCount = currentAgg._count;
    const prevVolume = prevAgg._sum.amount || 0;
    const prevFee = prevAgg._sum.fee || 0;
    const prevCount = prevAgg._count;

    // Category breakdown
    const categoryBreakdown = await this.prisma.brilinkTransaction.groupBy({
      by: ['category'],
      where: baseWhere,
      _sum: { amount: true, fee: true },
      _count: true,
    });

    // Daily trend (for chart)
    const transactions = await this.prisma.brilinkTransaction.findMany({
      where: baseWhere,
      select: { createdAt: true, amount: true, fee: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { volume: number; fee: number; count: number }>();
    for (const trx of transactions) {
      const day = trx.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(day) || { volume: 0, fee: 0, count: 0 };
      existing.volume += trx.amount;
      existing.fee += trx.fee;
      existing.count += 1;
      dailyMap.set(day, existing);
    }

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      volume: data.volume,
      fee: data.fee,
      count: data.count,
    }));

    // Primary account balance
    const primaryAccount = await this.prisma.brilinkAccount.findFirst({
      where: { shopId, isPrimary: true, isActive: true },
      select: { id: true, accountNumber: true, accountName: true, balance: true, bankName: true },
    });

    // Recent transactions (5)
    const recentTransactions = await this.prisma.brilinkTransaction.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      kpi: {
        volume: {
          value: currentVolume,
          delta: formatDeltaPercent(currentVolume, prevVolume),
          deltaPositive: currentVolume >= prevVolume,
          label: 'Volume Transaksi',
        },
        fee: {
          value: currentFee,
          delta: formatDeltaPercent(currentFee, prevFee),
          deltaPositive: currentFee >= prevFee,
          label: 'Total Fee',
        },
        count: {
          value: currentCount,
          delta: formatDeltaPercent(currentCount, prevCount),
          deltaPositive: currentCount >= prevCount,
          label: 'Jumlah Transaksi',
        },
        balance: {
          value: primaryAccount?.balance ?? 0,
          label: 'Saldo Rekening',
          accountNumber: primaryAccount?.accountNumber ?? null,
        },
      },
      categoryBreakdown: categoryBreakdown.map((cb) => ({
        category: cb.category,
        volume: cb._sum.amount || 0,
        fee: cb._sum.fee || 0,
        count: cb._count,
      })),
      dailyTrend,
      recentTransactions,
      primaryAccount,
      period,
    };
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  async listTransactions(dto: QueryBrilinkTransactionDto) {
    const {
      shopId,
      category,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = dto;

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { refNumber: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.brilinkTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(shopId: string) {
    const where = {
      shopId,
      status: BrilinkTransactionStatus.SUCCESS,
    };

    const agg = await this.prisma.brilinkTransaction.aggregate({
      where,
      _sum: { amount: true, fee: true },
      _count: true,
    });

    const byCategory = await this.prisma.brilinkTransaction.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true, fee: true },
      _count: true,
    });

    return {
      totalVolume: agg._sum.amount || 0,
      totalFee: agg._sum.fee || 0,
      totalTransactions: agg._count,
      byCategory: byCategory.map((bc) => ({
        category: bc.category,
        volume: bc._sum.amount || 0,
        fee: bc._sum.fee || 0,
        count: bc._count,
      })),
    };
  }

  async createTransaction(dto: CreateBrilinkTransactionDto) {
    const { shopId, accountId, category, customerName, destination, amount, fee = 0, notes, processedBy } = dto;

    // Auto-hitung fee dari tabel BrilinkFee jika tidak di-provide
    let finalFee = fee;
    if (fee === 0) {
      const feeRule = await this.prisma.brilinkFee.findFirst({
        where: {
          shopId,
          category,
          isActive: true,
          minAmount: { lte: amount },
          maxAmount: { gte: amount },
        },
        orderBy: { sortOrder: 'asc' },
      });
      if (feeRule) {
        finalFee =
          feeRule.feeType === 'FLAT'
            ? feeRule.feeAmount
            : Math.round((amount * feeRule.feePercent) / 100);
      }
    }

    // Generate refNumber
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.brilinkTransaction.count({ where: { shopId } });
    const refNumber = `BRL-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const transaction = await this.prisma.brilinkTransaction.create({
      data: {
        shopId,
        accountId: accountId || null,
        refNumber,
        category: category as BrilinkTransactionCategory,
        customerName,
        destination,
        amount,
        fee: finalFee,
        total: amount + finalFee,
        status: BrilinkTransactionStatus.SUCCESS,
        notes,
        processedBy,
      },
    });

    // Jika ada accountId, buat mutasi debit
    if (accountId) {
      const account = await this.prisma.brilinkAccount.findUnique({ where: { id: accountId } });
      if (account) {
        const newBalance = account.balance - (amount + finalFee);
        await this.prisma.$transaction([
          this.prisma.brilinkAccount.update({
            where: { id: accountId },
            data: { balance: newBalance },
          }),
          this.prisma.brilinkMutation.create({
            data: {
              accountId,
              shopId,
              type: BrilinkMutationType.DEBIT,
              amount: amount + finalFee,
              balanceBefore: account.balance,
              balanceAfter: newBalance,
              description: `${category} - ${customerName} - ${destination}`,
              reference: transaction.id,
            },
          }),
        ]);
      }
    }

    return transaction;
  }

  // ============================================================
  // ACCOUNTS
  // ============================================================

  async listAccounts(shopId: string) {
    return this.prisma.brilinkAccount.findMany({
      where: { shopId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAccount(dto: CreateBrilinkAccountDto) {
    const { shopId, accountNumber, accountName, bankName = 'BRI', isPrimary = false, notes } = dto;

    // Jika isPrimary, unset semua yang lain
    if (isPrimary) {
      await this.prisma.brilinkAccount.updateMany({
        where: { shopId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.brilinkAccount.create({
      data: { shopId, accountNumber, accountName, bankName, isPrimary, notes },
    });
  }

  async updateAccount(id: string, dto: UpdateBrilinkAccountDto) {
    const account = await this.prisma.brilinkAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Rekening tidak ditemukan');

    // Jika set primary, unset yang lain
    if (dto.isPrimary) {
      await this.prisma.brilinkAccount.updateMany({
        where: { shopId: account.shopId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.brilinkAccount.update({ where: { id }, data: dto });
  }

  async deleteAccount(id: string) {
    const account = await this.prisma.brilinkAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Rekening tidak ditemukan');
    if (account.isPrimary) {
      throw new BadRequestException('Tidak bisa hapus rekening utama. Set rekening lain sebagai utama dulu.');
    }
    await this.prisma.brilinkAccount.delete({ where: { id } });
    return { message: 'Rekening berhasil dihapus' };
  }

  async listMutations(accountId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.brilinkMutation.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkMutation.count({ where: { accountId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // FEES
  // ============================================================

  async listFees(shopId: string) {
    return this.prisma.brilinkFee.findMany({
      where: { shopId },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { minAmount: 'asc' }],
    });
  }

  async createFee(dto: CreateBrilinkFeeDto) {
    const { shopId, category, label, minAmount = 0, maxAmount = 999999999, feeType, feeAmount = 0, feePercent = 0 } = dto;
    return this.prisma.brilinkFee.create({
      data: { shopId, category, label, minAmount, maxAmount, feeType, feeAmount, feePercent },
    });
  }

  async updateFee(id: string, dto: UpdateBrilinkFeeDto) {
    const fee = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!fee) throw new NotFoundException('Fee tidak ditemukan');
    return this.prisma.brilinkFee.update({ where: { id }, data: dto });
  }

  async deleteFee(id: string) {
    const fee = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!fee) throw new NotFoundException('Fee tidak ditemukan');
    await this.prisma.brilinkFee.delete({ where: { id } });
    return { message: 'Fee berhasil dihapus' };
  }

  async calculateFee(shopId: string, category: BrilinkTransactionCategory, amount: number) {
    const feeRule = await this.prisma.brilinkFee.findFirst({
      where: {
        shopId,
        category,
        isActive: true,
        minAmount: { lte: amount },
        maxAmount: { gte: amount },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (!feeRule) return { fee: 0, feeRule: null };

    const fee =
      feeRule.feeType === 'FLAT'
        ? feeRule.feeAmount
        : Math.round((amount * feeRule.feePercent) / 100);

    return { fee, feeRule };
  }
}
