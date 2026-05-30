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
import {
  computeTotalFromDenominations,
  type CashDenominations,
} from './dto/close-shift.dto';

const SHIFT_INCLUDE = {
  user: {
    select: { id: true, email: true, username: true, role: true },
  },
  shop: {
    select: { id: true, name: true, address: true },
  },
  cashBoxes: {
    include: {
      category: {
        select: {
          id: true,
          code: true,
          name: true,
          color: true,
          icon: true,
          isDefault: true,
        },
      },
    },
    orderBy: { category: { sortOrder: 'asc' as const } },
  },
} as const;

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Buka shift baru. Untuk setiap kategori cashbox aktif:
   * - Buat row ShiftCashBox dengan startingCash dari input kasir
   * - Kategori yang tidak di-input → startingCash = 0
   *
   * Validasi: user belum punya shift OPEN.
   */
  async openShift(userId: string, shopId: string, dto: OpenShiftDto) {
    if (!shopId) {
      throw new BadRequestException(
        'Cabang belum dipilih. Pilih cabang dulu sebelum buka shift.',
      );
    }

    const existingOpenShift = await this.prisma.shift.findFirst({
      where: { userId, shopId, status: ShiftStatus.OPEN },
    });

    if (existingOpenShift) {
      throw new ConflictException(
        'Anda masih punya shift yang belum ditutup. Tutup shift dulu sebelum buka shift baru.',
      );
    }

    // "Wajib Tutup Shift Saat Ganti Kasir" (Pengaturan Sistem):
    // kalau toggle aktif, tolak buka shift selama ada shift kasir LAIN yang
    // masih OPEN di toko ini — shift sebelumnya wajib ditutup dulu (handover).
    const forceCloseSetting = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { shiftForceCloseOnSwitch: true },
    });
    if (forceCloseSetting?.shiftForceCloseOnSwitch ?? true) {
      const otherOpenShift = await this.prisma.shift.findFirst({
        where: { shopId, status: ShiftStatus.OPEN, userId: { not: userId } },
        include: { user: { select: { username: true, email: true } } },
      });
      if (otherOpenShift) {
        const owner =
          otherOpenShift.user.username ||
          otherOpenShift.user.email ||
          'kasir lain';
        throw new ConflictException(
          `Shift atas nama "${owner}" masih terbuka. Sesuai pengaturan toko, shift tersebut harus ditutup dulu sebelum ganti kasir.`,
        );
      }
    }

    // Ambil semua kategori aktif. Setiap shift baru wajib punya row untuk
    // semua kategori aktif (biar reporting & UI konsisten).
    const activeCategories = await this.prisma.cashBoxCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (activeCategories.length === 0) {
      throw new BadRequestException(
        'Belum ada kategori cashbox aktif. Hubungi super-admin untuk setup kategori.',
      );
    }

    // Validasi: semua categoryId di input harus exist & aktif
    const activeCategoryIds = new Set(activeCategories.map((c) => c.id));
    for (const entry of dto.startingCashByCategory) {
      if (!activeCategoryIds.has(entry.categoryId)) {
        throw new BadRequestException(
          `Kategori cashbox "${entry.categoryId}" tidak ditemukan atau tidak aktif.`,
        );
      }
    }

    // Map dari categoryId → startingCash dari input.
    const startingCashMap = new Map<string, number>(
      dto.startingCashByCategory.map((e) => [e.categoryId, e.startingCash]),
    );

    const shift = await this.prisma.shift.create({
      data: {
        userId,
        shopId,
        startTime: new Date(),
        status: ShiftStatus.OPEN,
        notes: dto.notes ?? null,
        cashBoxes: {
          create: activeCategories.map((cat) => ({
            categoryId: cat.id,
            startingCash: startingCashMap.get(cat.id) ?? 0,
            expectedCash: 0,
            expectedQRIS: 0,
          })),
        },
      },
      include: SHIFT_INCLUDE,
    });

    return {
      shift,
      message: 'Shift berhasil dibuka. Selamat bekerja!',
    };
  }

  /**
   * Tutup shift. Server hitung expectedCash/QRIS dari payments dalam shift,
   * lalu compute variance vs actual yang di-input kasir per kategori.
   *
   * variance = actualCash - (startingCash + expectedCash)
   *   → kalau positif: kelebihan (cash lebih dari ekspektasi)
   *   → kalau negatif: kekurangan (cash kurang dari ekspektasi)
   */
  async closeShift(
    shiftId: string,
    userId: string,
    userRole: Role,
    dto: CloseShiftDto,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: SHIFT_INCLUDE,
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan.');
    }

    // Hanya owner shift atau admin yang bisa tutup
    if (
      shift.userId !== userId &&
      userRole !== Role.SUPER_ADMIN &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Anda tidak punya akses untuk tutup shift ini.',
      );
    }

    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException(
        'Shift ini sudah ditutup atau sudah difinalisasi.',
      );
    }

    // Ambil semua transaksi COMPLETED dalam shift.
    // TODO (iterasi 2): kalau Transaction sudah punya cashBoxCategoryId,
    //   group payments per category. Untuk sekarang semua payment masuk ke
    //   default kategori (RETAIL) karena Transaction belum di-tag kategori.
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: shift.userId,
        shopId: shift.shopId,
        status: 'COMPLETED',
        createdAt: { gte: shift.startTime, lte: new Date() },
      },
      include: { payments: true },
    });

    // Identifikasi default category (RETAIL) — semua payment lama masuk sini
    // sampai POS implementasi ke-tag per kategori.
    const defaultCashBox = shift.cashBoxes.find((cb) => cb.category.isDefault);
    if (!defaultCashBox) {
      throw new BadRequestException(
        'Shift ini tidak punya kategori default. Data shift kemungkinan rusak.',
      );
    }

    // Reset expected nilai per kategori, lalu akumulasi dari transaksi.
    const expectedByCategory = new Map<
      string,
      { expectedCash: number; expectedQRIS: number }
    >();
    for (const cb of shift.cashBoxes) {
      expectedByCategory.set(cb.categoryId, {
        expectedCash: 0,
        expectedQRIS: 0,
      });
    }

    for (const trx of transactions) {
      // Sampai POS support kategori → semua transaksi default ke RETAIL.
      const targetCategoryId = defaultCashBox.categoryId;
      const bucket = expectedByCategory.get(targetCategoryId)!;

      for (const payment of trx.payments) {
        if (payment.method === PaymentMethod.CASH) {
          bucket.expectedCash += payment.amount;
        } else if (payment.method === PaymentMethod.QRIS) {
          bucket.expectedQRIS += payment.amount;
        }
        // TRANSFER & HUTANG tidak masuk ke expected cash/qris kasir
      }
    }

    // Validasi: actualByCategory harus mencakup semua cashBox di shift ini
    // (kalau gak, treat sebagai 0 — tapi log warning).
    const actualMap = new Map<
      string,
      {
        actualCash: number;
        actualQRIS?: number;
        denominations?: CashDenominations;
      }
    >(
      dto.actualByCategory.map((e) => [
        e.categoryId,
        {
          actualCash: e.actualCash,
          actualQRIS: e.actualQRIS,
          denominations: e.denominations,
        },
      ]),
    );

    // Validasi categoryId di input harus exist di shift
    const shiftCategoryIds = new Set(shift.cashBoxes.map((cb) => cb.categoryId));
    for (const [cid, entry] of actualMap) {
      if (!shiftCategoryIds.has(cid)) {
        throw new BadRequestException(
          `Kategori "${cid}" tidak ada di shift ini.`,
        );
      }

      // Kalau denominations di-pass, validate sum == actualCash.
      // Toleransi 0 — harus match exactly (kasir bisa cross-check pakai UI
      // calculator sebelum submit).
      if (entry.denominations) {
        const computed = computeTotalFromDenominations(entry.denominations);
        if (computed !== entry.actualCash) {
          throw new BadRequestException(
            `Total denominasi (Rp ${computed.toLocaleString('id-ID')}) tidak ` +
              `sama dengan actualCash (Rp ${entry.actualCash.toLocaleString('id-ID')}) ` +
              `untuk kategori "${cid}". Cek hitungan kasir.`,
          );
        }
      }
    }

    // Update setiap ShiftCashBox dalam transaction
    const updatedShift = await this.prisma.$transaction(async (tx) => {
      for (const cashBox of shift.cashBoxes) {
        const expected = expectedByCategory.get(cashBox.categoryId)!;
        const provided = actualMap.get(cashBox.categoryId);
        const actualCash = provided?.actualCash ?? 0;
        // QRIS bersifat elektronik → kalau kasir tidak input, rekonsiliasi
        // otomatis ke nilai expected (variance QRIS = 0).
        const actualQRIS = provided?.actualQRIS ?? expected.expectedQRIS;
        const denominations = provided?.denominations;

        // variance = actual - (starting + expected)
        const varianceCash =
          actualCash - (cashBox.startingCash + expected.expectedCash);
        const varianceQRIS = actualQRIS - expected.expectedQRIS;

        await tx.shiftCashBox.update({
          where: { id: cashBox.id },
          data: {
            expectedCash: expected.expectedCash,
            expectedQRIS: expected.expectedQRIS,
            actualCash,
            actualQRIS,
            varianceCash,
            varianceQRIS,
            cashDenominations: denominations ? (denominations as any) : null,
          },
        });
      }

      return tx.shift.update({
        where: { id: shiftId },
        data: {
          endTime: new Date(),
          status: ShiftStatus.CLOSED,
          notes: dto.notes
            ? `${shift.notes ? shift.notes + '\n\n' : ''}Catatan tutup shift: ${dto.notes}`
            : shift.notes,
        },
        include: SHIFT_INCLUDE,
      });
    });

    // Build summary per kategori untuk response UI
    const summary = updatedShift.cashBoxes.map((cb) => ({
      categoryId: cb.categoryId,
      categoryCode: cb.category.code,
      categoryName: cb.category.name,
      startingCash: cb.startingCash,
      expectedCash: cb.expectedCash,
      actualCash: cb.actualCash ?? 0,
      varianceCash: cb.varianceCash ?? 0,
      expectedQRIS: cb.expectedQRIS,
      actualQRIS: cb.actualQRIS ?? 0,
      varianceQRIS: cb.varianceQRIS ?? 0,
    }));

    const totalVariance = summary.reduce(
      (sum, s) => sum + Math.abs(s.varianceCash) + Math.abs(s.varianceQRIS),
      0,
    );

    return {
      shift: updatedShift,
      summary,
      totalTransactions: transactions.length,
      message:
        totalVariance > 10000
          ? `⚠️ Shift ditutup dengan total variance Rp ${totalVariance.toLocaleString('id-ID')}. Harap review oleh admin.`
          : 'Shift berhasil ditutup. Terima kasih atas kerja keras Anda!',
    };
  }

  /**
   * List shifts dengan filter. Non-superadmin scoped ke shopId mereka.
   */
  async listShifts(
    query: QueryShiftDto,
    requestUserRole: Role,
    requestUserShopId: string | null,
  ) {
    const where: any = {};

    // Non-superadmin hanya bisa lihat shift di cabang mereka
    if (requestUserRole !== Role.SUPER_ADMIN) {
      where.shopId = requestUserShopId;
    }

    if (query.shopId) where.shopId = query.shopId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.startTime.lte = endDate;
      }
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: SHIFT_INCLUDE,
      orderBy: { startTime: 'desc' },
    });

    return { data: shifts, total: shifts.length };
  }

  /**
   * Detail shift dengan list transaksi dalam shift.
   */
  async getShiftDetail(
    shiftId: string,
    requestUserRole: Role,
    requestUserShopId: string | null,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: SHIFT_INCLUDE,
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan.');
    }

    if (
      requestUserRole !== Role.SUPER_ADMIN &&
      shift.shopId !== requestUserShopId
    ) {
      throw new ForbiddenException(
        'Anda tidak punya akses untuk melihat shift ini.',
      );
    }

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
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      shift,
      transactions: { data: transactions, total: transactions.length },
    };
  }

  /**
   * Finalize shift (admin only). Setelah finalize, shift immutable.
   */
  async finalizeShift(
    shiftId: string,
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
          ? `${shift.notes ? shift.notes + '\n\n' : ''}Catatan finalisasi: ${dto.notes}`
          : shift.notes,
      },
      include: SHIFT_INCLUDE,
    });

    return {
      shift: updatedShift,
      message: 'Shift berhasil difinalisasi.',
    };
  }

  /**
   * Get current open shift untuk user. Helper buat kasir cek apakah ada
   * shift aktif sebelum mulai transaksi.
   */
  async getCurrentShift(userId: string, shopId: string | null) {
    if (!shopId) {
      return { shift: null, message: 'Cabang belum dipilih.' };
    }

    const shift = await this.prisma.shift.findFirst({
      where: { userId, shopId, status: ShiftStatus.OPEN },
      include: SHIFT_INCLUDE,
    });

    if (!shift) {
      return { shift: null, message: 'Belum ada shift aktif.' };
    }

    const transactionCount = await this.prisma.transaction.count({
      where: {
        userId,
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: shift.startTime },
      },
    });

    return { shift, transactionCount };
  }
}
