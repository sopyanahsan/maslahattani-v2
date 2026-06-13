<template>
  <div class="space-y-5">
    <div></div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-[#292a2a] rounded-lg p-1 w-fit">
      <button v-for="tab in tabs" :key="tab.key" type="button"
        :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900']"
        @click="handleTabChange(tab.key)">{{ tab.label }}</button>
    </div>



    <!-- ============================================ -->
    <!-- TAB: Mutasi                                   -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'mutasi'">
      <!-- Kas Cards (like BRILink rekening style) -->
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-[#869392]">{{ (cashBox?.cashBoxes || []).length }} kas aktif</p>
        <button type="button"
          class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openCashBoxModal(null)">
          <PlusIcon class="w-3.5 h-3.5" /> Tambah Kas
        </button>
      </div>


      <!-- Saldo Kas Strip -->
      <div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        <!-- Total Pill -->
        <div class="shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/80 rounded-lg px-5 py-3 shadow-sm">
          <p class="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Total Kas</p>
          <p class="text-lg font-bold font-mono tabular-nums text-slate-900 whitespace-nowrap leading-tight">{{ formatRupiah(cashBox?.balance ?? 0) }}</p>
        </div>
        <!-- Per-Kas Pill -->
        <div v-for="cb in cashBox?.cashBoxes || []" :key="cb.id"
          class="shrink-0 bg-white border border-slate-200/80 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 group">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <p class="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">{{ cb.label }}</p>
              <span v-if="cb.isDefault" class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Default"></span>
            </div>
            <p class="text-sm font-bold font-mono tabular-nums whitespace-nowrap leading-tight" :class="cb.balance > 0 ? 'text-slate-900 dark:text-[#e3e2e2]' : 'text-red-500'">{{ formatRupiah(cb.balance) }}</p>
          </div>
          <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
            <button type="button" class="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold flex items-center justify-center hover:bg-emerald-100 transition-colors" @click="openMutationModalForKas('CASH_IN', cb)" title="Setor">+</button>
            <button type="button" class="w-6 h-6 rounded-full bg-red-50 text-red-600 text-[10px] font-bold flex items-center justify-center hover:bg-red-100 transition-colors" @click="openMutationModalForKas('CASH_OUT', cb)" title="Tarik">−</button>
            <button type="button" class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center hover:bg-slate-200 transition-colors" @click="filterByKas(cb)" title="Riwayat">↗</button>
          </div>
        </div>
      </div>


      <!-- Filter -->
      <div class="flex flex-col sm:flex-row gap-3">
        <select v-model="mutasiCategoryFilter" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="fetchHistory">
          <option value="">Semua Kas</option>
          <option v-for="cb in cashBox?.cashBoxes || []" :key="cb.id" :value="cb.categoryId || cb.id">{{ cb.label }}</option>
        </select>
        <input v-model="mutasiStartDate" type="date" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="fetchHistory" />
        <input v-model="mutasiEndDate" type="date" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="fetchHistory" />
        <div class="flex-1"></div>
        <span v-if="historyMeta" class="text-xs text-slate-500 self-center">{{ historyMeta.total }} mutasi</span>
      </div>


      <!-- Loading -->
      <div v-if="historyLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-blue-600" />
      </div>

      <!-- Empty -->
      <div v-else-if="historyData.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
        <WalletIcon class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-bold text-slate-700">Belum ada riwayat mutasi</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Tanggal</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Tipe</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Jumlah</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Saldo Setelah</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Catatan</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in historyData" :key="item.id" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-xs font-mono tabular-nums text-slate-600">{{ formatDateTime(item.createdAt) }}</td>
                <td class="px-4 py-3 text-center"><span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.type === 'CASH_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">{{ item.type === 'CASH_IN' ? 'Masuk' : 'Keluar' }}</span></td>
                <td class="px-4 py-3 text-right text-xs font-mono tabular-nums font-semibold" :class="item.type === 'CASH_IN' ? 'text-emerald-600' : 'text-red-600'">{{ item.type === 'CASH_IN' ? '+' : '-' }}{{ formatRupiah(item.amount) }}</td>
                <td class="px-4 py-3 text-right text-xs font-mono tabular-nums text-slate-700">{{ formatRupiah(item.balanceAfter) }}</td>
                <td class="px-4 py-3 text-xs text-slate-600">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="historyMeta && historyMeta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <p class="text-xs text-slate-500 dark:text-[#869392]">Hal. {{ historyMeta.page }} / {{ historyMeta.totalPages }}</p>
          <div class="flex gap-1">
            <button :disabled="historyMeta.page <= 1" class="h-7 px-3 text-xs font-semibold border border-slate-200 rounded disabled:opacity-40 text-slate-700 hover:bg-slate-50" @click="fetchHistoryPage(historyMeta!.page - 1)">Prev</button>
            <button :disabled="historyMeta.page >= historyMeta.totalPages" class="h-7 px-3 text-xs font-semibold border border-slate-200 rounded disabled:opacity-40 text-slate-700 hover:bg-slate-50" @click="fetchHistoryPage(historyMeta!.page + 1)">Next</button>
          </div>
        </div>
      </div>
    </template>



    <!-- ============================================ -->
    <!-- TAB: Kelola Kas (Card per kas — like BRILink)-->
    <!-- ============================================ -->
    <template v-if="activeTab === 'kelola'">
      <!-- Actions bar -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600">Kelola kas retail. Setiap kas punya saldo sendiri.</p>
        <button type="button"
          class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openCashBoxModal(null)">
          <PlusIcon class="w-3.5 h-3.5" /> Tambah Kas
        </button>
      </div>

      <!-- Loading -->
      <div v-if="kelolaLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-blue-600" />
        <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat kas...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="kelolaKasList.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
        <BoxesIcon class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-bold text-slate-700">Belum ada kas</p>
        <p class="text-xs text-slate-500 dark:text-[#869392] mt-1">Tambahkan kas retail untuk mulai tracking saldo.</p>
      </div>


      <!-- Kas Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="kas in kelolaKasList" :key="kas.id"
          class="relative bg-white border border-slate-200/80 rounded-lg p-4 shadow-sm hover:shadow-md transition-all group">
          <!-- Header -->
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900 truncate pr-2">{{ kas.label }}</h4>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                title="Edit" @click="openCashBoxModal(kas)">
                <PencilIcon class="w-3 h-3 text-slate-500" />
              </button>
              <button class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                title="Hapus" @click="handleDeleteCashBox(kas)">
                <Trash2Icon class="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>

          <!-- Balance -->
          <p class="text-lg font-bold font-mono tabular-nums leading-tight mb-3" :class="kas.balance > 0 ? 'text-slate-900 dark:text-[#e3e2e2]' : 'text-red-500'">
            {{ formatRupiah(kas.balance) }}
          </p>

          <!-- Action row -->
          <div class="flex items-center gap-1.5">
            <button type="button"
              class="flex-1 h-7 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 rounded-lg hover:bg-emerald-100 transition-colors"
              @click="openMutationModalForKas('CASH_IN', kas)">+ Setor</button>
            <button type="button"
              class="flex-1 h-7 text-[10px] font-semibold text-red-600 bg-red-50/80 rounded-lg hover:bg-red-100 transition-colors"
              @click="openMutationModalForKas('CASH_OUT', kas)">− Tarik</button>
            <button type="button"
              class="flex-1 h-7 text-[10px] font-semibold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              @click="filterByKas(kas)">Riwayat</button>
          </div>
        </div>
      </div>
    </template>



    <!-- Mutation Modal -->
    <Teleport to="body">
      <div v-if="showMutationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showMutationModal = false"></div>
        <form class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleMutation">
          <h3 class="text-sm font-bold" :class="mutationType === 'CASH_IN' ? 'text-emerald-700' : 'text-red-700'">{{ mutationType === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}</h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Kas / Kategori *</label>
            <select v-model="mutationCategoryId" required class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none">
              <option value="">— Pilih Kas —</option>
              <option v-for="cat in mutationCategories" :key="cat.id" :value="cat.id">{{ cat.name }} ({{ cat.code }})</option>
            </select>
          </div>
          <div><label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Rp) *</label><input v-model.number="mutationAmount" type="number" min="1" required class="w-full h-9 px-3 text-sm font-mono border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" /></div>
          <div><label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label><input v-model="mutationNotes" type="text" placeholder="Opsional" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" /></div>
          <div v-if="mutationError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ mutationError }}</div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showMutationModal = false">Batal</button>
            <button type="submit" :disabled="mutationSaving" :class="['h-9 px-4 text-xs font-semibold text-white rounded-md disabled:opacity-50', mutationType === 'CASH_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700']">{{ mutationType === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}</button>
          </div>
        </form>
      </div>
    </Teleport>


    <!-- Tambah / Edit Kas Modal -->
    <Teleport to="body">
      <div v-if="showCashBoxModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCashBoxModal = false"></div>
        <form class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleSaveCashBox">
          <h3 class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2]">{{ editingCashBox ? 'Edit Kas' : 'Tambah Kas Baru' }}</h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Kas <span class="text-red-500">*</span></label>
            <input v-model="cashBoxForm.label" type="text" required placeholder="Kas Retail"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ editingCashBox ? 'Saldo (update manual)' : 'Saldo Awal (Rp)' }}</label>
            <input v-model.number="cashBoxForm.balance" type="number" min="0" placeholder="0"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
            <p class="text-[10px] text-slate-400 mt-0.5">{{ editingCashBox ? 'Ubah saldo akan tercatat sebagai mutasi penyesuaian.' : 'Saldo kas saat ini. Bisa 0 kalau baru.' }}</p>
          </div>
          <div v-if="cashBoxError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ cashBoxError }}</div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showCashBoxModal = false">Batal</button>
            <button type="submit" :disabled="cashBoxSaving" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{{ editingCashBox ? 'Simpan' : 'Tambah' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>



<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { Wallet as WalletIcon, Boxes as BoxesIcon, Plus as PlusIcon, Pencil as PencilIcon, Trash2 as Trash2Icon, Loader2 as Loader2Icon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import kasRetailService, { type CashBoxResponse, type PaymentHistoryItem, type PaymentHistoryResponse } from '@/shared/services/kas-retail.service';
import cashBoxCategoryService, { type CashBoxCategoryDto } from '@/shared/services/cashbox-category.service';
import cashBoxService, { type CashBoxItem } from '@/shared/services/cash-box.service';

import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';

const authStore = useAuthStore();
const { ask } = useConfirm();
const toast = useToast();
type TabKey = 'mutasi' | 'kelola';
const tabs: { key: TabKey; label: string }[] = [{ key: 'mutasi', label: 'Mutasi' }, { key: 'kelola', label: 'Kelola Kas' }];
const activeTab = ref<TabKey>('mutasi');

function getShopId(): string | undefined { return authStore.user?.shopId || undefined; }
function formatRupiah(n: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso: string): string { const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z'); return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }


// ============================================
// Mutasi Tab State
// ============================================
const cashBox = ref<CashBoxResponse | null>(null);
const historyData = ref<PaymentHistoryItem[]>([]);
const historyMeta = ref<PaymentHistoryResponse['meta'] | null>(null);
const historyLoading = ref(false);
const mutasiStartDate = ref('');
const mutasiEndDate = ref('');
const mutasiCategoryFilter = ref('');
const showMutationModal = ref(false);
const mutationType = ref<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
const mutationAmount = ref(0);
const mutationNotes = ref('');
const mutationCategoryId = ref('');
const mutationCategories = ref<CashBoxCategoryDto[]>([]);
const mutationError = ref<string | null>(null);
const mutationSaving = ref(false);

// ============================================
// Kelola Kas Tab State (direct CashBox CRUD)
// ============================================
const kelolaKasList = ref<CashBoxItem[]>([]);
const kelolaLoading = ref(false);
const showCashBoxModal = ref(false);
const editingCashBox = ref<CashBoxItem | null>(null);
const cashBoxSaving = ref(false);
const cashBoxError = ref<string | null>(null);
const cashBoxForm = reactive({ label: '', balance: 0 });


// ============================================
// Mutasi Tab Methods
// ============================================
async function fetchCashBox() { const s = getShopId(); if (!s) return; try { cashBox.value = await kasRetailService.getCashBox(s); } catch { /* */ } }
async function fetchHistory() {
  const s = getShopId(); if (!s) return;
  if (historyData.value.length === 0) historyLoading.value = true;
  try {
    // Determine if filter value is a categoryId or cashBoxId
    const filterVal = mutasiCategoryFilter.value || undefined;
    const filterCb = (cashBox.value?.cashBoxes || []).find(cb => (cb.categoryId || cb.id) === filterVal);
    const categoryId = filterCb?.categoryId || undefined;
    const cashBoxId = (filterCb && !filterCb.categoryId) ? filterCb.id : undefined;

    const res = await kasRetailService.getHistory({
      shopId: s,
      categoryId,
      cashBoxId,
      startDate: mutasiStartDate.value || undefined,
      endDate: mutasiEndDate.value || undefined,
      page: 1, limit: 20,
    });
    historyData.value = res.data; historyMeta.value = res.meta;
  } catch { if (historyData.value.length === 0) historyData.value = []; }
  finally { historyLoading.value = false; }
}
async function fetchHistoryPage(p: number) {
  const s = getShopId(); if (!s) return;
  historyLoading.value = true;
  try {
    const filterVal = mutasiCategoryFilter.value || undefined;
    const filterCb = (cashBox.value?.cashBoxes || []).find(cb => (cb.categoryId || cb.id) === filterVal);
    const categoryId = filterCb?.categoryId || undefined;
    const cashBoxId = (filterCb && !filterCb.categoryId) ? filterCb.id : undefined;

    const res = await kasRetailService.getHistory({
      shopId: s,
      categoryId,
      cashBoxId,
      startDate: mutasiStartDate.value || undefined,
      endDate: mutasiEndDate.value || undefined,
      page: p, limit: 20,
    });
    historyData.value = res.data; historyMeta.value = res.meta;
  } catch { /* */ }
  finally { historyLoading.value = false; }
}

function openMutationModalForKas(type: 'CASH_IN' | 'CASH_OUT', cb: any) {
  mutationType.value = type;
  mutationAmount.value = 0;
  mutationNotes.value = '';
  mutationCategoryId.value = cb.categoryId || cb.id || '';
  mutationError.value = null;
  showMutationModal.value = true;
  if (mutationCategories.value.length === 0) { fetchMutationCategories(); }
}

function filterByKas(cb: any) {
  activeTab.value = 'mutasi';
  mutasiCategoryFilter.value = cb.categoryId || cb.id || '';
  fetchHistory();
}

async function fetchMutationCategories() { try { const res = await cashBoxCategoryService.list(false); mutationCategories.value = res.data; } catch { /* */ } }


async function handleMutation() {
  const s = getShopId(); if (!s) return;
  if (!mutationCategoryId.value) { mutationError.value = 'Pilih kas/kategori terlebih dahulu.'; return; }
  mutationSaving.value = true; mutationError.value = null;
  try {
    await kasRetailService.createMutation({ shopId: s, type: mutationType.value, amount: mutationAmount.value, categoryId: mutationCategoryId.value, notes: mutationNotes.value || undefined });
    showMutationModal.value = false;
    await fetchCashBox(); await fetchHistory(); await fetchKelolaKas();
  } catch (e: any) { mutationError.value = e?.response?.data?.message || e?.message || 'Gagal.'; }
  finally { mutationSaving.value = false; }
}

// ============================================
// Kelola Kas Methods (direct CashBox CRUD)
// ============================================
async function fetchKelolaKas() {
  const s = getShopId(); if (!s) return;
  kelolaLoading.value = true;
  try { kelolaKasList.value = await cashBoxService.list(s); }
  catch { kelolaKasList.value = []; }
  finally { kelolaLoading.value = false; }
}

function openCashBoxModal(kas: CashBoxItem | null) {
  editingCashBox.value = kas;
  cashBoxError.value = null;
  if (kas) {
    cashBoxForm.label = kas.label;
    cashBoxForm.balance = kas.balance;
  } else {
    cashBoxForm.label = '';
    cashBoxForm.balance = 0;
  }
  showCashBoxModal.value = true;
}


async function handleSaveCashBox() {
  const s = getShopId(); if (!s) return;
  cashBoxSaving.value = true; cashBoxError.value = null;
  try {
    if (editingCashBox.value) {
      await cashBoxService.update(editingCashBox.value.id, {
        label: cashBoxForm.label,
        balance: cashBoxForm.balance,
      });
    } else {
      await cashBoxService.create({
        shopId: s,
        label: cashBoxForm.label,
        balance: cashBoxForm.balance || 0,
      });
    }
    showCashBoxModal.value = false;
    await fetchKelolaKas();
    await fetchCashBox();
  } catch (e: any) {
    cashBoxError.value = e?.response?.data?.message || e?.message || 'Gagal menyimpan.';
  } finally { cashBoxSaving.value = false; }
}

async function handleDeleteCashBox(kas: CashBoxItem) {
  const confirmed = await ask({ title: 'Hapus Kas?', message: `Kas "${kas.label}" akan dihapus. Saldo harus 0.`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!confirmed) return;
  try {
    await cashBoxService.remove(kas.id);
    await fetchKelolaKas();
    await fetchCashBox();
  } catch (e: any) {
    toast.error(e?.response?.data?.message || e?.message || 'Gagal menghapus.');
  }
}


// ============================================
// Tab change & lifecycle
// ============================================
function handleTabChange(tab: TabKey) {
  activeTab.value = tab;
  if (tab === 'kelola' && kelolaKasList.value.length === 0) fetchKelolaKas();
}

onMounted(() => { fetchCashBox(); fetchHistory(); fetchMutationCategories(); });

useAutoRefresh(() => { fetchCashBox(); fetchHistory(); });
</script>

<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-5 > *, .space-y-6 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-5 > *:nth-child(1), .space-y-6 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2), .space-y-6 > *:nth-child(2) { animation-delay: 70ms; }
.space-y-5 > *:nth-child(3), .space-y-6 > *:nth-child(3) { animation-delay: 140ms; }
.space-y-5 > *:nth-child(4), .space-y-6 > *:nth-child(4) { animation-delay: 210ms; }
.space-y-5 > *:nth-child(5), .space-y-6 > *:nth-child(5) { animation-delay: 280ms; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.grid > div[class*="rounded-lg"] { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.grid > div:nth-child(1) { animation-delay: 100ms; }
.grid > div:nth-child(2) { animation-delay: 180ms; }
.grid > div:nth-child(3) { animation-delay: 260ms; }
.grid > div:nth-child(4) { animation-delay: 340ms; }
table tbody tr { transition: all 0.15s ease; }
table tbody tr:hover { box-shadow: inset 3px 0 0 #2563EB; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
div[class*="rounded-lg"][class*="shadow-xl"] { animation: scaleIn 0.25s ease-out; }
</style>
