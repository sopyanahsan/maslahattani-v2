import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOpnameSessionDto,
  UpdateOpnameItemDto,
  QueryOpnameSessionsDto,
} from './dto';

@Injectable()
export class OpnameService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // LIST SESSIONS
  // ============================================

  async listSessions(query: QueryOpnameSessionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.opnameSession.findMany({
        where,
        include: {
          conductor: { select: { id: true, username: true, email: true, fullName: true } },
          assignee: { select: { id: true, username: true, email: true, fullName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.opnameSession.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        status: s.status,
        notes: s.notes,
        conductorId: s.conductorId,
        conductorName: s.conductor?.fullName || s.conductor?.username || s.conductor?.email || '-',
        assigneeId: s.assigneeId,
        assigneeName: s.assignee
          ? s.assignee.fullName || s.assignee.username || s.assignee.email || '-'
          : null,
        shopId: s.shopId,
        totalProducts: s.totalProducts,
        totalMatched: s.totalMatched,
        totalSurplus: s.totalSurplus,
        totalDeficit: s.totalDeficit,
        startedAt: s.startedAt?.toISOString() || null,
        completedAt: s.completedAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
        itemCount: s._count.items,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // GET SESSION DETAIL (with items)
  // ============================================

  async getSession(id: string) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { id },
      include: {
        conductor: { select: { id: true, username: true, email: true, fullName: true } },
        assignee: { select: { id: true, username: true, email: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
          },
          orderBy: { product: { name: 'asc' } },
        },
      },
    });

    if (!session) throw new NotFoundException('Sesi opname tidak ditemukan.');

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      status: session.status,
      notes: session.notes,
      conductorId: session.conductorId,
      conductorName: session.conductor?.fullName || session.conductor?.username || session.conductor?.email || '-',
      assigneeId: session.assigneeId,
      assigneeName: session.assignee
        ? session.assignee.fullName || session.assignee.username || session.assignee.email || '-'
        : null,
      shopId: session.shopId,
      totalProducts: session.totalProducts,
      totalMatched: session.totalMatched,
      totalSurplus: session.totalSurplus,
      totalDeficit: session.totalDeficit,
      startedAt: session.startedAt?.toISOString() || null,
      completedAt: session.completedAt?.toISOString() || null,
      createdAt: session.createdAt.toISOString(),
      items: session.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productPrice: item.product.price,
        systemQty: item.systemQty,
        actualQty: item.actualQty,
        variance: item.variance,
        reason: item.reason,
        notes: item.notes,
      })),
    };
  }

  // ============================================
  // CREATE SESSION
  // ============================================

  async createSession(dto: CreateOpnameSessionDto, conductorId: string) {
    const sessionNumber = this.generateSessionNumber();

    // Build stock query — optionally filter by rackIds
    const stockWhere: any = { shopId: dto.shopId };
    if (dto.rackIds && dto.rackIds.length > 0) {
      stockWhere.rackId = { in: dto.rackIds };
    }

    // Get products with stock for this shop (filtered by rack if specified)
    const stocks = await this.prisma.stock.findMany({
      where: stockWhere,
      include: { product: { select: { id: true, deletedAt: true } } },
    });

    // Filter out deleted products
    const activeStocks = stocks.filter((s) => !s.product.deletedAt);

    if (activeStocks.length === 0) {
      const rackNote = dto.rackIds?.length ? ' di rak yang dipilih' : '';
      throw new BadRequestException(`Tidak ada produk dengan stok${rackNote} di toko ini.`);
    }

    // Validate assignee (if provided) belongs to this shop
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, shopId: dto.shopId },
        select: { id: true },
      });
      if (!assignee) {
        throw new BadRequestException('Petugas yang dipilih tidak ditemukan di cabang ini.');
      }
    }

    const session = await this.prisma.opnameSession.create({
      data: {
        shopId: dto.shopId,
        conductorId,
        assigneeId: dto.assigneeId || null,
        sessionNumber,
        status: 'IN_PROGRESS',
        notes: dto.notes,
        startedAt: new Date(),
        totalProducts: activeStocks.length,
        items: {
          create: activeStocks.map((stock) => ({
            productId: stock.productId,
            systemQty: stock.quantity,
          })),
        },
      },
      include: {
        conductor: { select: { id: true, username: true, email: true, fullName: true } },
        assignee: { select: { id: true, username: true, email: true, fullName: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      status: session.status,
      assigneeId: session.assigneeId,
      assigneeName: session.assignee
        ? session.assignee.fullName || session.assignee.username || session.assignee.email || '-'
        : null,
      totalProducts: session.totalProducts,
      startedAt: session.startedAt?.toISOString(),
      itemCount: session._count.items,
    };
  }

  // ============================================
  // UPDATE ITEM (input actual qty)
  // ============================================

  async updateItem(itemId: string, dto: UpdateOpnameItemDto) {
    const item = await this.prisma.opnameItem.findUnique({
      where: { id: itemId },
      include: { session: { select: { status: true } } },
    });

    if (!item) throw new NotFoundException('Item opname tidak ditemukan.');
    if (item.session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Sesi opname sudah selesai atau dibatalkan.');
    }

    const variance = dto.actualQty - item.systemQty;

    const updated = await this.prisma.opnameItem.update({
      where: { id: itemId },
      data: {
        actualQty: dto.actualQty,
        variance,
        reason: dto.reason || null,
        notes: dto.notes,
      },
    });

    return {
      id: updated.id,
      productId: updated.productId,
      systemQty: updated.systemQty,
      actualQty: updated.actualQty,
      variance: updated.variance,
      reason: updated.reason,
      notes: updated.notes,
    };
  }

  // ============================================
  // COMPLETE SESSION
  // ============================================

  async completeSession(id: string, applyAdjustments: boolean = false, userId?: string) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!session) throw new NotFoundException('Sesi opname tidak ditemukan.');
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Sesi opname tidak dalam status IN_PROGRESS.');
    }

    // Check all items have been counted
    const uncounted = session.items.filter((item) => item.actualQty === null);
    if (uncounted.length > 0) {
      throw new BadRequestException(
        `Masih ada ${uncounted.length} produk yang belum dihitung.`,
      );
    }

    // Calculate summary
    const totalMatched = session.items.filter((i) => i.variance === 0).length;
    const totalSurplus = session.items.filter((i) => (i.variance ?? 0) > 0).length;
    const totalDeficit = session.items.filter((i) => (i.variance ?? 0) < 0).length;

    // Apply stock adjustments if requested
    if (applyAdjustments) {
      for (const item of session.items) {
        if (item.variance !== 0 && item.actualQty !== null) {
          // Update stock quantity
          await this.prisma.stock.updateMany({
            where: { shopId: session.shopId, productId: item.productId },
            data: { quantity: item.actualQty },
          });

          // Create stock history entry
          const stock = await this.prisma.stock.findFirst({
            where: { shopId: session.shopId, productId: item.productId },
          });

          if (stock) {
            const reasonLabel = item.reason ? ` [${item.reason}]` : '';
            await this.prisma.stockHistory.create({
              data: {
                stockId: stock.id,
                type: 'OPNAME',
                source: 'OPNAME_SESSION',
                quantityBefore: item.systemQty,
                quantityAfter: item.actualQty,
                quantityChange: item.variance!,
                reference: session.id,
                notes: `Opname ${session.sessionNumber}: ${item.variance! > 0 ? '+' : ''}${item.variance}${reasonLabel}${item.notes ? ' — ' + item.notes : ''}`,
                createdById: userId || null,
              },
            });
          }
        }
      }
    }

    // Update session status
    const updated = await this.prisma.opnameSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalMatched,
        totalSurplus,
        totalDeficit,
      },
    });

    return {
      id: updated.id,
      sessionNumber: updated.sessionNumber,
      status: updated.status,
      totalProducts: updated.totalProducts,
      totalMatched,
      totalSurplus,
      totalDeficit,
      completedAt: updated.completedAt?.toISOString(),
      adjustmentsApplied: applyAdjustments,
    };
  }

  // ============================================
  // CANCEL SESSION
  // ============================================

  async cancelSession(id: string) {
    const session = await this.prisma.opnameSession.findUnique({ where: { id } });

    if (!session) throw new NotFoundException('Sesi opname tidak ditemukan.');
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Sesi yang sudah selesai tidak bisa dibatalkan.');
    }

    const updated = await this.prisma.opnameSession.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return {
      id: updated.id,
      sessionNumber: updated.sessionNumber,
      status: updated.status,
    };
  }

  // ============================================
  // MONTHLY SUMMARY (recap card)
  // ============================================

  /**
   * Rekap bulanan opname untuk satu shop.
   * KPI: nilai kerugian (Rp) bulan ini + perubahan vs bulan lalu,
   * akurasi stok (%), jumlah sesi bulan ini, tanggal opname terakhir.
   */
  async getMonthlySummary(shopId: string, month?: string) {
    // month format: YYYY-MM. Default = bulan berjalan.
    const now = new Date();
    let year = now.getFullYear();
    let mon = now.getMonth(); // 0-indexed
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      year = y;
      mon = m - 1;
    }

    const startThis = new Date(year, mon, 1);
    const startNext = new Date(year, mon + 1, 1);
    const startPrev = new Date(year, mon - 1, 1);

    const completedInclude = {
      items: { include: { product: { select: { price: true } } } },
    };

    const [thisMonth, lastMonth, lastSession, sessionCount] = await Promise.all([
      this.prisma.opnameSession.findMany({
        where: {
          shopId,
          status: 'COMPLETED',
          completedAt: { gte: startThis, lt: startNext },
        },
        include: completedInclude,
      }),
      this.prisma.opnameSession.findMany({
        where: {
          shopId,
          status: 'COMPLETED',
          completedAt: { gte: startPrev, lt: startThis },
        },
        include: completedInclude,
      }),
      this.prisma.opnameSession.findFirst({
        where: { shopId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true, sessionNumber: true },
      }),
      this.prisma.opnameSession.count({
        where: { shopId, createdAt: { gte: startThis, lt: startNext } },
      }),
    ]);

    const lossValue = this.calcLossValue(thisMonth);
    const lossValueLastMonth = this.calcLossValue(lastMonth);

    let lossChangePct: number | null = null;
    if (lossValueLastMonth > 0) {
      lossChangePct = Math.round(((lossValue - lossValueLastMonth) / lossValueLastMonth) * 100);
    } else if (lossValue > 0) {
      lossChangePct = 100; // dari 0 jadi ada kerugian
    } else {
      lossChangePct = 0;
    }

    // Akurasi = item cocok / item yang sudah dihitung (bulan ini)
    let matched = 0;
    let counted = 0;
    for (const s of thisMonth) {
      for (const it of s.items) {
        if (it.actualQty !== null) {
          counted += 1;
          if (it.variance === 0) matched += 1;
        }
      }
    }
    const accuracy = counted > 0 ? Math.round((matched / counted) * 1000) / 10 : null;

    return {
      month: `${year}-${String(mon + 1).padStart(2, '0')}`,
      lossValue,
      lossValueLastMonth,
      lossChangePct,
      accuracy, // persen (0-100) atau null jika belum ada hitungan
      sessionCount,
      lastOpnameAt: lastSession?.completedAt?.toISOString() || null,
      lastOpnameSession: lastSession?.sessionNumber || null,
    };
  }

  private calcLossValue(
    sessions: { items: { variance: number | null; product: { price: number } }[] }[],
  ): number {
    let total = 0;
    for (const s of sessions) {
      for (const it of s.items) {
        if (it.variance !== null && it.variance < 0) {
          total += Math.abs(it.variance) * (it.product?.price || 0);
        }
      }
    }
    return total;
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateSessionNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OPN-${dateStr}-${rand}`;
  }
}
