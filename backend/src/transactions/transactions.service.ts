import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
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

  /**
   * Create transaksi baru.
   * @param dto data transaksi (items, payment, optional idempotencyKey + clientCreatedAt)
   * @param userId kasir yang melakukan transaksi (dari JWT)
   * @param shopId cabang konteks (dari JWT user.shopId, bukan dari client)
   *
   * Idempotency:
   *   Kalau dto.idempotencyKey terisi dan transaksi dgn key tsb sudah ada,
   *   return transaksi existing tanpa create dobel. Berguna untuk offline
   *   POS yang retry karena network glitch.
   */
  async create(dto: CreateTransactionDto, userId: string, shopId: string) {
    // ============================================
    // IDEMPOTENCY CHECK
    // ============================================
    if (dto.idempotencyKey) {
      const existing = await this.prisma.transaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          payments: true,
          user: { select: { id: true, email: true, username: true } },
        },
      });

      if (existing) {
        // Pastikan tidak ada conflict cross-shop (key sama tapi shop beda = mencurigakan)
        if (existing.shopId !== shopId) {
          throw new ConflictException(
            'Idempotency key conflict — sudah dipakai untuk cabang lain.',
          );
        }

        // Return existing transaction; client harus treat sebagai sukses (idempotent)
        return {
          success: true,
          idempotent: true,
          transaction: existing,
          summary: {
            transactionNumber: existing.transactionNumber,
            totalPrice: existing.totalPrice,
            totalCost: existing.totalCost,
            totalDiscount: existing.totalDiscount,
            profit: existing.totalPrice - existing.totalCost,
            paymentMethod: existing.payments[0]?.method ?? null,
            amountPaid: existing.totalPrice,
            change: 0,
          },
        };
      }
    }

    // ============================================
    // VALIDATE PRODUCTS + STOCK
    // ============================================
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId, deletedAt: null },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Satu atau lebih produk tidak ditemukan di cabang ini.',
      );
    }

    for (const item of dto.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { productId: item.productId, shopId },
      });

      if (!stock || stock.quantity < item.quantity) {
        const product = products.find((p) => p.id === item.productId);
        throw new BadRequestException(
          `Stok "${product?.name}" tidak mencukupi. Tersedia: ${stock?.quantity ?? 0}`,
        );
      }
    }

    // ============================================
    // CALCULATE TOTALS
    // ============================================
    let totalPrice = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const transactionItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const discount = item.discount ?? 0;
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

    const transactionNumber = await this.generateTransactionNumber(shopId);
    const clientCreatedAt = dto.clientCreatedAt ? new Date(dto.clientCreatedAt) : null;

    // ============================================
    // CREATE (transaksi + items + payment + stock update) atomik
    // ============================================
    const transaction = await this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          shopId,
          userId,
          transactionNumber,
          totalPrice,
          totalCost,
          totalDiscount,
          status: TransactionStatus.COMPLETED,
          idempotencyKey: dto.idempotencyKey,
          clientCreatedAt,
          items: {
            create: transactionItems,
          },
          payments: {
            create: {
              shopId,
              method: dto.paymentMethod,
              amount: totalPrice,
              status: PaymentStatus.COMPLETED,
              reference: dto.paymentReference ?? null,
            },
          },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true, price: true } } } },
          payments: true,
          user: { select: { id: true, email: true, username: true } },
          shop: { select: { id: true, name: true, address: true, phone: true } },
        },
      });

      // Reduce stock per item
      for (const item of dto.items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, shopId },
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity - item.quantity },
          });

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

    const change = dto.amountPaid ? dto.amountPaid - totalPrice : 0;

    // ============================================
    // AUTO-CREATE DEBT (Hutang flow)
    // ============================================
    let debtInfo: { id: string; amount: number } | null = null;

    if (dto.paymentMethod === 'HUTANG') {
      // Full hutang: entire amount is debt
      if (!dto.customerName) {
        throw new BadRequestException('Nama pelanggan wajib diisi untuk metode Hutang.');
      }
      await this.prisma.debt.create({
        data: {
          shopId,
          transactionId: transaction.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone || null,
          totalAmount: totalPrice,
          paidAmount: 0,
          status: 'PENDING',
        },
      });
      debtInfo = { id: transaction.id, amount: totalPrice };
    } else if (dto.createDebtForRemainder && dto.amountPaid && dto.amountPaid < totalPrice) {
      // Partial hutang: paid some, rest is debt
      if (!dto.customerName) {
        throw new BadRequestException('Nama pelanggan wajib untuk mencatat sisa sebagai hutang.');
      }
      const debtAmount = totalPrice - dto.amountPaid;
      await this.prisma.debt.create({
        data: {
          shopId,
          transactionId: transaction.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone || null,
          totalAmount: debtAmount,
          paidAmount: 0,
          status: 'PENDING',
        },
      });
      debtInfo = { id: transaction.id, amount: debtAmount };
    }

    return {
      success: true,
      idempotent: false,
      transaction,
      debt: debtInfo,
      summary: {
        transactionNumber,
        totalPrice,
        totalCost,
        totalDiscount,
        profit: totalPrice - totalCost,
        paymentMethod: dto.paymentMethod,
        amountPaid: dto.amountPaid ?? totalPrice,
        change: change > 0 ? change : 0,
      },
    };
  }

  // ============================================
  // VOID TRANSACTION (Admin only, requires OTP)
  // ============================================

  async voidTransaction(transactionId: string, dto: VoidTransactionDto, adminUser: any) {
    const otpResult = this.otpService.verifyOtp(adminUser.email, dto.otp);
    if (!otpResult.valid) {
      throw new ForbiddenException(otpResult.message);
    }

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

    const voided = await this.prisma.$transaction(async (tx) => {
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

      await tx.payment.updateMany({
        where: { transactionId },
        data: { status: PaymentStatus.CANCELLED },
      });

      // Restore stock
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

    // Search by transactionNumber (partial match, case-insensitive)
    if (query.search) {
      where.transactionNumber = { contains: query.search, mode: 'insensitive' };
    }

    // Filter by payment method (requires join via payments relation)
    if (query.paymentMethod) {
      where.payments = { some: { method: query.paymentMethod } };
    }

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

    const stats = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        totalPrice: true,
        totalCost: true,
        totalDiscount: true,
      },
      _count: true,
    });

    const voidedCount = await this.prisma.transaction.count({
      where: { ...where, status: TransactionStatus.VOIDED },
    });

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
  // SAVE BILL (park transaction as PENDING)
  // ============================================

  async saveBill(
    dto: CreateTransactionDto,
    userId: string,
    shopId: string,
    customerName?: string,
    customerPhone?: string,
    tableNumber?: string,
  ) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId, deletedAt: null },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Satu atau lebih produk tidak ditemukan.');
    }

    let totalPrice = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const transactionItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const discount = item.discount ?? 0;
      const subtotal = product.price * item.quantity - discount;
      totalPrice += subtotal;
      totalCost += product.cost * item.quantity;
      totalDiscount += discount;
      return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, discount, subtotal };
    });

    const transactionNumber = await this.generateTransactionNumber(shopId);

    const bill = await this.prisma.transaction.create({
      data: {
        shopId,
        userId,
        transactionNumber,
        totalPrice,
        totalCost,
        totalDiscount,
        status: TransactionStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
        clientCreatedAt: dto.clientCreatedAt ? new Date(dto.clientCreatedAt) : null,
        items: { create: transactionItems },
      },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    return {
      success: true,
      message: `Bill ${transactionNumber} tersimpan.`,
      bill,
    };
  }

  // ============================================
  // LIST SAVED BILLS (status=PENDING for current user in current shift)
  // ============================================

  async listSavedBills(userId: string, shopId: string) {
    const bills = await this.prisma.transaction.findMany({
      where: {
        shopId,
        userId,
        status: TransactionStatus.PENDING,
      },
      include: {
        items: { include: { product: { select: { name: true, sku: true, price: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: bills, total: bills.length };
  }

  // ============================================
  // LOAD BILL (return items for cart restore)
  // ============================================

  async loadBill(billId: string, userId: string, shopId: string) {
    const bill = await this.prisma.transaction.findFirst({
      where: { id: billId, shopId, userId, status: TransactionStatus.PENDING },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, price: true } } } },
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill tidak ditemukan atau sudah diproses.');
    }

    return { bill };
  }

  // ============================================
  // DISCARD BILL (delete pending transaction)
  // ============================================

  async discardBill(billId: string, userId: string, shopId: string) {
    const bill = await this.prisma.transaction.findFirst({
      where: { id: billId, shopId, userId, status: TransactionStatus.PENDING },
    });

    if (!bill) {
      throw new NotFoundException('Bill tidak ditemukan atau sudah diproses.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transactionItem.deleteMany({ where: { transactionId: billId } });
      await tx.transaction.delete({ where: { id: billId } });
    });

    return { success: true, message: `Bill ${bill.transactionNumber} dihapus.` };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateTransactionNumber(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

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
