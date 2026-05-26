<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Hutang Pelanggan</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Daftar hutang aktif, cicilan, jatuh tempo, dan riwayat pembayaran.
        </p>
      </div>
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
               hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Catat Hutang
      </button>
    </div>

    <!-- Summary cards -->
    <div v-if="summary" class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Total Piutang Aktif</p>
        <p class="text-lg font-bold font-mono text-slate-950 mt-1">
          {{ formatRupiah(summary.totalOutstanding) }}
        </p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Pelanggan Berhutang</p>
        <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ summary.totalDebtors }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Jatuh Tempo / Overdue</p>
        <p class="text-lg font-bold font-mono text-red-600 mt-1">{{ summary.overdue }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchCustomer"
          type="text"
          placeholder="Cari nama pelanggan..."
          class="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 rounded-lg
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @input="debouncedSearch"
        />
      </div>
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="PENDING">Pending</option>
        <option value="PARTIALLY_PAID">Sebagian</option>
        <option value="PAID">Lunas</option>
        <option value="OVERDUE">Overdue</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat data hutang...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="debts.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <HandCoinsIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada data hutang</p>
      <p class="text-xs text-slate-500 mt-1">Catat hutang pelanggan pertama lewat tombol di atas.</p>
    </div>

    <!-- Debt table -->
    <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Pelanggan</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Produk</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Total</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Sisa</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Jatuh Tempo</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="debt in debts" :key="debt.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900">{{ debt.customerName }}</p>
                <p v-if="debt.customerPhone" class="text-[10px] text-slate-500">{{ debt.customerPhone }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-xs text-slate-700">{{ debt.product.name }}</p>
                <p class="text-[10px] text-slate-500">{{ debt.quantity }} × {{ formatRupiah(debt.unitPrice) }}</p>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono text-slate-900">
                {{ formatRupiah(debt.totalAmount) }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-semibold"
                  :class="debt.totalAmount - debt.paidAmount > 0 ? 'text-red-600' : 'text-emerald-600'">
                {{ formatRupiah(debt.totalAmount - debt.paidAmount) }}
              </td>
              <td class="px-4 py-3 text-center text-xs text-slate-600">
                {{ debt.dueDate ? formatDate(debt.dueDate) : '—' }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', debtStatusBadge(debt.status)]">
                  {{ debtStatusLabel(debt.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="debt.status !== 'PAID' && debt.status !== 'CANCELLED'"
                  class="h-7 px-2.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200
                         rounded-md hover:bg-emerald-100 transition-colors"
                  @click="openPayModal(debt)"
                >
                  Bayar
                </button>
                <span v-else class="text-[10px] text-slate-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <p class="text-xs text-slate-500">Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
        <div class="flex items-center gap-1">
          <button :disabled="meta.page <= 1" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" @click="goPage(meta!.page - 1)">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" @click="goPage(meta!.page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Create Debt Modal                            -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCreateModal = false"></div>
        <form class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleCreate">
          <h2 class="text-base font-bold text-slate-950">Catat Hutang Baru</h2>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Pelanggan <span class="text-red-500">*</span></label>
            <input v-model="createForm.customerName" type="text" required placeholder="Pak Ahmad" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">No. HP (opsional)</label>
            <input v-model="createForm.customerPhone" type="text" placeholder="08123456789" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Produk <span class="text-red-500">*</span></label>
            <input v-model="createForm.productId" type="text" required placeholder="ID Produk (dari list produk)" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Qty <span class="text-red-500">*</span></label>
              <input v-model.number="createForm.quantity" type="number" min="1" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">DP (Rp)</label>
              <input v-model.number="createForm.downPayment" type="number" min="0" placeholder="0" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
            <input v-model="createForm.dueDate" type="date" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input v-model="createForm.notes" type="text" placeholder="Bayar akhir bulan" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div v-if="createError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ createError }}</div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showCreateModal = false">Batal</button>
            <button type="submit" :disabled="creating" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="creating" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Pay Debt Modal                               -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showPayModal && payingDebt" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showPayModal = false"></div>
        <form class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handlePay">
          <h2 class="text-base font-bold text-slate-950">Bayar Hutang</h2>
          <div class="bg-slate-50 rounded-md px-3 py-2 space-y-1">
            <p class="text-xs font-medium text-slate-900">{{ payingDebt.customerName }}</p>
            <p class="text-[11px] text-slate-500">{{ payingDebt.product.name }} · {{ payingDebt.quantity }} unit</p>
            <p class="text-xs font-mono text-red-600">Sisa: {{ formatRupiah(payingDebt.totalAmount - payingDebt.paidAmount) }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah Bayar (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="payForm.amount" type="number" min="1" :max="payingDebt.totalAmount - payingDebt.paidAmount" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Metode <span class="text-red-500">*</span></label>
            <select v-model="payForm.method" required class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="CASH">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input v-model="payForm.notes" type="text" placeholder="Cicilan ke-2" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div v-if="payError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ payError }}</div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showPayModal = false">Batal</button>
            <button type="submit" :disabled="paying" class="h-9 px-4 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="paying" class="w-3.5 h-3.5 animate-spin" />
              Bayar
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  HandCoins as HandCoinsIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import debtsService, {
  type DebtDto,
  type DebtListResponse,
  type DebtStatus,
  type PaymentMethod,
} from '@/shared/services/debts.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const debts = ref<DebtDto[]>([]);
const meta = ref<DebtListResponse['meta'] | null>(null);
const summary = ref<DebtListResponse['summary'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Filters
const searchCustomer = ref('');
const filterStatus = ref<string>('');
const currentPage = ref(1);

// Create modal
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const createForm = reactive({
  customerName: '',
  customerPhone: '',
  productId: '',
  quantity: 1,
  downPayment: 0,
  dueDate: '',
  notes: '',
});

// Pay modal
const showPayModal = ref(false);
const payingDebt = ref<DebtDto | null>(null);
const paying = ref(false);
const payError = ref<string | null>(null);
const payForm = reactive({
  amount: 0,
  method: 'CASH' as PaymentMethod,
  notes: '',
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Methods
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

async function fetchDebts() {
  loading.value = true;
  error.value = null;
  try {
    const response = await debtsService.list({
      shopId: getShopId(),
      status: (filterStatus.value as DebtStatus) || undefined,
      customerName: searchCustomer.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    debts.value = response.data;
    meta.value = response.meta;
    summary.value = response.summary;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat data hutang.';
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchDebts();
  }, 400);
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchDebts();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchDebts();
}

function openCreateModal() {
  createForm.customerName = '';
  createForm.customerPhone = '';
  createForm.productId = '';
  createForm.quantity = 1;
  createForm.downPayment = 0;
  createForm.dueDate = '';
  createForm.notes = '';
  createError.value = null;
  showCreateModal.value = true;
}

async function handleCreate() {
  const shopId = getShopId();
  if (!shopId) { createError.value = 'Tidak ada cabang aktif.'; return; }

  creating.value = true;
  createError.value = null;
  try {
    await debtsService.create({
      shopId,
      productId: createForm.productId,
      customerName: createForm.customerName,
      customerPhone: createForm.customerPhone || undefined,
      quantity: createForm.quantity,
      downPayment: createForm.downPayment || undefined,
      dueDate: createForm.dueDate || undefined,
      notes: createForm.notes || undefined,
    });
    showCreateModal.value = false;
    await fetchDebts();
  } catch (err: any) {
    createError.value = err.response?.data?.message ?? err.message ?? 'Gagal mencatat hutang.';
  } finally {
    creating.value = false;
  }
}

function openPayModal(debt: DebtDto) {
  payingDebt.value = debt;
  payForm.amount = debt.totalAmount - debt.paidAmount;
  payForm.method = 'CASH';
  payForm.notes = '';
  payError.value = null;
  showPayModal.value = true;
}

async function handlePay() {
  if (!payingDebt.value) return;
  paying.value = true;
  payError.value = null;
  try {
    await debtsService.pay(payingDebt.value.id, {
      amount: payForm.amount,
      method: payForm.method,
      notes: payForm.notes || undefined,
    });
    showPayModal.value = false;
    payingDebt.value = null;
    await fetchDebts();
  } catch (err: any) {
    payError.value = err.response?.data?.message ?? err.message ?? 'Gagal membayar hutang.';
  } finally {
    paying.value = false;
  }
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debtStatusBadge(status: DebtStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700';
    case 'PAID': return 'bg-emerald-100 text-emerald-700';
    case 'OVERDUE': return 'bg-red-100 text-red-700';
    case 'CANCELLED': return 'bg-slate-100 text-slate-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function debtStatusLabel(status: DebtStatus): string {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'PARTIALLY_PAID': return 'Sebagian';
    case 'PAID': return 'Lunas';
    case 'OVERDUE': return 'Overdue';
    case 'CANCELLED': return 'Batal';
    default: return status;
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchDebts);
</script>
