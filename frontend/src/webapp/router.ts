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
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'Kasir Retail — POS',
          description:
            'Scan/cari produk, atur qty, pilih metode bayar, cetak struk. POS lengkap akan tersedia di iterasi B.',
        },
      },
      {
        path: 'retail/history',
        name: 'webapp-retail-history',
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'Riwayat Transaksi',
          description: 'Daftar transaksi yang Anda kerjakan hari ini & shift sebelumnya.',
        },
      },
      {
        path: 'retail/shift',
        name: 'webapp-retail-shift',
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'Shift Kasir',
          description: 'Buka shift di awal jam kerja, tutup shift dengan input nominal kas fisik.',
        },
      },

      // === BRILink (Phase 2) ===
      {
        path: 'brilink/transfer',
        name: 'webapp-brilink-transfer',
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'BRILink — Transfer',
          description: 'Kirim dana antar bank dengan kalkulasi fee otomatis.',
          phase: 2,
        },
      },
      {
        path: 'brilink/cash',
        name: 'webapp-brilink-cash',
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'BRILink — Tarik Tunai',
          description: 'Layani penarikan tunai pelanggan dari rekening BRI.',
          phase: 2,
        },
      },
      {
        path: 'brilink/topup',
        name: 'webapp-brilink-topup',
        component: () => import('@/webapp/views/PlaceholderView.vue'),
        meta: {
          title: 'BRILink — Top Up',
          description: 'Top-up e-wallet, pulsa, paket data, dan token PLN.',
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
  // Base "/" — webapp di-deploy di domain root (maslahattani.my.id).
  // Nginx config: try_files $uri $uri/ /webapp/index.html, jadi semua path
  // path apapun fallback ke /webapp/index.html, lalu vue-router yang resolve
  // berdasarkan window.location.pathname.
  history: createWebHistory('/'),
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
