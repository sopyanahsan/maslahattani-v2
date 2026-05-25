import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftStatus, Role, PaymentMethod } from '@prisma/client';
import {
  OpenShiftDto,
  CloseShiftDto,
  QueryShiftDto,
  FinalizeShiftDto,
} from './dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Buka shift baru.
   * Validasi: user belum punya shift OPEN.
   */
  async openShift(userId: string, shopId: string, dto: OpenShiftDto) {
    // Check apakah user sudah punya shift OPEN
    const existingOpenShift = await this.prisma.shift.findFirst({
      where: {
        userId,
        shopId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpenShift) {
      throw new ConflictException(
        'Anda masih punya shift yang belum ditutup. Tutup shift dulu sebelum buka shift baru.',
      );
    }

    const shift = await this.prisma.shift.create({
      data: {
        userId,
        shopId,
        startTime: new Date(),
        expectedCash: 0, // akan diupdate saat ada transaksi
        expectedQRIS: 0,
        status: ShiftStatus.OPEN,
        notes: dto.notes || `Saldo kas awal: Rp ${dto.startingCash.toLocaleString('id-ID')}`,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      shift,
      message: 'Shift berhasil dibuka. Selamat bekerja!',
    };
  }

  /**
   * Tutup shift.
   * Hitung expected cash/QRIS dari transaksi dalam shift ini.
   * Hitung variance (selisih expected vs actual).
   */
  async closeShift(
    shiftId: string,
    userId: string,
    userRole: Role,
    dto: CloseShiftDto,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: true,
        shop: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan.');
    }

    // Hanya owner shift atau admin yang bisa tutup
    if (shift.userId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Anda tidak punya akses untuk tutup shift ini.');
    }

    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift ini sudah ditutup atau sudah difinalisasi.');
    }

    // Hitung expected cash & QRIS dari transaksi dalam shift ini
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: shift.userId,
        shopId: shift.shopId,
        status: 'COMPLETED',
        createdAt: {
          gte: shift.startTime,
          lte: new Date(),
        },
      },
      include: {
        payments: true,
      },
    });

    let expectedCash = 0;
    let expectedQRIS = 0;

    for (const trx of transactions) {
      for (const payment of trx.payments) {
        if (payment.method === PaymentMethod.CASH) {
          expectedCash += payment.amount;
        } else if (payment.method === PaymentMethod.QRIS) {
          expectedQRIS += payment.amount;
        }
        // TRANSFER & HUTANG tidak masuk ke expected cash/qris
      }
    }

    const variance = dto.actualCash - expectedCash;

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime: new Date(),
        expectedCash,
        actualCash: dto.actualCash,
        expectedQRIS,
        actualQRIS: dto.actualQRIS,
        variance,
        status: ShiftStatus.CLOSED,
        notes: dto.notes
          ? `${shift.notes || ''}\n\nCatatan tutup shift: ${dto.notes}`
          : shift.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      shift: updatedShift,
      summary: {
        expectedCash,
        actualCash: dto.actualCash,
        varianceCash: variance,
        expectedQRIS,
        actualQRIS: dto.actualQRIS,
        varianceQRIS: dto.actualQRIS - expectedQRIS,
        totalTransactions: transactions.length,
      },
      message:
        Math.abs(variance) > 10000
          ? `⚠️ Shift ditutup dengan variance Rp ${Math.abs(variance).toLocaleString('id-ID')}. Harap review oleh admin.`
          : 'Shift berhasil ditutup. Terima kasih atas kerja keras Anda!',
    };
  }

  /**
   * List shifts dengan filter.
   */
  async listShifts(
    query: QueryShiftDto,
    requestUserId: string,
    requestUserRole: Role,
    requestUserShopId: string | null,
  ) {
    const where: any = {};

    // Non-superadmin hanya bisa lihat shift di cabang mereka
    if (requestUserRole !== Role.SUPER_ADMIN) {
      where.shopId = requestUserShopId;
    }

    // Apply filters
    if (query.shopId) {
      where.shopId = query.shopId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999); // sampai akhir hari
        where.startTime.lte = endDate;
      }
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return {
      data: shifts,
      total: shifts.length,
    };
  }

  /**
   * Detail shift dengan list transaksi dalam shift.
   */
  async getShiftDetail(
    shiftId: string,
    requestUserId: string,
    requestUserRole: Role,
    requestUserShopId: string | null,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan.');
    }

    // Non-superadmin hanya bisa lihat shift di cabang mereka
    if (requestUserRole !== Role.SUPER_ADMIN && shift.shopId !== requestUserShopId) {
      throw new ForbiddenException('Anda tidak punya akses untuk melihat shift ini.');
    }

    // Get transactions dalam shift ini
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: shift.userId,
        shopId: shift.shopId,
        status: 'COMPLETED',
        createdAt: {
          gte: shift.startTime,
          ...(shift.endTime && { lte: shift.endTime }),
        },
      },
      include: {
        payments: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      shift,
      transactions: {
        data: transactions,
        total: transactions.length,
      },
    };
  }

  /**
   * Finalize shift (admin only).
   * Setelah difinalkan, shift tidak bisa diubah lagi.
   */
  async finalizeShift(
    shiftId: string,
    adminUserId: string,
    adminUsername: string,
    dto: FinalizeShiftDto,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan.');
    }

    if (shift.status !== ShiftStatus.CLOSED) {
      throw new BadRequestException(
        'Hanya shift yang sudah ditutup yang bisa difinalisasi.',
      );
    }

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.FINALIZED,
        finalizedAt: new Date(),
        finalizedBy: adminUsername,
        notes: dto.notes
          ? `${shift.notes || ''}\n\nCatatan finalisasi: ${dto.notes}`
          : shift.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      shift: updatedShift,
      message: 'Shift berhasil difinalisasi.',
    };
  }

  /**
   * Get current open shift for user (helper untuk kasir).
   */
  async getCurrentShift(userId: string, shopId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        userId,
        shopId,
        status: ShiftStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!shift) {
      return { shift: null, message: 'Belum ada shift aktif.' };
    }

    // Hitung transaksi dalam shift ini
    const transactionCount = await this.prisma.transaction.count({
      where: {
        userId,
        shopId,
        status: 'COMPLETED',
        createdAt: {
          gte: shift.startTime,
        },
      },
    });

    return {
      shift,
      transactionCount,
    };
  }
}
