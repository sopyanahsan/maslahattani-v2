import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed Maslahat Tani v2.
 *
 * Idempotent: bisa di-run berulang kali, pakai upsert by unique key (id / email).
 *
 * Skema akun:
 * - 1 SUPER_ADMIN (shopId = null) → bisa akses semua cabang
 * - 2 Cabang: Pusat (Bekasi) & Cabang Bandung
 * - 1 ADMIN per cabang (shopId terisi → akses 1 cabang aja)
 * - 1 KASIR per cabang
 *
 * Catatan migrasi:
 * - Existing 'default-shop' (dari seed lama) di-rename jadi "Maslahat Tani Pusat".
 * - Existing admin@maslahat-tani.com tetap dipakai sebagai SUPER_ADMIN tapi shopId=null
 *   supaya konsisten dengan rule "super-admin tidak punya shop tetap".
 * - Existing kasir@maslahat-tani.com tetap di Pusat (karena dulu shopId=default-shop).
 */
async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================
  // CASH BOX CATEGORIES (default RETAIL only)
  // ============================================
  // SUBSIDI_PUPUK / kategori lain di-create via admin panel oleh super-admin
  // sesuai kebutuhan toko. RETAIL adalah default mandatory.
  await prisma.cashBoxCategory.upsert({
    where: { code: 'RETAIL' },
    update: {
      name: 'Kas Retail',
      description: 'Kas penjualan retail biasa (non-subsidi).',
      color: 'blue',
      icon: 'shopping-cart',
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    },
    create: {
      id: 'cashbox-retail',
      code: 'RETAIL',
      name: 'Kas Retail',
      description: 'Kas penjualan retail biasa (non-subsidi).',
      color: 'blue',
      icon: 'shopping-cart',
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log('✅ CashBoxCategory: RETAIL (default)');

  // ============================================
  // SUPER ADMIN (shopId = null, akses semua cabang)
  // ============================================
  const superAdminPassword = await bcrypt.hash('Admin123!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@maslahat-tani.com' },
    update: {
      role: Role.SUPER_ADMIN,
      shopId: null, // PENTING: super-admin tidak terikat ke 1 cabang
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin@maslahat-tani.com',
      username: 'superadmin',
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      shopId: null,
    },
  });

  console.log(`✅ Super Admin: ${superAdmin.email} / Admin123!`);

  // ============================================
  // SHOPS
  // ============================================
  // Pusat — pakai id 'default-shop' biar backward compat dengan data existing
  // (existing User.shopId = 'default-shop' tetap valid).
  const shopPusat = await prisma.shop.upsert({
    where: { id: 'default-shop' },
    update: {
      name: 'Maslahat Tani Pusat',
      address: 'Jl. Jenderal Sudirman No. 1, Bekasi, Jawa Barat',
      phone: '021-88001100',
    },
    create: {
      id: 'default-shop',
      name: 'Maslahat Tani Pusat',
      address: 'Jl. Jenderal Sudirman No. 1, Bekasi, Jawa Barat',
      phone: '021-88001100',
    },
  });

  const shopBandung = await prisma.shop.upsert({
    where: { id: 'shop-bandung' },
    update: {
      name: 'Maslahat Tani — Cabang Bandung',
      address: 'Jl. Asia Afrika No. 88, Bandung, Jawa Barat',
      phone: '022-77001100',
    },
    create: {
      id: 'shop-bandung',
      name: 'Maslahat Tani — Cabang Bandung',
      address: 'Jl. Asia Afrika No. 88, Bandung, Jawa Barat',
      phone: '022-77001100',
    },
  });

  console.log(`✅ Shop: ${shopPusat.name}`);
  console.log(`✅ Shop: ${shopBandung.name}`);

  // Shop settings
  for (const shop of [shopPusat, shopBandung]) {
    await prisma.shopSetting.upsert({
      where: { shopId: shop.id },
      update: {},
      create: {
        shopId: shop.id,
        language: 'id',
        receiptConfig: JSON.stringify({
          autoPrint: true,
          mergeReceipts: false,
          footerMessage: 'Terima kasih sudah berbelanja!',
        }),
      },
    });

    await prisma.cashBox.upsert({
      where: { shopId: shop.id },
      update: {},
      create: { shopId: shop.id, balance: 0 },
    });
  }
  console.log(`✅ Shop settings + cash boxes created`);

  // ============================================
  // ADMINS (1 per cabang)
  // ============================================
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const adminPusat = await prisma.user.upsert({
    where: { email: 'admin.pusat@maslahat-tani.com' },
    update: {
      role: Role.ADMIN,
      shopId: shopPusat.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin.pusat@maslahat-tani.com',
      username: 'adminpusat',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      shopId: shopPusat.id,
    },
  });

  const adminBandung = await prisma.user.upsert({
    where: { email: 'admin.bandung@maslahat-tani.com' },
    update: {
      role: Role.ADMIN,
      shopId: shopBandung.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin.bandung@maslahat-tani.com',
      username: 'adminbandung',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      shopId: shopBandung.id,
    },
  });

  // Set shop owner ke admin masing-masing
  await prisma.shop.update({
    where: { id: shopPusat.id },
    data: { ownerId: adminPusat.id },
  });
  await prisma.shop.update({
    where: { id: shopBandung.id },
    data: { ownerId: adminBandung.id },
  });

  console.log(`✅ Admin Pusat: ${adminPusat.email} / Admin123!`);
  console.log(`✅ Admin Bandung: ${adminBandung.email} / Admin123!`);

  // ============================================
  // KASIRS (1 per cabang)
  // ============================================
  const kasirPassword = await bcrypt.hash('Kasir123!', 12);

  // Existing kasir@maslahat-tani.com (backward compat) → tetap di Pusat
  const kasirLegacy = await prisma.user.upsert({
    where: { email: 'kasir@maslahat-tani.com' },
    update: {
      role: Role.KASIR,
      shopId: shopPusat.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'kasir@maslahat-tani.com',
      username: 'kasir1',
      passwordHash: kasirPassword,
      role: Role.KASIR,
      status: UserStatus.ACTIVE,
      shopId: shopPusat.id,
    },
  });

  const kasirBandung = await prisma.user.upsert({
    where: { email: 'kasir.bandung@maslahat-tani.com' },
    update: {
      role: Role.KASIR,
      shopId: shopBandung.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'kasir.bandung@maslahat-tani.com',
      username: 'kasirbandung',
      passwordHash: kasirPassword,
      role: Role.KASIR,
      status: UserStatus.ACTIVE,
      shopId: shopBandung.id,
    },
  });

  console.log(`✅ Kasir Pusat: ${kasirLegacy.email} / Kasir123!`);
  console.log(`✅ Kasir Bandung: ${kasirBandung.email} / Kasir123!`);

  // ============================================
  // PRODUCTS + STOCK (per cabang, beda set untuk verifikasi shop scoping)
  // ============================================
  const productsPusat = [
    { name: 'Beras 5kg', sku: 'BRS-5KG', price: 75_000, cost: 60_000, stock: 50 },
    { name: 'Minyak Goreng 1L', sku: 'MYK-1L', price: 18_000, cost: 15_000, stock: 30 },
    { name: 'Gula Pasir 1kg', sku: 'GLA-1KG', price: 16_000, cost: 13_000, stock: 40 },
    { name: 'Telur 1 Rak', sku: 'TLR-1RK', price: 45_000, cost: 38_000, stock: 20 },
    { name: 'Indomie Goreng', sku: 'IDM-GRG', price: 3_500, cost: 2_800, stock: 100 },
    { name: 'Aqua 600ml', sku: 'AQA-600', price: 4_000, cost: 3_000, stock: 80 },
    { name: 'Sabun Lifebuoy', sku: 'SBN-LFB', price: 5_000, cost: 3_500, stock: 25 },
    { name: 'Rokok Surya 16', sku: 'RKK-SR16', price: 28_000, cost: 25_000, stock: 15 },
  ];

  const productsBandung = [
    { name: 'Beras 5kg Premium', sku: 'BRS-5KG-PRM', price: 80_000, cost: 65_000, stock: 30 },
    { name: 'Minyak Bimoli 2L', sku: 'BIM-2L', price: 36_000, cost: 30_000, stock: 25 },
    { name: 'Kopi Kapal Api Sachet', sku: 'KPI-SCH', price: 1_500, cost: 1_200, stock: 200 },
    { name: 'Susu UHT 1L', sku: 'SUSU-1L', price: 22_000, cost: 18_000, stock: 30 },
    { name: 'Mie Sedaap', sku: 'SDP-GRG', price: 3_500, cost: 2_800, stock: 80 },
    { name: 'Le Minerale 600ml', sku: 'LMN-600', price: 4_000, cost: 3_000, stock: 60 },
    { name: 'Pasta Gigi Pepsodent', sku: 'PSD-PG', price: 12_000, cost: 9_500, stock: 20 },
    { name: 'Sampo Sachet Clear', sku: 'CLR-SCH', price: 1_000, cost: 700, stock: 150 },
  ];

  await seedShopProducts(shopPusat.id, productsPusat);
  await seedShopProducts(shopBandung.id, productsBandung);

  console.log(`✅ ${productsPusat.length} produk + stok untuk Pusat`);
  console.log(`✅ ${productsBandung.length} produk + stok untuk Bandung`);

  console.log('');
  console.log('🎉 Seeding selesai!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   ┌─ Super Admin (akses semua cabang) ─────────────────────');
  console.log('   │ admin@maslahat-tani.com / Admin123!');
  console.log('   ├─ Admin Pusat ──────────────────────────────────────────');
  console.log('   │ admin.pusat@maslahat-tani.com / Admin123!');
  console.log('   ├─ Admin Bandung ────────────────────────────────────────');
  console.log('   │ admin.bandung@maslahat-tani.com / Admin123!');
  console.log('   ├─ Kasir Pusat ──────────────────────────────────────────');
  console.log('   │ kasir@maslahat-tani.com / Kasir123!');
  console.log('   └─ Kasir Bandung ────────────────────────────────────────');
  console.log('     kasir.bandung@maslahat-tani.com / Kasir123!');
  console.log('');
  console.log('🏪 Cabang:');
  console.log('   - Maslahat Tani Pusat (Bekasi)');
  console.log('   - Maslahat Tani — Cabang Bandung');
}

interface ProductSeed {
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
}

async function seedShopProducts(shopId: string, products: ProductSeed[]) {
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { shopId_sku: { shopId, sku: p.sku } },
      update: {
        name: p.name,
        price: p.price,
        cost: p.cost,
      },
      create: {
        shopId,
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
      },
    });

    const stock = await prisma.stock.upsert({
      where: {
        shopId_productId_warehouse: {
          shopId,
          productId: product.id,
          warehouse: 'main',
        },
      },
      update: {},
      create: {
        shopId,
        productId: product.id,
        quantity: p.stock,
        warehouse: 'main',
      },
    });

    const existingHistory = await prisma.stockHistory.findFirst({
      where: { stockId: stock.id },
    });

    if (!existingHistory) {
      await prisma.stockHistory.create({
        data: {
          stockId: stock.id,
          type: 'IN',
          quantityBefore: 0,
          quantityAfter: p.stock,
          quantityChange: p.stock,
          notes: 'Stok awal (seed)',
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
