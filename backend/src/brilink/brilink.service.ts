import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrilinkTransactionDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
  QueryBrilinkTransactionsDto,
} from './dto';

@Injectable()
export class BrilinkService {
  constructor(private prisma: PrismaService) {}

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
    // Calculate fee from matching fee rules
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

    const transaction = await this.prisma.brilinkTransaction.create({
      data: {
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
        status: 'SUCCESS',
      },
    });

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
