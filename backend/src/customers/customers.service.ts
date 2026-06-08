import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // LIST (with search & pagination)
  // ============================================

  async listCustomers(query: QueryCustomersDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        id: c.id,
        shopId: c.shopId,
        name: c.name,
        phone: c.phone,
        address: c.address,
        notes: c.notes,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // AUTOCOMPLETE (for POS / BRILink forms)
  // ============================================

  async autocomplete(shopId: string, q: string) {
    const trimmed = (q || '').trim();
    if (!trimmed || trimmed.length < 2) return [];

    const results = await this.prisma.customer.findMany({
      where: {
        shopId,
        isActive: true,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { phone: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
      take: 10,
    });

    return results;
  }

  // ============================================
  // CHECK DUPLICATE NAME (for frontend real-time check)
  // ============================================

  async checkName(shopId: string, name: string, excludeId?: string) {
    const trimmed = name.trim();
    if (!trimmed) return { exists: false };

    const existing = await this.prisma.customer.findUnique({
      where: { shopId_name: { shopId, name: trimmed } },
    });

    if (existing && existing.id !== excludeId) {
      return { exists: true, existingCustomer: { id: existing.id, name: existing.name } };
    }
    return { exists: false };
  }

  // ============================================
  // CREATE
  // ============================================

  async createCustomer(dto: CreateCustomerDto) {
    const trimmedName = dto.name.trim();

    // Anti-double name check
    const existing = await this.prisma.customer.findUnique({
      where: { shopId_name: { shopId: dto.shopId, name: trimmedName } },
    });
    if (existing) {
      throw new ConflictException(
        `Customer "${trimmedName}" sudah ada di cabang ini.`,
      );
    }

    const customer = await this.prisma.customer.create({
      data: {
        shopId: dto.shopId,
        name: trimmedName,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    return {
      id: customer.id,
      shopId: customer.shopId,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer tidak ditemukan.');

    // Check name conflict if name is being changed
    if (dto.name && dto.name.trim() !== existing.name) {
      const dup = await this.prisma.customer.findUnique({
        where: { shopId_name: { shopId: existing.shopId, name: dto.name.trim() } },
      });
      if (dup) {
        throw new ConflictException(
          `Customer "${dto.name.trim()}" sudah ada di cabang ini.`,
        );
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      id: updated.id,
      shopId: updated.shopId,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      notes: updated.notes,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // ============================================
  // DELETE
  // ============================================

  async deleteCustomer(id: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer tidak ditemukan.');

    await this.prisma.customer.delete({ where: { id } });
    return { success: true, message: 'Customer berhasil dihapus.' };
  }
}
