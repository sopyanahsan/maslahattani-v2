import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
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
    component: () => import('@/views/kasir/RegisterView.vue'),
    meta: { title: 'Daftar Kasir', guestOnly: true },
  },
  {
    path: '/kasir/forgot-password',
    name: 'kasir-forgot-password',
    component: () => import('@/views/kasir/ForgotPasswordView.vue'),
    meta: { title: 'Lupa Password', guestOnly: true },
  },

  // === Protected Routes (Kasir) ===
  {
    path: '/kasir/dashboard',
    name: 'kasir-dashboard',
    component: () => import('@/views/HomeView.vue'), // Placeholder
    meta: { title: 'Dashboard Kasir', requiresAuth: true, roles: ['KASIR', 'CASHIER_SUPERVISOR'] },
  },

  // === Protected Routes (Admin) ===
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('@/views/HomeView.vue'), // Placeholder
    meta: { title: 'Dashboard Admin', requiresAuth: true, roles: ['ADMIN', 'SUPER_ADMIN'] },
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

// Navigation Guard
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Guest-only routes: redirect authenticated users away
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      return next({ name: 'admin-dashboard' });
    }
    return next({ name: 'kasir-dashboard' });
  }

  // Protected routes: redirect unauthenticated users to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const roles = to.meta.roles as string[] | undefined;
    if (roles?.includes('ADMIN') || roles?.includes('SUPER_ADMIN')) {
      return next({ name: 'admin-login', query: { redirect: to.fullPath } });
    }
    return next({ name: 'kasir-login', query: { redirect: to.fullPath } });
  }

  // Role-based access control
  if (to.meta.requiresAuth && to.meta.roles && authStore.user) {
    const allowedRoles = to.meta.roles as string[];
    if (!allowedRoles.includes(authStore.user.role)) {
      // Redirect to appropriate dashboard
      if (authStore.isAdmin) {
        return next({ name: 'admin-dashboard' });
      }
      return next({ name: 'kasir-dashboard' });
    }
  }

  next();
});

// Update document title on route change
router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Maslahat Tani v2';
  document.title = title;
});

export default router;
