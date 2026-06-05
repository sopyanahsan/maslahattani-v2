import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrilinkCashboxService } from '../brilink-cashbox/brilink-cashbox.service';
import {
  CreateBrilinkTransactionDto,
  BrilinkCategoryEnum,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
  QueryBrilinkTransactionsDto,
} from './dto';

@Injectable()
export class BrilinkService {
  constructor(
    private prisma: PrismaService,
    private cashboxService: BrilinkCashboxService,
  ) {}

  // ============================================
  // IMPACT CALCULATION
  // ============================================

  /**
   * Calculate the dual-impact of a BRILink transaction.
   * - DEBIT: saldo rekening berkurang, kas tunai bertambah (6 kategori)
   * - CREDIT: saldo rekening bertambah, kas tunai berkurang (TARIK_TUNAI only)
   */
  private calculateImpact(
    category: BrilinkCategoryEnum,
    amount: number,
    fee: number,
  ) {
    if (category === BrilinkCategoryEnum.TARIK_TUNAI) {
      return {
        flowDirection: 'CREDIT',
        accountImpact: +amount, // saldo rek bertambah
        cashImpact: -(amount - fee), // kas tunai berkurang (net: keluar amount, terima fee)
      };
    } else {
      return {
        flowDirection: 'DEBIT',
        accountImpact: -amount, // saldo rek berkurang
        cashImpact: +(amount + fee), // kas tunai bertambah (nasabah bayar nominal + fee)
      };
    }
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  async listTransactions(query: QueryBrilinkTransactionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.shopId) where.shopId = query.shopId;
    if (query.category) where.category = query.category;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate)
        where.createdAt.gte = new Date(query.startDate + 'T00:00:00.000+07:00');
      if (query.endDate)
        where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999+07:00');
    }

    const [data, total] = await Promise.all([
      this.prisma.brilinkTransaction.findMany({
        where,
        include: {
          cashier: {
            select: { id: true, username: true, email: true },
          },
          account: {
            select: { id: true, label: true, accountNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.brilinkTransaction.count({ where }),
    ]);

    return {
      data: data.map((trx) => ({
        id: trx.id,
        refNumber: trx.refNumber,
        category: trx.category,
        customerName: trx.customerName,
        customerPhone: trx.customerPhone,
        destination: trx.destination,
        amount: trx.amount,
        fee: trx.fee,
        total: trx.total,
        status: trx.status,
        flowDirection: trx.flowDirection,
        accountImpact: trx.accountImpact,
        cashImpact: trx.cashImpact,
        shopId: trx.shopId,
        cashierId: trx.cashierId,
        cashierName: trx.cashier?.username || trx.cashier?.email || '-',
        accountId: trx.accountId,
        accountLabel: trx.account?.label || null,
        voidedAt: trx.voidedAt?.toISOString() || null,
        voidReason: trx.voidReason,
        createdAt: trx.createdAt.toISOString(),
        updatedAt: trx.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a BRILink transaction with full dual-impact:
   * 1. Calculate fee from rules
   * 2. Determine flow direction & impact
   * 3. Update BrilinkAccount (rekening) balance + mutation
   * 4. Update BrilinkCashBox (kas tunai) balance + mutation
   * 5. Insert transaction record
   * All in a single Prisma interactive transaction.
   */
  async createTransaction(
    dto: CreateBrilinkTransactionDto,
    shopId: string,
    cashierId: string,
  ) {
    // 0. Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.prisma.brilinkTransaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        // Return existing record (dedup)
        return {
          id: existing.id,
          deduplicated: true,
          summary: {
            refNumber: existing.refNumber,
            category: existing.category,
            amount: existing.amount,
            fee: existing.fee,
            total: existing.total,
            status: existing.status,
          },
        };
      }
    }

    // 1. Calculate fee from matching fee rules
    const feeRules = await this.prisma.brilinkFee.findMany({
      where: {
        shopId,
        category: dto.category,
        isActive: true,
      },
    });

    let fee = 0;
    const matchingRule = feeRules.find(
      (rule) => dto.amount >= rule.minAmount && dto.amount <= rule.maxAmount,
    );

    if (matchingRule) {
      if (matchingRule.feeType === 'FLAT') {
        fee = matchingRule.feeAmount;
      } else {
        fee = Math.round((dto.amount * matchingRule.feePercent) / 100);
      }
    }

    const total = dto.amount + fee;
    const refNumber = this.generateRefNumber();

    // 2. Calculate impact
    const impact = this.calculateImpact(dto.category, dto.amount, fee);

    // 3. Get account and cashbox
    const account = await this.prisma.brilinkAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException('Rekening BRI tidak ditemukan.');
    }
    if (!account.isActive) {
      throw new BadRequestException('Rekening BRI sudah tidak aktif.');
    }

    const cashBox = await this.cashboxService.getOrCreate(shopId);

    // 4. Validate kas tunai for TARIK_TUNAI (cash going out)
    if (
      impact.flowDirection === 'CREDIT' &&
      Math.abs(impact.cashImpact) > cashBox.balance
    ) {
      // Warning only — don't block (configurable, but default allow)
      // In production this could be a soft warning returned to client
    }

    // 5. Execute all in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 5a. Update account balance
      const accountBalanceBefore = account.balance;
      const accountBalanceAfter = accountBalanceBefore + impact.accountImpact;

      const updatedAccount = await tx.brilinkAccount.update({
        where: { id: dto.accountId },
        data: { balance: accountBalanceAfter },
      });

      // 5b. Create account mutation
      const accountMutation = await tx.brilinkMutation.create({
        data: {
          accountId: dto.accountId,
          type:
            impact.flowDirection === 'DEBIT' ? 'TRX_DEBIT' : 'TRX_CREDIT',
          amount: dto.amount,
          balanceBefore: accountBalanceBefore,
          balanceAfter: accountBalanceAfter,
          reference: refNumber,
          description: `${dto.category} - ${dto.customerName} (${dto.destination})`,
          createdById: cashierId,
        },
      });

      // 5c. Update cash box balance
      const cashBalanceBefore = cashBox.balance;
      const cashBalanceAfter = cashBalanceBefore + impact.cashImpact;

      await tx.brilinkCashBox.update({
        where: { id: cashBox.id },
        data: { balance: cashBalanceAfter },
      });

      // 5d. Create cash mutation
      const cashMutationType =
        impact.cashImpact >= 0 ? 'TRX_IN' : 'TRX_OUT';
      const cashMutationAmount = Math.abs(impact.cashImpact);

      const cashMutation = await tx.brilinkCashMutation.create({
        data: {
          cashBoxId: cashBox.id,
          type: cashMutationType,
          amount: cashMutationAmount,
          balanceBefore: cashBalanceBefore,
          balanceAfter: cashBalanceAfter,
          reference: refNumber,
          description: `${dto.category} - ${dto.customerName}`,
          createdById: cashierId,
        },
      });

      // 5e. Create transaction record
      const transaction = await tx.brilinkTransaction.create({
        data: {
          shopId,
          cashierId,
          accountId: dto.accountId,
          refNumber,
          category: dto.category,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          destination: dto.destination,
          amount: dto.amount,
          fee,
          total,
          status: 'SUCCESS',
          flowDirection: impact.flowDirection,
          accountImpact: impact.accountImpact,
          cashImpact: impact.cashImpact,
          idempotencyKey: dto.idempotencyKey || null,
          clientCreatedAt: dto.clientCreatedAt
            ? new Date(dto.clientCreatedAt)
            : null,
          cashMutationId: cashMutation.id,
        },
      });

      return {
        transaction,
        accountMutation,
        cashMutation,
        accountBalanceAfter,
        cashBalanceAfter,
      };
    });

    return {
      id: result.transaction.id,
      deduplicated: false,
      summary: {
        refNumber: result.transaction.refNumber,
        category: result.transaction.category,
        customerName: result.transaction.customerName,
        destination: result.transaction.destination,
        amount: result.transaction.amount,
        fee: result.transaction.fee,
        total: result.transaction.total,
        status: result.transaction.status,
        flowDirection: result.transaction.flowDirection,
      },
      impact: {
        account: {
          id: dto.accountId,
          label: account.label,
          impact: impact.accountImpact,
          balanceAfter: result.accountBalanceAfter,
        },
        cashBox: {
          impact: impact.cashImpact,
          balanceAfter: result.cashBalanceAfter,
        },
      },
    };
  }

  // ============================================
  // VOID TRANSACTION
  // ============================================

  async voidTransaction(transactionId: string, reason: string, userId: string) {
    const transaction = await this.prisma.brilinkTransaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan.');
    }

    if (transaction.status !== 'SUCCESS') {
      throw new BadRequestException(
        `Hanya transaksi SUCCESS yang bisa di-void. Status saat ini: ${transaction.status}`,
      );
    }

    // Calculate reversals (opposite of original impact)
    const accountReversal = -(transaction.accountImpact || 0);
    const cashReversal = -(transaction.cashImpact || 0);

    const cashBox = await this.cashboxService.getOrCreate(transaction.shopId);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Reverse account balance
      let accountMutation = null;
      if (transaction.accountId && accountReversal !== 0) {
        const account = await tx.brilinkAccount.findUnique({
          where: { id: transaction.accountId },
        });

        if (account) {
          const accBalanceBefore = account.balance;
          const accBalanceAfter = accBalanceBefore + accountReversal;

          await tx.brilinkAccount.update({
            where: { id: transaction.accountId },
            data: { balance: accBalanceAfter },
          });

          accountMutation = await tx.brilinkMutation.create({
            data: {
              accountId: transaction.accountId,
              type: 'ADJUSTMENT',
              amount: Math.abs(accountReversal),
              balanceBefore: accBalanceBefore,
              balanceAfter: accBalanceAfter,
              reference: transaction.refNumber,
              description: `VOID: ${transaction.category} - ${transaction.customerName}`,
              notes: `Void reason: ${reason}`,
              createdById: userId,
            },
          });
        }
      }

      // 2. Reverse cash box balance
      let cashMutation = null;
      if (cashReversal !== 0) {
        const cashBalanceBefore = cashBox.balance;
        const cashBalanceAfter = cashBalanceBefore + cashReversal;

        await tx.brilinkCashBox.update({
          where: { id: cashBox.id },
          data: { balance: cashBalanceAfter },
        });

        cashMutation = await tx.brilinkCashMutation.create({
          data: {
            cashBoxId: cashBox.id,
            type: 'VOID_REVERSE',
            amount: Math.abs(cashReversal),
            balanceBefore: cashBalanceBefore,
            balanceAfter: cashBalanceAfter,
            reference: transaction.refNumber,
            description: `VOID: ${transaction.category} - ${transaction.customerName}`,
            notes: `Void reason: ${reason}`,
            createdById: userId,
          },
        });
      }

      // 3. Update transaction status
      const voidedTransaction = await tx.brilinkTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedBy: userId,
          voidReason: reason,
        },
      });

      return { voidedTransaction, accountMutation, cashMutation };
    });

    return {
      transaction: {
        id: result.voidedTransaction.id,
        refNumber: result.voidedTransaction.refNumber,
        status: result.voidedTransaction.status,
        voidedAt: result.voidedTransaction.voidedAt?.toISOString(),
        voidReason: result.voidedTransaction.voidReason,
      },
      reversals: {
        accountMutation: result.accountMutation
          ? {
              type: result.accountMutation.type,
              amount: accountReversal,
              balanceAfter: result.accountMutation.balanceAfter,
            }
          : null,
        cashMutation: result.cashMutation
          ? {
              type: result.cashMutation.type,
              amount: cashReversal,
              balanceAfter: result.cashMutation.balanceAfter,
            }
          : null,
      },
    };
  }

  // ============================================
  // KPI
  // ============================================

  async getKpi(shopId: string) {
    // Get today range (WIB)
    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const jakarta = new Date(now.getTime() + jakartaOffset);
    jakarta.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(jakarta.getTime() - jakartaOffset);
    const jakartaEnd = new Date(now.getTime() + jakartaOffset);
    jakartaEnd.setUTCHours(23, 59, 59, 999);
    const todayEnd = new Date(jakartaEnd.getTime() - jakartaOffset);

    // Get today's aggregate
    const todayAgg = await this.prisma.brilinkTransaction.aggregate({
      where: {
        shopId,
        status: 'SUCCESS',
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      _count: true,
      _sum: { amount: true, fee: true },
    });

    // Get KPI targets from settings
    const setting = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { brilinkKpiConfig: true },
    });

    const kpiConfig = (setting?.brilinkKpiConfig as any) || {};
    const targets = {
      dailyTransactionTarget: kpiConfig.dailyTransactionTarget || 50,
      dailyVolumeTarget: kpiConfig.dailyVolumeTarget || 50000000,
      dailyFeeTarget: kpiConfig.dailyFeeTarget || 500000,
    };

    const currentTransactions = todayAgg._count || 0;
    const currentVolume = todayAgg._sum.amount || 0;
    const currentFee = todayAgg._sum.fee || 0;

    const trxPercent = Math.min(
      Math.round((currentTransactions / targets.dailyTransactionTarget) * 100),
      100,
    );
    const volumePercent = Math.min(
      Math.round((currentVolume / targets.dailyVolumeTarget) * 100),
      100,
    );
    const feePercent = Math.min(
      Math.round((currentFee / targets.dailyFeeTarget) * 100),
      100,
    );
    const achievement = Math.round((trxPercent + volumePercent + feePercent) / 3);

    return {
      transactions: {
        current: currentTransactions,
        target: targets.dailyTransactionTarget,
        percent: trxPercent,
      },
      volume: {
        current: currentVolume,
        target: targets.dailyVolumeTarget,
        percent: volumePercent,
      },
      fee: {
        current: currentFee,
        target: targets.dailyFeeTarget,
        percent: feePercent,
      },
      achievement,
    };
  }

  // ============================================
  // SYNC (batch offline transactions)
  // ============================================

  async syncTransactions(
    transactions: Array<{
      category: BrilinkCategoryEnum;
      customerName: string;
      customerPhone?: string;
      destination: string;
      amount: number;
      accountId: string;
      idempotencyKey: string;
      clientCreatedAt?: string;
      status: 'SUCCESS' | 'FAILED';
      voidReason?: string;
    }>,
    shopId: string,
    cashierId: string,
  ) {
    const synced: any[] = [];
    const conflicts: any[] = [];

    for (const trx of transactions) {
      try {
        if (trx.status === 'FAILED') {
          // For FAILED transactions, just record them without impacting balances
          const existing = trx.idempotencyKey
            ? await this.prisma.brilinkTransaction.findUnique({
                where: { idempotencyKey: trx.idempotencyKey },
              })
            : null;

          if (existing) {
            conflicts.push({
              idempotencyKey: trx.idempotencyKey,
              reason: 'already_exists',
              existingId: existing.id,
            });
            continue;
          }

          const refNumber = this.generateRefNumber();
          const impact = this.calculateImpact(
            trx.category,
            trx.amount,
            0,
          );

          const failed = await this.prisma.brilinkTransaction.create({
            data: {
              shopId,
              cashierId,
              accountId: trx.accountId,
              refNumber,
              category: trx.category,
              customerName: trx.customerName,
              customerPhone: trx.customerPhone,
              destination: trx.destination,
              amount: trx.amount,
              fee: 0,
              total: trx.amount,
              status: 'FAILED',
              flowDirection: impact.flowDirection,
              accountImpact: 0,
              cashImpact: 0,
              idempotencyKey: trx.idempotencyKey,
              clientCreatedAt: trx.clientCreatedAt
                ? new Date(trx.clientCreatedAt)
                : null,
              voidReason: trx.voidReason || null,
            },
          });

          synced.push({ id: failed.id, status: 'FAILED', idempotencyKey: trx.idempotencyKey });
        } else {
          // SUCCESS — full dual-impact
          const result = await this.createTransaction(
            {
              category: trx.category,
              customerName: trx.customerName,
              customerPhone: trx.customerPhone,
              destination: trx.destination,
              amount: trx.amount,
              accountId: trx.accountId,
              idempotencyKey: trx.idempotencyKey,
              clientCreatedAt: trx.clientCreatedAt,
            },
            shopId,
            cashierId,
          );

          synced.push({
            id: result.id,
            status: 'SUCCESS',
            deduplicated: result.deduplicated,
            idempotencyKey: trx.idempotencyKey,
          });
        }
      } catch (error: any) {
        conflicts.push({
          idempotencyKey: trx.idempotencyKey,
          reason: error.message || 'unknown_error',
        });
      }
    }

    return { synced, conflicts, total: transactions.length };
  }

  // ============================================
  // CHART (transactions stacked / profit line)
  // ============================================

  async getTransactionsChart(
    shopId: string,
    period: string,
    type: string,
    startDate?: string,
    endDate?: string,
  ) {
    const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
    const BRILINK_CATEGORIES = [
      'TRANSFER_BRI',
      'TRANSFER_OTHER',
      'TARIK_TUNAI',
      'TOPUP_PULSA',
      'TOPUP_DATA',
      'TOPUP_EWALLET',
      'TOPUP_PLN',
    ] as const;

    // Determine date range
    const now = new Date();
    let start: Date;
    let end: Date;

    const jakartaNow = new Date(now.getTime() + JAKARTA_OFFSET_MS);
    const todayStartJakarta = new Date(jakartaNow);
    todayStartJakarta.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(todayStartJakarta.getTime() - JAKARTA_OFFSET_MS);

    const todayEndJakarta = new Date(jakartaNow);
    todayEndJakarta.setUTCHours(23, 59, 59, 999);
    const todayEnd = new Date(todayEndJakarta.getTime() - JAKARTA_OFFSET_MS);

    switch (period) {
      case 'today':
        start = todayStart;
        end = todayEnd;
        break;
      case '7d':
        start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 6);
        end = todayEnd;
        break;
      case '1m':
        start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 29);
        end = todayEnd;
        break;
      case '3m':
        start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 89);
        end = todayEnd;
        break;
      case 'custom':
        if (!startDate || !endDate) {
          start = new Date(todayStart);
          start.setUTCDate(start.getUTCDate() - 6);
          end = todayEnd;
        } else {
          start = new Date(startDate + 'T00:00:00.000+07:00');
          end = new Date(endDate + 'T23:59:59.999+07:00');
        }
        break;
      default:
        start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 6);
        end = todayEnd;
    }

    // Determine bucket type
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const bucketType =
      period === 'today' ? 'hourly' : diffDays > 60 ? 'weekly' : 'daily';

    if (type === 'profit') {
      return this.getProfitChart(shopId, start, end, bucketType, JAKARTA_OFFSET_MS);
    }

    // Default: transactions stacked chart
    return this.getTransactionsStackedChart(
      shopId,
      start,
      end,
      bucketType,
      BRILINK_CATEGORIES,
      JAKARTA_OFFSET_MS,
    );
  }

  private async getTransactionsStackedChart(
    shopId: string,
    start: Date,
    end: Date,
    bucketType: string,
    categories: readonly string[],
    JAKARTA_OFFSET_MS: number,
  ) {
    if (bucketType === 'hourly') {
      const results: Array<{
        hour: number;
        category: string;
        count: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'Asia/Jakarta'))::int as hour,
          "category",
          COUNT(*)::bigint as count
        FROM "brilink_transactions"
        WHERE "shopId" = $1
          AND "status" = 'SUCCESS'
          AND "createdAt" >= $2
          AND "createdAt" <= $3
        GROUP BY hour, "category"
        ORDER BY hour ASC
        `,
        shopId,
        start,
        end,
      );

      const labels: string[] = [];
      const datasets: Record<string, number[]> = {};
      for (const cat of categories) datasets[cat] = [];

      const map = new Map<string, number>();
      for (const r of results) map.set(`${r.hour}-${r.category}`, Number(r.count));

      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        for (const cat of categories) {
          datasets[cat].push(map.get(`${h}-${cat}`) ?? 0);
        }
      }

      return { labels, datasets, bucketType };
    }

    if (bucketType === 'weekly') {
      const results: Array<{
        week_label: string;
        category: string;
        count: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          TO_CHAR(DATE_TRUNC('week', ("createdAt" AT TIME ZONE 'Asia/Jakarta')::date), 'YYYY-MM-DD') as week_label,
          "category",
          COUNT(*)::bigint as count
        FROM "brilink_transactions"
        WHERE "shopId" = $1
          AND "status" = 'SUCCESS'
          AND "createdAt" >= $2
          AND "createdAt" <= $3
        GROUP BY week_label, "category"
        ORDER BY week_label ASC
        `,
        shopId,
        start,
        end,
      );

      const map = new Map<string, number>();
      for (const r of results) map.set(`${r.week_label}-${r.category}`, Number(r.count));

      // Generate week labels
      const labels: string[] = [];
      const datasets: Record<string, number[]> = {};
      for (const cat of categories) datasets[cat] = [];

      const cursor = new Date(start);
      // Align to Monday
      const cursorJakarta = new Date(cursor.getTime() + JAKARTA_OFFSET_MS);
      const dayOfWeek = cursorJakarta.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      cursorJakarta.setUTCDate(cursorJakarta.getUTCDate() + mondayOffset);
      cursorJakarta.setUTCHours(0, 0, 0, 0);

      while (cursorJakarta.getTime() - JAKARTA_OFFSET_MS <= end.getTime()) {
        const label = cursorJakarta.toISOString().slice(0, 10);
        labels.push(label);
        for (const cat of categories) {
          datasets[cat].push(map.get(`${label}-${cat}`) ?? 0);
        }
        cursorJakarta.setUTCDate(cursorJakarta.getUTCDate() + 7);
      }

      return { labels, datasets, bucketType };
    }

    // Daily buckets
    const results: Array<{
      day_label: string;
      category: string;
      count: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') as day_label,
        "category",
        COUNT(*)::bigint as count
      FROM "brilink_transactions"
      WHERE "shopId" = $1
        AND "status" = 'SUCCESS'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY day_label, "category"
      ORDER BY day_label ASC
      `,
      shopId,
      start,
      end,
    );

    const map = new Map<string, number>();
    for (const r of results) map.set(`${r.day_label}-${r.category}`, Number(r.count));

    const labels: string[] = [];
    const datasets: Record<string, number[]> = {};
    for (const cat of categories) datasets[cat] = [];

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i < diffDays; i++) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + i);
      const j = new Date(day.getTime() + JAKARTA_OFFSET_MS);
      const label = j.toISOString().slice(0, 10);
      labels.push(label);
      for (const cat of categories) {
        datasets[cat].push(map.get(`${label}-${cat}`) ?? 0);
      }
    }

    return { labels, datasets, bucketType };
  }

  private async getProfitChart(
    shopId: string,
    start: Date,
    end: Date,
    bucketType: string,
    JAKARTA_OFFSET_MS: number,
  ) {
    if (bucketType === 'hourly') {
      const results: Array<{
        hour: number;
        total_fee: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'Asia/Jakarta'))::int as hour,
          COALESCE(SUM("fee"), 0)::bigint as total_fee
        FROM "brilink_transactions"
        WHERE "shopId" = $1
          AND "status" = 'SUCCESS'
          AND "createdAt" >= $2
          AND "createdAt" <= $3
        GROUP BY hour
        ORDER BY hour ASC
        `,
        shopId,
        start,
        end,
      );

      const map = new Map<number, number>();
      for (const r of results) map.set(r.hour, Number(r.total_fee));

      const labels: string[] = [];
      const data: number[] = [];
      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        data.push(map.get(h) ?? 0);
      }

      return { labels, data, bucketType };
    }

    if (bucketType === 'weekly') {
      const results: Array<{
        week_label: string;
        total_fee: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          TO_CHAR(DATE_TRUNC('week', ("createdAt" AT TIME ZONE 'Asia/Jakarta')::date), 'YYYY-MM-DD') as week_label,
          COALESCE(SUM("fee"), 0)::bigint as total_fee
        FROM "brilink_transactions"
        WHERE "shopId" = $1
          AND "status" = 'SUCCESS'
          AND "createdAt" >= $2
          AND "createdAt" <= $3
        GROUP BY week_label
        ORDER BY week_label ASC
        `,
        shopId,
        start,
        end,
      );

      const map = new Map<string, number>();
      for (const r of results) map.set(r.week_label, Number(r.total_fee));

      const labels: string[] = [];
      const data: number[] = [];

      const cursor = new Date(start);
      const cursorJakarta = new Date(cursor.getTime() + JAKARTA_OFFSET_MS);
      const dayOfWeek = cursorJakarta.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      cursorJakarta.setUTCDate(cursorJakarta.getUTCDate() + mondayOffset);
      cursorJakarta.setUTCHours(0, 0, 0, 0);

      while (cursorJakarta.getTime() - JAKARTA_OFFSET_MS <= end.getTime()) {
        const label = cursorJakarta.toISOString().slice(0, 10);
        labels.push(label);
        data.push(map.get(label) ?? 0);
        cursorJakarta.setUTCDate(cursorJakarta.getUTCDate() + 7);
      }

      return { labels, data, bucketType };
    }

    // Daily
    const results: Array<{
      day_label: string;
      total_fee: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') as day_label,
        COALESCE(SUM("fee"), 0)::bigint as total_fee
      FROM "brilink_transactions"
      WHERE "shopId" = $1
        AND "status" = 'SUCCESS'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY day_label
      ORDER BY day_label ASC
      `,
      shopId,
      start,
      end,
    );

    const map = new Map<string, number>();
    for (const r of results) map.set(r.day_label, Number(r.total_fee));

    const labels: string[] = [];
    const data: number[] = [];
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < diffDays; i++) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + i);
      const j = new Date(day.getTime() + JAKARTA_OFFSET_MS);
      const label = j.toISOString().slice(0, 10);
      labels.push(label);
      data.push(map.get(label) ?? 0);
    }

    return { labels, data, bucketType };
  }

  // ============================================
  // STATS
  // ============================================

  async getStats(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allTimeAgg, todayAgg, byCategory] = await Promise.all([
      this.prisma.brilinkTransaction.aggregate({
        where: { shopId, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
      this.prisma.brilinkTransaction.aggregate({
        where: {
          shopId,
          status: 'SUCCESS',
          createdAt: { gte: today },
        },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
      this.prisma.brilinkTransaction.groupBy({
        by: ['category'],
        where: { shopId, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true, fee: true },
      }),
    ]);

    return {
      totalTransactions: allTimeAgg._count,
      totalAmount: allTimeAgg._sum.amount || 0,
      totalFee: allTimeAgg._sum.fee || 0,
      byCategory: byCategory.map((cat) => ({
        category: cat.category,
        count: cat._count,
        amount: cat._sum.amount || 0,
        fee: cat._sum.fee || 0,
      })),
      todayTransactions: todayAgg._count,
      todayAmount: todayAgg._sum.amount || 0,
      todayFee: todayAgg._sum.fee || 0,
    };
  }

  // ============================================
  // FEE MANAGEMENT
  // ============================================

  async listFees(shopId: string) {
    const fees = await this.prisma.brilinkFee.findMany({
      where: { shopId },
      orderBy: [{ category: 'asc' }, { minAmount: 'asc' }],
    });

    return fees.map((fee) => ({
      id: fee.id,
      shopId: fee.shopId,
      category: fee.category,
      label: fee.label,
      minAmount: fee.minAmount,
      maxAmount: fee.maxAmount,
      feeType: fee.feeType,
      feeAmount: fee.feeAmount,
      feePercent: fee.feePercent,
      isActive: fee.isActive,
      createdAt: fee.createdAt.toISOString(),
      updatedAt: fee.updatedAt.toISOString(),
    }));
  }

  async createFee(dto: CreateBrilinkFeeDto) {
    const fee = await this.prisma.brilinkFee.create({
      data: {
        shopId: dto.shopId,
        category: dto.category,
        label: dto.label,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        feeType: dto.feeType,
        feeAmount: dto.feeAmount,
        feePercent: dto.feePercent,
      },
    });

    return fee;
  }

  async updateFee(id: string, dto: UpdateBrilinkFeeDto) {
    const existing = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Fee rule tidak ditemukan.');
    }

    const updated = await this.prisma.brilinkFee.update({
      where: { id },
      data: dto,
    });

    return updated;
  }

  async deleteFee(id: string) {
    const existing = await this.prisma.brilinkFee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Fee rule tidak ditemukan.');
    }

    await this.prisma.brilinkFee.delete({ where: { id } });
    return { success: true, message: 'Fee rule berhasil dihapus.' };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateRefNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BRL-${dateStr}-${rand}`;
  }
}
