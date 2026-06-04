import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashBoxDto, UpdateCashBoxDto } from './dto';

@Injectable()
export class CashBoxesService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // LIST — all cash boxes for a shop
  // ============================================

  async findAll(shopId: string) {
    return this.prisma.cashBox.findMany({
      where: { shopId },
      orderBy: [{ label: 'asc' }],
    });
  }

  // ============================================
  // GET ONE
  // ============================================

  async findOne(id: string) {
    const cashBox = await this.prisma.cashBox.findUnique({ where: { id } });
    if (!cashBox) throw new NotFoundException('Kas tidak ditemukan.');
    return cashBox;
  }

  // ============================================
  // CREATE — direct CashBox (decoupled from category)
  // ============================================

  async create(dto: CreateCashBoxDto) {
    const cashBox = await this.prisma.cashBox.create({
      data: {
        shopId: dto.shopId,
        categoryId: null, // decoupled — no category link
        label: dto.label,
        balance: dto.balance ?? 0,
      },
    });

    // If initial balance > 0, record a CashMutation
    if (dto.balance && dto.balance > 0) {
      await this.prisma.cashMutation.create({
        data: {
          shopId: dto.shopId,
          categoryId: null,
          type: 'CASH_IN',
          amount: dto.balance,
          balanceBefore: 0,
          balanceAfter: dto.balance,
          category: null,
          notes: 'Saldo awal kas',
        },
      });
    }

    return cashBox;
  }

  // ============================================
  // UPDATE — edit label and/or manual balance
  // ============================================

  async update(id: string, dto: UpdateCashBoxDto) {
    const existing = await this.findOne(id);

    const updateData: any = {};
    if (dto.label !== undefined) updateData.label = dto.label;

    // If balance is being manually adjusted, record a mutation
    if (dto.balance !== undefined && dto.balance !== existing.balance) {
      const diff = dto.balance - existing.balance;
      const type = diff > 0 ? 'CASH_IN' : 'CASH_OUT';

      updateData.balance = dto.balance;

      await this.prisma.cashMutation.create({
        data: {
          shopId: existing.shopId,
          categoryId: existing.categoryId,
          type,
          amount: Math.abs(diff),
          balanceBefore: existing.balance,
          balanceAfter: dto.balance,
          category: null,
          notes: 'Penyesuaian saldo manual',
        },
      });
    }

    const updated = await this.prisma.cashBox.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  // ============================================
  // DELETE — hard delete (only if balance is 0)
  // ============================================

  async remove(id: string) {
    const cashBox = await this.findOne(id);

    if (cashBox.balance !== 0) {
      throw new BadRequestException(
        `Tidak bisa hapus kas "${cashBox.label}" karena saldo masih Rp ${cashBox.balance.toLocaleString('id-ID')}. Tarik dulu saldo ke 0.`,
      );
    }

    await this.prisma.cashBox.delete({ where: { id } });

    return { success: true, message: `Kas "${cashBox.label}" berhasil dihapus.` };
  }
}
