import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrilinkProductDto,
  UpdateBrilinkProductDto,
  QueryBrilinkProductsDto,
  SeedProductsDto,
} from './dto';

@Injectable()
export class BrilinkProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // OPERATOR DETECTION
  // ============================================

  async detectOperator(phone: string) {
    // Normalize: remove +62, spaces, dashes
    let normalized = phone.replace(/[\s\-+]/g, '');
    if (normalized.startsWith('62')) normalized = '0' + normalized.slice(2);
    if (!normalized.startsWith('0')) normalized = '0' + normalized;

    const prefix4 = normalized.slice(0, 4);

    const match = await this.prisma.operatorPrefix.findUnique({
      where: { prefix: prefix4 },
    });

    return match
      ? { operator: match.operator, prefix: match.prefix, phone: normalized }
      : { operator: null, prefix: prefix4, phone: normalized };
  }

  async getAllPrefixes() {
    return this.prisma.operatorPrefix.findMany({
      orderBy: [{ operator: 'asc' }, { prefix: 'asc' }],
    });
  }

  // ============================================
  // PRODUCTS CRUD
  // ============================================

  async listProducts(query: QueryBrilinkProductsDto) {
    const where: any = { shopId: query.shopId };
    if (query.category) where.category = query.category;
    if (query.operator) where.operator = query.operator;
    if (query.provider) where.provider = query.provider;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const products = await this.prisma.brilinkProduct.findMany({
      where,
      orderBy: [{ category: 'asc' }, { operator: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return { data: products, total: products.length };
  }

  async createProduct(dto: CreateBrilinkProductDto) {
    return this.prisma.brilinkProduct.create({
      data: {
        shopId: dto.shopId,
        category: dto.category,
        operator: dto.operator || null,
        provider: dto.provider || null,
        name: dto.name,
        nominal: dto.nominal || null,
        buyPrice: dto.buyPrice,
        sellPrice: dto.sellPrice,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateProduct(id: string, dto: UpdateBrilinkProductDto) {
    const existing = await this.prisma.brilinkProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Produk tidak ditemukan.');

    return this.prisma.brilinkProduct.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nominal !== undefined && { nominal: dto.nominal }),
        ...(dto.buyPrice !== undefined && { buyPrice: dto.buyPrice }),
        ...(dto.sellPrice !== undefined && { sellPrice: dto.sellPrice }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.brilinkProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Produk tidak ditemukan.');
    await this.prisma.brilinkProduct.delete({ where: { id } });
    return { success: true };
  }

  // ============================================
  // SEED TEMPLATE
  // ============================================

  async seedProducts(dto: SeedProductsDto) {
    const template = this.getTemplate(dto.template);

    // Delete existing products for this shop (fresh seed)
    await this.prisma.brilinkProduct.deleteMany({ where: { shopId: dto.shopId } });

    const products = template.map((t) => ({
      shopId: dto.shopId,
      category: t.category,
      operator: t.operator || null,
      provider: t.provider || null,
      name: t.name,
      nominal: t.nominal || null,
      buyPrice: t.buyPrice,
      sellPrice: t.sellPrice,
      isActive: true,
      sortOrder: t.sortOrder || 0,
    }));

    const result = await this.prisma.brilinkProduct.createMany({ data: products });
    return { created: result.count, template: dto.template };
  }

  private getTemplate(template: string) {
    const operators = ['TELKOMSEL', 'XL', 'INDOSAT', 'THREE', 'AXIS', 'SMARTFREN'];
    const multiplier = template === 'premium' ? 1.3 : template === 'economy' ? 0.8 : 1;

    const products: any[] = [];
    let order = 0;

    // Pulsa per operator
    for (const op of operators) {
      for (const nom of [5000, 10000, 15000, 20000, 25000, 50000, 100000]) {
        const buy = nom + Math.round(nom * 0.02); // 2% markup beli
        const sell = nom + Math.round(nom * 0.1 * multiplier); // 10% markup jual
        products.push({
          category: 'TOPUP_PULSA',
          operator: op,
          name: `Pulsa ${nom >= 1000 ? (nom / 1000) + 'rb' : nom}`,
          nominal: nom,
          buyPrice: buy,
          sellPrice: sell,
          sortOrder: order++,
        });
      }
    }

    // Paket Data per operator (simplified)
    for (const op of operators) {
      const dataPackets = [
        { name: '1GB 30hr', buy: 12000, sell: Math.round(15000 * multiplier) },
        { name: '3GB 30hr', buy: 25000, sell: Math.round(30000 * multiplier) },
        { name: '6GB 30hr', buy: 42000, sell: Math.round(50000 * multiplier) },
        { name: '15GB 30hr', buy: 65000, sell: Math.round(75000 * multiplier) },
        { name: 'Unlimited 30hr', buy: 80000, sell: Math.round(95000 * multiplier) },
      ];
      for (const dp of dataPackets) {
        products.push({
          category: 'TOPUP_DATA',
          operator: op,
          name: `${op} ${dp.name}`,
          buyPrice: dp.buy,
          sellPrice: dp.sell,
          sortOrder: order++,
        });
      }
    }

    // PLN Token
    for (const nom of [20000, 50000, 100000, 200000, 500000, 1000000]) {
      const fee = Math.round(nom * 0.015 * multiplier); // 1.5% fee
      products.push({
        category: 'TOPUP_PLN',
        name: `Token ${nom >= 1000000 ? '1jt' : (nom / 1000) + 'rb'}`,
        nominal: nom,
        buyPrice: nom,
        sellPrice: nom + (fee < 2000 ? 2000 : fee),
        sortOrder: order++,
      });
    }

    // E-Wallet (generic nominals)
    const wallets = ['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA'];
    for (const w of wallets) {
      for (const nom of [25000, 50000, 100000, 200000, 500000]) {
        products.push({
          category: 'TOPUP_EWALLET',
          provider: w,
          name: `${w} ${nom >= 1000 ? (nom / 1000) + 'rb' : nom}`,
          nominal: nom,
          buyPrice: nom,
          sellPrice: nom + Math.round(2500 * multiplier),
          sortOrder: order++,
        });
      }
    }

    return products;
  }

  // ============================================
  // BANK LIST
  // ============================================

  async listBanks(search?: string, isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search } },
      ];
    }

    return this.prisma.bankList.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { shortName: 'asc' }],
    });
  }

  async toggleBank(id: string, isActive: boolean) {
    return this.prisma.bankList.update({
      where: { id },
      data: { isActive },
    });
  }

  // ============================================
  // E-WALLET PROVIDERS
  // ============================================

  async listEwalletProviders() {
    return this.prisma.ewalletProvider.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async toggleEwalletProvider(id: string, isActive: boolean) {
    return this.prisma.ewalletProvider.update({
      where: { id },
      data: { isActive },
    });
  }
}
