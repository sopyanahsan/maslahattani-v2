import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { BulkUpdatePricesDto } from './dto/bulk-update-prices.dto';
import { QuickCreateProductDto } from './dto/quick-create-product.dto';
// xlsx — pastikan sudah `npm install` setelah pull
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch {
  // Will throw at runtime when bulk upload is called
  XLSX = null;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE PRODUCT
  // ============================================

  async create(dto: CreateProductDto) {
    // Check SKU unique per shop
    const existing = await this.prisma.product.findUnique({
      where: { shopId_sku: { shopId: dto.shopId, sku: dto.sku } },
    });

    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" sudah digunakan di toko ini.`);
    }

    // Create product + initial stock in one transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          shopId: dto.shopId,
          name: dto.name,
          sku: dto.sku,
          barcode: dto.barcode || null,
          price: dto.price,
          cost: dto.cost,
          supplierId: dto.supplierId || null,
          imageUrl: dto.imageUrl || null,
          categoryId: dto.categoryId || null,
          unit: dto.unit || null,
          description: (dto as any).description || null,
        },
      });

      // Create stock record
      const initialQty = dto.initialStock || 0;
      const stock = await tx.stock.create({
        data: {
          shopId: dto.shopId,
          productId: prod.id,
          quantity: initialQty,
          warehouse: 'main',
        },
      });

      // Log initial stock
      if (initialQty > 0) {
        await tx.stockHistory.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            source: 'INITIAL',
            quantityBefore: 0,
            quantityAfter: initialQty,
            quantityChange: initialQty,
            notes: 'Stok awal produk baru',
          },
        });
      }

      return prod;
    });

    return { success: true, product };
  }

  // ============================================
  // GET ALL PRODUCTS
  // ============================================

  async findAll(query: QueryProductDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.shopId) where.shopId = query.shopId;
    if (query.categoryId) where.categoryId = query.categoryId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Determine orderBy from sortBy param
    let orderBy: any = { name: 'asc' };
    switch (query.sortBy) {
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'stock-low':
      case 'stock-high':
        // Stock sort handled after query (since it's a relation aggregate)
        orderBy = { name: 'asc' };
        break;
      case 'name-asc':
      default:
        orderBy = { name: 'asc' };
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          stocks: { select: { quantity: true, warehouse: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Sort by stock if needed (post-query since stock is aggregated)
    let sortedProducts = products;
    if (query.sortBy === 'stock-low') {
      sortedProducts = [...products].sort((a, b) => {
        const stockA = a.stocks.reduce((sum, s) => sum + s.quantity, 0);
        const stockB = b.stocks.reduce((sum, s) => sum + s.quantity, 0);
        return stockA - stockB;
      });
    } else if (query.sortBy === 'stock-high') {
      sortedProducts = [...products].sort((a, b) => {
        const stockA = a.stocks.reduce((sum, s) => sum + s.quantity, 0);
        const stockB = b.stocks.reduce((sum, s) => sum + s.quantity, 0);
        return stockB - stockA;
      });
    }

    return {
      data: sortedProducts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // GET SINGLE PRODUCT
  // ============================================

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            stockHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    return product;
  }

  // ============================================
  // FIND BY BARCODE (untuk POS scan)
  // ============================================

  async findByBarcode(shopId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { shopId, barcode, deletedAt: null },
      include: {
        stocks: { select: { quantity: true, warehouse: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan barcode "${barcode}" tidak ditemukan.`);
    }

    return product;
  }

  // ============================================
  // UPDATE PRODUCT
  // ============================================

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? product.name,
        price: dto.price ?? product.price,
        cost: dto.cost ?? product.cost,
        supplierId: dto.supplierId ?? product.supplierId,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : product.imageUrl,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : product.categoryId,
        unit: dto.unit !== undefined ? dto.unit : product.unit,
        description: dto.description !== undefined ? dto.description : product.description,
        barcode: dto.barcode !== undefined ? (dto.barcode || null) : product.barcode,
      },
      include: {
        stocks: { select: { quantity: true, warehouse: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });

    return { success: true, product: updated };
  }

  // ============================================
  // DELETE PRODUCT (Soft delete)
  // ============================================

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: `Produk "${product.name}" berhasil dihapus.` };
  }

  // ============================================
  // LIST CATEGORIES
  // ============================================

  async listCategories(shopId: string) {
    const categories = await this.prisma.productCategory.findMany({
      where: { shopId, isActive: true },
      select: { id: true, name: true, icon: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return { data: categories };
  }

  // ============================================
  // QUICK CREATE (from PO flow — minimal fields)
  // ============================================

  /**
   * Create product with minimal info (name + shopId).
   * SKU auto-generated. Price/cost = 0 (to be filled when PO received).
   * Used when creating a PO and the product doesn't exist yet.
   */
  async quickCreate(dto: QuickCreateProductDto) {
    const sku = await this.generateUniqueSKU(dto.shopId, dto.name);

    const product = await this.prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          shopId: dto.shopId,
          name: dto.name,
          sku,
          price: 0,
          cost: 0,
          unit: dto.unit || 'pcs',
          categoryId: dto.categoryId || null,
        },
      });

      // Create stock record with 0 qty
      await tx.stock.create({
        data: {
          shopId: dto.shopId,
          productId: prod.id,
          quantity: 0,
          warehouse: 'main',
        },
      });

      return prod;
    });

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        stock: 0,
      },
    };
  }

  /**
   * Generate unique SKU from product name.
   * Format: {3-char-prefix}-{3-random-alphanumeric}
   * e.g. "Beras Organik 5kg" → "BER-7K3"
   */
  private async generateUniqueSKU(shopId: string, productName: string): Promise<string> {
    // Get 3-char prefix from first word (or first 3 chars)
    const words = productName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/);
    const prefix = words[0]?.substring(0, 3) || 'PRD';

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;

    while (attempts < 20) {
      let suffix = '';
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const sku = `${prefix}-${suffix}`;

      // Check uniqueness
      const existing = await this.prisma.product.findUnique({
        where: { shopId_sku: { shopId, sku } },
      });
      if (!existing) return sku;
      attempts++;
    }

    // Fallback: use timestamp
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    return `${prefix}-${ts}`;
  }

  // ============================================
  // BULK UPDATE PRICES (from PO price changes)
  // ============================================

  /**
   * Update harga beli (cost) dan jual (price) untuk beberapa produk sekaligus.
   * Dipanggil setelah terima PO dan admin review perubahan harga.
   *
   * Jika price tidak diisi per item, sistem hitung otomatis:
   * - Ambil margin terakhir (currentPrice - currentCost) / currentCost * 100
   * - Apply margin yang sama ke new cost
   * - Round up ke kelipatan 100
   */
  async bulkUpdatePrices(dto: BulkUpdatePricesDto) {
    const results: Array<{
      productId: string;
      productName: string;
      oldCost: number;
      newCost: number;
      oldPrice: number;
      newPrice: number;
      marginPercent: number;
    }> = [];

    for (const update of dto.updates) {
      const product = await this.prisma.product.findUnique({
        where: { id: update.productId },
      });

      if (!product || product.deletedAt) continue;

      const oldCost = product.cost;
      const oldPrice = product.price;
      const newCost = update.cost;

      // Calculate new price
      let newPrice: number;
      if (update.price && update.price > 0) {
        // Admin specified exact price
        newPrice = update.price;
      } else {
        // Auto-calculate: maintain current margin percentage, round up to 100
        const marginPercent = oldCost > 0
          ? ((oldPrice - oldCost) / oldCost) * 100
          : 20; // Default 20% margin if cost was 0
        const rawPrice = newCost * (1 + marginPercent / 100);
        newPrice = Math.ceil(rawPrice / 100) * 100;
      }

      const marginPercent = newCost > 0
        ? Math.round(((newPrice - newCost) / newCost) * 100)
        : 0;

      await this.prisma.product.update({
        where: { id: update.productId },
        data: { cost: newCost, price: newPrice },
      });

      results.push({
        productId: product.id,
        productName: product.name,
        oldCost,
        newCost,
        oldPrice,
        newPrice,
        marginPercent,
      });
    }

    return {
      success: true,
      message: `${results.length} produk berhasil diupdate harganya.`,
      updated: results,
    };
  }

  // ============================================
  // BULK UPLOAD (from Excel/CSV)
  // ============================================

  async bulkUpload(shopId: string, fileBuffer: Buffer) {
    if (!XLSX) {
      throw new BadRequestException(
        'Module "xlsx" belum terinstall. Jalankan: npm install xlsx',
      );
    }

    // Parse file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('File Excel kosong atau format tidak valid.');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      throw new BadRequestException('Tidak ada data produk di file.');
    }

    if (rows.length > 500) {
      throw new BadRequestException('Maksimal 500 produk per upload.');
    }

    // Validate & transform rows
    const results: { success: number; skipped: number; errors: string[] } = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    // Get existing SKUs for this shop to check duplicates
    const existingProducts = await this.prisma.product.findMany({
      where: { shopId, deletedAt: null },
      select: { sku: true },
    });
    const existingSKUs = new Set(existingProducts.map(p => p.sku.toUpperCase()));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (1-indexed + header)

      // Map columns (support both Indonesian & English headers)
      const imageUrl = String(row['URL Gambar'] || row['imageUrl'] || row['image_url'] || '').trim();
      const barcode = String(row['Barcode'] || row['barcode'] || '').trim();
      const name = String(row['Nama Produk'] || row['nama'] || row['name'] || '').trim();
      const sku = String(row['SKU'] || row['sku'] || '').trim().toUpperCase();
      const priceRaw = row['Harga Jual'] || row['harga_jual'] || row['price'] || 0;
      const costRaw = row['Harga Beli'] || row['Modal'] || row['harga_modal'] || row['harga_beli'] || row['cost'] || 0;
      const stockRaw = row['Stok Awal'] || row['stok'] || row['stock'] || 0;
      const unit = String(row['Satuan'] || row['unit'] || 'pcs').trim();
      const categoryName = String(row['Kategori'] || row['category'] || '').trim();
      const description = String(row['Deskripsi'] || row['description'] || '').trim();

      // Validate required fields
      if (!name) {
        results.errors.push(`Baris ${rowNum}: Nama produk kosong.`);
        results.skipped++;
        continue;
      }
      if (!sku) {
        results.errors.push(`Baris ${rowNum}: SKU kosong.`);
        results.skipped++;
        continue;
      }

      const price = Math.round(Number(priceRaw) || 0);
      const cost = Math.round(Number(costRaw) || 0);
      const initialStock = Math.round(Number(stockRaw) || 0);

      if (price <= 0) {
        results.errors.push(`Baris ${rowNum} (${name}): Harga jual harus > 0.`);
        results.skipped++;
        continue;
      }

      // Check duplicate SKU
      if (existingSKUs.has(sku)) {
        results.errors.push(`Baris ${rowNum} (${name}): SKU "${sku}" sudah ada.`);
        results.skipped++;
        continue;
      }

      // Resolve category (find or create)
      let categoryId: string | null = null;
      if (categoryName) {
        const existingCat = await this.prisma.productCategory.findFirst({
          where: { shopId, name: { equals: categoryName, mode: 'insensitive' } },
        });
        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          const newCat = await this.prisma.productCategory.create({
            data: { shopId, name: categoryName },
          });
          categoryId = newCat.id;
        }
      }

      // Create product + stock in transaction
      try {
        await this.prisma.$transaction(async (tx) => {
          const prod = await tx.product.create({
            data: {
              shopId,
              name,
              sku,
              barcode: barcode || null,
              price,
              cost,
              unit: unit || null,
              categoryId,
              description: description || null,
              imageUrl: imageUrl || null,
            },
          });

          const stock = await tx.stock.create({
            data: {
              shopId,
              productId: prod.id,
              quantity: initialStock,
              warehouse: 'main',
            },
          });

          if (initialStock > 0) {
            await tx.stockHistory.create({
              data: {
                stockId: stock.id,
                type: 'IN',
                source: 'BULK_UPLOAD',
                quantityBefore: 0,
                quantityAfter: initialStock,
                quantityChange: initialStock,
                notes: 'Stok awal (bulk upload)',
              },
            });
          }
        });

        existingSKUs.add(sku);
        results.success++;
      } catch (err: any) {
        results.errors.push(`Baris ${rowNum} (${name}): ${err.message || 'Gagal menyimpan.'}`);
        results.skipped++;
      }
    }

    return {
      success: true,
      message: `Upload selesai: ${results.success} berhasil, ${results.skipped} dilewati.`,
      totalRows: rows.length,
      imported: results.success,
      skipped: results.skipped,
      errors: results.errors,
    };
  }

  // ============================================
  // DOWNLOAD TEMPLATE
  // ============================================

  generateTemplate(): Buffer {
    if (!XLSX) {
      throw new BadRequestException(
        'Module "xlsx" belum terinstall. Jalankan: npm install xlsx',
      );
    }

    const headers = [
      'URL Gambar', 'SKU', 'Barcode', 'Nama Produk', 'Kategori', 'Stok Awal', 'Satuan', 'Harga Jual', 'Harga Beli', 'Deskripsi',
    ];
    const exampleRow = [
      '', 'BRS-5KG-001', '8991042001234', 'Beras Premium 5kg', 'Sembako', 50, 'pcs', 80000, 65000, 'Beras kualitas premium',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');

    // Force buffer output (some xlsx versions return string by default)
    const result = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
    return Buffer.isBuffer(result) ? result : Buffer.from(result);
  }
}
