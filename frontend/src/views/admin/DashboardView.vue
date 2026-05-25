<template>
  <div class="space-y-6">
    <!-- Welcome strip (mobile only — desktop has topbar) -->
    <div class="lg:hidden">
      <h1 class="text-xl font-bold text-slate-950">Dashboard</h1>
      <p class="text-xs text-slate-500">Ringkasan operasional toko hari ini</p>
    </div>

    <!-- Stat Cards -->
    <section>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          v-for="stat in stats"
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
    </section>

    <!-- 2-column grid: recent trx + sidebar widgets -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Recent Transactions (2 cols on desktop) -->
      <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div class="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-950">Transaksi Terbaru</h3>
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
    </section>

    <!-- Quick actions -->
    <section>
      <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Aksi Cepat
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <RouterLink
          v-for="action in quickActions"
          :key="action.label"
          :to="action.to"
          class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg p-4 transition-colors group"
        >
          <div
            :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center mb-2',
              action.iconBg,
            ]"
          >
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
import { ref, onMounted } from 'vue';
import {
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  HandCoins as DebtIcon,
  PackageX as LowStockIcon,
  Plus as PlusIcon,
  UserPlus as UserPlusIcon,
  FileBarChart as ReportIcon,
  Settings as SettingsIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import StatCard from '@/components/dashboard/StatCard.vue';

// =====================================================
// State (placeholder data — wire ke /admin/dashboard/stats kalau backend sudah ada)
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

const stats = ref([
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
  {
    id: '1',
    transactionNumber: 'TRX-20260525-008',
    cashier: 'kasir1',
    totalPrice: 125000,
    method: 'CASH',
    status: 'COMPLETED',
    createdAt: '2026-05-25T10:42:00',
  },
  {
    id: '2',
    transactionNumber: 'TRX-20260525-007',
    cashier: 'kasir1',
    totalPrice: 38500,
    method: 'QRIS',
    status: 'COMPLETED',
    createdAt: '2026-05-25T10:18:00',
  },
  {
    id: '3',
    transactionNumber: 'TRX-20260525-006',
    cashier: 'kasir2',
    totalPrice: 215000,
    method: 'TRANSFER',
    status: 'COMPLETED',
    createdAt: '2026-05-25T09:55:00',
  },
  {
    id: '4',
    transactionNumber: 'TRX-20260525-005',
    cashier: 'kasir1',
    totalPrice: 67500,
    method: 'HUTANG',
    status: 'PENDING',
    createdAt: '2026-05-25T09:31:00',
  },
  {
    id: '5',
    transactionNumber: 'TRX-20260525-004',
    cashier: 'kasir2',
    totalPrice: 89000,
    method: 'CASH',
    status: 'COMPLETED',
    createdAt: '2026-05-25T09:12:00',
  },
  {
    id: '6',
    transactionNumber: 'TRX-20260525-003',
    cashier: 'kasir1',
    totalPrice: 45000,
    method: 'CASH',
    status: 'VOIDED',
    createdAt: '2026-05-25T08:47:00',
  },
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

const quickActions = [
  {
    label: 'Tambah Produk',
    desc: 'Buat master produk baru',
    to: '/admin/products',
    icon: PlusIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Tambah Kasir',
    desc: 'Daftarkan akun kasir',
    to: '/admin/kasir',
    icon: UserPlusIcon,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    label: 'Lihat Laporan',
    desc: 'Penjualan & laba',
    to: '/admin/reports',
    icon: ReportIcon,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Pengaturan',
    desc: 'Konfigurasi toko',
    to: '/admin/settings',
    icon: SettingsIcon,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
];

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

// =====================================================
// Lifecycle
// =====================================================

onMounted(async () => {
  // TODO: ganti dengan call ke endpoint dashboard saat backend sudah ada:
  //   const { data } = await api.get('/admin/dashboard/summary');
  //   stats.value = data.stats; recentTransactions.value = data.recentTransactions; ...
  // Untuk sekarang pakai placeholder di atas supaya layout terlihat dulu.
});
</script>
