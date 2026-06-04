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
  JoinOpnameSessionDto,
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
          conductor: { select: { id: true, username: true, email: true } },
          items: { select: { actualQty: true } },
          _count: { select: { items: true, participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.opnameSession.count({ where }),
    ]);

    return {
      data: data.map((s) => {
        const countedItems = s.items.filter((i) => i.actualQty !== null).length;
        const allCounted = countedItems === s.items.length && s.items.length > 0;
        return {
          id: s.id,
          sessionNumber: s.sessionNumber,
          passcode: s.passcode,
          status: s.status,
          notes: s.notes,
          conductorId: s.conductorId,
          conductorName: s.conductor?.username || s.conductor?.email || '-',
          shopId: s.shopId,
          totalProducts: s.totalProducts,
          totalMatched: s.totalMatched,
          totalSurplus: s.totalSurplus,
          totalDeficit: s.totalDeficit,
          startedAt: s.startedAt?.toISOString() || null,
          completedAt: s.completedAt?.toISOString() || null,
          createdAt: s.createdAt.toISOString(),
          itemCount: s._count.items,
          countedItems,
          allCounted,
          participantCount: s._count.participants,
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // GET SESSION DETAIL (with items & participants)
  // ============================================

  async getSession(id: string) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { id },
      include: {
        conductor: { select: { id: true, username: true, email: true } },
        participants: {
          orderBy: { joinedAt: 'asc' },
        },
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
      passcode: session.passcode,
      status: session.status,
      notes: session.notes,
      conductorId: session.conductorId,
      conductorName: session.conductor?.username || session.conductor?.email || '-',
      shopId: session.shopId,
      totalProducts: session.totalProducts,
      totalMatched: session.totalMatched,
      totalSurplus: session.totalSurplus,
      totalDeficit: session.totalDeficit,
      startedAt: session.startedAt?.toISOString() || null,
      completedAt: session.completedAt?.toISOString() || null,
      createdAt: session.createdAt.toISOString(),
      participants: session.participants.map((p) => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
        deviceId: p.deviceId,
        joinedAt: p.joinedAt.toISOString(),
      })),
      items: session.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productPrice: item.product.price,
        systemQty: item.systemQty,
        actualQty: item.actualQty,
        variance: item.variance,
        notes: item.notes,
        countedById: item.countedById,
      })),
    };
  }

  // ============================================
  // CREATE SESSION (with passcode generation)
  // ============================================

  async createSession(dto: CreateOpnameSessionDto, conductorId: string) {
    const sessionNumber = this.generateSessionNumber();
    const passcode = await this.generateUniquePasscode();

    // Build stock query — filter by rackIds if provided (opname per rak)
    const stockWhere: any = { shopId: dto.shopId };
    if (dto.rackIds && dto.rackIds.length > 0) {
      stockWhere.rackId = { in: dto.rackIds };
    }

    // Get products with stock for this shop (optionally filtered by rack)
    const stocks = await this.prisma.stock.findMany({
      where: stockWhere,
      include: { product: { select: { id: true, deletedAt: true } } },
    });

    // Filter out deleted products
    const activeStocks = stocks.filter((s) => !s.product.deletedAt);

    if (activeStocks.length === 0) {
      throw new BadRequestException('Tidak ada produk dengan stok di toko ini.');
    }

    const session = await this.prisma.opnameSession.create({
      data: {
        shopId: dto.shopId,
        conductorId,
        sessionNumber,
        passcode,
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
        conductor: { select: { id: true, username: true, email: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      passcode: session.passcode,
      status: session.status,
      totalProducts: session.totalProducts,
      startedAt: session.startedAt?.toISOString(),
      itemCount: session._count.items,
    };
  }

  // ============================================
  // JOIN SESSION VIA PASSCODE (for webapp)
  // ============================================

  async joinSessionByPasscode(dto: JoinOpnameSessionDto) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { passcode: dto.passcode.toUpperCase() },
      include: {
        shop: { select: { id: true, name: true, address: true } },
        _count: { select: { items: true, participants: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Kode opname tidak ditemukan. Periksa kembali kode yang dimasukkan.');
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Sesi opname ini sudah selesai.');
    }

    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Sesi opname ini sudah dibatalkan.');
    }

    // Create participant record
    const participant = await this.prisma.opnameParticipant.create({
      data: {
        sessionId: session.id,
        name: dto.name,
        userId: dto.userId || null,
        deviceId: dto.deviceId || null,
      },
    });

    return {
      participant: {
        id: participant.id,
        name: participant.name,
        joinedAt: participant.joinedAt.toISOString(),
      },
      session: {
        id: session.id,
        sessionNumber: session.sessionNumber,
        status: session.status,
        shopName: session.shop.name,
        shopAddress: session.shop.address,
        totalProducts: session._count.items,
        participantCount: session._count.participants + 1,
        startedAt: session.startedAt?.toISOString() || null,
      },
    };
  }

  // ============================================
  // GET SESSION BY PASSCODE (public lookup)
  // ============================================

  async getSessionByPasscode(passcode: string) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { passcode: passcode.toUpperCase() },
      include: {
        shop: { select: { id: true, name: true, address: true } },
        _count: { select: { items: true, participants: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Kode opname tidak ditemukan.');
    }

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      passcode: session.passcode,
      status: session.status,
      shopName: session.shop.name,
      shopAddress: session.shop.address,
      totalProducts: session._count.items,
      participantCount: session._count.participants,
      startedAt: session.startedAt?.toISOString() || null,
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
        notes: dto.notes,
        countedById: dto.countedById || item.countedById,
      },
    });

    return {
      id: updated.id,
      productId: updated.productId,
      systemQty: updated.systemQty,
      actualQty: updated.actualQty,
      variance: updated.variance,
      notes: updated.notes,
      countedById: updated.countedById,
    };
  }

  // ============================================
  // COMPLETE SESSION
  // ============================================

  async completeSession(id: string, applyAdjustments: boolean = false) {
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
            await this.prisma.stockHistory.create({
              data: {
                stockId: stock.id,
                type: 'OPNAME',
                quantityBefore: item.systemQty,
                quantityAfter: item.actualQty,
                quantityChange: item.variance!,
                reference: session.id,
                notes: `Opname ${session.sessionNumber}: adjustment`,
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
  // MARK COUNTING COMPLETE (from webapp petugas)
  // ============================================

  async markCountingComplete(sessionId: string, participantId: string) {
    const session = await this.prisma.opnameSession.findUnique({
      where: { id: sessionId },
      include: {
        items: true,
        participants: true,
      },
    });

    if (!session) throw new NotFoundException('Sesi opname tidak ditemukan.');

    // Count progress
    const totalItems = session.items.length;
    const countedItems = session.items.filter((i) => i.actualQty !== null).length;
    const allCounted = countedItems === totalItems;

    // Update participant's completion status (optional: mark finishedAt)
    // For now we just return the status

    return {
      success: true,
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      participantId,
      progress: {
        total: totalItems,
        counted: countedItems,
        remaining: totalItems - countedItems,
        allCounted,
      },
      message: allCounted
        ? 'Semua produk sudah dihitung. Admin akan menerima notifikasi untuk review.'
        : `${countedItems}/${totalItems} produk sudah dihitung.`,
    };
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

  /**
   * Generate unique 6-character alphanumeric passcode.
   * Checks DB for uniqueness to avoid collision.
   */
  private async generateUniquePasscode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0/O/1/I to avoid confusion
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check uniqueness among active sessions
      const existing = await this.prisma.opnameSession.findUnique({
        where: { passcode: code },
      });

      if (!existing) return code;
      attempts++;
    }

    // Fallback: use timestamp-based code
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    return ts;
  }
}
