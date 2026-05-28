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
      unitCost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
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

  async markReceived(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('PO tidak ditemukan.');
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException('PO sudah selesai atau dibatalkan.');
    }

    // Update all items receivedQty = quantity
    await this.prisma.purchaseOrderItem.updateMany({
      where: { orderId: id },
      data: { receivedQty: undefined }, // will set per-item below
    });

    // Update stock for each item
    for (const item of po.items) {
      // Update receivedQty
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQty: item.quantity },
      });

      // Add stock
      const stock = await this.prisma.stock.findFirst({
        where: { shopId: po.shopId, productId: item.productId },
      });

      if (stock) {
        await this.prisma.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: item.quantity } },
        });

        await this.prisma.stockHistory.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            quantityBefore: stock.quantity,
            quantityAfter: stock.quantity + item.quantity,
            quantityChange: item.quantity,
            reference: po.id,
            notes: `PO ${po.orderNumber}: ${item.quantity} unit masuk`,
          },
        });
      }
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
    });
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
