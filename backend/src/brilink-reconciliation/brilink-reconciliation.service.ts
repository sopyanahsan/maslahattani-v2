import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrilinkCashboxService } from '../brilink-cashbox/brilink-cashbox.service';
import {
  ReconcileDto,
  ReconciliationTarget,
  QueryReconciliationHistoryDto,
} from './dto';

@Injectable()
export class BrilinkReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashboxService: BrilinkCashboxService,
  ) {}

  /**
   * Reconcile: compare app balance vs real balance, create adjustment if needed.
   */
  async reconcile(dto: ReconcileDto, shopId: string, userId: string) {
    if (dto.target === ReconciliationTarget.ACCOUNT) {
      return this.reconcileAccount(dto, shopId, userId);
    } else {
      return this.reconcileCashBox(dto, shopId, userId);
    }
  }

  private async reconcileAccount(
    dto: ReconcileDto,
    shopId: string,
    userId: string,
  ) {
    const account = await this.prisma.brilinkAccount.findUnique({
      where: { id: dto.targetId },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan.');
    }

    const balanceApp = account.balance;
    const adjustment = dto.realBalance - balanceApp;
    const status = adjustment === 0 ? 'MATCHED' : 'ADJUSTED';

    // If there's an adjustment, update account balance + create mutation
    let mutation: any = null;
    if (adjustment !== 0) {
      const balanceAfter = dto.realBalance;

      await this.prisma.brilinkAccount.update({
        where: { id: dto.targetId },
        data: { balance: balanceAfter },
      });

      mutation = await this.prisma.brilinkMutation.create({
        data: {
          accountId: dto.targetId,
          type: 'ADJUSTMENT',
          amount: Math.abs(adjustment),
          balanceBefore: balanceApp,
          balanceAfter,
          reference: `RECON-${Date.now()}`,
          description: `Reconciliation: ${adjustment > 0 ? '+' : ''}${adjustment.toLocaleString('id-ID')}`,
          notes: dto.notes || null,
          createdById: userId,
        },
      });
    }

    // Record reconciliation
    const record = await this.prisma.brilinkReconciliation.create({
      data: {
        shopId,
        target: 'ACCOUNT',
        targetId: dto.targetId,
        targetLabel: account.label,
        balanceApp,
        balanceReal: dto.realBalance,
        adjustment,
        status,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    // Update lastAudit on account
    await this.prisma.brilinkAccount.update({
      where: { id: dto.targetId },
      data: { updatedAt: new Date() },
    });

    return {
      id: record.id,
      target: record.target,
      targetLabel: record.targetLabel,
      balanceApp,
      balanceReal: dto.realBalance,
      adjustment,
      status,
      mutation: mutation
        ? { type: mutation.type, amount: adjustment, balanceAfter: mutation.balanceAfter }
        : null,
    };
  }

  private async reconcileCashBox(
    dto: ReconcileDto,
    shopId: string,
    userId: string,
  ) {
    const cashBox = await this.cashboxService.getOrCreate(shopId);

    const balanceApp = cashBox.balance;
    const adjustment = dto.realBalance - balanceApp;
    const status = adjustment === 0 ? 'MATCHED' : 'ADJUSTED';

    // If there's an adjustment, update cashbox balance + create mutation
    let mutation: any = null;
    if (adjustment !== 0) {
      const balanceAfter = dto.realBalance;

      await this.prisma.brilinkCashBox.update({
        where: { id: cashBox.id },
        data: {
          balance: balanceAfter,
          lastAudit: new Date(),
          lastAuditBalance: balanceAfter,
        },
      });

      mutation = await this.prisma.brilinkCashMutation.create({
        data: {
          cashBoxId: cashBox.id,
          type: 'ADJUSTMENT',
          amount: Math.abs(adjustment),
          balanceBefore: balanceApp,
          balanceAfter,
          reference: `RECON-${Date.now()}`,
          description: `Reconciliation: ${adjustment > 0 ? '+' : ''}${adjustment.toLocaleString('id-ID')}`,
          notes: dto.notes || null,
          createdById: userId,
        },
      });
    } else {
      // Even if matched, update lastAudit
      await this.prisma.brilinkCashBox.update({
        where: { id: cashBox.id },
        data: {
          lastAudit: new Date(),
          lastAuditBalance: balanceApp,
        },
      });
    }

    // Record reconciliation
    const record = await this.prisma.brilinkReconciliation.create({
      data: {
        shopId,
        target: 'CASHBOX',
        targetId: cashBox.id,
        targetLabel: 'Kas Tunai BRILink',
        balanceApp,
        balanceReal: dto.realBalance,
        adjustment,
        status,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    return {
      id: record.id,
      target: record.target,
      targetLabel: record.targetLabel,
      balanceApp,
      balanceReal: dto.realBalance,
      adjustment,
      status,
      mutation: mutation
        ? { type: 'ADJUSTMENT', amount: adjustment, balanceAfter: mutation.balanceAfter }
        : null,
    };
  }

  /**
   * Get reconciliation history for a shop.
   */
  async getHistory(dto: QueryReconciliationHistoryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { shopId: dto.shopId };

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
      this.prisma.brilinkReconciliation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkReconciliation.count({ where }),
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
}
