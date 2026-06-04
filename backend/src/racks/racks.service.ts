import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRackZoneDto,
  UpdateRackZoneDto,
  CreateRackDto,
  UpdateRackDto,
} from './dto';

@Injectable()
export class RacksService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // RACK ZONES
  // ============================================

  async listZones(shopId: string) {
    const zones = await this.prisma.rackZone.findMany({
      where: { shopId },
      include: { _count: { select: { racks: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return zones.map((z) => ({
      id: z.id,
      shopId: z.shopId,
      name: z.name,
      description: z.description,
      sortOrder: z.sortOrder,
      rackCount: z._count.racks,
      createdAt: z.createdAt.toISOString(),
    }));
  }

  async createZone(dto: CreateRackZoneDto) {
    // Check duplicate name
    const existing = await this.prisma.rackZone.findUnique({
      where: { shopId_name: { shopId: dto.shopId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Zona "${dto.name}" sudah ada di cabang ini.`);
    }

    const zone = await this.prisma.rackZone.create({
      data: {
        shopId: dto.shopId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return {
      id: zone.id,
      shopId: zone.shopId,
      name: zone.name,
      description: zone.description,
      sortOrder: zone.sortOrder,
      createdAt: zone.createdAt.toISOString(),
    };
  }

  async updateZone(id: string, dto: UpdateRackZoneDto) {
    const zone = await this.prisma.rackZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zona tidak ditemukan.');

    // Check name conflict
    if (dto.name && dto.name !== zone.name) {
      const dup = await this.prisma.rackZone.findUnique({
        where: { shopId_name: { shopId: zone.shopId, name: dto.name } },
      });
      if (dup) throw new ConflictException(`Zona "${dto.name}" sudah ada.`);
    }

    const updated = await this.prisma.rackZone.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      sortOrder: updated.sortOrder,
    };
  }

  async deleteZone(id: string) {
    const zone = await this.prisma.rackZone.findUnique({
      where: { id },
      include: { _count: { select: { racks: true } } },
    });
    if (!zone) throw new NotFoundException('Zona tidak ditemukan.');

    // Cascade will delete racks + unset stock.rackId (SET NULL via FK)
    await this.prisma.rackZone.delete({ where: { id } });

    return { message: `Zona "${zone.name}" dan ${zone._count.racks} rak di dalamnya berhasil dihapus.` };
  }

  // ============================================
  // RACKS
  // ============================================

  async listRacks(shopId: string, zoneId?: string) {
    const where: any = { shopId };
    if (zoneId) where.zoneId = zoneId;

    const racks = await this.prisma.rack.findMany({
      where,
      include: {
        zone: { select: { id: true, name: true } },
        _count: { select: { stocks: true } },
      },
      orderBy: [{ zone: { sortOrder: 'asc' } }, { code: 'asc' }],
    });

    return racks.map((r) => ({
      id: r.id,
      shopId: r.shopId,
      zoneId: r.zoneId,
      zoneName: r.zone.name,
      code: r.code,
      name: r.name,
      productCount: r._count.stocks,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createRack(dto: CreateRackDto) {
    // Validate zone belongs to same shop
    const zone = await this.prisma.rackZone.findUnique({ where: { id: dto.zoneId } });
    if (!zone || zone.shopId !== dto.shopId) {
      throw new BadRequestException('Zona tidak ditemukan di cabang ini.');
    }

    // Check code uniqueness
    const existing = await this.prisma.rack.findUnique({
      where: { shopId_code: { shopId: dto.shopId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Kode rak "${dto.code}" sudah dipakai di cabang ini.`);
    }

    const rack = await this.prisma.rack.create({
      data: {
        shopId: dto.shopId,
        zoneId: dto.zoneId,
        code: dto.code,
        name: dto.name,
      },
      include: { zone: { select: { id: true, name: true } } },
    });

    return {
      id: rack.id,
      shopId: rack.shopId,
      zoneId: rack.zoneId,
      zoneName: rack.zone.name,
      code: rack.code,
      name: rack.name,
      createdAt: rack.createdAt.toISOString(),
    };
  }

  async updateRack(id: string, dto: UpdateRackDto) {
    const rack = await this.prisma.rack.findUnique({ where: { id } });
    if (!rack) throw new NotFoundException('Rak tidak ditemukan.');

    // Check code conflict
    if (dto.code && dto.code !== rack.code) {
      const dup = await this.prisma.rack.findUnique({
        where: { shopId_code: { shopId: rack.shopId, code: dto.code } },
      });
      if (dup) throw new ConflictException(`Kode rak "${dto.code}" sudah dipakai.`);
    }

    // Validate zone if changing
    if (dto.zoneId && dto.zoneId !== rack.zoneId) {
      const zone = await this.prisma.rackZone.findUnique({ where: { id: dto.zoneId } });
      if (!zone || zone.shopId !== rack.shopId) {
        throw new BadRequestException('Zona tidak valid untuk cabang ini.');
      }
    }

    const updated = await this.prisma.rack.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.zoneId !== undefined && { zoneId: dto.zoneId }),
      },
      include: { zone: { select: { id: true, name: true } } },
    });

    return {
      id: updated.id,
      zoneId: updated.zoneId,
      zoneName: updated.zone.name,
      code: updated.code,
      name: updated.name,
    };
  }

  async deleteRack(id: string) {
    const rack = await this.prisma.rack.findUnique({ where: { id } });
    if (!rack) throw new NotFoundException('Rak tidak ditemukan.');

    // Stock.rackId will be SET NULL via FK cascade
    await this.prisma.rack.delete({ where: { id } });

    return { message: `Rak "${rack.code}" berhasil dihapus.` };
  }

  // ============================================
  // PRODUCTS IN RACK
  // ============================================

  async getProductsByRack(rackId: string) {
    const rack = await this.prisma.rack.findUnique({ where: { id: rackId } });
    if (!rack) throw new NotFoundException('Rak tidak ditemukan.');

    const stocks = await this.prisma.stock.findMany({
      where: { rackId },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });

    return {
      rack: { id: rack.id, code: rack.code, name: rack.name },
      products: stocks.map((s) => ({
        stockId: s.id,
        productId: s.product.id,
        productName: s.product.name,
        productSku: s.product.sku,
        productPrice: s.product.price,
        quantity: s.quantity,
      })),
    };
  }

  // ============================================
  // ASSIGN / UNASSIGN PRODUCT TO RACK
  // ============================================

  /**
   * List produk yang belum di-assign ke rak manapun di shop ini.
   * Opsional filter by search (nama / SKU).
   */
  async getUnassignedProducts(shopId: string, search?: string) {
    const where: any = { shopId, rackId: null };

    if (search && search.trim()) {
      where.product = {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { sku: { contains: search.trim(), mode: 'insensitive' } },
        ],
        deletedAt: null,
      };
    } else {
      where.product = { deletedAt: null };
    }

    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
      orderBy: { product: { name: 'asc' } },
      take: 50, // limit for performance
    });

    return stocks.map((s) => ({
      stockId: s.id,
      productId: s.product.id,
      productName: s.product.name,
      productSku: s.product.sku,
      productPrice: s.product.price,
      quantity: s.quantity,
    }));
  }

  async assignProductToRack(stockId: string, rackId: string | null) {
    const stock = await this.prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) throw new NotFoundException('Stok tidak ditemukan.');

    if (rackId) {
      const rack = await this.prisma.rack.findUnique({ where: { id: rackId } });
      if (!rack || rack.shopId !== stock.shopId) {
        throw new BadRequestException('Rak tidak ditemukan di cabang ini.');
      }
    }

    await this.prisma.stock.update({
      where: { id: stockId },
      data: { rackId: rackId || null },
    });

    return { message: rackId ? 'Produk berhasil dipindahkan ke rak.' : 'Produk berhasil dilepas dari rak.' };
  }
}
