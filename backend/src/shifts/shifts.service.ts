import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { FinalizeShiftDto } from './dto/finalize-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { ShiftStatus } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // OPEN SHIFT
  // ============================================

  async openShift(dto: OpenShiftDto) {
    // Check if user already has an open shift
    const existing = await this.prisma.shift.findFirst({
      where: { userId: dto.userId, shopId: dto.shopId, status: ShiftStatus.OPEN },
    });

    if (existing) {
      throw new BadRequestException('Kasir ini masih punya shift aktif. Tutup shift dulu.');
    }

    const shift = await this.prisma.shift.create({
      data: {
        shopId: dto.shopId,
        userId: dto.userId,
        startTime: new Date(),
        expectedCash: 0,
        expectedQRIS: 0,
        status: ShiftStatus.OPEN,
      },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    return {
      success: true,
      message: 'Shift berhasil dibuka.',
      shift,
    };
  }

  // ============================================
  // CLOSE SHIFT (tutup, belum finalisasi)
  // ============================================

  async closeShift(shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });

    if (!shift) throw new NotFoundException('Shift tidak ditemukan.');
    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift sudah ditutup/difinalisasi.');
    }

    // Calculate expected totals from transactions during this shift
    const transactions = await this.prisma.payment.findMany({
      where: {
        shopId: shift.shopId,
        status: 'COMPLETED',
        createdAt: { gte: shift.startTime },
      },
    });

    const expectedCash = transactions
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    const expectedQRIS = transactions
      .filter((p) => p.method === 'QRIS')
      .reduce((sum, p) => sum + p.amount, 0);

    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.CLOSED,
        endTime: new Date(),
        expectedCash,
        expectedQRIS,
        notes: dto.notes || null,
      },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    return {
      success: true,
      message: 'Shift berhasil ditutup. Menunggu finalisasi admin.',
      shift: updated,
      summary: {
        duration: this.calculateDuration(shift.startTime, new Date()),
        expectedCash,
        expectedQRIS,
        totalExpected: expectedCash + expectedQRIS,
        totalTransactions: transactions.length,
      },
    };
  }

  // ============================================
  // FINALIZE SHIFT (Admin: hitung uang fisik)
  // ============================================

  async finalizeShift(shiftId: string, dto: FinalizeShiftDto, adminUser: any) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    if (!shift) throw new NotFoundException('Shift tidak ditemukan.');
    if (shift.status === ShiftStatus.FINALIZED) {
      throw new BadRequestException('Shift sudah difinalisasi.');
    }
    if (shift.status === ShiftStatus.OPEN) {
      throw new BadRequestException('Shift belum ditutup. Tutup shift terlebih dahulu.');
    }

    const cashVariance = dto.actualCash - shift.expectedCash;
    const qrisVariance = dto.actualQRIS - shift.expectedQRIS;
    const totalVariance = cashVariance + qrisVariance;

    const finalized = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.FINALIZED,
        actualCash: dto.actualCash,
        actualQRIS: dto.actualQRIS,
        variance: totalVariance,
        notes: dto.notes || shift.notes,
        finalizedAt: new Date(),
        finalizedBy: adminUser.username || adminUser.email,
      },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    return {
      success: true,
      message: totalVariance === 0
        ? 'Shift berhasil difinalisasi. Saldo COCOK!'
        : `Shift difinalisasi. ${totalVariance > 0 ? 'SURPLUS' : 'SELISIH'} Rp ${Math.abs(totalVariance).toLocaleString('id-ID')}`,
      shift: finalized,
      clerek: {
        kasir: shift.user,
        shiftStart: shift.startTime,
        shiftEnd: shift.endTime,
        expectedCash: shift.expectedCash,
        actualCash: dto.actualCash,
        cashVariance,
        expectedQRIS: shift.expectedQRIS,
        actualQRIS: dto.actualQRIS,
        qrisVariance,
        totalVariance,
        status: totalVariance === 0 ? 'MATCH' : totalVariance > 0 ? 'SURPLUS' : 'SELISIH',
        finalizedBy: adminUser.username || adminUser.email,
        finalizedAt: new Date(),
      },
    };
  }

  // ============================================
  // GET SHIFT BY ID (Detail)
  // ============================================

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, username: true } } },
    });

    if (!shift) throw new NotFoundException('Shift tidak ditemukan.');
    return shift;
  }

  // ============================================
  // LIST SHIFTS (with filters)
  // ============================================

  async findAll(query: QueryShiftDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (query.date) {
      const start = new Date(query.date);
      const end = new Date(query.date + 'T23:59:59.999Z');
      where.startTime = { gte: start, lte: end };
    }

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: { user: { select: { id: true, email: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      data: shifts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private calculateDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}j ${minutes}m`;
  }
}
