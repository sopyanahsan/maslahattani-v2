import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { PayDebtDto } from './dto/pay-debt.dto';
import { QueryDebtDto, DebtSortBy } from './dto/query-debt.dto';
import { DebtStatus } from '@prisma/client';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE DEBT
  // ============================================

  async create(dto: CreateDebtDto) {
    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    const totalAmount = product.price * dto.quantity;
    const downPayment = dto.downPayment || 0;

    if (downPayment > totalAmount) {
      throw new BadRequestException('DP tidak boleh melebihi total hutang.');
    }

    // Determine initial status
    let status: DebtStatus = DebtStatus.PENDING;
    if (downPayment > 0) {
      status = DebtStatus.PARTIALLY_PAID;
    }

    // Create debt + optional DP payment
    const debt = await this.prisma.$transaction(async (tx) => {
      const newDebt = await tx.debt.create({
        data: {
          shopId: dto.shopId,
          productId: dto.productId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone || null,
          quantity: dto.quantity,
          unitPrice: product.price,
          totalAmount,
          paidAmount: downPayment,
          status,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          notes: dto.notes || null,
        },
        include: { product: { select: { name: true, sku: true } } },
      });

      // Log DP payment if any
      if (downPayment > 0) {
        await tx.debtPayment.create({
          data: {
            debtId: newDebt.id,
            amount: downPayment,
            method: 'CASH',
            notes: 'Uang muka (DP)',
          },
        });
      }

      return newDebt;
    });

    return {
      success: true,
      message: `Hutang "${dto.customerName}" berhasil dicatat.`,
      debt,
      summary: {
        totalAmount,
        downPayment,
        remaining: totalAmount - downPayment,
      },
    };
  }

  // ============================================
  // PAY DEBT (Cicilan / Lunas)
  // ============================================

  async payDebt(debtId: string, dto: PayDebtDto) {
    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
      include: { product: { select: { name: true } } },
    });

    if (!debt) {
      throw new NotFoundException('Data hutang tidak ditemukan.');
    }

    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('Hutang sudah lunas.');
    }

    if (debt.status === DebtStatus.CANCELLED) {
      throw new BadRequestException('Hutang sudah dibatalkan.');
    }

    const remaining = debt.totalAmount - debt.paidAmount;

    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Pembayaran melebihi sisa hutang. Sisa: Rp ${remaining.toLocaleString('id-ID')}`,
      );
    }

    const newPaidAmount = debt.paidAmount + dto.amount;
    const isFullyPaid = newPaidAmount >= debt.totalAmount;

    // Update debt + log payment
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? DebtStatus.PAID : DebtStatus.PARTIALLY_PAID,
        },
        include: {
          product: { select: { name: true } },
          debtPayments: { orderBy: { createdAt: 'desc' } },
        },
      });

      await tx.debtPayment.create({
        data: {
          debtId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference || null,
          notes: dto.notes || null,
        },
      });

      return updatedDebt;
    });

    return {
      success: true,
      message: isFullyPaid
        ? `Hutang "${debt.customerName}" LUNAS!`
        : `Pembayaran Rp ${dto.amount.toLocaleString('id-ID')} berhasil dicatat.`,
      debt: updated,
      summary: {
        totalAmount: debt.totalAmount,
        paidAmount: newPaidAmount,
        remaining: debt.totalAmount - newPaidAmount,
        isFullyPaid,
      },
    };
  }

  // ============================================
  // GET ALL DEBTS (with filters)
  // ============================================

  async findAll(query: QueryDebtDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) where.shopId = query.shopId;
    if (query.status) where.status = query.status;
    if (query.customerName) {
      where.customerName = { contains: query.customerName, mode: 'insensitive' };
    }

    // Due date range filter (for calendar view)
    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {};
      if (query.dueDateFrom) where.dueDate.gte = new Date(query.dueDateFrom);
      if (query.dueDateTo) where.dueDate.lte = new Date(query.dueDateTo + 'T23:59:59.999Z');
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    if (query.sortBy === DebtSortBy.DUE_DATE) {
      orderBy = [{ dueDate: 'asc' }, { createdAt: 'desc' }];
    } else if (query.sortBy === DebtSortBy.REMAINING_DESC) {
      // Sort by remaining = totalAmount - paidAmount DESC
      // Prisma doesn't support computed sort, so we sort in JS after fetch
      orderBy = { createdAt: 'desc' };
    }

    const [debts, total] = await Promise.all([
      this.prisma.debt.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          debtPayments: { orderBy: { createdAt: 'desc' } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.debt.count({ where }),
    ]);

    // Post-sort for remaining_desc (only works within current page — acceptable for UX)
    let sortedDebts = debts;
    if (query.sortBy === DebtSortBy.REMAINING_DESC) {
      sortedDebts = [...debts].sort(
        (a, b) => (b.totalAmount - b.paidAmount) - (a.totalAmount - a.paidAmount),
      );
    }

    // Calculate summary
    const allDebts = await this.prisma.debt.findMany({
      where: { shopId: query.shopId, status: { in: [DebtStatus.PENDING, DebtStatus.PARTIALLY_PAID] } },
    });

    const totalHutang = allDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    return {
      data: sortedDebts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        totalDebtors: allDebts.length,
        totalOutstanding: totalHutang,
        overdue: allDebts.filter((d) => d.dueDate && d.dueDate < new Date()).length,
      },
    };
  }

  // ============================================
  // GET DEBTS BY CUSTOMER
  // ============================================

  async findByCustomer(customerName: string, shopId: string) {
    const debts = await this.prisma.debt.findMany({
      where: {
        shopId,
        customerName: { contains: customerName, mode: 'insensitive' },
      },
      include: {
        product: { select: { name: true, sku: true } },
        debtPayments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOutstanding = debts
      .filter((d) => d.status !== DebtStatus.PAID && d.status !== DebtStatus.CANCELLED)
      .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    return {
      customer: customerName,
      data: debts,
      summary: {
        totalDebts: debts.length,
        totalOutstanding,
        activeDebts: debts.filter((d) => d.status !== DebtStatus.PAID && d.status !== DebtStatus.CANCELLED).length,
      },
    };
  }

  // ============================================
  // GET SINGLE DEBT
  // ============================================

  async findOne(id: string) {
    const debt = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, sku: true, price: true } },
        debtPayments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!debt) {
      throw new NotFoundException('Data hutang tidak ditemukan.');
    }

    return debt;
  }
}
