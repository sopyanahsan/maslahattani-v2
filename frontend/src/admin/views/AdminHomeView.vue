<template>
  <div class="space-y-5">
    <!-- Greeting -->
    <div>
      <h1 class="text-2xl font-bold text-slate-950 dark:text-slate-100">
        {{ greeting }}, {{ displayName }} 👋
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ todayLabel }}</p>
    </div>

    <!-- KPI mini cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Omzet Hari Ini</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(store.overview?.kpi.revenue.value ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transaksi</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ store.overview?.kpi.transactions.value ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profit</p>
        <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ formatRupiah(store.overview?.kpi.profit.value ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hutang Aktif</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ store.alerts?.overdueDebts.count ?? 0 }}</p>
      </div>
    </div>

    <!-- 2 main action cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RouterLink
        to="/admin/dashboard"
        class="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl p-6 text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <component :is="DashboardIcon" class="w-6 h-6" />
            </div>
            <h2 class="text-xl font-bold mb-1">Dashboard Retail</h2>
            <p class="text-sm text-blue-100">Grafik penjualan, alerts, dan kategori produk.</p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/brilink"
        class="group bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 rounded-2xl p-6 text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <component :is="LandmarkIcon" class="w-6 h-6" />
            </div>
            <h2 class="text-xl font-bold mb-1">Dashboard BRILink</h2>
            <p class="text-sm text-indigo-100">Transfer, tarik tunai, top-up, fee & mutasi.</p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </div>
      </RouterLink>
    </div>

    <!-- ROW: Top Products + Recent Activity + Payment Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TopProductsTable
        :products="store.topProducts"
        :loading="store.loading.topProducts"
        @select="onSelectProduct"
      />
      <RecentActivityFeed
        :activities="store.recentActivity"
        :loading="store.loading.recentActivity"
      />
      <PaymentBreakdown
        :data="store.paymentBreakdown"
        :loading="store.loading.paymentBreakdown"
      />
    </div>

    <!-- ROW: Operations + Cashier Leaderboard -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <OperationsPanel :data="store.operations" :loading="store.loading.operations" />
      <CashierLeaderboard
        :entries="store.cashierLeaderboard"
        :loading="store.loading.cashierLeaderboard"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  LayoutDashboard as DashboardIcon,
  Landmark as LandmarkIcon,
  ArrowRight as ArrowRightIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useDashboardRetailStore } from '@/shared/stores/dashboard-retail.store';
import TopProductsTable from '@/admin/components/dashboard/TopProductsTable.vue';
import RecentActivityFeed from '@/admin/components/dashboard/RecentActivityFeed.vue';
import PaymentBreakdown from '@/admin/components/dashboard/PaymentBreakdown.vue';
import OperationsPanel from '@/admin/components/dashboard/OperationsPanel.vue';
import CashierLeaderboard from '@/admin/components/dashboard/CashierLeaderboard.vue';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();
const store = useDashboardRetailStore();

const shopId = computed(() => shopStore.currentShopId);

const displayName = computed(() => {
  const u = authStore.user;
  if (!u) return 'Admin';
  return u.username || u.email?.split('@')[0] || 'Admin';
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
});

const todayLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
);

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function onSelectProduct(productId: string) {
  router.push({ path: '/admin/products', query: { id: productId } });
}

onMounted(async () => {
  store.setShopId(shopId.value);
  if (shopId.value) {
    await store.fetchAll();
    store.startAutoRefresh();
  }
});

watch(shopId, async (newId) => {
  store.setShopId(newId);
  if (newId) {
    await store.fetchAll();
    store.startAutoRefresh();
  } else {
    store.stopAutoRefresh();
  }
});

onBeforeUnmount(() => {
  store.teardown();
});
</script>
