import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  QuerySuppliersDto,
  QueryPurchaseOrdersDto,
} from './dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // SUPPLIERS CRUD
  // ============================================

  async listSuppliers(query: QuerySuppliersDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        shopId: s.shopId,
        name: s.name,
        phone: s.phone,
        address: s.address,
        notes: s.notes,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createSupplier(dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        shopId: dto.shopId,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        notes: dto.notes,
      },
    });
    return supplier;
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier tidak ditemukan.');

    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async deleteSupplier(id: string) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier tidak ditemukan.');

    // Check if supplier has POs
    const poCount = await this.prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      throw new BadRequestException(
        'Supplier memiliki Purchase Order. Nonaktifkan saja daripada hapus.',
      );
    }

    await this.prisma.supplier.delete({ where: { id } });
    return { success: true, message: 'Supplier berhasil dihapus.' };
  }

  // ============================================
  // PURCHASE ORDERS
  // ============================================

  async listPurchaseOrders(query: QueryPurchaseOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: data.map((po) => ({
        id: po.id,
        orderNumber: po.orderNumber,
        status: po.status,
        totalAmount: po.totalAmount,
        notes: po.notes,
        supplierId: po.supplierId,
        supplierName: po.supplier.name,
        createdById: po.createdById,
        createdByName: po.createdBy?.username || po.createdBy?.email || '-',
        itemCount: po._count.items,
        orderedAt: po.orderedAt?.toISOString() || null,
        receivedAt: po.receivedAt?.toISOString() || null,
        createdAt: po.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, username: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!po) throw new NotFoundException('Purchase Order tidak ditemukan.');

    return {
      id: po.id,
      orderNumber: po.orderNumber,
      status: po.status,
      totalAmount: po.totalAmount,
      notes: po.notes,
      supplier: po.supplier,
      createdBy: { id: po.createdBy.id, name: po.createdBy.username || po.createdBy.email },
      orderedAt: po.orderedAt?.toISOString() || null,
      receivedAt: po.receivedAt?.toISOString() || null,
      createdAt: po.createdAt.toISOString(),
      items: po.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.subtotal,
        receivedQty: item.receivedQty,
      })),
    };
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, createdById: string) {
    const orderNumber = this.generateOrderNumber();

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost || 0, // Opsional — bisa diisi nanti saat terima
      subtotal: item.quantity * (item.unitCost || 0),
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        shopId: dto.shopId,
        supplierId: dto.supplierId,
        createdById,
        orderNumber,
        totalAmount,
        notes: dto.notes,
        items: { create: items },
      },
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      id: po.id,
      orderNumber: po.orderNumber,
      status: po.status,
      totalAmount: po.totalAmount,
      supplierName: po.supplier.name,
      itemCount: po._count.items,
    };
  }

  async markOrdered(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO tidak ditemukan.');
    if (po.status !== 'DRAFT') throw new BadRequestException('PO sudah diorder atau selesai.');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'ORDERED', orderedAt: new Date() },
    });
  }

  async markReceived(id: string, receivedItems?: Array<{ itemId: string; receivedQty: number; actualCost?: number }>) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, cost: true, price: true } },
          },
        },
      },
    });
    if (!po) throw new NotFoundException('PO tidak ditemukan.');
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException('PO sudah selesai atau dibatalkan.');
    }

    // Build receive map with actualCost
    const receiveMap = new Map<string, { qty: number; actualCost?: number }>();
    if (receivedItems && receivedItems.length > 0) {
      for (const ri of receivedItems) {
        receiveMap.set(ri.itemId, { qty: ri.receivedQty, actualCost: ri.actualCost });
      }
    } else {
      for (const item of po.items) {
        receiveMap.set(item.id, { qty: item.quantity - item.receivedQty });
      }
    }

    // Validate quantities
    for (const item of po.items) {
      const entry = receiveMap.get(item.id);
      if (!entry) continue;
      const remaining = item.quantity - item.receivedQty;
      if (entry.qty > remaining) {
        throw new BadRequestException(
          `Qty terima (${entry.qty}) melebihi sisa yang belum diterima (${remaining}).`,
        );
      }
      if (entry.qty < 0) {
        throw new BadRequestException('Qty terima tidak boleh negatif.');
      }
    }

    // Track price changes
    const priceChanges: Array<{
      productId: string;
      productName: string;
      productSku: string;
      oldCost: number;
      newCost: number;
      currentPrice: number;
      marginPercent: number;
      suggestedPrice: number;
    }> = [];

    // Execute atomically
    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        const entry = receiveMap.get(item.id);
        const toReceive = entry?.qty ?? 0;
        if (toReceive <= 0) continue;

        // Determine actual cost: from input → from PO item → from product
        const actualCost = entry?.actualCost ?? (item.unitCost > 0 ? item.unitCost : item.product.cost);

        // Update PO item receivedQty + unitCost (in case it was 0 at creation)
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQty: item.receivedQty + toReceive,
            unitCost: actualCost,
            subtotal: item.quantity * actualCost,
          },
        });

        // Find or create stock record
        let stock = await tx.stock.findFirst({
          where: { shopId: po.shopId, productId: item.productId },
        });
        if (!stock) {
          stock = await tx.stock.create({
            data: { shopId: po.shopId, productId: item.productId, quantity: 0, warehouse: 'main' },
          });
        }

        const qtyBefore = stock.quantity;
        const qtyAfter = qtyBefore + toReceive;

        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: qtyAfter },
        });

        await tx.stockHistory.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            source: 'PURCHASE_ORDER',
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            quantityChange: toReceive,
            reference: po.id,
            notes: `PO ${po.orderNumber}: terima ${toReceive} unit @ Rp ${actualCost.toLocaleString('id-ID')}`,
          },
        });

        // Detect price change: new cost vs current product cost
        if (actualCost > 0 && actualCost !== item.product.cost) {
          const oldCost = item.product.cost;
          const currentPrice = item.product.price;
          const marginPercent = oldCost > 0
            ? Math.round(((currentPrice - oldCost) / oldCost) * 100)
            : 0;
          // Calculate suggested price: maintain same margin %, round up to nearest 100
          const suggestedPrice = marginPercent > 0
            ? Math.ceil((actualCost * (1 + marginPercent / 100)) / 100) * 100
            : currentPrice;

          priceChanges.push({
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku,
            oldCost,
            newCost: actualCost,
            currentPrice,
            marginPercent,
            suggestedPrice,
          });
        }
      }

      // Recalculate totalAmount with actual costs
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { orderId: id } });
      const newTotalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      const allFullyReceived = updatedItems.every((i) => i.receivedQty >= i.quantity);
      const newStatus = allFullyReceived ? 'RECEIVED' : 'PARTIAL';

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          totalAmount: newTotalAmount,
          ...(allFullyReceived ? { receivedAt: new Date() } : {}),
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    });

    return {
      purchaseOrder: result,
      message: result.status === 'RECEIVED'
        ? `PO ${po.orderNumber} selesai! Semua barang diterima & stok diupdate.`
        : `PO ${po.orderNumber} diterima sebagian. Sisa bisa diterima nanti.`,
      priceChanges: priceChanges.length > 0 ? priceChanges : undefined,
    };
  }

  async cancelPO(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO tidak ditemukan.');
    if (po.status === 'RECEIVED') {
      throw new BadRequestException('PO yang sudah diterima tidak bisa dibatalkan.');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PO-${dateStr}-${rand}`;
  }
}
