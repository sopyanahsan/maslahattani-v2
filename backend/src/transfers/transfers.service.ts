import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CreateTransferDto,
  ApprovalNotesDto,
  ReceiveTransferDto,
  QueryTransfersDto,
} from './dto';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  // ============================================
  // LIST TRANSFERS
  // ============================================

  async listTransfers(query: QueryTransfersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) {
      if (query.direction === 'out') {
        where.fromShopId = query.shopId;
      } else if (query.direction === 'in') {
        where.toShopId = query.shopId;
      } else {
        where.OR = [
          { fromShopId: query.shopId },
          { toShopId: query.shopId },
        ];
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        include: {
          fromShop: { select: { id: true, name: true } },
          toShop: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, username: true, email: true } },
          approvedBy: { select: { id: true, username: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        status: t.status,
        fromShopId: t.fromShopId,
        fromShopName: t.fromShop.name,
        toShopId: t.toShopId,
        toShopName: t.toShop.name,
        requestedById: t.requestedById,
        requestedByName: t.requestedBy?.username || t.requestedBy?.email || '-',
        approvedById: t.approvedById,
        approvedByName: t.approvedBy?.username || t.approvedBy?.email || null,
        notes: t.notes,
        approvalNotes: t.approvalNotes,
        itemCount: t._count.items,
        requestedAt: t.requestedAt.toISOString(),
        approvedAt: t.approvedAt?.toISOString() || null,
        shippedAt: t.shippedAt?.toISOString() || null,
        receivedAt: t.receivedAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // GET TRANSFER DETAIL
  // ============================================

  async getTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromShop: { select: { id: true, name: true } },
        toShop: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, username: true, email: true } },
        approvedBy: { select: { id: true, username: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      status: transfer.status,
      fromShop: transfer.fromShop,
      toShop: transfer.toShop,
      requestedBy: {
        id: transfer.requestedBy.id,
        name: transfer.requestedBy.username || transfer.requestedBy.email,
      },
      approvedBy: transfer.approvedBy
        ? {
            id: transfer.approvedBy.id,
            name: transfer.approvedBy.username || transfer.approvedBy.email,
          }
        : null,
      notes: transfer.notes,
      approvalNotes: transfer.approvalNotes,
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      shippedAt: transfer.shippedAt?.toISOString() || null,
      receivedAt: transfer.receivedAt?.toISOString() || null,
      createdAt: transfer.createdAt.toISOString(),
      items: transfer.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        receivedQty: item.receivedQty,
      })),
    };
  }

  // ============================================
  // CREATE TRANSFER REQUEST
  // ============================================

  async createTransfer(dto: CreateTransferDto, requestedById: string) {
    if (dto.fromShopId === dto.toShopId) {
      throw new BadRequestException('Tidak bisa transfer ke toko yang sama.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Minimal 1 item untuk transfer.');
    }

    // Verify shops exist
    const [fromShop, toShop] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: dto.fromShopId } }),
      this.prisma.shop.findUnique({ where: { id: dto.toShopId } }),
    ]);

    if (!fromShop) throw new NotFoundException('Toko asal tidak ditemukan.');
    if (!toShop) throw new NotFoundException('Toko tujuan tidak ditemukan.');

    // Check stock availability (warning, still allows creation)
    const stockWarnings: Array<{ productId: string; requested: number; available: number }> = [];
    for (const item of dto.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { shopId: dto.fromShopId, productId: item.productId },
      });
      const available = stock?.quantity ?? 0;
      if (available < item.quantity) {
        stockWarnings.push({ productId: item.productId, requested: item.quantity, available });
      }
    }

    const transferNumber = this.generateTransferNumber();

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        fromShopId: dto.fromShopId,
        toShopId: dto.toShopId,
        requestedById,
        transferNumber,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        fromShop: { select: { name: true } },
        toShop: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });

    // Emit real-time event to both shops
    this.realtimeGateway.emitDataChanged(dto.fromShopId, 'transfers', 'created', transfer.id);
    if (dto.fromShopId !== dto.toShopId) {
      this.realtimeGateway.emitDataChanged(dto.toShopId, 'transfers', 'created', transfer.id);
    }

    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      status: transfer.status,
      fromShopName: transfer.fromShop.name,
      toShopName: transfer.toShop.name,
      itemCount: transfer._count.items,
      stockWarnings: stockWarnings.length > 0 ? stockWarnings : undefined,
    };
  }

  // ============================================
  // APPROVE TRANSFER
  // ============================================

  async approveTransfer(id: string, approvedById: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    if (transfer.status !== 'PENDING') {
      throw new BadRequestException('Transfer hanya bisa di-approve saat status PENDING.');
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  // ============================================
  // REJECT TRANSFER
  // ============================================

  async rejectTransfer(id: string, approvedById: string, dto: ApprovalNotesDto) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    if (transfer.status !== 'PENDING') {
      throw new BadRequestException('Transfer hanya bisa di-reject saat status PENDING.');
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById,
        approvedAt: new Date(),
        approvalNotes: dto.notes || null,
      },
    });
  }

  // ============================================
  // SHIP TRANSFER (mark as in-transit)
  // Validates source shop has sufficient stock before shipping.
  // ============================================

  async shipTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });
    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    if (transfer.status !== 'APPROVED') {
      throw new BadRequestException('Transfer hanya bisa dikirim setelah di-approve.');
    }

    // Validate stock availability at source shop
    const insufficientItems: Array<{ name: string; requested: number; available: number }> = [];

    for (const item of transfer.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { shopId: transfer.fromShopId, productId: item.productId },
      });

      const available = stock?.quantity ?? 0;
      if (available < item.quantity) {
        insufficientItems.push({
          name: item.product.name,
          requested: item.quantity,
          available,
        });
      }
    }

    if (insufficientItems.length > 0) {
      const details = insufficientItems
        .map((i) => `• ${i.name}: diminta ${i.requested}, tersedia ${i.available}`)
        .join('\n');
      throw new BadRequestException(
        `Stok tidak cukup di cabang asal:\n${details}\n\nKurangi qty atau restok dulu sebelum kirim.`,
      );
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        shippedAt: new Date(),
      },
    });
  }

  // ============================================
  // RECEIVE TRANSFER (update stock both shops)
  // ============================================

  async receiveTransfer(id: string, dto?: ReceiveTransferDto, userId?: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    if (transfer.status !== 'IN_TRANSIT') {
      throw new BadRequestException('Transfer hanya bisa diterima saat status IN_TRANSIT.');
    }

    // Determine received quantities
    const receivedMap = new Map<string, number>();
    if (dto?.items && dto.items.length > 0) {
      for (const item of dto.items) {
        receivedMap.set(item.productId, item.receivedQty);
      }
    }

    // Process each item: deduct from source shop, add to destination shop
    for (const item of transfer.items) {
      const receivedQty = receivedMap.get(item.productId) ?? item.quantity;

      // Update received qty on transfer item
      await this.prisma.stockTransferItem.update({
        where: { id: item.id },
        data: { receivedQty },
      });

      // --- Deduct stock from source shop (fromShop) ---
      const sourceStock = await this.prisma.stock.findFirst({
        where: { shopId: transfer.fromShopId, productId: item.productId },
      });

      if (sourceStock) {
        const newSourceQty = sourceStock.quantity - item.quantity;
        await this.prisma.stock.update({
          where: { id: sourceStock.id },
          data: { quantity: newSourceQty },
        });

        await this.prisma.stockHistory.create({
          data: {
            stockId: sourceStock.id,
            type: 'TRANSFER_OUT',
            source: 'TRANSFER_OUT',
            quantityBefore: sourceStock.quantity,
            quantityAfter: newSourceQty,
            quantityChange: -item.quantity,
            reference: transfer.id,
            notes: `Transfer keluar ${transfer.transferNumber}: ${item.quantity} unit`,
            createdById: userId || null,
          },
        });
      }

      // --- Add stock to destination shop (toShop) ---
      let destStock = await this.prisma.stock.findFirst({
        where: { shopId: transfer.toShopId, productId: item.productId },
      });

      if (!destStock) {
        // Create stock record if it doesn't exist in destination
        destStock = await this.prisma.stock.create({
          data: {
            shopId: transfer.toShopId,
            productId: item.productId,
            quantity: 0,
          },
        });
      }

      const newDestQty = destStock.quantity + receivedQty;
      await this.prisma.stock.update({
        where: { id: destStock.id },
        data: { quantity: newDestQty },
      });

      await this.prisma.stockHistory.create({
        data: {
          stockId: destStock.id,
          type: 'TRANSFER_IN',
          source: 'TRANSFER_IN',
          quantityBefore: destStock.quantity,
          quantityAfter: newDestQty,
          quantityChange: receivedQty,
          reference: transfer.id,
          notes: `Transfer masuk ${transfer.transferNumber}: ${receivedQty} unit`,
          createdById: userId || null,
        },
      });
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
    });
  }

  // ============================================
  // CANCEL TRANSFER
  // ============================================

  async cancelTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Transfer tidak ditemukan.');

    if (transfer.status === 'RECEIVED') {
      throw new BadRequestException('Transfer yang sudah diterima tidak bisa dibatalkan.');
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateTransferNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRF-${dateStr}-${rand}`;
  }
}
