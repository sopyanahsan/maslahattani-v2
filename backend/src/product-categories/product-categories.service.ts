import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string) {
    const categories = await this.prisma.productCategory.findMany({
      where: { shopId },
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return { data: categories, total: categories.length };
  }

  async create(shopId: string, dto: { name: string; icon?: string; color?: string; sortOrder?: number }) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { shopId_name: { shopId, name: dto.name } },
    });
    if (existing) throw new ConflictException(`Kategori "${dto.name}" sudah ada.`);

    const category = await this.prisma.productCategory.create({
      data: { shopId, name: dto.name, icon: dto.icon, color: dto.color, sortOrder: dto.sortOrder ?? 0 },
    });
    return { category };
  }

  async update(id: string, shopId: string, dto: { name?: string; icon?: string; color?: string; sortOrder?: number; isActive?: boolean }) {
    const category = await this.prisma.productCategory.findFirst({ where: { id, shopId } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan.');

    if (dto.name && dto.name !== category.name) {
      const dup = await this.prisma.productCategory.findUnique({
        where: { shopId_name: { shopId, name: dto.name } },
      });
      if (dup) throw new ConflictException(`Kategori "${dto.name}" sudah ada.`);
    }

    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: { name: dto.name, icon: dto.icon, color: dto.color, sortOrder: dto.sortOrder, isActive: dto.isActive },
    });
    return { category: updated };
  }

  async remove(id: string, shopId: string) {
    const category = await this.prisma.productCategory.findFirst({ where: { id, shopId } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan.');

    // Unlink products (set categoryId to null)
    await this.prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await this.prisma.productCategory.delete({ where: { id } });
    return { success: true, message: `Kategori "${category.name}" dihapus.` };
  }
}
