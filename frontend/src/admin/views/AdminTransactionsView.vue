<template>
  <div class="space-y-5">
    <!-- Header -->
    <div></div>

    <!-- Stats cards (6 KPI) -->
    <div v-if="stats" class="grid grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Omzet</p>
        <p class="text-base font-bold font-mono text-slate-950 dark:text-slate-100 mt-0.5">{{ formatRupiah(stats.omzet) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Laba Kotor</p>
        <p class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{{ formatRupiah(stats.profit) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Transaksi</p>
        <p class="text-base font-bold font-mono text-slate-950 dark:text-slate-100 mt-0.5">{{ stats.totalTransaksi }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">AOV</p>
        <p class="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">{{ formatRupiah(stats.totalTransaksi > 0 ? Math.round(stats.omzet / stats.totalTransaksi) : 0) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Diskon</p>
        <p class="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{{ formatRupiah(stats.totalDiskon ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Void</p>
        <p class="text-base font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">{{ stats.totalVoid }}</p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <!-- Search -->
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          v-model="filterSearch"
          type="text"
          placeholder="Cari no. transaksi / nama pembeli..."
          class="h-9 pl-9 pr-3 w-52 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @input="debouncedFetch"
        />
      </div>


      <!-- Status filter -->
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="COMPLETED">Completed</option>
        <option value="VOIDED">Voided</option>
        <option value="PENDING">Pending</option>
      </select>

      <!-- Payment method filter -->
      <select
        v-model="filterPaymentMethod"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Metode</option>
        <option value="CASH">Cash</option>
        <option value="QRIS">QRIS</option>
        <option value="TRANSFER">Transfer</option>
        <option value="HUTANG">Hutang</option>
      </select>

      <!-- Date filters -->
      <input
        v-model="filterStartDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />
      <input
        v-model="filterEndDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />

      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-slate-400 self-center">
        {{ meta.total }} transaksi
      </span>
    </div>


    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat transaksi...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="transactions.length === 0"
      class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center"
    >
      <ReceiptIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada transaksi</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Transaksi dari POS kasir akan muncul di sini.</p>
    </div>


    <!-- Transaction table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">No. Transaksi</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Pembeli</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kasir</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Waktu</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Item</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Metode</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Profit</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="trx in transactions"
              :key="trx.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-slate-900 dark:text-slate-100">{{ trx.transactionNumber }}</code>
              </td>
              <td class="px-4 py-3">
                <span v-if="trx.customerName" class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ trx.customerName }}</span>
                <span v-else class="text-[10px] text-slate-400 italic">Umum</span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                {{ trx.user?.username ?? trx.user?.email ?? '—' }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                {{ formatDateTime(trx.createdAt) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">{{ trx.items?.length ?? 0 }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  v-for="p in trx.payments"
                  :key="p.id"
                  :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', methodBadge(p.method)]"
                >{{ p.method }}</span>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
                {{ formatRupiah(trx.totalPrice) }}
              </td>
              <td class="px-4 py-3 text-right text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatRupiah(trx.totalPrice - (trx.totalCost || 0)) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(trx.status)]">
                  {{ statusLabel(trx.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Detail"
                    @click="openDetail(trx)"
                  >
                    <EyeIcon class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                    title="Cetak Ulang Struk"
                    @click="handlePrintReceipt(trx)"
                  >
                    <PrinterIcon class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  </button>
                  <button
                    v-if="trx.status === 'COMPLETED'"
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    title="Void"
                    @click="openVoidModal(trx)"
                  >
                    <XCircleIcon class="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
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
        class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
      >
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            @click="goPage(meta!.page - 1)"
          >Prev</button>
          <button
            :disabled="meta.page >= meta.totalPages"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            @click="goPage(meta!.page + 1)"
          >Next</button>
        </div>
      </div>
    </div>


    <!-- ============================================ -->
    <!-- Detail Modal                                  -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showDetailModal && detailTrx" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showDetailModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">Detail Transaksi</h2>
              <code class="text-xs font-mono text-slate-500 dark:text-slate-400">{{ detailTrx.transactionNumber }}</code>
            </div>
            <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(detailTrx.status)]">
              {{ statusLabel(detailTrx.status) }}
            </span>
          </div>

          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p class="text-slate-500 dark:text-slate-400">Kasir</p>
              <p class="font-semibold text-slate-900 dark:text-slate-100">{{ detailTrx.user?.username ?? detailTrx.user?.email ?? '—' }}</p>
            </div>
            <div>
              <p class="text-slate-500 dark:text-slate-400">Pembeli</p>
              <p class="font-semibold text-slate-900 dark:text-slate-100">
                {{ detailTrx.customerName || 'Umum' }}
                <span v-if="detailTrx.customerPhone" class="text-slate-500 font-normal"> · {{ detailTrx.customerPhone }}</span>
              </p>
            </div>
            <div>
              <p class="text-slate-500 dark:text-slate-400">Waktu</p>
              <p class="font-semibold text-slate-900 dark:text-slate-100 font-mono">{{ formatDateTime(detailTrx.createdAt) }}</p>
            </div>
            <div>
              <p class="text-slate-500 dark:text-slate-400">Total</p>
              <p class="font-semibold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(detailTrx.totalPrice) }}</p>
            </div>
            <div>
              <p class="text-slate-500 dark:text-slate-400">Profit</p>
              <p class="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">{{ formatRupiah(detailTrx.totalPrice - detailTrx.totalCost) }}</p>
            </div>
          </div>

          <!-- Void info -->
          <div v-if="detailTrx.status === 'VOIDED'" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 space-y-1">
            <p class="text-xs font-bold text-red-800 dark:text-red-200">Dibatalkan</p>
            <p class="text-[11px] text-red-700 dark:text-red-300">
              Oleh <strong>{{ detailTrx.voidedBy }}</strong> · {{ detailTrx.voidedAt ? formatDateTime(detailTrx.voidedAt) : '' }}
            </p>
            <p class="text-[11px] text-red-700 dark:text-red-300">Alasan: {{ detailTrx.voidReason }}</p>
          </div>


          <!-- Items -->
          <div>
            <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Item ({{ detailTrx.items.length }})</p>
            <div class="space-y-1.5">
              <div v-for="item in detailTrx.items" :key="item.id" class="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{{ item.product.name }}</p>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {{ item.quantity }} × {{ formatRupiah(item.unitPrice) }}
                    <span v-if="item.discount > 0" class="text-red-500 dark:text-red-400"> -{{ formatRupiah(item.discount) }}</span>
                  </p>
                </div>
                <span class="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0 ml-3">{{ formatRupiah(item.subtotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Payments -->
          <div>
            <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Pembayaran</p>
            <div class="space-y-1">
              <div v-for="p in detailTrx.payments" :key="p.id" class="flex items-center justify-between text-xs">
                <span :class="['font-bold uppercase px-2 py-0.5 rounded', methodBadge(p.method)]">{{ p.method }}</span>
                <span class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ formatRupiah(p.amount) }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showDetailModal = false">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ============================================ -->
    <!-- Void Modal                                    -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showVoidModal && voidTrx" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showVoidModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleVoid">
          <h3 class="text-sm font-bold text-red-700 dark:text-red-400">Void Transaksi</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Batalkan <strong class="text-slate-900 dark:text-slate-100">{{ voidTrx.transactionNumber }}</strong> ({{ formatRupiah(voidTrx.totalPrice) }})?
            Stok akan dikembalikan.
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kode OTP <span class="text-red-500">*</span></label>
            <input v-model="voidForm.otp" type="text" required minlength="6" placeholder="Masukkan OTP admin"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alasan <span class="text-red-500">*</span></label>
            <textarea v-model="voidForm.reason" required minlength="3" rows="2" placeholder="Alasan pembatalan..."
              class="w-full text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none" />
          </div>

          <div v-if="voidError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ voidError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showVoidModal = false">Batal</button>
            <button type="submit" :disabled="voiding" class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="voiding" class="w-3.5 h-3.5 animate-spin" />
              Konfirmasi Void
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Receipt as ReceiptIcon,
  Eye as EyeIcon,
  XCircle as XCircleIcon,
  Search as SearchIcon,
  Printer as PrinterIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import transactionsService, {
  type TransactionDto,
  type TransactionStatus,
  type PaymentMethod,
  type TransactionListResponse,
  type TransactionStatsResponse,
} from '@/shared/services/transactions.service';

const authStore = useAuthStore();
const toast = useToast();

// ============================================
// State
// ============================================
const transactions = ref<TransactionDto[]>([]);
const meta = ref<TransactionListResponse['meta'] | null>(null);
const stats = ref<TransactionStatsResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Filters
const filterSearch = ref('');
const filterStatus = ref('');
const filterPaymentMethod = ref('');
const filterStartDate = ref('');
const filterEndDate = ref('');
const currentPage = ref(1);

// Detail modal
const showDetailModal = ref(false);
const detailTrx = ref<TransactionDto | null>(null);

// Void modal
const showVoidModal = ref(false);
const voidTrx = ref<TransactionDto | null>(null);
const voiding = ref(false);
const voidError = ref<string | null>(null);
const voidForm = reactive({ otp: '', reason: '' });


// ============================================
// Helpers
// ============================================
function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'QRIS': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'TRANSFER': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
    case 'HUTANG': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'VOIDED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'PENDING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'Sukses';
    case 'VOIDED': return 'Void';
    case 'PENDING': return 'Pending';
    case 'PROCESSING': return 'Proses';
    default: return status;
  }
}


// ============================================
// Fetch Methods
// ============================================
async function fetchTransactions() {
  const shopId = getShopId();
  if (!shopId) return;
  if (transactions.value.length === 0) loading.value = true;
  error.value = null;
  try {
    const res = await transactionsService.list({
      shopId,
      status: (filterStatus.value as TransactionStatus) || undefined,
      paymentMethod: (filterPaymentMethod.value as PaymentMethod) || undefined,
      search: filterSearch.value || undefined,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    transactions.value = res.data;
    meta.value = res.meta;
  } catch (err: any) {
    if (transactions.value.length === 0) {
      error.value = err?.response?.data?.message || err?.message || 'Gagal memuat transaksi.';
    }
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  const shopId = getShopId();
  if (!shopId) return;
  try {
    stats.value = await transactionsService.getStats(
      shopId,
      filterStartDate.value || undefined,
      filterEndDate.value || undefined,
    );
  } catch {
    stats.value = null;
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

// Debounce for search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchTransactions();
  }, 300);
}


// ============================================
// Detail & Void
// ============================================
function openDetail(trx: TransactionDto) {
  detailTrx.value = trx;
  showDetailModal.value = true;
}

/**
 * Cetak ulang struk via Bluetooth thermal printer.
 * Jika printer belum connect → show pairing dialog.
 * Fallback: download sebagai gambar (browser print).
 */
async function handlePrintReceipt(trx: TransactionDto) {
  try {
    const { thermalPrint } = await import('@/shared/services/thermal-print.service');

    if (!thermalPrint.isConnected) {
      await thermalPrint.connect();
    }

    const shopName = authStore.user?.shopId ? 'Toko' : 'Toko';
    await thermalPrint.printReceipt({
      shopName,
      trxNumber: trx.transactionNumber,
      date: formatDateTime(trx.createdAt),
      cashierName: trx.user?.username ?? trx.user?.email ?? 'Kasir',
      items: (trx.items || []).map((i: any) => ({
        name: i.product?.name || 'Produk',
        qty: i.quantity,
        price: i.unitPrice,
        subtotal: i.subtotal,
      })),
      subtotal: trx.totalPrice,
      discount: trx.totalDiscount || 0,
      total: trx.totalPrice,
      paid: trx.payments?.[0]?.amount || trx.totalPrice,
      change: Math.max(0, (trx.payments?.[0]?.amount || trx.totalPrice) - trx.totalPrice),
      method: trx.payments?.[0]?.method || 'CASH',
    });

    toast.success(`Struk ${trx.transactionNumber} tercetak ke ${thermalPrint.deviceName}`);
  } catch (err: any) {
    if (err.message?.includes('cancelled') || err.message?.includes('NotFound')) {
      // User cancelled pairing — silent
    } else if (err.message?.includes('Web Bluetooth')) {
      toast.error('Bluetooth tidak tersedia di browser ini. Gunakan Chrome/Edge.');
    } else {
      toast.error(err.message || 'Gagal cetak struk.');
    }
  }
}

function openVoidModal(trx: TransactionDto) {
  voidTrx.value = trx;
  voidError.value = null;
  voidForm.otp = '';
  voidForm.reason = '';
  showVoidModal.value = true;
}

async function handleVoid() {
  if (!voidTrx.value) return;
  voiding.value = true;
  voidError.value = null;
  try {
    await transactionsService.voidTransaction(voidTrx.value.id, {
      otp: voidForm.otp,
      reason: voidForm.reason,
    });
    showVoidModal.value = false;
    await fetchTransactions();
    await fetchStats();
  } catch (err: any) {
    voidError.value = err?.response?.data?.message || err?.message || 'Gagal void transaksi.';
  } finally {
    voiding.value = false;
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchTransactions();
  fetchStats();
});

useAutoRefresh(() => { fetchTransactions(); fetchStats(); });
</script>
