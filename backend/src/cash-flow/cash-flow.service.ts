import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CATEGORIES CRUD
  // ============================================

  async listCategories(shopId: string, type?: string) {
    const where: any = { shopId };
    if (type) where.type = type;
    const categories = await this.prisma.cashFlowCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return { data: categories };
  }

  async createCategory(shopId: string, dto: { name: string; type: string; icon?: string }) {
    if (!['CASH_IN', 'CASH_OUT'].includes(dto.type)) {
      throw new BadRequestException('Type harus CASH_IN atau CASH_OUT.');
    }
    const category = await this.prisma.cashFlowCategory.create({
      data: { shopId, name: dto.name, type: dto.type, icon: dto.icon },
    });
    return { category };
  }

  async updateCategory(id: string, shopId: string, dto: { name?: string; icon?: string; isActive?: boolean; sortOrder?: number }) {
    const cat = await this.prisma.cashFlowCategory.findFirst({ where: { id, shopId } });
    if (!cat) throw new NotFoundException('Kategori tidak ditemukan.');
    const updated = await this.prisma.cashFlowCategory.update({
      where: { id },
      data: { name: dto.name, icon: dto.icon, isActive: dto.isActive, sortOrder: dto.sortOrder },
    });
    return { category: updated };
  }

  async deleteCategory(id: string, shopId: string) {
    const cat = await this.prisma.cashFlowCategory.findFirst({ where: { id, shopId } });
    if (!cat) throw new NotFoundException('Kategori tidak ditemukan.');
    await this.prisma.cashFlowCategory.delete({ where: { id } });
    return { success: true, message: `Kategori "${cat.name}" dihapus.` };
  }

  // ============================================
  // CASH FLOW CRUD
  // ============================================

  async create(shopId: string, userId: string, dto: { categoryId: string; type: string; amount: number; notes?: string; shiftId?: string }) {
    if (!['CASH_IN', 'CASH_OUT'].includes(dto.type)) {
      throw new BadRequestException('Type harus CASH_IN atau CASH_OUT.');
    }
    if (dto.amount <= 0) throw new BadRequestException('Amount harus > 0.');

    const category = await this.prisma.cashFlowCategory.findFirst({ where: { id: dto.categoryId, shopId } });
    if (!category) throw new BadRequestException('Kategori tidak valid.');

    const cashFlow = await this.prisma.cashFlow.create({
      data: {
        shopId,
        userId,
        shiftId: dto.shiftId || null,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        notes: dto.notes || null,
        status: 'PENDING',
      },
      include: { category: true, user: { select: { id: true, username: true } } },
    });

    return { success: true, cashFlow };
  }

  async list(shopId: string, query: { type?: string; status?: string; shiftId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const where: any = { shopId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.cashFlow.findMany({
        where,
        include: { category: true, user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cashFlow.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ============================================
  // VERIFY / REJECT (Admin)
  // ============================================

  async verify(id: string, shopId: string, adminUserId: string) {
    const cf = await this.prisma.cashFlow.findFirst({ where: { id, shopId } });
    if (!cf) throw new NotFoundException('Cash flow tidak ditemukan.');
    if (cf.status !== 'PENDING') throw new BadRequestException('Hanya bisa verifikasi yang statusnya PENDING.');

    const updated = await this.prisma.cashFlow.update({
      where: { id },
      data: { status: 'VERIFIED', verifiedBy: adminUserId, verifiedAt: new Date() },
    });
    return { success: true, cashFlow: updated };
  }

  async reject(id: string, shopId: string, adminUserId: string, reason: string) {
    const cf = await this.prisma.cashFlow.findFirst({ where: { id, shopId } });
    if (!cf) throw new NotFoundException('Cash flow tidak ditemukan.');
    if (cf.status !== 'PENDING') throw new BadRequestException('Hanya bisa reject yang statusnya PENDING.');

    const updated = await this.prisma.cashFlow.update({
      where: { id },
      data: { status: 'REJECTED', verifiedBy: adminUserId, verifiedAt: new Date(), rejectReason: reason },
    });
    return { success: true, cashFlow: updated };
  }

  // ============================================
  // SUMMARY (for shift/dashboard)
  // ============================================

  async getSummary(shopId: string, shiftId?: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: { not: 'REJECTED' } };
    if (shiftId) where.shiftId = shiftId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const cashIn = await this.prisma.cashFlow.aggregate({
      where: { ...where, type: 'CASH_IN' },
      _sum: { amount: true },
      _count: true,
    });

    const cashOut = await this.prisma.cashFlow.aggregate({
      where: { ...where, type: 'CASH_OUT' },
      _sum: { amount: true },
      _count: true,
    });

    return {
      cashIn: { total: cashIn._sum.amount || 0, count: cashIn._count },
      cashOut: { total: cashOut._sum.amount || 0, count: cashOut._count },
      net: (cashIn._sum.amount || 0) - (cashOut._sum.amount || 0),
    };
  }
}
