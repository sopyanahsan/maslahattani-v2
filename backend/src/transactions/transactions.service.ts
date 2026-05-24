import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../auth/otp.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
  ) {}

  // ============================================
  // CREATE TRANSACTION (POS)
  // ============================================

  async create(dto: CreateTransactionDto, userId: string) {
    // Validate products exist and get prices
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId: dto.shopId, deletedAt: null },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Satu atau lebih produk tidak ditemukan.');
    }

    // Check stock availability
    for (const item of dto.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { productId: item.productId, shopId: dto.shopId },
      });

      if (!stock || stock.quantity < item.quantity) {
        const product = products.find((p) => p.id === item.productId);
        throw new BadRequestException(
          `Stok "${product?.name}" tidak mencukupi. Tersedia: ${stock?.quantity || 0}`,
        );
      }
    }

    // Calculate totals
    let totalPrice = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const transactionItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const discount = item.discount || 0;
      const subtotal = product.price * item.quantity - discount;

      totalPrice += subtotal;
      totalCost += product.cost * item.quantity;
      totalDiscount += discount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        discount,
        subtotal,
      };
    });

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber(dto.shopId);

    // Create transaction with items + payment + stock update in one transaction
    const transaction = await this.prisma.$transaction(async (tx) => {
      // 1. Create transaction
      const trx = await tx.transaction.create({
        data: {
          shopId: dto.shopId,
          userId,
          transactionNumber,
          totalPrice,
          totalCost,
          totalDiscount,
          status: TransactionStatus.COMPLETED,
          items: {
            create: transactionItems,
          },
          payments: {
            create: {
              shopId: dto.shopId,
              method: dto.paymentMethod,
              amount: totalPrice,
              status: PaymentStatus.COMPLETED,
              reference: dto.paymentReference || null,
            },
          },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          payments: true,
          user: { select: { id: true, email: true, username: true } },
        },
      });

      // 2. Reduce stock for each item
      for (const item of dto.items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, shopId: dto.shopId },
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity - item.quantity },
          });

          // Log stock history
          await tx.stockHistory.create({
            data: {
              stockId: stock.id,
              type: 'OUT',
              quantityBefore: stock.quantity,
              quantityAfter: stock.quantity - item.quantity,
              quantityChange: -item.quantity,
              reference: trx.id,
              notes: `Penjualan ${transactionNumber}`,
            },
          });
        }
      }

      return trx;
    });

    // Calculate change
    const change = dto.amountPaid ? dto.amountPaid - totalPrice : 0;

    return {
      success: true,
      transaction,
      summary: {
        transactionNumber,
        totalPrice,
        totalCost,
        totalDiscount,
        profit: totalPrice - totalCost,
        paymentMethod: dto.paymentMethod,
        amountPaid: dto.amountPaid || totalPrice,
        change: change > 0 ? change : 0,
      },
    };
  }

  // ============================================
  // VOID TRANSACTION (Admin only, requires OTP)
  // ============================================

  async voidTransaction(transactionId: string, dto: VoidTransactionDto, adminUser: any) {
    // Verify OTP
    const otpResult = this.otpService.verifyOtp(adminUser.email, dto.otp);
    if (!otpResult.valid) {
      throw new ForbiddenException(otpResult.message);
    }

    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan.');
    }

    if (transaction.status === TransactionStatus.VOIDED) {
      throw new BadRequestException('Transaksi sudah dibatalkan sebelumnya.');
    }

    // Void transaction + restore stock
    const voided = await this.prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.VOIDED,
          voidedAt: new Date(),
          voidedBy: adminUser.username || adminUser.email,
          voidReason: dto.reason,
        },
        include: {
          items: { include: { product: { select: { name: true } } } },
          payments: true,
        },
      });

      // 2. Cancel payment
      await tx.payment.updateMany({
        where: { transactionId },
        data: { status: PaymentStatus.CANCELLED },
      });

      // 3. Restore stock
      for (const item of transaction.items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, shopId: transaction.shopId },
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity + item.quantity },
          });

          await tx.stockHistory.create({
            data: {
              stockId: stock.id,
              type: 'IN',
              quantityBefore: stock.quantity,
              quantityAfter: stock.quantity + item.quantity,
              quantityChange: item.quantity,
              reference: transactionId,
              notes: `Void transaksi ${transaction.transactionNumber}: ${dto.reason}`,
            },
          });
        }
      }

      return updated;
    });

    return {
      success: true,
      message: `Transaksi ${transaction.transactionNumber} berhasil dibatalkan.`,
      transaction: voided,
    };
  }

  // ============================================
  // GET TRANSACTIONS (List with filters)
  // ============================================

  async findAll(query: QueryTransactionDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) where.shopId = query.shopId;
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          payments: true,
          user: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
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
  // GET SINGLE TRANSACTION
  // ============================================

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { name: true, sku: true, price: true } } } },
        payments: true,
        user: { select: { id: true, email: true, username: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan.');
    }

    return transaction;
  }

  // ============================================
  // GET TRANSACTION STATS (Dashboard)
  // ============================================

  async getStats(shopId: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: TransactionStatus.COMPLETED };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Aggregate stats
    const stats = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        totalPrice: true,
        totalCost: true,
        totalDiscount: true,
      },
      _count: true,
    });

    // Count voided
    const voidedCount = await this.prisma.transaction.count({
      where: { ...where, status: TransactionStatus.VOIDED },
    });

    // Total hutang
    const hutangWhere: any = { shopId };
    if (startDate || endDate) {
      hutangWhere.createdAt = {};
      if (startDate) hutangWhere.createdAt.gte = new Date(startDate);
      if (endDate) hutangWhere.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const hutangStats = await this.prisma.payment.aggregate({
      where: { ...hutangWhere, method: 'HUTANG', status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
      _count: true,
    });

    const omzet = stats._sum.totalPrice || 0;
    const modal = stats._sum.totalCost || 0;
    const diskon = stats._sum.totalDiscount || 0;
    const profit = omzet - modal;

    return {
      omzet,
      modal,
      profit,
      diskon,
      totalTransaksi: stats._count,
      totalVoid: voidedCount,
      totalHutang: hutangStats._sum.amount || 0,
      jumlahHutang: hutangStats._count,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateTransactionNumber(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count today's transactions for this shop
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.prisma.transaction.count({
      where: {
        shopId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `TRX-${dateStr}-${sequence}`;
  }
}
