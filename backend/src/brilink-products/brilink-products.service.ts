import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrilinkProductDto,
  UpdateBrilinkProductDto,
  QueryBrilinkProductsDto,
  SeedProductsDto,
} from './dto';

// Dynamic import for xlsx (optional dependency)
let XLSX: any = null;
try { XLSX = require('xlsx'); } catch { /* not installed */ }

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
  // BULK TEMPLATE & UPLOAD
  // ============================================

  /**
   * Generate template Excel untuk bulk upload produk BRILink.
   * Columns: Kategori, Operator, Provider, Nama Produk, Nominal, Harga Beli, Harga Jual, Aktif
   */
  generateBulkTemplate(): Buffer {
    if (!XLSX) throw new BadRequestException('Module xlsx belum terinstall.');

    const headers = [
      'Kategori', 'Operator', 'Provider', 'Nama Produk', 'Nominal', 'Harga Beli', 'Harga Jual', 'Aktif',
    ];

    // Sample data rows
    const sampleData = [
      ['TOPUP_PULSA', 'TELKOMSEL', '', 'Pulsa 5rb', 5000, 5100, 5500, 'Ya'],
      ['TOPUP_PULSA', 'XL', '', 'Pulsa 10rb', 10000, 10200, 11000, 'Ya'],
      ['TOPUP_DATA', 'INDOSAT', '', 'Indosat 3GB 30hr', 0, 25000, 30000, 'Ya'],
      ['TOPUP_EWALLET', '', 'GOPAY', 'GoPay 50rb', 50000, 50000, 52500, 'Ya'],
      ['TOPUP_EWALLET', '', 'OVO', 'OVO 100rb', 100000, 100000, 102500, 'Ya'],
      ['TOPUP_PLN', '', '', 'Token 50rb', 50000, 50000, 52000, 'Ya'],
      ['TOPUP_PLN', '', '', 'Token 100rb', 100000, 100000, 102000, 'Ya'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Set column widths
    ws['!cols'] = [
      { wch: 14 }, // Kategori
      { wch: 12 }, // Operator
      { wch: 12 }, // Provider
      { wch: 22 }, // Nama Produk
      { wch: 10 }, // Nominal
      { wch: 12 }, // Harga Beli
      { wch: 12 }, // Harga Jual
      { wch: 6 },  // Aktif
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk BRILink');

    // Add info sheet
    const infoData = [
      ['PANDUAN PENGISIAN TEMPLATE'],
      [''],
      ['Kolom', 'Keterangan', 'Wajib', 'Contoh'],
      ['Kategori', 'TOPUP_PULSA / TOPUP_DATA / TOPUP_EWALLET / TOPUP_PLN', 'Ya', 'TOPUP_PULSA'],
      ['Operator', 'Untuk pulsa/data: TELKOMSEL, XL, INDOSAT, THREE, AXIS, SMARTFREN', 'Kondisional', 'TELKOMSEL'],
      ['Provider', 'Untuk e-wallet: GOPAY, OVO, DANA, SHOPEEPAY, LINKAJA', 'Kondisional', 'GOPAY'],
      ['Nama Produk', 'Nama tampilan produk', 'Ya', 'Pulsa 50rb'],
      ['Nominal', 'Nilai nominal (0 jika paket data tanpa nominal tetap)', 'Tidak', '50000'],
      ['Harga Beli', 'Harga modal/beli dari distributor (Rp)', 'Ya', '50000'],
      ['Harga Jual', 'Harga jual ke nasabah (Rp)', 'Ya', '52500'],
      ['Aktif', 'Ya / Tidak', 'Tidak (default: Ya)', 'Ya'],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 14 }, { wch: 55 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Panduan');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Bulk upload produk BRILink dari file Excel.
   */
  async bulkUpload(shopId: string, fileBuffer: Buffer) {
    if (!XLSX) throw new BadRequestException('Module xlsx belum terinstall.');

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('File Excel kosong atau format tidak valid.');

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) throw new BadRequestException('Tidak ada data produk di file.');
    if (rows.length > 1000) throw new BadRequestException('Maksimal 1000 produk per upload.');

    const validCategories = ['TOPUP_PULSA', 'TOPUP_DATA', 'TOPUP_EWALLET', 'TOPUP_PLN'];
    const results = { success: 0, skipped: 0, updated: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const category = String(row['Kategori'] || row['category'] || '').trim().toUpperCase();
      const operator = String(row['Operator'] || row['operator'] || '').trim().toUpperCase() || null;
      const provider = String(row['Provider'] || row['provider'] || '').trim().toUpperCase() || null;
      const name = String(row['Nama Produk'] || row['nama'] || row['name'] || '').trim();
      const nominalRaw = row['Nominal'] || row['nominal'] || 0;
      const buyPriceRaw = row['Harga Beli'] || row['harga_beli'] || row['buyPrice'] || 0;
      const sellPriceRaw = row['Harga Jual'] || row['harga_jual'] || row['sellPrice'] || 0;
      const isActiveRaw = String(row['Aktif'] || row['aktif'] || row['isActive'] || 'Ya').trim().toLowerCase();

      // Validate
      if (!name) { results.errors.push(`Baris ${rowNum}: Nama produk kosong.`); results.skipped++; continue; }
      if (!category || !validCategories.includes(category)) {
        results.errors.push(`Baris ${rowNum} (${name}): Kategori tidak valid. Harus: ${validCategories.join(', ')}`);
        results.skipped++;
        continue;
      }

      const buyPrice = Math.round(Number(buyPriceRaw) || 0);
      const sellPrice = Math.round(Number(sellPriceRaw) || 0);
      const nominal = Math.round(Number(nominalRaw) || 0) || null;
      const isActive = ['ya', 'yes', 'true', '1', 'aktif'].includes(isActiveRaw);

      if (sellPrice <= 0) { results.errors.push(`Baris ${rowNum} (${name}): Harga Jual harus > 0.`); results.skipped++; continue; }

      // Upsert: match by shopId + category + name (update if exists, create if not)
      const existing = await this.prisma.brilinkProduct.findFirst({
        where: { shopId, category, name: { equals: name, mode: 'insensitive' } },
      });

      if (existing) {
        await this.prisma.brilinkProduct.update({
          where: { id: existing.id },
          data: { operator, provider, nominal, buyPrice, sellPrice, isActive },
        });
        results.updated++;
      } else {
        await this.prisma.brilinkProduct.create({
          data: {
            shopId, category, operator, provider, name, nominal, buyPrice, sellPrice, isActive,
            sortOrder: i,
          },
        });
        results.success++;
      }
    }

    return {
      message: `Upload selesai: ${results.success} produk baru, ${results.updated} di-update, ${results.skipped} dilewati.`,
      ...results,
      total: rows.length,
    };
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
