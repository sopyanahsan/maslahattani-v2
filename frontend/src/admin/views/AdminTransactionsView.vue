<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">Transaksi</h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Riwayat transaksi retail, filter by tanggal/status, detail &amp; void.
      </p>
    </div>

    <!-- Stats cards -->
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Omzet</p>
        <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ formatRupiah(stats.omzet) }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Laba Kotor</p>
        <p class="text-lg font-bold font-mono text-emerald-600 mt-1">{{ formatRupiah(stats.profit) }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Transaksi</p>
        <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ stats.totalTransaksi }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[11px] text-slate-500">Void</p>
        <p class="text-lg font-bold font-mono text-red-600 mt-1">{{ stats.totalVoid }}</p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="COMPLETED">Completed</option>
        <option value="VOIDED">Voided</option>
        <option value="PENDING">Pending</option>
      </select>

      <input
        v-model="filterStartDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />
      <input
        v-model="filterEndDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />

      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 self-center">
        {{ meta.total }} transaksi
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat transaksi...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="transactions.length === 0"
      class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center"
    >
      <ReceiptIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada transaksi</p>
      <p class="text-xs text-slate-500 mt-1">Transaksi dari POS kasir akan muncul di sini.</p>
    </div>

    <!-- Transaction table -->
    <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                No. Transaksi
              </th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Kasir
              </th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Waktu
              </th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Metode
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Total
              </th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Status
              </th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="trx in transactions"
              :key="trx.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-slate-900">{{ trx.transactionNumber }}</code>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">
                {{ trx.user?.username ?? trx.user?.email ?? '—' }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 font-mono">
                {{ formatDateTime(trx.createdAt) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  v-for="p in trx.payments"
                  :key="p.id"
                  :class="[
                    'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                    methodBadge(p.method),
                  ]"
                >
                  {{ p.method }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-900">
                {{ formatRupiah(trx.totalPrice) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    statusBadge(trx.status),
                  ]"
                >
                  {{ statusLabel(trx.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-slate-100 transition-colors"
                    title="Detail"
                    @click="openDetail(trx)"
                  >
                    <EyeIcon class="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    v-if="trx.status === 'COMPLETED'"
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Void"
                    @click="openVoidModal(trx)"
                  >
                    <XCircleIcon class="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="px-4 py-3 border-t border-slate-200 flex items-center justify-between"
      >
        <p class="text-xs text-slate-500">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="goPage(meta!.page - 1)"
          >
            Prev
          </button>
          <button
            :disabled="meta.page >= meta.totalPages"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="goPage(meta!.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Detail Modal                                  -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && detailTrx"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="showDetailModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-950">Detail Transaksi</h2>
              <code class="text-xs font-mono text-slate-500">{{ detailTrx.transactionNumber }}</code>
            </div>
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                statusBadge(detailTrx.status),
              ]"
            >
              {{ statusLabel(detailTrx.status) }}
            </span>
          </div>

          <!-- Info -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p class="text-slate-500">Kasir</p>
              <p class="font-semibold text-slate-900">
                {{ detailTrx.user?.username ?? detailTrx.user?.email ?? '—' }}
              </p>
            </div>
            <div>
              <p class="text-slate-500">Waktu</p>
              <p class="font-semibold text-slate-900 font-mono">{{ formatDateTime(detailTrx.createdAt) }}</p>
            </div>
            <div>
              <p class="text-slate-500">Total</p>
              <p class="font-semibold text-slate-900 font-mono">{{ formatRupiah(detailTrx.totalPrice) }}</p>
            </div>
            <div>
              <p class="text-slate-500">Profit</p>
              <p class="font-semibold text-emerald-700 font-mono">
                {{ formatRupiah(detailTrx.totalPrice - detailTrx.totalCost) }}
              </p>
            </div>
          </div>

          <!-- Void info -->
          <div
            v-if="detailTrx.status === 'VOIDED'"
            class="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1"
          >
            <p class="text-xs font-bold text-red-800">Dibatalkan</p>
            <p class="text-[11px] text-red-700">
              Oleh <strong>{{ detailTrx.voidedBy }}</strong>
              · {{ detailTrx.voidedAt ? formatDateTime(detailTrx.voidedAt) : '' }}
            </p>
            <p class="text-[11px] text-red-700">Alasan: {{ detailTrx.voidReason }}</p>
          </div>

          <!-- Items -->
          <div>
            <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
              Item ({{ detailTrx.items.length }})
            </p>
            <div class="space-y-1.5">
              <div
                v-for="item in detailTrx.items"
                :key="item.id"
                class="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium text-slate-900 truncate">{{ item.product.name }}</p>
                  <p class="text-[10px] text-slate-500 font-mono">
                    {{ item.quantity }} × {{ formatRupiah(item.unitPrice) }}
                    <span v-if="item.discount > 0" class="text-red-500">
                      -{{ formatRupiah(item.discount) }}
                    </span>
                  </p>
                </div>
                <span class="text-xs font-mono font-semibold text-slate-900 shrink-0 ml-3">
                  {{ formatRupiah(item.subtotal) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Payments -->
          <div>
            <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
              Pembayaran
            </p>
            <div class="space-y-1">
              <div
                v-for="p in detailTrx.payments"
                :key="p.id"
                class="flex items-center justify-between text-xs"
              >
                <span :class="['font-bold uppercase px-2 py-0.5 rounded', methodBadge(p.method)]">
                  {{ p.method }}
                </span>
                <span class="font-mono font-semibold text-slate-900">{{ formatRupiah(p.amount) }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200"
              @click="showDetailModal = false"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Void Modal                                    -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showVoidModal && voidingTrx"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="showVoidModal = false"></div>
        <form
          class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleVoid"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <XCircleIcon class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Void Transaksi</h3>
              <p class="text-xs text-slate-600 mt-0.5">
                <code>{{ voidingTrx.transactionNumber }}</code> — {{ formatRupiah(voidingTrx.totalPrice) }}
              </p>
            </div>
          </div>

          <!-- OTP -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              OTP Admin <span class="text-red-500">*</span>
            </label>
            <input
              v-model="voidForm.otp"
              type="text"
              inputmode="numeric"
              required
              maxlength="6"
              placeholder="123456"
              class="w-full h-9 px-3 text-sm font-mono text-center tracking-widest border border-slate-300
                     rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Void <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="voidForm.reason"
              rows="2"
              required
              placeholder="Produk rusak / salah input / customer batal"
              class="w-full text-sm border border-slate-300 rounded-md px-3 py-2
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div
            v-if="voidError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ voidError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200"
              @click="showVoidModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="voiding"
              class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md
                     hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="voiding" class="w-3.5 h-3.5 animate-spin" />
              Void Transaksi
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
  Receipt as ReceiptIcon,
  Eye as EyeIcon,
  XCircle as XCircleIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import transactionsService, {
  type TransactionDto,
  type TransactionListResponse,
  type TransactionStatus,
  type TransactionStatsResponse,
  type PaymentMethod,
} from '@/shared/services/transactions.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const transactions = ref<TransactionDto[]>([]);
const meta = ref<TransactionListResponse['meta'] | null>(null);
const stats = ref<TransactionStatsResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Filters
const filterStatus = ref<string>('');
const filterStartDate = ref('');
const filterEndDate = ref('');
const currentPage = ref(1);

// Detail modal
const showDetailModal = ref(false);
const detailTrx = ref<TransactionDto | null>(null);

// Void modal
const showVoidModal = ref(false);
const voidingTrx = ref<TransactionDto | null>(null);
const voiding = ref(false);
const voidError = ref<string | null>(null);
const voidForm = reactive({ otp: '', reason: '' });

// ============================================
// Methods
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

async function fetchTransactions() {
  loading.value = true;
  error.value = null;
  try {
    const shopId = getShopId();
    const response = await transactionsService.list({
      shopId,
      status: (filterStatus.value as TransactionStatus) || undefined,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    transactions.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat transaksi.';
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const shopId = getShopId();
    if (!shopId) return;
    stats.value = await transactionsService.getStats(
      shopId,
      filterStartDate.value || undefined,
      filterEndDate.value || undefined,
    );
  } catch {
    // silent — stats are optional
  }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchTransactions();
  fetchStats();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchTransactions();
}

function openDetail(trx: TransactionDto) {
  detailTrx.value = trx;
  showDetailModal.value = true;
}

function openVoidModal(trx: TransactionDto) {
  voidingTrx.value = trx;
  voidForm.otp = '';
  voidForm.reason = '';
  voidError.value = null;
  showVoidModal.value = true;
}

async function handleVoid() {
  if (!voidingTrx.value) return;
  voiding.value = true;
  voidError.value = null;
  try {
    await transactionsService.voidTransaction(voidingTrx.value.id, {
      otp: voidForm.otp,
      reason: voidForm.reason,
    });
    showVoidModal.value = false;
    voidingTrx.value = null;
    await fetchTransactions();
    await fetchStats();
  } catch (err: any) {
    voidError.value = err.response?.data?.message ?? err.message ?? 'Gagal void transaksi.';
  } finally {
    voiding.value = false;
  }
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function methodBadge(method: PaymentMethod): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusBadge(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'VOIDED': return 'bg-red-100 text-red-700';
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'PROCESSING': return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETED': return 'Selesai';
    case 'VOIDED': return 'Void';
    case 'PENDING': return 'Pending';
    case 'PROCESSING': return 'Proses';
    default: return status;
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchTransactions();
  fetchStats();
});
</script>
