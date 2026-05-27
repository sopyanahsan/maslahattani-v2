<template>
  <div class="space-y-6">
    <!-- Welcome strip (mobile only — desktop has topbar) -->
    <div class="lg:hidden">
      <h1 class="text-xl font-bold text-slate-950">Dashboard</h1>
      <p class="text-xs text-slate-500">{{ tabSubtitle }}</p>
    </div>

    <!-- Tab Switcher -->
    <DashboardTabs
      :model-value="activeTab"
      :tabs="tabs"
      @update:model-value="setTab"
    />

    <!-- ============================================ -->
    <!-- SECTION: RETAIL                              -->
    <!-- ============================================ -->
    <section v-if="showRetail" class="space-y-4 sm:space-y-6">
      <SectionHeader
        v-if="activeTab === 'semua'"
        :icon="StoreIcon"
        title="Retail"
        subtitle="Operasional toko & POS"
        badge="Aktif"
        badge-tone="emerald"
      />

      <!-- Stat Cards Retail -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          v-for="stat in retailStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :delta="stat.delta"
          :delta-positive="stat.deltaPositive"
          :icon="stat.icon"
          :tone="stat.tone"
          :loading="isLoading"
        />
      </div>

      <!-- 2-column grid: recent trx + sidebar widgets -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- Recent Transactions -->
        <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-950">Transaksi Retail Terbaru</h3>
              <p class="text-[11px] text-slate-500">10 transaksi terakhir</p>
            </div>
            <RouterLink
              to="/admin/transactions"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat semua →
            </RouterLink>
          </div>

          <div v-if="isLoading" class="p-8 flex flex-col items-center text-slate-500">
            <component :is="Loader2Icon" class="w-6 h-6 animate-spin mb-2" />
            <p class="text-xs">Memuat transaksi…</p>
          </div>

          <div v-else-if="recentTransactions.length === 0" class="p-10 text-center">
            <div class="text-4xl mb-2 opacity-50">🧾</div>
            <p class="text-sm font-semibold text-slate-900">Belum ada transaksi</p>
            <p class="text-xs text-slate-500 mt-1">
              Transaksi yang dibuat kasir akan muncul di sini.
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    No Trx
                  </th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Petugas
                  </th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Total
                  </th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Metode
                  </th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="trx in recentTransactions"
                  :key="trx.id"
                  class="hover:bg-slate-50 transition-colors"
                >
                  <td class="px-4 py-2.5 text-sm font-mono text-slate-900">
                    {{ trx.transactionNumber }}
                  </td>
                  <td class="px-4 py-2.5 text-sm text-slate-700">{{ trx.cashier }}</td>
                  <td class="px-4 py-2.5 text-sm font-mono font-medium text-right text-slate-900">
                    {{ formatRupiah(trx.totalPrice) }}
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span
                      :class="[
                        'inline-block px-2 py-0.5 rounded text-[11px] font-medium',
                        methodBadgeClass(trx.method),
                      ]"
                    >
                      {{ trx.method }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                        statusBadgeClass(trx.status),
                      ]"
                    >
                      {{ statusLabel(trx.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right column: ringkasan hutang + low stock -->
        <div class="space-y-4 sm:space-y-6">
          <!-- Hutang -->
          <div class="bg-white rounded-lg border border-slate-200">
            <div class="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-950">Ringkasan Hutang</h3>
              <RouterLink
                to="/admin/debts"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Detail →
              </RouterLink>
            </div>
            <div class="p-4 sm:p-5 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Total hutang aktif</span>
                <span class="text-sm font-mono font-semibold text-slate-900">
                  {{ formatRupiah(debtSummary.totalActive) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Jatuh tempo minggu ini</span>
                <span class="text-sm font-mono font-semibold text-amber-700">
                  {{ formatRupiah(debtSummary.dueThisWeek) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Overdue</span>
                <span class="text-sm font-mono font-semibold text-red-700">
                  {{ formatRupiah(debtSummary.overdue) }}
                </span>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-500">{{ debtSummary.customerCount }} pelanggan</span>
                <span class="badge-warning">{{ debtSummary.overdueCount }} overdue</span>
              </div>
            </div>
          </div>

          <!-- Low Stock -->
          <div class="bg-white rounded-lg border border-slate-200">
            <div class="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-950">Stok Menipis</h3>
              <RouterLink
                to="/admin/products"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Kelola →
              </RouterLink>
            </div>
            <div class="divide-y divide-slate-100">
              <div
                v-for="item in lowStock"
                :key="item.sku"
                class="flex items-center justify-between px-4 sm:px-5 py-2.5"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 truncate">{{ item.name }}</p>
                  <p class="text-[11px] font-mono text-slate-500">{{ item.sku }}</p>
                </div>
                <span
                  :class="[
                    'shrink-0 ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                    item.quantity === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700',
                  ]"
                >
                  {{ item.quantity === 0 ? 'Habis' : `${item.quantity} tersisa` }}
                </span>
              </div>
              <div v-if="lowStock.length === 0" class="px-4 sm:px-5 py-6 text-center">
                <p class="text-xs text-slate-500">Semua stok aman 👍</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- SECTION: BRILINK                             -->
    <!-- ============================================ -->
    <section v-if="showBrilink" class="space-y-4 sm:space-y-6">
      <SectionHeader
        v-if="activeTab === 'semua'"
        :icon="LandmarkIcon"
        title="BRILink"
        subtitle="Transfer, tarik tunai & top-up"
        badge="Live"
        badge-tone="blue"
      />

      <!-- Period selector + refresh (brilink tab only) -->
      <div v-if="activeTab === 'brilink'" class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            v-for="opt in PERIOD_OPTIONS"
            :key="opt.value"
            type="button"
            :class="[
              'h-7 px-3 text-xs font-semibold rounded-md transition-colors',
              brilinkPeriod === opt.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ]"
            @click="changeBrilinkPeriod(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          type="button"
          :disabled="brilinkStore.dashboardLoading"
          class="h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg
                 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
          @click="refreshBrilinkDashboard"
        >
          <component :is="RefreshIcon" :class="['w-3.5 h-3.5', brilinkStore.dashboardLoading && 'animate-spin']" />
          Refresh
        </button>
      </div>

      <!-- Error boundary BRILink -->
      <div
        v-if="brilinkStore.dashboardError"
        class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
      >
        <component :is="AlertTriangleIcon" class="w-4 h-4 text-red-500 shrink-0" />
        <p class="text-sm text-red-700 flex-1">{{ brilinkStore.dashboardError }}</p>
        <button
          type="button"
          class="text-xs font-medium text-red-700 underline"
          @click="refreshBrilinkDashboard"
        >
          Coba lagi
        </button>
      </div>

      <!-- Stat Cards BRILink (live data) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          v-for="stat in brilinkStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :delta="stat.delta"
          :delta-positive="stat.deltaPositive"
          :icon="stat.icon"
          :tone="stat.tone"
          :loading="brilinkStore.dashboardLoading"
        />
      </div>

      <!-- Category breakdown (brilink tab only) -->
      <div
        v-if="activeTab === 'brilink' && brilinkCategoryBreakdown.length > 0"
        class="bg-white rounded-lg border border-slate-200 overflow-hidden"
      >
        <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-950">Breakdown per Kategori</h3>
          <p class="text-[11px] text-slate-500">Berdasarkan periode yang dipilih</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[480px]">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Kategori</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Volume</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Fee</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Trx</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in brilinkCategoryBreakdown"
                :key="item.category"
                class="hover:bg-slate-50"
              >
                <td class="px-4 py-2.5 text-sm text-slate-700">
                  {{ BRILINK_CATEGORY_LABELS[item.category as BrilinkCategory] ?? item.category }}
                </td>
                <td class="px-4 py-2.5 text-right text-sm font-mono text-slate-900">{{ formatRupiah(item.volume) }}</td>
                <td class="px-4 py-2.5 text-right text-sm font-mono text-emerald-600">{{ formatRupiah(item.fee) }}</td>
                <td class="px-4 py-2.5 text-right text-sm font-mono text-slate-600">{{ item.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BRILink Transaction History -->
      <BrilinkTransactionTable :transactions="brilinkTransactions" />

      <!-- Primary account info (brilink tab) -->
      <div
        v-if="activeTab === 'brilink' && brilinkPrimaryAccount"
        class="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-lg p-4 flex items-center gap-4"
      >
        <div class="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0">
          <component :is="PiggyBankIcon" class="w-5 h-5 text-blue-600" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-slate-500">Rekening Utama BRILink</p>
          <p class="text-sm font-semibold text-slate-900">{{ brilinkPrimaryAccount.accountName }}</p>
          <p class="text-xs font-mono text-slate-600">{{ brilinkPrimaryAccount.bankName }} · {{ brilinkPrimaryAccount.accountNumber }}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-xs text-slate-500">Saldo</p>
          <p class="text-base font-bold font-mono text-slate-900">{{ formatRupiah(brilinkPrimaryAccount.balance) }}</p>
        </div>
      </div>

      <!-- Quick actions BRILink (brilink tab) -->
      <div v-if="activeTab === 'brilink'">
        <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Aksi Cepat</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RouterLink
            v-for="action in brilinkQuickActions"
            :key="action.label"
            :to="action.to"
            class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg p-4 transition-colors group"
          >
            <div :class="['w-9 h-9 rounded-lg flex items-center justify-center mb-2', action.iconBg]">
              <component :is="action.icon" :class="['w-4 h-4', action.iconColor]" />
            </div>
            <p class="text-sm font-semibold text-slate-900">{{ action.label }}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ action.desc }}</p>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Quick actions (hidden on BRILink-only tab) -->
    <section v-if="activeTab !== 'brilink'">
      <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Aksi Cepat
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <RouterLink
          v-for="action in retailQuickActions"
          :key="action.label"
          :to="action.to"
          class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg p-4 transition-colors group"
        >
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center mb-2', action.iconBg]">
            <component :is="action.icon" :class="['w-4 h-4', action.iconColor]" />
          </div>
          <p class="text-sm font-semibold text-slate-900">{{ action.label }}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">{{ action.desc }}</p>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  // Retail
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  HandCoins as DebtIcon,
  PackageX as LowStockIcon,
  Plus as PlusIcon,
  UserPlus as UserPlusIcon,
  FileBarChart as ReportIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Loader2 as Loader2Icon,
  AlertTriangle as AlertTriangleIcon,
  RefreshCw as RefreshIcon,
  // BRILink
  Landmark as LandmarkIcon,
  ArrowRightLeft as TransferIcon,
  Banknote as BanknoteIcon,
  PiggyBank as PiggyBankIcon,
  Percent as PercentIcon,
  Smartphone as SmartphoneIcon,
  CreditCard as CreditCardIcon,
  // Tabs
  LayoutDashboard as AllIcon,
} from 'lucide-vue-next';
import StatCard from '@/admin/components/dashboard/StatCard.vue';
import SectionHeader from '@/admin/components/dashboard/SectionHeader.vue';
import DashboardTabs, { type DashboardTab } from '@/admin/components/dashboard/DashboardTabs.vue';
import BrilinkTransactionTable, {
  type BrilinkTransaction,
} from '@/admin/components/dashboard/BrilinkTransactionTable.vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useBrilinkDashboardStore } from '@/shared/stores/brilink-dashboard.store';
import { BRILINK_CATEGORY_LABELS, type BrilinkCategory } from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const brilinkStore = useBrilinkDashboardStore();

// =====================================================
// Tab state — persist to URL ?view=
// =====================================================

type ViewTab = 'semua' | 'retail' | 'brilink';

const route = useRoute();
const router = useRouter();

const tabs: DashboardTab<ViewTab>[] = [
  { value: 'semua', label: 'Semua', icon: AllIcon },
  { value: 'retail', label: 'Retail', icon: StoreIcon },
  { value: 'brilink', label: 'BRILink', icon: LandmarkIcon },
];

const activeTab = computed<ViewTab>(() => {
  const v = route.query.view;
  if (v === 'retail' || v === 'brilink') return v;
  return 'semua';
});

const showRetail = computed(() => activeTab.value === 'semua' || activeTab.value === 'retail');
const showBrilink = computed(() => activeTab.value === 'semua' || activeTab.value === 'brilink');

const tabSubtitle = computed(() => {
  switch (activeTab.value) {
    case 'retail':
      return 'Operasional toko & POS';
    case 'brilink':
      return 'Transfer, tarik tunai & top-up';
    default:
      return 'Ringkasan operasional retail & BRILink';
  }
});

function setTab(value: string) {
  const v = value as ViewTab;
  router.replace({
    query: {
      ...route.query,
      view: v === 'semua' ? undefined : v,
    },
  });
}

// =====================================================
// Placeholder data (TODO: ganti ke /api/admin/dashboard/summary)
// =====================================================

const isLoading = ref(false);

interface RecentTrx {
  id: string;
  transactionNumber: string;
  cashier: string;
  totalPrice: number;
  method: 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG';
  status: 'COMPLETED' | 'PENDING' | 'VOIDED' | 'PROCESSING';
  createdAt: string;
}

// ============ RETAIL ============

const retailStats = ref([
  {
    label: 'Omzet Hari Ini',
    value: 'Rp 2.500.000',
    delta: '+12% dari kemarin',
    deltaPositive: true,
    icon: WalletIcon,
    tone: 'blue',
  },
  {
    label: 'Total Transaksi',
    value: '47 Trx',
    delta: '+5 dari kemarin',
    deltaPositive: true,
    icon: ReceiptIcon,
    tone: 'indigo',
  },
  {
    label: 'Hutang Jatuh Tempo',
    value: 'Rp 850.000',
    delta: '3 pelanggan',
    deltaPositive: false,
    icon: DebtIcon,
    tone: 'amber',
  },
  {
    label: 'Stok Habis',
    value: '5 Produk',
    delta: 'Perlu restok',
    deltaPositive: false,
    icon: LowStockIcon,
    tone: 'red',
  },
] as const);

const recentTransactions = ref<RecentTrx[]>([
  { id: '1', transactionNumber: 'TRX-20260525-008', cashier: 'kasir1', totalPrice: 125000, method: 'CASH', status: 'COMPLETED', createdAt: '2026-05-25T10:42:00' },
  { id: '2', transactionNumber: 'TRX-20260525-007', cashier: 'kasir1', totalPrice: 38500, method: 'QRIS', status: 'COMPLETED', createdAt: '2026-05-25T10:18:00' },
  { id: '3', transactionNumber: 'TRX-20260525-006', cashier: 'kasir2', totalPrice: 215000, method: 'TRANSFER', status: 'COMPLETED', createdAt: '2026-05-25T09:55:00' },
  { id: '4', transactionNumber: 'TRX-20260525-005', cashier: 'kasir1', totalPrice: 67500, method: 'HUTANG', status: 'PENDING', createdAt: '2026-05-25T09:31:00' },
  { id: '5', transactionNumber: 'TRX-20260525-004', cashier: 'kasir2', totalPrice: 89000, method: 'CASH', status: 'COMPLETED', createdAt: '2026-05-25T09:12:00' },
  { id: '6', transactionNumber: 'TRX-20260525-003', cashier: 'kasir1', totalPrice: 45000, method: 'CASH', status: 'VOIDED', createdAt: '2026-05-25T08:47:00' },
]);

const debtSummary = ref({
  totalActive: 4_250_000,
  dueThisWeek: 1_100_000,
  overdue: 850_000,
  customerCount: 12,
  overdueCount: 3,
});

const lowStock = ref([
  { name: 'Beras 5kg', sku: 'BRS-5KG', quantity: 3 },
  { name: 'Minyak Goreng 1L', sku: 'MYK-1L', quantity: 2 },
  { name: 'Telur 1 Rak', sku: 'TLR-1RK', quantity: 0 },
  { name: 'Rokok Surya 16', sku: 'RKK-SR16', quantity: 4 },
  { name: 'Sabun Lifebuoy', sku: 'SBN-LFB', quantity: 0 },
]);

const retailQuickActions = [
  { label: 'Tambah Produk', desc: 'Buat master produk baru', to: '/admin/products', icon: PlusIcon, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Tambah Kasir', desc: 'Daftarkan akun kasir', to: '/admin/kasir', icon: UserPlusIcon, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { label: 'Lihat Laporan', desc: 'Penjualan & laba', to: '/admin/reports', icon: ReportIcon, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { label: 'Pengaturan', desc: 'Konfigurasi toko', to: '/admin/settings', icon: SettingsIcon, iconBg: 'bg-slate-100', iconColor: 'text-slate-700' },
];

const brilinkQuickActions = [
  { label: 'Mutasi BRILink', desc: 'Riwayat transaksi nasabah', to: '/admin/brilink', icon: TransferIcon, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Statistik', desc: 'Volume & fee per kategori', to: '/admin/brilink', icon: ReportIcon, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { label: 'Pengaturan Fee', desc: 'Atur margin fee per layanan', to: '/admin/brilink', icon: PercentIcon, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { label: 'Rekening', desc: 'Kelola rekening BRILink', to: '/admin/kas-rekening-brilink', icon: PiggyBankIcon, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
];

// Shopid dari auth store
const shopId = computed(() => authStore.user?.shopId ?? '');

// KPI computed dari store
const brilinkKpi = computed(() => brilinkStore.dashboard?.kpi);
const brilinkCategoryBreakdown = computed(() => brilinkStore.dashboard?.categoryBreakdown ?? []);
const brilinkPrimaryAccount = computed(() => brilinkStore.dashboard?.primaryAccount);

const brilinkStats = computed(() => [
  {
    label: brilinkKpi.value?.volume.label ?? 'Volume Transaksi',
    value: brilinkKpi.value
      ? formatRupiah(brilinkKpi.value.volume.value)
      : '—',
    delta: brilinkKpi.value?.volume.delta,
    deltaPositive: brilinkKpi.value?.volume.deltaPositive,
    icon: TransferIcon,
    tone: 'blue' as const,
    loading: brilinkStore.dashboardLoading,
  },
  {
    label: brilinkKpi.value?.fee.label ?? 'Total Fee',
    value: brilinkKpi.value
      ? formatRupiah(brilinkKpi.value.fee.value)
      : '—',
    delta: brilinkKpi.value?.fee.delta,
    deltaPositive: brilinkKpi.value?.fee.deltaPositive,
    icon: PercentIcon,
    tone: 'emerald' as const,
    loading: brilinkStore.dashboardLoading,
  },
  {
    label: brilinkKpi.value?.balance.label ?? 'Saldo Rekening',
    value: brilinkKpi.value
      ? formatRupiah(brilinkKpi.value.balance.value)
      : '—',
    delta: brilinkKpi.value?.balance.accountNumber
      ? `···${brilinkKpi.value.balance.accountNumber.slice(-4)}`
      : undefined,
    deltaPositive: undefined,
    icon: PiggyBankIcon,
    tone: 'indigo' as const,
    loading: brilinkStore.dashboardLoading,
  },
  {
    label: brilinkKpi.value?.count.label ?? 'Trx BRILink',
    value: brilinkKpi.value
      ? String(brilinkKpi.value.count.value)
      : '—',
    delta: brilinkKpi.value?.count.delta,
    deltaPositive: brilinkKpi.value?.count.deltaPositive,
    icon: BanknoteIcon,
    tone: 'amber' as const,
    loading: brilinkStore.dashboardLoading,
  },
]);

// Recent transactions untuk tabel (dari store)
const brilinkTransactions = computed<BrilinkTransaction[]>(() => {
  const recent = brilinkStore.dashboard?.recentTransactions ?? [];
  return recent.map((t) => ({
    id: t.id,
    refNumber: t.refNumber,
    category: t.category as BrilinkTransaction['category'],
    amount: t.amount,
    fee: t.fee,
    status: t.status as BrilinkTransaction['status'],
    cashier: t.processedBy ?? '—',
    customerName: t.customerName,
    destination: t.destination,
    createdAt: t.createdAt,
  }));
});

const brilinkFeatures = [
  { label: 'Transfer Antar Bank', desc: 'Kirim dana ke rekening BRI / bank lain dengan tarif transparan.', icon: TransferIcon },
  { label: 'Tarik Tunai', desc: 'Layani penarikan tunai pelanggan dari rekening BRI.', icon: BanknoteIcon },
  { label: 'Top Up & Pulsa', desc: 'Top-up e-wallet, pulsa, paket data, dan token PLN.', icon: SmartphoneIcon },
  { label: 'Pengaturan Fee', desc: 'Atur margin fee per nominal & jenis transaksi.', icon: CreditCardIcon },
];

// Period selector
const brilinkPeriod = ref<string>('month');
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'year', label: 'Tahun Ini' },
];

function changeBrilinkPeriod(period: string) {
  brilinkPeriod.value = period;
  if (shopId.value) {
    brilinkStore.fetchDashboard(shopId.value, period);
  }
}

async function refreshBrilinkDashboard() {
  if (shopId.value) {
    await brilinkStore.fetchDashboard(shopId.value, brilinkPeriod.value);
  }
}

// Lifecycle
onMounted(() => {
  if (shopId.value) {
    brilinkStore.initDashboard(shopId.value);
    brilinkStore.startAutoRefresh(shopId.value, 30_000);
  }
});

onUnmounted(() => {
  brilinkStore.stopAutoRefresh();
});

// =====================================================
// Helpers
// =====================================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function methodBadgeClass(method: RecentTrx['method']): string {
  switch (method) {
    case 'CASH':
      return 'bg-emerald-100 text-emerald-700';
    case 'QRIS':
      return 'bg-blue-100 text-blue-700';
    case 'TRANSFER':
      return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function statusBadgeClass(status: RecentTrx['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700';
    case 'VOIDED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: RecentTrx['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'Selesai';
    case 'PENDING':
      return 'Pending';
    case 'PROCESSING':
      return 'Proses';
    case 'VOIDED':
      return 'Void';
    default:
      return status;
  }
}
</script>
