import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';

/**
 * Router untuk bundle WEBAPP (maslahattani.my.id).
 * Untuk kasir POS retail + BRILink (Phase 2).
 *
 * Hanya berisi route kasir/operator. Admin panel punya router sendiri di
 * src/admin/router.ts.
 */
const routes: RouteRecordRaw[] = [
  // === Auth (Guest Only) ===
  {
    path: '/login',
    name: 'login',
    component: () => import('@/webapp/views/LoginView.vue'),
    meta: { title: 'Masuk Kasir', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/webapp/views/LoginView.vue'), // Placeholder — register page diisi nanti
    meta: { title: 'Daftar Kasir', guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/webapp/views/LoginView.vue'), // Placeholder
    meta: { title: 'Lupa Password', guestOnly: true },
  },

  // === App Shell (KasirLayout) ===
  {
    path: '/',
    component: () => import('@/webapp/layouts/KasirLayout.vue'),
    meta: {
      requiresAuth: true,
      roles: ['KASIR', 'CASHIER_SUPERVISOR'],
    },
    redirect: { name: 'webapp-dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'webapp-dashboard',
        component: () => import('@/webapp/views/DashboardView.vue'),
        meta: { title: 'Dashboard Kasir' },
      },

      // === Retail (Phase 1) ===
      {
        path: 'retail/pos',
        name: 'webapp-retail-pos',
        component: () => import('@/webapp/views/POSView.vue'),
        meta: {
          title: 'Kasir Retail — POS',
          description:
            'Cari produk, atur qty, pilih metode bayar, checkout. POS kasir retail.',
        },
      },
      {
        path: 'retail/history',
        name: 'webapp-retail-history',
        component: () => import('@/webapp/views/TransactionHistoryView.vue'),
        meta: {
          title: 'Riwayat Transaksi',
          description: 'Daftar transaksi yang Anda kerjakan hari ini.',
        },
      },
      {
        path: 'retail/shift',
        name: 'webapp-retail-shift',
        component: () => import('@/webapp/views/ShiftView.vue'),
        meta: {
          title: 'Shift Kasir',
          description: 'Buka shift di awal jam kerja, tutup shift dengan input nominal kas fisik.',
        },
      },

      // === BRILink ===
      {
        path: 'brilink/menu',
        name: 'webapp-brilink-menu',
        component: () => import('@/webapp/views/BrilinkMenuView.vue'),
        meta: { title: 'BRILink — Menu' },
      },
      {
        path: 'brilink/transaction',
        name: 'webapp-brilink-transaction',
        component: () => import('@/webapp/views/BrilinkTransactionView.vue'),
        meta: { title: 'BRILink — Transaksi' },
      },

      // === Receipt ===
      {
        path: 'retail/receipt',
        name: 'webapp-receipt',
        component: () => import('@/webapp/views/ReceiptView.vue'),
        meta: { title: 'Struk Pembayaran' },
      },
    ],
  },

  // === Stock Opname (Public — no auth required, uses passcode) ===
  {
    path: '/opname',
    name: 'webapp-opname-join',
    component: () => import('@/webapp/views/OpnameJoinView.vue'),
    meta: { title: 'Stock Opname', public: true },
  },
  {
    path: '/opname/count/:sessionId',
    name: 'webapp-opname-count',
    component: () => import('@/webapp/views/OpnameCountView.vue'),
    meta: { title: 'Hitung Stok', public: true },
    props: true,
  },

  // === 404 ===
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/views/NotFoundView.vue'),
    meta: { title: '404 - Not Found' },
  },
];

// Base URL berbeda antara dev & prod:
// - DEV (npm run dev): index.html di-served dari /webapp/index.html oleh Vite
//   multi-entry → vue-router base harus '/webapp/' supaya match URL.
// - PROD (nginx): webapp domain root di maslahattani.my.id, nginx fallback
//   semua path ke /webapp/index.html, tapi URL di browser tetap '/login',
//   '/dashboard', dst → vue-router base '/'.
const ROUTER_BASE = import.meta.env.DEV ? '/webapp/' : '/';

const router = createRouter({
  history: createWebHistory(ROUTER_BASE),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

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

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Public pages (like opname join) skip all auth checks
  const isPublic = getMeta<boolean>(to, 'public');
  if (isPublic) return next();

  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUser();
  }

  const guestOnly = getMeta<boolean>(to, 'guestOnly');
  const requiresAuth =
    hasMeta(to, 'requiresAuth') && !!getMeta<boolean>(to, 'requiresAuth');
  const allowedRoles = getMeta<string[]>(to, 'roles');

  if (guestOnly && authStore.isAuthenticated) {
    return next({ name: 'webapp-dashboard' });
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (requiresAuth && allowedRoles && authStore.user) {
    if (!allowedRoles.includes(authStore.user.role)) {
      // Role mismatch (mis. admin nyangkut di webapp) → logout & redirect ke login
      authStore.clearAuth();
      return next({ name: 'login' });
    }
  }

  next();
});

router.afterEach((to) => {
  const explicit = getMeta<string>(to, 'title');
  document.title = explicit ? `${explicit} — Maslahat Tani` : 'Maslahat Tani';
});

export default router;
