import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create default SUPER_ADMIN
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@maslahat-tani.com' },
    update: {},
    create: {
      email: 'admin@maslahat-tani.com',
      username: 'superadmin',
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Super Admin: ${admin.email} (password: Admin123!)`);

  // 2. Create default Shop
  const shop = await prisma.shop.upsert({
    where: { id: 'default-shop' },
    update: {},
    create: {
      id: 'default-shop',
      name: 'Toko Maslahat Tani',
      address: 'Jl. Contoh No. 1, Sukabumi',
      phone: '08123456789',
      ownerId: admin.id,
    },
  });

  console.log(`✅ Shop: ${shop.name}`);

  // Assign admin to shop
  await prisma.user.update({
    where: { id: admin.id },
    data: { shopId: shop.id },
  });

  // 3. Create Shop Settings
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

  console.log('✅ Shop Settings created');

  // 4. Create Cash Box
  await prisma.cashBox.upsert({
    where: { shopId: shop.id },
    update: {},
    create: { shopId: shop.id, balance: 0 },
  });

  console.log('✅ Cash Box created');

  // 5. Create sample Kasir
  const kasirPassword = await bcrypt.hash('Kasir123!', 12);

  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@maslahat-tani.com' },
    update: {},
    create: {
      email: 'kasir@maslahat-tani.com',
      username: 'kasir1',
      passwordHash: kasirPassword,
      role: Role.KASIR,
      status: UserStatus.ACTIVE,
      shopId: shop.id,
    },
  });

  console.log(`✅ Kasir: ${kasir.email} (password: Kasir123!)`);

  // 6. Create sample Products
  const products = [
    { name: 'Beras 5kg', sku: 'BRS-5KG', price: 75000, cost: 60000, stock: 50 },
    { name: 'Minyak Goreng 1L', sku: 'MYK-1L', price: 18000, cost: 15000, stock: 30 },
    { name: 'Gula Pasir 1kg', sku: 'GLA-1KG', price: 16000, cost: 13000, stock: 40 },
    { name: 'Telur 1 Rak', sku: 'TLR-1RK', price: 45000, cost: 38000, stock: 20 },
    { name: 'Indomie Goreng', sku: 'IDM-GRG', price: 3500, cost: 2800, stock: 100 },
    { name: 'Aqua 600ml', sku: 'AQA-600', price: 4000, cost: 3000, stock: 80 },
    { name: 'Sabun Lifebuoy', sku: 'SBN-LFB', price: 5000, cost: 3500, stock: 25 },
    { name: 'Rokok Surya 16', sku: 'RKK-SR16', price: 28000, cost: 25000, stock: 15 },
    { name: 'Pulsa 10rb', sku: 'PLS-10K', price: 12000, cost: 10500, stock: 999 },
    { name: 'Token Listrik 50rb', sku: 'TKN-50K', price: 52000, cost: 50000, stock: 999 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { shopId_sku: { shopId: shop.id, sku: p.sku } },
      update: {},
      create: {
        shopId: shop.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
      },
    });

    const stock = await prisma.stock.upsert({
      where: { shopId_productId_warehouse: { shopId: shop.id, productId: product.id, warehouse: 'main' } },
      update: {},
      create: {
        shopId: shop.id,
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

  console.log(`✅ ${products.length} Produk + Stok created`);

  console.log('');
  console.log('🎉 Seeding selesai!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Admin: admin@maslahat-tani.com / Admin123!');
  console.log('   Kasir: kasir@maslahat-tani.com / Kasir123!');
  console.log('');
  console.log('🏪 Default shop: Toko Maslahat Tani');
  console.log(`📦 Products: ${products.length} items`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
