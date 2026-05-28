import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLanguageDto, UpdateReceiptConfigDto } from './dto/update-settings.dto';
import { UpdateShopDto, CreateShopDto } from './dto/update-shop.dto';

/** Default BRILink category config — 7 categories with display info. */
export const DEFAULT_BRILINK_CATEGORY_CONFIG: Record<string, BrilinkCategoryItem> = {
  TRANSFER_BRI: { displayName: 'Transfer BRI', color: 'blue', icon: 'landmark', isActive: true, sortOrder: 0 },
  TRANSFER_OTHER: { displayName: 'Transfer Lain', color: 'indigo', icon: 'send', isActive: true, sortOrder: 1 },
  TARIK_TUNAI: { displayName: 'Tarik Tunai', color: 'amber', icon: 'banknote', isActive: true, sortOrder: 2 },
  TOPUP_PULSA: { displayName: 'Top-Up Pulsa', color: 'pink', icon: 'smartphone', isActive: true, sortOrder: 3 },
  TOPUP_DATA: { displayName: 'Top-Up Data', color: 'purple', icon: 'wifi', isActive: true, sortOrder: 4 },
  TOPUP_EWALLET: { displayName: 'Top-Up E-Wallet', color: 'cyan', icon: 'wallet', isActive: true, sortOrder: 5 },
  TOPUP_PLN: { displayName: 'Top-Up PLN', color: 'yellow', icon: 'zap', isActive: true, sortOrder: 6 },
};

export interface BrilinkCategoryItem {
  displayName: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

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

  // ============================================
  // BRILINK CATEGORY CONFIG
  // ============================================

  async getBrilinkCategoryConfig(shopId: string): Promise<Record<string, BrilinkCategoryItem>> {
    const setting = await this.prisma.shopSetting.findUnique({
      where: { shopId },
    });

    if (!setting) return { ...DEFAULT_BRILINK_CATEGORY_CONFIG };

    // brilinkCategoryConfig is stored inside alertConfig JSON (reusing pattern)
    const raw = setting as any;
    const stored = raw.brilinkCategoryConfig;
    if (!stored || typeof stored !== 'object') {
      return { ...DEFAULT_BRILINK_CATEGORY_CONFIG };
    }

    // Merge with defaults to ensure all 7 categories exist
    const result: Record<string, BrilinkCategoryItem> = {};
    for (const key of Object.keys(DEFAULT_BRILINK_CATEGORY_CONFIG)) {
      result[key] = {
        ...DEFAULT_BRILINK_CATEGORY_CONFIG[key],
        ...(stored[key] || {}),
      };
    }
    return result;
  }

  async updateBrilinkCategoryConfig(
    shopId: string,
    config: Record<string, Partial<BrilinkCategoryItem>>,
  ): Promise<Record<string, BrilinkCategoryItem>> {
    // Merge with existing/defaults
    const current = await this.getBrilinkCategoryConfig(shopId);
    const merged: Record<string, BrilinkCategoryItem> = {};

    for (const key of Object.keys(DEFAULT_BRILINK_CATEGORY_CONFIG)) {
      merged[key] = {
        ...current[key],
        ...(config[key] || {}),
      };
    }

    // Get current setting to preserve other fields
    const existing = await this.prisma.shopSetting.findUnique({
      where: { shopId },
    });

    if (existing) {
      await this.prisma.shopSetting.update({
        where: { shopId },
        data: { brilinkCategoryConfig: merged as any },
      });
    } else {
      await this.prisma.shopSetting.create({
        data: {
          shopId,
          language: 'id',
          brilinkCategoryConfig: merged as any,
        },
      });
    }

    return merged;
  }
}
