import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCashBoxCategoryDto,
  UpdateCashBoxCategoryDto,
} from './dto';

@Injectable()
export class CashBoxCategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * List semua kategori. Default-nya hanya yang aktif (untuk kasir).
   * Super-admin di admin panel bisa pass `includeInactive=true` untuk lihat
   * yang sudah di-disable.
   */
  async list(includeInactive = false) {
    const categories = await this.prisma.cashBoxCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return { data: categories, total: categories.length };
  }

  async findOne(id: string) {
    const category = await this.prisma.cashBoxCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategori cashbox tidak ditemukan.');
    }

    return category;
  }

  /**
   * Create kategori baru. Validasi:
   * - Code harus unik (case-sensitive UPPERCASE)
   * - Kalau isDefault=true, unset default dari kategori lain
   */
  async create(dto: CreateCashBoxCategoryDto) {
    // Cek code conflict
    const existing = await this.prisma.cashBoxCategory.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Kategori dengan code "${dto.code}" sudah ada.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Kalau isDefault=true, unset default lainnya supaya cuma 1 default
      if (dto.isDefault) {
        await tx.cashBoxCategory.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.cashBoxCategory.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          color: dto.color,
          icon: dto.icon,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });

      return {
        category: created,
        message: 'Kategori cashbox berhasil dibuat.',
      };
    });
  }

  /**
   * Update kategori. Code immutable.
   */
  async update(id: string, dto: UpdateCashBoxCategoryDto) {
    const existing = await this.prisma.cashBoxCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Kategori cashbox tidak ditemukan.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Kalau set isDefault=true, unset default lainnya
      if (dto.isDefault === true && !existing.isDefault) {
        await tx.cashBoxCategory.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      // Defensif: jangan biarkan satu-satunya default jadi non-default,
      // sistem harus selalu punya minimal 1 default (untuk fallback POS).
      if (dto.isDefault === false && existing.isDefault) {
        const otherDefaults = await tx.cashBoxCategory.count({
          where: { isDefault: true, id: { not: id } },
        });
        if (otherDefaults === 0) {
          throw new BadRequestException(
            'Tidak bisa unset default. Pilih kategori lain sebagai default dulu.',
          );
        }
      }

      const updated = await tx.cashBoxCategory.update({
        where: { id },
        data: dto,
      });

      return {
        category: updated,
        message: 'Kategori cashbox berhasil diupdate.',
      };
    });
  }

  /**
   * Soft-delete: set isActive=false. Kategori yang sudah dipakai di shift
   * tidak bisa hard-delete karena foreign key constraint.
   */
  async remove(id: string) {
    const category = await this.prisma.cashBoxCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Kategori cashbox tidak ditemukan.');
    }

    if (category.isDefault) {
      throw new BadRequestException(
        'Kategori default tidak bisa dihapus. Set kategori lain sebagai default dulu.',
      );
    }

    // Cek apakah ada ShiftCashBox yang masih reference kategori ini
    const usageCount = await this.prisma.shiftCashBox.count({
      where: { categoryId: id },
    });

    if (usageCount > 0) {
      // Soft-delete: set isActive=false. Data history shift tetap ke-jaga.
      const updated = await this.prisma.cashBoxCategory.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        category: updated,
        message: `Kategori dinonaktifkan (sudah dipakai di ${usageCount} shift). Data history tetap utuh.`,
      };
    }

    // Belum pernah dipakai → hard delete OK
    await this.prisma.cashBoxCategory.delete({ where: { id } });
    return {
      message: 'Kategori cashbox berhasil dihapus.',
    };
  }
}
