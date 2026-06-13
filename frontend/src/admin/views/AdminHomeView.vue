<template>
  <div class="space-y-6 font-sans">
    <!-- Greeting -->
    <div>
      <h1 class="text-2xl font-bold text-slate-950 dark:text-[#e3e2e2] tracking-tight">
        {{ greeting }}, {{ displayName }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-[#869392] mt-1">{{ todayLabel }}</p>
    </div>

    <!-- KPI mini cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#869392]">Omzet Retail</p>
        <p class="text-lg font-bold text-slate-950 dark:text-[#e3e2e2] mt-1 font-mono">{{ formatRupiah(retailStore.overview?.kpi.revenue.value ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#869392]">Transaksi Retail</p>
        <p class="text-lg font-bold text-slate-950 dark:text-[#e3e2e2] mt-1 font-mono">{{ retailStore.overview?.kpi.transactions.value ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
        <p class="text-[10px] font-bold uppercase tracking-widest text-blue-600">Fee BRILink</p>
        <p class="text-lg font-bold text-blue-600 mt-1 font-mono">{{ formatRupiah(brilinkStore.overview?.kpi.feeEarnings.value ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#869392]">Trx BRILink</p>
        <p class="text-lg font-bold text-slate-950 dark:text-[#e3e2e2] mt-1 font-mono">{{ brilinkStore.overview?.kpi.transactions.value ?? 0 }}</p>
      </div>
    </div>

    <!-- 2 main action cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RouterLink
        to="/admin/dashboard"
        class="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white transition-all hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5"
      >
        <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white dark:bg-[#1e2020]/10 pointer-events-none" />
        <div class="relative flex items-start justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-white dark:bg-[#1e2020]/20 flex items-center justify-center mb-3 backdrop-blur-sm">
              <component :is="DashboardIcon" class="w-5 h-5" />
            </div>
            <h2 class="text-lg font-bold mb-1 tracking-tight">Dashboard Retail</h2>
            <p class="text-xs text-white/70">Grafik penjualan, alerts, kategori produk.</p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/brilink"
        class="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg p-6 text-white transition-all hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-0.5"
      >
        <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white dark:bg-[#1e2020]/10 pointer-events-none" />
        <div class="relative flex items-start justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-white dark:bg-[#1e2020]/20 flex items-center justify-center mb-3 backdrop-blur-sm">
              <component :is="LandmarkIcon" class="w-5 h-5" />
            </div>
            <h2 class="text-lg font-bold mb-1 tracking-tight">Dashboard BRILink</h2>
            <p class="text-xs text-white/70">Transfer, tarik tunai, top-up, fee & mutasi.</p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      </RouterLink>
    </div>

    <!-- ROW: Retail — Top Products + Recent Activity + Payment Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TopProductsTable
        :products="retailStore.topProducts"
        :loading="retailStore.loading.topProducts"
        @select="onSelectProduct"
      />
      <RecentActivityFeed
        :activities="retailStore.recentActivity"
        :loading="retailStore.loading.recentActivity"
      />
      <PaymentBreakdown
        :data="retailStore.paymentBreakdown"
        :loading="retailStore.loading.paymentBreakdown"
      />
    </div>

    <!-- ROW: Retail — Operations + Cashier Leaderboard -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <OperationsPanel :data="retailStore.operations" :loading="retailStore.loading.operations" />
      <CashierLeaderboard
        :entries="retailStore.cashierLeaderboard"
        :loading="retailStore.loading.cashierLeaderboard"
      />
    </div>

    <!-- ROW: BRILink — Saldo Rekening + Transaksi Terbaru -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BrilinkAccountsPanel
        :accounts="brilinkStore.accounts"
        :loading="brilinkStore.loading.accounts"
        :error="brilinkStore.errors.accounts"
      />
      <BrilinkRecentTransactions
        :transactions="brilinkStore.recentTransactions"
        :loading="brilinkStore.loading.recentTransactions"
        :error="brilinkStore.errors.recentTransactions"
      />
    </div>

    <!-- ROW: BRILink — Kategori Breakdown + Top Customer -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BrilinkCategoryBreakdown
        :breakdown="brilinkStore.categoryBreakdown"
        :loading="brilinkStore.loading.categoryBreakdown"
        :error="brilinkStore.errors.categoryBreakdown"
      />
      <BrilinkTopCustomers
        :customers="brilinkStore.topCustomers"
        :loading="brilinkStore.loading.topCustomers"
        :error="brilinkStore.errors.topCustomers"
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
import { useDashboardBrilinkStore } from '@/shared/stores/dashboard-brilink.store';

// Retail components
import TopProductsTable from '@/admin/components/dashboard/TopProductsTable.vue';
import RecentActivityFeed from '@/admin/components/dashboard/RecentActivityFeed.vue';
import PaymentBreakdown from '@/admin/components/dashboard/PaymentBreakdown.vue';
import OperationsPanel from '@/admin/components/dashboard/OperationsPanel.vue';
import CashierLeaderboard from '@/admin/components/dashboard/CashierLeaderboard.vue';

// BRILink components
import BrilinkAccountsPanel from '@/admin/components/dashboard-brilink/BrilinkAccountsPanel.vue';
import BrilinkRecentTransactions from '@/admin/components/dashboard-brilink/BrilinkRecentTransactions.vue';
import BrilinkCategoryBreakdown from '@/admin/components/dashboard-brilink/BrilinkCategoryBreakdown.vue';
import BrilinkTopCustomers from '@/admin/components/dashboard-brilink/BrilinkTopCustomers.vue';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();
const retailStore = useDashboardRetailStore();
const brilinkStore = useDashboardBrilinkStore();

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

async function fetchAll() {
  await Promise.allSettled([
    retailStore.fetchAll(),
    brilinkStore.fetchAll(),
  ]);
}

onMounted(async () => {
  if (shopId.value) {
    retailStore.setShopId(shopId.value);
    brilinkStore.setShopId(shopId.value);
    await fetchAll();
    retailStore.startAutoRefresh();
    brilinkStore.startAutoRefresh();
  }
});

watch(shopId, async (newId) => {
  if (newId) {
    retailStore.setShopId(newId);
    brilinkStore.setShopId(newId);
    await fetchAll();
    retailStore.startAutoRefresh();
    brilinkStore.startAutoRefresh();
  } else {
    retailStore.stopAutoRefresh();
    brilinkStore.stopAutoRefresh();
  }
});

onBeforeUnmount(() => {
  retailStore.teardown();
  brilinkStore.teardown();
});
</script>


<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-6 > * { animation: fadeSlideUp 0.45s ease-out both; }
.space-y-6 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-6 > *:nth-child(2) { animation-delay: 100ms; }
.space-y-6 > *:nth-child(3) { animation-delay: 200ms; }
.space-y-6 > *:nth-child(4) { animation-delay: 300ms; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.grid > div[class*="rounded-lg"] { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.grid > div:nth-child(1) { animation-delay: 100ms; }
.grid > div:nth-child(2) { animation-delay: 180ms; }
.grid > div:nth-child(3) { animation-delay: 260ms; }
.grid > div:nth-child(4) { animation-delay: 340ms; }
</style>
