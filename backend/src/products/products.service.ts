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
          price: dto.price,
          cost: dto.cost,
          supplierId: dto.supplierId || null,
          imageUrl: dto.imageUrl || null,
          categoryId: dto.categoryId || null,
          unit: dto.unit || null,
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
      'URL Gambar', 'SKU', 'Nama Produk', 'Kategori', 'Stok Awal', 'Satuan', 'Harga Jual', 'Harga Beli', 'Deskripsi',
    ];
    const exampleRow = [
      '', 'BRS-5KG-001', 'Beras Premium 5kg', 'Sembako', 50, 'pcs', 80000, 65000, 'Beras kualitas premium',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
