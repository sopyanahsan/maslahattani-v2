import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Maslahat Tani v2' },
  },
  {
    path: '/showcase',
    name: 'showcase',
    component: () => import('@/views/ShowcaseView.vue'),
    meta: { title: 'UI Showcase — Maslahat Tani' },
  },

  // === Auth Routes (Guest Only) ===
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
    meta: { title: 'Admin Login', guestOnly: true },
  },
  {
    path: '/kasir/login',
    name: 'kasir-login',
    component: () => import('@/views/kasir/LoginView.vue'),
    meta: { title: 'Kasir Login', guestOnly: true },
  },
  {
    path: '/kasir/register',
    name: 'kasir-register',
    component: () => import('@/views/kasir/LoginView.vue'), // Placeholder until register page is built
    meta: { title: 'Daftar Kasir', guestOnly: true },
  },
  {
    path: '/kasir/forgot-password',
    name: 'kasir-forgot-password',
    component: () => import('@/views/kasir/LoginView.vue'), // Placeholder until forgot-password page is built
    meta: { title: 'Lupa Password', guestOnly: true },
  },

  // === Protected Routes (Kasir) ===
  {
    path: '/kasir/dashboard',
    name: 'kasir-dashboard',
    component: () => import('@/views/HomeView.vue'), // Placeholder
    meta: {
      title: 'Dashboard Kasir',
      requiresAuth: true,
      roles: ['KASIR', 'CASHIER_SUPERVISOR'],
    },
  },

  // === Protected Routes (Admin) — pakai AdminLayout sebagai shell ===
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'SUPER_ADMIN'] },
    redirect: { name: 'admin-dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'transactions',
        name: 'admin-transactions',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Transaksi',
          description: 'List transaksi, void, detail receipt akan tersedia di sini.',
        },
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Produk & Stok',
          description: 'Master produk, stok in/out, opname, transfer antar gudang.',
        },
      },
      {
        path: 'debts',
        name: 'admin-debts',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Hutang',
          description: 'Daftar hutang aktif, jatuh tempo, dan riwayat pembayaran.',
        },
      },
      {
        path: 'payments',
        name: 'admin-payments',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Pembayaran',
          description: 'Mutasi kas, QRIS, transfer, dan rekonsiliasi.',
        },
      },
      {
        path: 'shifts',
        name: 'admin-shifts',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Shift',
          description:
            'Buka shift di pagi hari, tutup di sore dengan input nominal kas fisik. Sistem otomatis hitung selisih (variance) untuk audit kas harian.',
        },
      },
      {
        path: 'kasir',
        name: 'admin-kasir',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Kasir',
          description: 'Kelola akun kasir, reset password, assign toko.',
        },
      },
      {
        path: 'shops',
        name: 'admin-shops',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Cabang',
          description:
            'Kelola toko / cabang — setiap cabang punya stok, kasir, dan laporan terpisah. Transfer antar cabang akan tersedia di Phase 2.',
        },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Laporan',
          description: 'Laporan penjualan harian, bulanan, dan laba kotor.',
        },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'Pengaturan',
          description: 'Konfigurasi toko, struk, bahasa, dan preferensi sistem.',
        },
      },

      // === BRILink (Phase 2) — semua placeholder dulu ===
      {
        path: 'brilink/transfer',
        name: 'admin-brilink-transfer',
        component: () => import('@/views/admin/ComingSoonView.vue'),
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
        component: () => import('@/views/admin/ComingSoonView.vue'),
        meta: {
          title: 'BRILink — Tarik Tunai',
          description: 'Layani penarikan tunai pelanggan dari rekening BRI.',
          phase: 2,
        },
      },
      {
        path: 'brilink/topup',
        name: 'admin-brilink-topup',
        component: () => import('@/views/admin/ComingSoonView.vue'),
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
        component: () => import('@/views/admin/ComingSoonView.vue'),
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
        component: () => import('@/views/admin/ComingSoonView.vue'),
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
    component: () => import('@/views/NotFoundView.vue'),
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

function getMeta<T = unknown>(route: RouteLocationNormalized, key: string): T | undefined {
  for (let i = route.matched.length - 1; i >= 0; i--) {
    const value = route.matched[i].meta[key as keyof typeof route.matched[number]['meta']];
    if (value !== undefined) return value as T;
  }
  return undefined;
}

// Navigation Guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Kalau ada token di localStorage tapi user object belum di-load, ambil profil dulu.
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUser();
  }

  const guestOnly = getMeta<boolean>(to, 'guestOnly');
  const requiresAuth = hasMeta(to, 'requiresAuth') && !!getMeta<boolean>(to, 'requiresAuth');
  const allowedRoles = getMeta<string[]>(to, 'roles');

  // Guest-only: redirect user yang sudah login ke dashboard masing-masing
  if (guestOnly && authStore.isAuthenticated) {
    if (authStore.isAdmin) return next({ name: 'admin-dashboard' });
    return next({ name: 'kasir-dashboard' });
  }

  // Protected: belum login → redirect ke login yang sesuai
  if (requiresAuth && !authStore.isAuthenticated) {
    if (allowedRoles?.includes('ADMIN') || allowedRoles?.includes('SUPER_ADMIN')) {
      return next({ name: 'admin-login', query: { redirect: to.fullPath } });
    }
    return next({ name: 'kasir-login', query: { redirect: to.fullPath } });
  }

  // Role-based access control
  if (requiresAuth && allowedRoles && authStore.user) {
    if (!allowedRoles.includes(authStore.user.role)) {
      // Role mismatch → redirect ke dashboard yang sesuai role-nya
      if (authStore.isAdmin) return next({ name: 'admin-dashboard' });
      return next({ name: 'kasir-dashboard' });
    }
  }

  next();
});

// Update document title on route change
router.afterEach((to) => {
  const explicit = getMeta<string>(to, 'title');
  document.title = explicit ? `${explicit} — Maslahat Tani` : 'Maslahat Tani v2';
});

export default router;
