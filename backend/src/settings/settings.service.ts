import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLanguageDto, UpdateReceiptConfigDto } from './dto/update-settings.dto';
import { UpdateShopDto, CreateShopDto } from './dto/update-shop.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // GET SETTINGS
  // ============================================

  async getSettings(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { settings: true, childShops: true },
    });

    if (!shop) throw new NotFoundException('Toko tidak ditemukan.');

    return {
      shop: {
        id: shop.id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        parentShopId: shop.parentShopId,
      },
      settings: shop.settings || { language: 'id', receiptConfig: null },
      branches: shop.childShops.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
      })),
    };
  }

  // ============================================
  // UPDATE LANGUAGE
  // ============================================

  async updateLanguage(dto: UpdateLanguageDto) {
    const setting = await this.prisma.shopSetting.upsert({
      where: { shopId: dto.shopId },
      update: { language: dto.language },
      create: { shopId: dto.shopId, language: dto.language },
    });

    return { success: true, message: `Bahasa berhasil diubah ke "${dto.language}".`, setting };
  }

  // ============================================
  // UPDATE RECEIPT CONFIG
  // ============================================

  async updateReceiptConfig(dto: UpdateReceiptConfigDto) {
    const config = JSON.stringify({
      autoPrint: dto.autoPrint ?? true,
      mergeReceipts: dto.mergeReceipts ?? false,
      footerMessage: dto.footerMessage ?? '',
    });

    const setting = await this.prisma.shopSetting.upsert({
      where: { shopId: dto.shopId },
      update: { receiptConfig: config },
      create: { shopId: dto.shopId, language: 'id', receiptConfig: config },
    });

    return { success: true, message: 'Pengaturan struk berhasil diperbarui.', setting };
  }

  // ============================================
  // UPDATE SHOP DATA
  // ============================================

  async updateShop(shopId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Toko tidak ditemukan.');

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        name: dto.name ?? shop.name,
        address: dto.address ?? shop.address,
        phone: dto.phone ?? shop.phone,
      },
    });

    return { success: true, message: 'Data toko berhasil diperbarui.', shop: updated };
  }

  // ============================================
  // CREATE SHOP (Tambah cabang)
  // ============================================

  async createShop(dto: CreateShopDto, ownerId: string) {
    const shop = await this.prisma.shop.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        ownerId,
        parentShopId: dto.parentShopId || null,
      },
    });

    // Auto-create cash box
    await this.prisma.cashBox.create({
      data: { shopId: shop.id, balance: 0 },
    });

    return { success: true, message: `Toko "${dto.name}" berhasil ditambahkan.`, shop };
  }

  // ============================================
  // LIST ALL SHOPS (multi-cabang)
  // ============================================

  async listShops(ownerId: string) {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
      include: {
        settings: true,
        childShops: { select: { id: true, name: true, address: true } },
        _count: { select: { users: true, products: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { data: shops, total: shops.length };
  }
}
