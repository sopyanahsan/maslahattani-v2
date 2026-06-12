import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';

/**
 * Router untuk bundle ADMIN (admin.maslahattani.my.id).
 * Hanya berisi route admin panel — kasir/webapp punya router sendiri.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/landing/LandingPage.vue'),
    meta: { title: 'Posify — Sistem POS Modern untuk UMKM' },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/admin/views/HomeView.vue'),
    meta: { title: 'Posify' },
  },
  {
    path: '/showcase',
    name: 'showcase',
    component: () => import('@/admin/views/ShowcaseView.vue'),
    meta: { title: 'UI Showcase — Posify' },
  },

  // === Owner Dashboard (platform owner only — tenantId must be null) ===
  {
    path: '/owner',
    name: 'owner-dashboard',
    component: () => import('@/owner/OwnerDashboard.vue'),
    meta: { title: 'Posify Owner Dashboard', requiresAuth: true, roles: ['SUPER_ADMIN'], platformOwnerOnly: true },
  },

  // === Admin Auth (Guest Only) ===
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/admin/views/LoginView.vue'),
    meta: { title: 'Admin Login', guestOnly: true },
  },
  {
    path: '/admin/select-shop',
    name: 'admin-select-shop',
    // Lazy: ShopSelectionView dibuat di task #13
    component: () => import('@/admin/views/ShopSelectionView.vue'),
    meta: {
      title: 'Pilih Cabang',
      requiresAuth: true,
      // Halaman ini di-akses dgn token yang shopId-nya masih null (super-admin
      // baru login). Tidak butuh shopId.
      allowMissingShop: true,
    },
  },

  // === Get Started (Onboarding wizard — no layout, full-screen) ===
  {
    path: '/admin/get-started',
    name: 'admin-get-started',
    component: () => import('@/admin/views/GetStartedView.vue'),
    meta: {
      title: 'Setup Toko — Posify',
      requiresAuth: true,
      roles: ['ADMIN', 'SUPER_ADMIN'],
      allowMissingShop: true,
    },
  },

  // === Admin Routes — pakai AdminLayout sebagai shell ===
  {
    path: '/admin',
    component: () => import('@/admin/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'SUPER_ADMIN'] },
    redirect: { name: 'admin-home' },
    children: [
      {
        path: 'home',
        name: 'admin-home',
        component: () => import('@/admin/views/AdminHomeView.vue'),
        meta: {
          title: 'Home',
          description: 'Pintu masuk dashboard Retail dan BRILink.',
        },
      },
      {
        path: 'profil',
        name: 'admin-profil',
        component: () => import('@/admin/views/ProfilView.vue'),
        meta: {
          title: 'Profil Saya',
          description: 'Kelola data pribadi, password, dan keamanan akun.',
        },
      },
      {
        path: 'kas-retail',
        name: 'admin-kas-retail',
        component: () => import('@/admin/views/KasRetailView.vue'),
        meta: {
          title: 'Kas Retail',
          description: 'Mutasi kas retail dan pengaturan metode kas.',
        },
      },
      {
        path: 'kas-rekening-brilink',
        name: 'admin-kas-rekening-brilink',
        component: () => import('@/admin/views/KasRekeningBrilinkView.vue'),
        meta: {
          title: 'Kas & Rekening BRILink',
          description: 'Mutasi saldo, daftar rekening BRI, dan metode kas BRILink.',
        },
      },
      {
        path: 'brilink/transaksi',
        name: 'admin-brilink-transaksi',
        component: () => import('@/admin/views/BrilinkTransaksiView.vue'),
        meta: {
          title: 'Transaksi BRILink',
          description: 'Daftar transaksi BRILink — transfer, tarik tunai, top-up, PLN.',
        },
      },
      {
        path: 'brilink/fee',
        name: 'admin-brilink-fee',
        component: () => import('@/admin/views/BrilinkFeeView.vue'),
        meta: {
          title: 'Pengaturan Fee BRILink',
          description: 'Atur margin fee per nominal dan jenis transaksi.',
        },
      },
      {
        path: 'brilink/laporan',
        name: 'admin-brilink-report',
        component: () => import('@/admin/views/BrilinkReportView.vue'),
        meta: {
          title: 'Laporan BRILink',
          description: 'Laporan volume, fee, trend harian, dan performa kasir BRILink.',
        },
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/admin/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard Retail',
          description: 'Ringkasan operasional toko hari ini.',
        },
      },
      {
        path: 'transactions',
        name: 'admin-transactions',
        component: () => import('@/admin/views/AdminTransactionsView.vue'),
        meta: {
          title: 'Transaksi',
          description: 'Riwayat transaksi retail, filter by tanggal/status, detail & void.',
        },
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/admin/views/AdminProductsView.vue'),
        meta: {
          title: 'Produk & Stok',
          description: 'Master produk, harga jual & modal, stok per cabang.',
        },
      },
      {
        path: 'product-categories',
        name: 'admin-product-categories',
        component: () => import('@/admin/views/ProductCategoriesView.vue'),
        meta: {
          title: 'Kategori Produk',
          description: 'Kelola kategori produk (Makanan, Minuman, Sembako, dll).',
        },
      },
      {
        path: 'stock',
        name: 'admin-stock',
        component: () => import('@/admin/views/AdminStockView.vue'),
        meta: {
          title: 'Stok & Inventaris',
          description: 'Overview stok, restok, opname, dan riwayat pergerakan.',
        },
      },
      {
        path: 'riwayat-stok',
        name: 'admin-riwayat-stok',
        component: () => import('@/admin/views/RiwayatStokView.vue'),
        meta: {
          title: 'Riwayat Stok',
          description: 'Riwayat lengkap keluar masuk barang — siapa, dari mana, metode bayar.',
        },
      },
      {
        path: 'cetak-label',
        name: 'admin-cetak-label',
        component: () => import('@/admin/views/CetakLabelView.vue'),
        meta: {
          title: 'Cetak Label',
          description: 'Generate & cetak barcode label produk untuk A4 atau printer label.',
        },
      },
      {
        path: 'racks',
        name: 'admin-racks',
        component: () => import('@/admin/views/AdminRacksView.vue'),
        meta: {
          title: 'Label Rak',
          description: 'Kelola zona & rak, mapping produk, cetak label rak (QR Code).',
        },
      },
      {
        path: 'debts',
        name: 'admin-debts',
        component: () => import('@/admin/views/AdminDebtsView.vue'),
        meta: {
          title: 'Hutang',
          description: 'Daftar hutang aktif, jatuh tempo, dan riwayat pembayaran.',
        },
      },
      {
        path: 'customers',
        name: 'admin-customers',
        component: () => import('@/admin/views/AdminCustomersView.vue'),
        meta: {
          title: 'Customer',
          description: 'Kelola data pelanggan — anti-double name per cabang.',
        },
      },
      {
        path: 'customers/:id',
        name: 'admin-customer-detail',
        component: () => import('@/admin/views/AdminCustomerDetailView.vue'),
        meta: {
          title: 'Detail Customer',
          description: 'Riwayat pembelian, statistik, dan produk favorit customer.',
        },
      },
      {
        path: 'payments',
        name: 'admin-payments',
        component: () => import('@/admin/views/AdminPaymentsView.vue'),
        meta: {
          title: 'Pembayaran',
          description: 'Mutasi kas, saldo toko, audit, dan riwayat pembayaran per metode.',
        },
      },
      {
        path: 'shifts',
        name: 'admin-shifts',
        component: () => import('@/admin/views/AdminShiftsView.vue'),
        meta: {
          title: 'Shift',
          description:
            'Daftar shift kasir per cabang. Filter by status & tanggal, lihat detail variance, dan finalisasi shift yang sudah ditutup.',
        },
      },
      {
        path: 'shifts/:id',
        name: 'admin-shift-detail',
        component: () => import('@/admin/views/AdminShiftDetailView.vue'),
        meta: {
          title: 'Detail Shift',
          description:
            'Rincian shift kasir, breakdown variance per kategori, transaksi, dan tombol finalisasi.',
        },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/admin/views/AdminKasirView.vue'),
        meta: {
          title: 'User & Akun',
          description: 'Kelola akun kasir & admin cabang, reset password, assign toko.',
        },
      },
      {
        path: 'shops',
        name: 'admin-shops',
        component: () => import('@/admin/views/AdminShopsView.vue'),
        meta: {
          title: 'Cabang',
          description:
            'Kelola toko / cabang — setiap cabang punya stok, kasir, dan laporan terpisah.',
        },
      },
      {
        path: 'cashbox-categories',
        name: 'admin-cashbox-categories',
        component: () => import('@/admin/views/CashBoxCategoriesView.vue'),
        meta: {
          title: 'Kategori Cashbox',
          description:
            'Kelola kategori kas terpisah (Retail, Subsidi Pupuk, dst). Hanya super-admin yang bisa CRUD.',
        },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/admin/views/AdminReportsView.vue'),
        meta: {
          title: 'Laporan',
          description: 'Laporan penjualan harian, bulanan, laba kotor, dan breakdown metode bayar.',
        },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/admin/views/AdminSettingsView.vue'),
        meta: {
          title: 'Pengaturan',
          description: 'Konfigurasi toko, struk, bahasa, sistem ON/OFF, dan preferensi.',
        },
      },
      {
        path: 'integrasi-api',
        name: 'admin-integrasi-api',
        component: () => import('@/admin/views/IntegrasiApiView.vue'),
        meta: {
          title: 'Integrasi API',
          description: 'Kelola koneksi API pihak ketiga — Tripay PPOB, webhook.',
        },
      },
      {
        path: 'billing',
        name: 'admin-billing',
        component: () => import('@/admin/views/BillingView.vue'),
        meta: {
          title: 'Billing & Langganan',
          description: 'Pilih paket, bayar, dan kelola langganan Posify.',
        },
      },
      {
        path: 'super-admin-settings',
        name: 'super-admin-settings',
        component: () => import('@/admin/views/SuperAdminSettingsView.vue'),
        meta: {
          title: 'Pengaturan Super Admin',
          description: 'Role & Permission, Audit Log, System Settings, Danger Zone.',
          roles: ['SUPER_ADMIN'],
        },
      },

      // === Inventaris (Coming Soon) ===
      {
        path: 'opname-sessions',
        name: 'admin-opname-sessions',
        component: () => import('@/admin/views/AdminOpnameSessionsView.vue'),
        meta: {
          title: 'Opname',
          description: 'Sesi stock opname untuk verifikasi stok fisik.',
        },
      },
      {
        path: 'suppliers',
        name: 'admin-suppliers',
        component: () => import('@/admin/views/AdminSuppliersView.vue'),
        meta: {
          title: 'Supplier & PO',
          description: 'Kelola supplier dan purchase order.',
        },
      },
      {
        path: 'transfers',
        name: 'admin-transfers',
        component: () => import('@/admin/views/AdminTransfersView.vue'),
        meta: {
          title: 'Transfer Stok',
          description: 'Transfer stok antar cabang dengan alur persetujuan.',
        },
      },

      // === Analytics ===
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: () => import('@/admin/views/AdminAnalyticsView.vue'),
        meta: {
          title: 'Analytics',
          description: 'Dashboard analitik bisnis — KPI, chart, insight.',
        },
      },

      // === BRILink ===
      {
        path: 'brilink',
        name: 'admin-brilink',
        component: () => import('@/admin/views/AdminBrilinkView.vue'),
        meta: {
          title: 'BRILink',
          description: 'Dashboard layanan BRILink — transfer, tarik tunai, top-up, dan mutasi.',
        },
      },
      // Redirects — sub-pages merged into consolidated views
      {
        path: 'brilink/transfer',
        redirect: { name: 'admin-brilink-transaksi' },
      },
      {
        path: 'brilink/cash',
        redirect: { name: 'admin-brilink-transaksi' },
      },
      {
        path: 'brilink/topup',
        redirect: { name: 'admin-brilink-transaksi' },
      },
      {
        path: 'brilink/mutations',
        redirect: { name: 'admin-kas-rekening-brilink' },
      },
      {
        path: 'brilink/fees',
        redirect: { name: 'admin-brilink-fee' },
      },
    ],
  },

  // === 404 ===
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/views/NotFoundView.vue'),
    meta: { title: '404 - Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

// Helper: cek meta di route + semua matched parent
function hasMeta(route: RouteLocationNormalized, key: string): boolean {
  return route.matched.some((r) => key in r.meta);
}

function getMeta<T = unknown>(
  route: RouteLocationNormalized,
  key: string,
): T | undefined {
  for (let i = route.matched.length - 1; i >= 0; i--) {
    const value = route.matched[i].meta[key as keyof (typeof route.matched)[number]['meta']];
    if (value !== undefined) return value as T;
  }
  return undefined;
}

// Navigation Guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Kalau ada token tapi user object belum di-load, fetch profile dulu.
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUser();
  }

  const guestOnly = getMeta<boolean>(to, 'guestOnly');
  const requiresAuth =
    hasMeta(to, 'requiresAuth') && !!getMeta<boolean>(to, 'requiresAuth');
  const allowedRoles = getMeta<string[]>(to, 'roles');
  const allowMissingShop = !!getMeta<boolean>(to, 'allowMissingShop');

  // Guest-only: redirect user yang sudah login ke home
  if (guestOnly && authStore.isAuthenticated) {
    if (authStore.isAdmin) return next({ name: 'admin-home' });
    return next({ name: 'home' });
  }

  // Protected: belum login → redirect ke admin login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } });
  }

  // Role-based access control
  if (requiresAuth && allowedRoles && authStore.user) {
    if (!allowedRoles.includes(authStore.user.role)) {
      // Kasir trying to access admin panel → redirect to webapp
      if (authStore.user.role === 'KASIR' || authStore.user.role === 'CASHIER_SUPERVISOR') {
        return next({ path: '/kasir/login' });
      }
      // Other role mismatch
      authStore.clearAuth();
      return next({ name: 'admin-login' });
    }
  }

  // Platform owner only: must be SUPER_ADMIN without tenantId
  const platformOwnerOnly = !!getMeta<boolean>(to, 'platformOwnerOnly');
  if (platformOwnerOnly && authStore.user) {
    if (authStore.user.role !== 'SUPER_ADMIN' || (authStore.user as any).tenantId) {
      return next({ name: 'admin-home' });
    }
  }

  // Shop selection: super-admin yang baru login tanpa shopId tetap boleh
  // masuk dashboard. Branch switcher di AdminLayout header akan handle
  // pemilihan cabang. Tidak perlu paksa redirect ke select-shop page lagi.

  next();
});

router.afterEach((to) => {
  const explicit = getMeta<string>(to, 'title');
  document.title = explicit ? `${explicit} — Posify` : 'Posify';
});

export default router;
