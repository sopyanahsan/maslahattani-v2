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
    name: 'home',
    component: () => import('@/admin/views/HomeView.vue'),
    meta: { title: 'Maslahat Tani v2' },
  },
  {
    path: '/showcase',
    name: 'showcase',
    component: () => import('@/admin/views/ShowcaseView.vue'),
    meta: { title: 'UI Showcase — Maslahat Tani' },
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

  // === Admin Routes — pakai AdminLayout sebagai shell ===
  {
    path: '/admin',
    component: () => import('@/admin/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'SUPER_ADMIN'] },
    redirect: { name: 'admin-dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/admin/views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
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
        path: 'stock',
        name: 'admin-stock',
        component: () => import('@/admin/views/AdminStockView.vue'),
        meta: {
          title: 'Stok & Inventaris',
          description: 'Overview stok, restok, opname, dan riwayat pergerakan.',
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
        path: 'kasir',
        name: 'admin-kasir',
        component: () => import('@/admin/views/AdminKasirView.vue'),
        meta: {
          title: 'Kasir',
          description: 'Kelola akun kasir, reset password, assign toko.',
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
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'Laporan',
          description: 'Laporan penjualan harian, bulanan, dan laba kotor.',
        },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/admin/views/AdminSettingsView.vue'),
        meta: {
          title: 'Pengaturan',
          description: 'Konfigurasi toko, struk, bahasa, dan preferensi sistem.',
        },
      },

      // === BRILink (Phase 2) — semua placeholder dulu ===
      {
        path: 'brilink/transfer',
        name: 'admin-brilink-transfer',
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Transfer',
          description:
            'Kirim dana antar rekening BRI dan ke bank lain dengan kalkulasi fee otomatis.',
          phase: 2,
        },
      },
      {
        path: 'brilink/cash',
        name: 'admin-brilink-cash',
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Tarik Tunai',
          description: 'Layani penarikan tunai pelanggan dari rekening BRI.',
          phase: 2,
        },
      },
      {
        path: 'brilink/topup',
        name: 'admin-brilink-topup',
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Top Up & Pulsa',
          description:
            'Top-up e-wallet, pulsa, paket data, dan token PLN dalam satu antarmuka.',
          phase: 2,
        },
      },
      {
        path: 'brilink/mutations',
        name: 'admin-brilink-mutations',
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Mutasi',
          description:
            'Riwayat transaksi BRILink dengan filter per kategori dan rekonsiliasi saldo BRI.',
          phase: 2,
        },
      },
      {
        path: 'brilink/fees',
        name: 'admin-brilink-fees',
        component: () => import('@/admin/views/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Pengaturan Fee',
          description: 'Atur margin fee per nominal dan jenis transaksi.',
          phase: 2,
        },
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

  // Guest-only: redirect user yang sudah login ke dashboard atau shop selection
  if (guestOnly && authStore.isAuthenticated) {
    if (authStore.requireShopSelection) {
      return next({ name: 'admin-select-shop' });
    }
    if (authStore.isAdmin) return next({ name: 'admin-dashboard' });
    // User non-admin akses admin domain → ke home (atau bisa redirect ke webapp)
    return next({ name: 'home' });
  }

  // Protected: belum login → redirect ke admin login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } });
  }

  // Role-based access control
  if (requiresAuth && allowedRoles && authStore.user) {
    if (!allowedRoles.includes(authStore.user.role)) {
      // Role mismatch (misal kasir nyangkut di admin domain)
      authStore.clearAuth();
      return next({ name: 'admin-login' });
    }
  }

  // Shop selection enforcement: user yang authed tapi belum punya shopId
  // (super-admin yang baru login) harus pilih cabang dulu, kecuali halaman
  // selectnya sendiri yang allowMissingShop=true.
  if (
    requiresAuth &&
    authStore.isAuthenticated &&
    authStore.requireShopSelection &&
    !allowMissingShop
  ) {
    return next({ name: 'admin-select-shop' });
  }

  next();
});

// Update document title on route change
router.afterEach((to) => {
  const explicit = getMeta<string>(to, 'title');
  document.title = explicit ? `${explicit} — Maslahat Tani` : 'Maslahat Tani v2';
});

export default router;
