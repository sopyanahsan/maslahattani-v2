import {
  BadRequestException,
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

    return this.prisma.brilinkAccount.create({
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

    return this.prisma.brilinkAccount.update({
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
