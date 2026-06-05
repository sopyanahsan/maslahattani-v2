import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CashBoxActionDto,
  QueryCashMutationsDto,
  UpdateCashBoxSettingsDto,
} from './dto';

@Injectable()
export class BrilinkCashboxService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GET OR CREATE CASHBOX
  // ============================================

  /**
   * Get or auto-create the BrilinkCashBox for a shop.
   * Each shop has exactly 1 kas tunai BRILink.
   */
  async getOrCreate(shopId: string) {
    let cashBox = await this.prisma.brilinkCashBox.findUnique({
      where: { shopId },
    });

    if (!cashBox) {
      cashBox = await this.prisma.brilinkCashBox.create({
        data: { shopId },
      });
    }

    return cashBox;
  }

  // ============================================
  // GET CASHBOX WITH RECENT MUTATIONS
  // ============================================

  async getCashBox(shopId: string) {
    const cashBox = await this.getOrCreate(shopId);

    const recentMutations = await this.prisma.brilinkCashMutation.findMany({
      where: { cashBoxId: cashBox.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      ...cashBox,
      isLowBalance: cashBox.balance < cashBox.lowBalanceThreshold,
      recentMutations,
    };
  }

  // ============================================
  // SETOR (TAMBAH MODAL KAS TUNAI)
  // ============================================

  async setor(shopId: string, dto: CashBoxActionDto, userId?: string) {
    const cashBox = await this.getOrCreate(shopId);

    const balanceBefore = cashBox.balance;
    const balanceAfter = balanceBefore + dto.amount;

    const [updatedCashBox, mutation] = await this.prisma.$transaction([
      this.prisma.brilinkCashBox.update({
        where: { id: cashBox.id },
        data: { balance: balanceAfter },
      }),
      this.prisma.brilinkCashMutation.create({
        data: {
          cashBoxId: cashBox.id,
          type: 'SETOR',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          description: `Tambah modal kas tunai Rp ${dto.amount.toLocaleString('id-ID')}`,
          notes: dto.notes,
          createdById: userId,
        },
      }),
    ]);

    return { cashBox: updatedCashBox, mutation };
  }

  // ============================================
  // TARIK (AMBIL TUNAI DARI KAS)
  // ============================================

  async tarik(shopId: string, dto: CashBoxActionDto, userId?: string) {
    const cashBox = await this.getOrCreate(shopId);

    if (cashBox.balance < dto.amount) {
      throw new BadRequestException(
        `Saldo kas tunai tidak cukup. Saldo saat ini: Rp ${cashBox.balance.toLocaleString('id-ID')}`,
      );
    }

    const balanceBefore = cashBox.balance;
    const balanceAfter = balanceBefore - dto.amount;

    const [updatedCashBox, mutation] = await this.prisma.$transaction([
      this.prisma.brilinkCashBox.update({
        where: { id: cashBox.id },
        data: { balance: balanceAfter },
      }),
      this.prisma.brilinkCashMutation.create({
        data: {
          cashBoxId: cashBox.id,
          type: 'TARIK',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          description: `Ambil tunai Rp ${dto.amount.toLocaleString('id-ID')}`,
          notes: dto.notes,
          createdById: userId,
        },
      }),
    ]);

    return { cashBox: updatedCashBox, mutation };
  }

  // ============================================
  // MUTATIONS LIST (paginated, filterable)
  // ============================================

  async getMutations(dto: QueryCashMutationsDto) {
    const cashBox = await this.getOrCreate(dto.shopId);
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { cashBoxId: cashBox.id };

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate + 'T00:00:00.000+07:00');
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate + 'T23:59:59.999+07:00');
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.brilinkCashMutation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkCashMutation.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // UPDATE SETTINGS
  // ============================================

  async updateSettings(shopId: string, dto: UpdateCashBoxSettingsDto) {
    const cashBox = await this.getOrCreate(shopId);

    return this.prisma.brilinkCashBox.update({
      where: { id: cashBox.id },
      data: {
        ...(dto.lowBalanceThreshold !== undefined && {
          lowBalanceThreshold: dto.lowBalanceThreshold,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }
}
