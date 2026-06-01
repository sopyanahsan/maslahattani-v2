import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockInDto } from './dto/stock-in.dto';
import { StockOpnameDto } from './dto/stock-opname.dto';
import { QueryStockHistoryDto } from './dto/query-stock.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // GET ALL STOCK (by shop)
  // ============================================

  async findAll(shopId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { shopId },
      include: {
        product: {
          select: { id: true, name: true, sku: true, price: true, cost: true, deletedAt: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    // Filter out deleted products
    const activeStocks = stocks.filter((s) => !s.product.deletedAt);

    // Categorize
    const outOfStock = activeStocks.filter((s) => s.quantity <= 0);
    const lowStock = activeStocks.filter((s) => s.quantity > 0 && s.quantity <= 5);

    return {
      data: activeStocks,
      summary: {
        totalProducts: activeStocks.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        totalStockValue: activeStocks.reduce((sum, s) => sum + s.quantity * s.product.cost, 0),
      },
    };
  }

  // ============================================
  // STOCK IN (Restok)
  // ============================================

  async stockIn(dto: StockInDto) {
    // Find stock record
    const stock = await this.prisma.stock.findFirst({
      where: { productId: dto.productId, shopId: dto.shopId },
      include: { product: { select: { name: true } } },
    });

    if (!stock) {
      throw new NotFoundException('Stok produk tidak ditemukan. Pastikan produk sudah ada.');
    }

    // Update stock + log history
    const updated = await this.prisma.$transaction(async (tx) => {
      const newQty = stock.quantity + dto.quantity;

      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });

      await tx.stockHistory.create({
        data: {
          stockId: stock.id,
          type: 'IN',
          source: 'STOCK_IN',
          quantityBefore: stock.quantity,
          quantityAfter: newQty,
          quantityChange: dto.quantity,
          notes: dto.notes || 'Stok masuk',
        },
      });

      return { quantity: newQty };
    });

    return {
      success: true,
      message: `Stok "${stock.product.name}" berhasil ditambah ${dto.quantity} unit.`,
      stock: {
        productId: dto.productId,
        quantityBefore: stock.quantity,
        quantityAfter: updated.quantity,
        added: dto.quantity,
      },
    };
  }

  // ============================================
  // STOCK OPNAME (Penyesuaian stok fisik)
  // ============================================

  async opname(dto: StockOpnameDto) {
    const results: any[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, shopId: dto.shopId },
          include: { product: { select: { name: true } } },
        });

        if (!stock) {
          throw new BadRequestException(`Stok untuk produk ${item.productId} tidak ditemukan.`);
        }

        const difference = item.actualQuantity - stock.quantity;

        // Update stock to actual quantity
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: item.actualQuantity },
        });

        // Log opname history
        await tx.stockHistory.create({
          data: {
            stockId: stock.id,
            type: 'OPNAME',
            source: 'OPNAME_INLINE',
            quantityBefore: stock.quantity,
            quantityAfter: item.actualQuantity,
            quantityChange: difference,
            notes: item.notes || dto.notes || 'Stok opname',
          },
        });

        results.push({
          productId: item.productId,
          productName: stock.product.name,
          systemQty: stock.quantity,
          actualQty: item.actualQuantity,
          difference,
          status: difference === 0 ? 'MATCH' : difference > 0 ? 'SURPLUS' : 'SELISIH',
        });
      }
    });

    const totalDifference = results.reduce((sum, r) => sum + Math.abs(r.difference), 0);
    const matchCount = results.filter((r) => r.status === 'MATCH').length;

    return {
      success: true,
      message: `Stok opname selesai. ${matchCount}/${results.length} produk cocok.`,
      results,
      summary: {
        totalProducts: results.length,
        matched: matchCount,
        surplus: results.filter((r) => r.status === 'SURPLUS').length,
        selisih: results.filter((r) => r.status === 'SELISIH').length,
        totalDifference,
      },
    };
  }

  // ============================================
  // STOCK HISTORY (Riwayat pergerakan stok)
  // ============================================

  async getHistory(query: QueryStockHistoryDto) {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.productId) {
      const stock = await this.prisma.stock.findFirst({
        where: { productId: query.productId, shopId: query.shopId },
      });
      if (stock) where.stockId = stock.id;
    } else if (query.shopId) {
      const stocks = await this.prisma.stock.findMany({
        where: { shopId: query.shopId },
        select: { id: true },
      });
      where.stockId = { in: stocks.map((s) => s.id) };
    }

    if (query.type) where.type = query.type;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [histories, total] = await Promise.all([
      this.prisma.stockHistory.findMany({
        where,
        include: {
          stock: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockHistory.count({ where }),
    ]);

    return {
      data: histories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
