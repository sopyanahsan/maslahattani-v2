import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE PRODUCT
  // ============================================

  async create(dto: CreateProductDto) {
    // Check SKU unique per shop
    const existing = await this.prisma.product.findUnique({
      where: { shopId_sku: { shopId: dto.shopId, sku: dto.sku } },
    });

    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" sudah digunakan di toko ini.`);
    }

    // Create product + initial stock in one transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          shopId: dto.shopId,
          name: dto.name,
          sku: dto.sku,
          price: dto.price,
          cost: dto.cost,
          supplierId: dto.supplierId || null,
        },
      });

      // Create stock record
      const initialQty = dto.initialStock || 0;
      const stock = await tx.stock.create({
        data: {
          shopId: dto.shopId,
          productId: prod.id,
          quantity: initialQty,
          warehouse: 'main',
        },
      });

      // Log initial stock
      if (initialQty > 0) {
        await tx.stockHistory.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            quantityBefore: 0,
            quantityAfter: initialQty,
            quantityChange: initialQty,
            notes: 'Stok awal produk baru',
          },
        });
      }

      return prod;
    });

    return { success: true, product };
  }

  // ============================================
  // GET ALL PRODUCTS
  // ============================================

  async findAll(query: QueryProductDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.shopId) where.shopId = query.shopId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          stocks: { select: { quantity: true, warehouse: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // GET SINGLE PRODUCT
  // ============================================

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            stockHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    return product;
  }

  // ============================================
  // UPDATE PRODUCT
  // ============================================

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? product.name,
        price: dto.price ?? product.price,
        cost: dto.cost ?? product.cost,
        supplierId: dto.supplierId ?? product.supplierId,
      },
      include: {
        stocks: { select: { quantity: true, warehouse: true } },
      },
    });

    return { success: true, product: updated };
  }

  // ============================================
  // DELETE PRODUCT (Soft delete)
  // ============================================

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: `Produk "${product.name}" berhasil dihapus.` };
  }
}
