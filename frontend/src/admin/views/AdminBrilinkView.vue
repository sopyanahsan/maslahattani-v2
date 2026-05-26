<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">BRILink</h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Kelola transaksi BRILink, statistik, dan pengaturan fee.
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>


    <!-- ============================================ -->
    <!-- TAB: Mutasi                                   -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'mutasi'">
      <!-- Filter bar -->
      <div class="flex flex-col sm:flex-row gap-3">
        <select
          v-model="filterCategory"
          class="h-9 px-3 text-sm border border-slate-300 rounded-lg
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetAndFetch"
        >
          <option value="">Semua Kategori</option>
          <option v-for="cat in BRILINK_CATEGORIES" :key="cat" :value="cat">
            {{ BRILINK_CATEGORY_LABELS[cat] }}
          </option>
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
        <span v-if="trxMeta" class="text-xs text-slate-500 self-center">
          {{ trxMeta.total }} transaksi
        </span>
      </div>


      <!-- Loading -->
      <div v-if="trxLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500">Memuat transaksi...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="trxError"
        class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2"
      >
        <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p class="text-sm text-red-800">{{ trxError }}</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="transactions.length === 0"
        class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center"
      >
        <WalletIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700">Belum ada transaksi BRILink</p>
        <p class="text-xs text-slate-500 mt-1">Transaksi dari kasir BRILink akan muncul di sini.</p>
      </div>


      <!-- Transaction table -->
      <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Ref Number
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Customer
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Kategori
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Amount
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Fee
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Total
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Status
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Tanggal
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
                  <code class="text-xs font-mono text-slate-900">{{ trx.refNumber }}</code>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">{{ trx.customerName }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', categoryBadge(trx.category)]">
                    {{ BRILINK_CATEGORY_LABELS[trx.category] }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-sm font-mono text-slate-900">{{ formatRupiah(trx.amount) }}</td>
                <td class="px-4 py-3 text-right text-sm font-mono text-emerald-600">{{ formatRupiah(trx.fee) }}</td>
                <td class="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-900">{{ formatRupiah(trx.total) }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(trx.status)]">
                    {{ statusLabel(trx.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 font-mono">{{ formatDateTime(trx.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>


        <!-- Pagination -->
        <div
          v-if="trxMeta && trxMeta.totalPages > 1"
          class="px-4 py-3 border-t border-slate-200 flex items-center justify-between"
        >
          <p class="text-xs text-slate-500">
            Halaman {{ trxMeta.page }} dari {{ trxMeta.totalPages }}
          </p>
          <div class="flex items-center gap-1">
            <button
              :disabled="trxMeta.page <= 1"
              class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="goPage(trxMeta!.page - 1)"
            >
              Prev
            </button>
            <button
              :disabled="trxMeta.page >= trxMeta.totalPages"
              class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="goPage(trxMeta!.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- TAB: Statistik                                -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'statistik'">
      <!-- Loading -->
      <div v-if="statsLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500">Memuat statistik...</span>
      </div>

      <template v-else-if="stats">
        <!-- Stats cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <p class="text-[11px] text-slate-500">Volume Transaksi</p>
            <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ formatRupiah(stats.totalVolume) }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <p class="text-[11px] text-slate-500">Total Fee</p>
            <p class="text-lg font-bold font-mono text-emerald-600 mt-1">{{ formatRupiah(stats.totalFee) }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <p class="text-[11px] text-slate-500">Jumlah Transaksi</p>
            <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ stats.totalTransactions }}</p>
          </div>
        </div>

        <!-- Per-category breakdown -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide">Breakdown per Kategori</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Kategori</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Volume</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Fee</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Transaksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="item in stats.byCategory" :key="item.category" class="hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', categoryBadge(item.category)]">
                      {{ BRILINK_CATEGORY_LABELS[item.category] }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-sm font-mono text-slate-900">{{ formatRupiah(item.volume) }}</td>
                  <td class="px-4 py-3 text-right text-sm font-mono text-emerald-600">{{ formatRupiah(item.fee) }}</td>
                  <td class="px-4 py-3 text-right text-sm font-mono text-slate-700">{{ item.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>


    <!-- ============================================ -->
    <!-- TAB: Pengaturan Fee                           -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'fee'">
      <!-- Header + Add button -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600">Atur fee per kategori &amp; range nominal.</p>
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg
                 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openFeeModal(null)"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          Tambah Fee
        </button>
      </div>

      <!-- Loading -->
      <div v-if="feesLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500">Memuat data fee...</span>
      </div>

      <!-- Empty -->
      <div
        v-else-if="fees.length === 0"
        class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center"
      >
        <SettingsIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700">Belum ada pengaturan fee</p>
        <p class="text-xs text-slate-500 mt-1">Tambahkan aturan fee untuk kalkulasi otomatis.</p>
      </div>


      <!-- Fees table -->
      <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px]">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Kategori</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Label</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Min</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Max</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Tipe</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">Nominal/Persen</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Aktif</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="fee in fees" :key="fee.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3">
                  <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', categoryBadge(fee.category)]">
                    {{ BRILINK_CATEGORY_LABELS[fee.category] }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">{{ fee.label }}</td>
                <td class="px-4 py-3 text-right text-xs font-mono text-slate-600">{{ formatRupiah(fee.minAmount) }}</td>
                <td class="px-4 py-3 text-right text-xs font-mono text-slate-600">{{ formatRupiah(fee.maxAmount) }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-[10px] font-bold uppercase text-slate-600">{{ fee.feeType }}</span>
                </td>
                <td class="px-4 py-3 text-right text-sm font-mono text-slate-900">
                  {{ fee.feeType === 'FLAT' ? formatRupiah(fee.feeAmount) : fee.feePercent + '%' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    type="button"
                    :class="[
                      'w-9 h-5 rounded-full relative transition-colors',
                      fee.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                    ]"
                    @click="toggleFeeActive(fee)"
                  >
                    <span
                      :class="[
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        fee.isActive ? 'left-[18px]' : 'left-0.5',
                      ]"
                    />
                  </button>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      title="Edit"
                      @click="openFeeModal(fee)"
                    >
                      <PencilIcon class="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button
                      class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Hapus"
                      @click="handleDeleteFee(fee)"
                    >
                      <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- Fee Create/Edit Modal                         -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showFeeModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="showFeeModal = false"></div>
        <form
          class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleSaveFee"
        >
          <h3 class="text-sm font-bold text-slate-900">
            {{ editingFee ? 'Edit Fee' : 'Tambah Fee Baru' }}
          </h3>

          <!-- Category -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Kategori <span class="text-red-500">*</span>
            </label>
            <select
              v-model="feeForm.category"
              required
              :disabled="!!editingFee"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none
                     disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Pilih kategori</option>
              <option v-for="cat in BRILINK_CATEGORIES" :key="cat" :value="cat">
                {{ BRILINK_CATEGORY_LABELS[cat] }}
              </option>
            </select>
          </div>

          <!-- Label -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Label <span class="text-red-500">*</span>
            </label>
            <input
              v-model="feeForm.label"
              type="text"
              required
              placeholder="Contoh: Fee Transfer 1-5jt"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>


          <!-- Range Nominal -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Min Nominal</label>
              <input
                v-model.number="feeForm.minAmount"
                type="number"
                min="0"
                placeholder="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Max Nominal</label>
              <input
                v-model.number="feeForm.maxAmount"
                type="number"
                min="0"
                placeholder="999999999"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- Fee Type + Amount -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Tipe Fee <span class="text-red-500">*</span></label>
              <select
                v-model="feeForm.feeType"
                required
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="FLAT">Flat (Rp)</option>
                <option value="PERCENT">Persen (%)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                {{ feeForm.feeType === 'FLAT' ? 'Nominal Fee' : 'Persen Fee' }}
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="feeForm.feeValue"
                type="number"
                min="0"
                :step="feeForm.feeType === 'PERCENT' ? '0.1' : '100'"
                required
                :placeholder="feeForm.feeType === 'FLAT' ? '5000' : '0.5'"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>


          <!-- Error -->
          <div
            v-if="feeModalError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ feeModalError }}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200"
              @click="showFeeModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="savingFee"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingFee" class="w-3.5 h-3.5 animate-spin" />
              {{ editingFee ? 'Simpan Perubahan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, reactive, watch } from 'vue';
import {
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Wallet as WalletIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Settings as SettingsIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  BRILINK_CATEGORIES,
  type BrilinkCategory,
  type BrilinkTransactionDto,
  type BrilinkFeeDto,
  type BrilinkStats,
  type BrilinkListResponse,
  type CreateBrilinkFeePayload,
  type UpdateBrilinkFeePayload,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();

// ============================================
// Tabs
// ============================================
type TabKey = 'mutasi' | 'statistik' | 'fee';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'mutasi', label: 'Mutasi' },
  { key: 'statistik', label: 'Statistik' },
  { key: 'fee', label: 'Pengaturan Fee' },
];
const activeTab = ref<TabKey>('mutasi');


// ============================================
// Mutasi State
// ============================================
const transactions = ref<BrilinkTransactionDto[]>([]);
const trxMeta = ref<BrilinkListResponse['meta'] | null>(null);
const trxLoading = ref(false);
const trxError = ref<string | null>(null);
const filterCategory = ref<string>('');
const filterStartDate = ref('');
const filterEndDate = ref('');
const currentPage = ref(1);

// ============================================
// Statistik State
// ============================================
const stats = ref<BrilinkStats | null>(null);
const statsLoading = ref(false);

// ============================================
// Fee State
// ============================================
const fees = ref<BrilinkFeeDto[]>([]);
const feesLoading = ref(false);
const showFeeModal = ref(false);
const editingFee = ref<BrilinkFeeDto | null>(null);
const savingFee = ref(false);
const feeModalError = ref<string | null>(null);
const feeForm = reactive({
  category: '' as string,
  label: '',
  minAmount: 0,
  maxAmount: 999999999,
  feeType: 'FLAT' as 'FLAT' | 'PERCENT',
  feeValue: 0,
});


// ============================================
// Helpers
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

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

function categoryBadge(category: BrilinkCategory): string {
  switch (category) {
    case 'TRANSFER_BRI': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER_OTHER': return 'bg-indigo-100 text-indigo-700';
    case 'TARIK_TUNAI': return 'bg-amber-100 text-amber-700';
    case 'TOPUP_PULSA': return 'bg-pink-100 text-pink-700';
    case 'TOPUP_DATA': return 'bg-purple-100 text-purple-700';
    case 'TOPUP_EWALLET': return 'bg-cyan-100 text-cyan-700';
    case 'TOPUP_PLN': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-100 text-emerald-700';
    case 'FAILED': return 'bg-red-100 text-red-700';
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'Sukses';
    case 'FAILED': return 'Gagal';
    case 'PENDING': return 'Pending';
    default: return status;
  }
}


// ============================================
// Mutasi Methods
// ============================================

async function fetchTransactions() {
  trxLoading.value = true;
  trxError.value = null;
  try {
    const shopId = getShopId();
    const response = await brilinkService.listTransactions({
      shopId,
      category: (filterCategory.value as BrilinkCategory) || undefined,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    transactions.value = response.data;
    trxMeta.value = response.meta;
  } catch (err: any) {
    trxError.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat transaksi.';
  } finally {
    trxLoading.value = false;
  }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchTransactions();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchTransactions();
}

// ============================================
// Statistik Methods
// ============================================

async function fetchStats() {
  const shopId = getShopId();
  if (!shopId) return;
  statsLoading.value = true;
  try {
    stats.value = await brilinkService.getStats(shopId);
  } catch {
    stats.value = null;
  } finally {
    statsLoading.value = false;
  }
}


// ============================================
// Fee Methods
// ============================================

async function fetchFees() {
  const shopId = getShopId();
  if (!shopId) return;
  feesLoading.value = true;
  try {
    fees.value = await brilinkService.listFees(shopId);
  } catch {
    fees.value = [];
  } finally {
    feesLoading.value = false;
  }
}

function openFeeModal(fee: BrilinkFeeDto | null) {
  editingFee.value = fee;
  feeModalError.value = null;
  if (fee) {
    feeForm.category = fee.category;
    feeForm.label = fee.label;
    feeForm.minAmount = fee.minAmount;
    feeForm.maxAmount = fee.maxAmount;
    feeForm.feeType = fee.feeType;
    feeForm.feeValue = fee.feeType === 'FLAT' ? fee.feeAmount : fee.feePercent;
  } else {
    feeForm.category = '';
    feeForm.label = '';
    feeForm.minAmount = 0;
    feeForm.maxAmount = 999999999;
    feeForm.feeType = 'FLAT';
    feeForm.feeValue = 0;
  }
  showFeeModal.value = true;
}

async function handleSaveFee() {
  const shopId = getShopId();
  if (!shopId) return;
  savingFee.value = true;
  feeModalError.value = null;

  try {
    if (editingFee.value) {
      // Update
      const payload: UpdateBrilinkFeePayload = {
        label: feeForm.label,
        minAmount: feeForm.minAmount,
        maxAmount: feeForm.maxAmount,
        feeType: feeForm.feeType,
        feeAmount: feeForm.feeType === 'FLAT' ? feeForm.feeValue : 0,
        feePercent: feeForm.feeType === 'PERCENT' ? feeForm.feeValue : 0,
      };
      await brilinkService.updateFee(editingFee.value.id, payload);
    } else {
      // Create
      const payload: CreateBrilinkFeePayload = {
        shopId,
        category: feeForm.category as BrilinkCategory,
        label: feeForm.label,
        minAmount: feeForm.minAmount,
        maxAmount: feeForm.maxAmount,
        feeType: feeForm.feeType,
        feeAmount: feeForm.feeType === 'FLAT' ? feeForm.feeValue : 0,
        feePercent: feeForm.feeType === 'PERCENT' ? feeForm.feeValue : 0,
      };
      await brilinkService.createFee(payload);
    }
    showFeeModal.value = false;
    await fetchFees();
  } catch (err: any) {
    feeModalError.value = err.response?.data?.message ?? err.message ?? 'Gagal menyimpan fee.';
  } finally {
    savingFee.value = false;
  }
}

async function toggleFeeActive(fee: BrilinkFeeDto) {
  try {
    await brilinkService.updateFee(fee.id, { isActive: !fee.isActive });
    fee.isActive = !fee.isActive;
  } catch {
    // silent
  }
}

async function handleDeleteFee(fee: BrilinkFeeDto) {
  if (!confirm(`Hapus fee "${fee.label}"?`)) return;
  try {
    await brilinkService.deleteFee(fee.id);
    await fetchFees();
  } catch {
    // silent
  }
}


// ============================================
// Tab watcher — fetch data on tab change
// ============================================
watch(activeTab, (tab) => {
  if (tab === 'mutasi') fetchTransactions();
  else if (tab === 'statistik') fetchStats();
  else if (tab === 'fee') fetchFees();
});

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchTransactions();
});
</script>
