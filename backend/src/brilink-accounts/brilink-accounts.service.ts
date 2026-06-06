import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrilinkAccountDto,
  UpdateBrilinkAccountDto,
  MutationActionDto,
  QueryAllMutationsDto,
} from './dto';

@Injectable()
export class BrilinkAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CRUD
  // ============================================

  async findAll(shopId: string) {
    return this.prisma.brilinkAccount.findMany({
      where: { shopId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.brilinkAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Rekening tidak ditemukan');
    return account;
  }

  async create(dto: CreateBrilinkAccountDto) {
    // If isDefault, unset other defaults in same shop
    if (dto.isDefault) {
      await this.prisma.brilinkAccount.updateMany({
        where: { shopId: dto.shopId, isDefault: true },
        data: { isDefault: false },
      });
    }

    try {
      return await this.prisma.brilinkAccount.create({
        data: {
          shopId: dto.shopId,
          label: dto.label,
          accountNumber: dto.accountNumber,
          accountHolder: dto.accountHolder,
          balance: dto.balance ?? 0,
          lowBalanceThreshold: dto.lowBalanceThreshold ?? 1000000,
          isDefault: dto.isDefault ?? false,
          notes: dto.notes,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Rekening dengan nomor "${dto.accountNumber}" sudah terdaftar di toko ini.`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateBrilinkAccountDto) {
    const account = await this.findOne(id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.brilinkAccount.updateMany({
        where: { shopId: account.shopId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    try {
      return await this.prisma.brilinkAccount.update({
        where: { id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.accountNumber !== undefined && {
            accountNumber: dto.accountNumber,
          }),
          ...(dto.accountHolder !== undefined && {
            accountHolder: dto.accountHolder,
          }),
          ...(dto.lowBalanceThreshold !== undefined && {
            lowBalanceThreshold: dto.lowBalanceThreshold,
          }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Rekening dengan nomor "${dto.accountNumber}" sudah terdaftar di toko ini.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete: set isActive = false
    return this.prisma.brilinkAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // SETOR / TARIK
  // ============================================

  async setor(id: string, dto: MutationActionDto, userId?: string) {
    const account = await this.findOne(id);

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + dto.amount;

    const [updatedAccount, mutation] = await this.prisma.$transaction([
      this.prisma.brilinkAccount.update({
        where: { id },
        data: { balance: balanceAfter },
      }),
      this.prisma.brilinkMutation.create({
        data: {
          accountId: id,
          type: 'SETOR',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          reference: dto.reference,
          description: `Setor saldo Rp ${dto.amount.toLocaleString('id-ID')}`,
          notes: dto.notes,
          createdById: userId,
        },
      }),
    ]);

    return { account: updatedAccount, mutation };
  }

  async tarik(id: string, dto: MutationActionDto, userId?: string) {
    const account = await this.findOne(id);

    if (account.balance < dto.amount) {
      throw new BadRequestException(
        `Saldo tidak cukup. Saldo saat ini: Rp ${account.balance.toLocaleString('id-ID')}`,
      );
    }

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - dto.amount;

    const [updatedAccount, mutation] = await this.prisma.$transaction([
      this.prisma.brilinkAccount.update({
        where: { id },
        data: { balance: balanceAfter },
      }),
      this.prisma.brilinkMutation.create({
        data: {
          accountId: id,
          type: 'TARIK',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          reference: dto.reference,
          description: `Tarik saldo Rp ${dto.amount.toLocaleString('id-ID')}`,
          notes: dto.notes,
          createdById: userId,
        },
      }),
    ]);

    return { account: updatedAccount, mutation };
  }

  // ============================================
  // TRANSFER INTERNAL (antar rekening)
  // ============================================

  async transferInternal(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes?: string,
    userId?: string,
  ) {
    if (fromAccountId === toAccountId) {
      throw new BadRequestException('Rekening asal dan tujuan tidak boleh sama.');
    }

    const fromAccount = await this.findOne(fromAccountId);
    const toAccount = await this.findOne(toAccountId);

    if (fromAccount.balance < amount) {
      throw new BadRequestException(
        `Saldo rekening "${fromAccount.label}" tidak cukup. Saldo: Rp ${fromAccount.balance.toLocaleString('id-ID')}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Debit from source
      const fromBefore = fromAccount.balance;
      const fromAfter = fromBefore - amount;

      await tx.brilinkAccount.update({
        where: { id: fromAccountId },
        data: { balance: fromAfter },
      });

      const fromMutation = await tx.brilinkMutation.create({
        data: {
          accountId: fromAccountId,
          type: 'TRANSFER_OUT',
          amount,
          balanceBefore: fromBefore,
          balanceAfter: fromAfter,
          reference: `TRANSFER-TO-${toAccount.label}`,
          description: `Pindah saldo ke ${toAccount.label} (${toAccount.accountNumber})`,
          notes: notes || null,
          createdById: userId || null,
        },
      });

      // Credit to destination
      const toBefore = toAccount.balance;
      const toAfter = toBefore + amount;

      await tx.brilinkAccount.update({
        where: { id: toAccountId },
        data: { balance: toAfter },
      });

      const toMutation = await tx.brilinkMutation.create({
        data: {
          accountId: toAccountId,
          type: 'TRANSFER_IN',
          amount,
          balanceBefore: toBefore,
          balanceAfter: toAfter,
          reference: `TRANSFER-FROM-${fromAccount.label}`,
          description: `Pindah saldo dari ${fromAccount.label} (${fromAccount.accountNumber})`,
          notes: notes || null,
          createdById: userId || null,
        },
      });

      return { fromMutation, toMutation, fromAfter, toAfter };
    });

    return {
      from: {
        accountId: fromAccountId,
        label: fromAccount.label,
        balanceAfter: result.fromAfter,
      },
      to: {
        accountId: toAccountId,
        label: toAccount.label,
        balanceAfter: result.toAfter,
      },
      amount,
      mutations: {
        from: result.fromMutation,
        to: result.toMutation,
      },
    };
  }

  // ============================================
  // MUTATIONS HISTORY
  // ============================================

  async getMutations(id: string, page: number, limit: number) {
    await this.findOne(id);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.brilinkMutation.findMany({
        where: { accountId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { username: true, email: true } },
        },
      }),
      this.prisma.brilinkMutation.count({ where: { accountId: id } }),
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
  // ALL MUTATIONS (cross-account, filterable)
  // ============================================

  async getAllMutations(dto: QueryAllMutationsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by shop: get all account IDs for the shop first
    const accountIds = await this.prisma.brilinkAccount.findMany({
      where: { shopId: dto.shopId },
      select: { id: true },
    });
    where.accountId = { in: accountIds.map((a) => a.id) };

    // Filter by specific account
    if (dto.accountId) {
      where.accountId = dto.accountId;
    }

    // Filter by mutation type
    if (dto.type) {
      where.type = dto.type;
    }

    // Filter by date range
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
      this.prisma.brilinkMutation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          account: { select: { id: true, label: true, accountNumber: true } },
          createdBy: { select: { username: true, email: true } },
        },
      }),
      this.prisma.brilinkMutation.count({ where }),
    ]);

    return {
      data: data.map((m) => ({
        id: m.id,
        accountId: m.accountId,
        accountLabel: m.account.label,
        accountNumber: m.account.accountNumber,
        type: m.type,
        amount: m.amount,
        balanceBefore: m.balanceBefore,
        balanceAfter: m.balanceAfter,
        reference: m.reference,
        description: m.description,
        notes: m.notes,
        createdBy: m.createdBy,
        createdAt: m.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
