<template>
  <div class="space-y-5">
    <div></div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button v-for="tab in tabs" :key="tab.key" type="button"
        :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200']"
        @click="handleTabChange(tab.key)">{{ tab.label }}</button>
    </div>


    <!-- ============================================ -->
    <!-- TAB: Mutasi                                   -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'mutasi'">
      <!-- Kas Cards (like BRILink rekening style) -->
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ (cashBox?.cashBoxes || []).length }} kas aktif</p>
        <button
          type="button"
          class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openCategoryModal(null)"
        >
          <PlusIcon class="w-3.5 h-3.5" /> Tambah Kas
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Total Card -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Semua Kas</p>
          <p class="text-2xl font-bold font-mono text-slate-950 dark:text-slate-100 mt-2">{{ formatRupiah(cashBox?.balance ?? 0) }}</p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{{ (cashBox?.cashBoxes || []).length }} kas aktif</p>
        </div>

        <!-- Per-Kas Cards -->
        <div
          v-for="cb in cashBox?.cashBoxes || []"
          :key="cb.id"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col"
        >
          <div class="flex items-start justify-between mb-1">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ cb.label }}</p>
                <span v-if="cb.isDefault" class="text-[9px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Default</span>
              </div>
              <p v-if="cb.code" class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{{ cb.code }}</p>
            </div>
          </div>

          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Saldo</p>
          <p class="text-xl font-bold font-mono mt-0.5" :class="cb.balance > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'">
            {{ formatRupiah(cb.balance) }}
          </p>
          <p v-if="cb.lastAudit" class="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Audit terakhir: {{ formatDate(cb.lastAudit) }}</p>

          <!-- Action buttons per kas -->
          <div class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              class="flex-1 h-8 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              @click="openMutationModalForKas('CASH_IN', cb)"
            >+ Setor</button>
            <button
              type="button"
              class="flex-1 h-8 text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
              @click="openMutationModalForKas('CASH_OUT', cb)"
            >- Tarik</button>
            <button
              type="button"
              class="flex-1 h-8 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              @click="filterByKas(cb)"
            >Riwayat</button>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="flex flex-col sm:flex-row gap-3">
        <select v-model="mutasiCategoryFilter" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" @change="fetchHistory">
          <option value="">Semua Kas</option>
          <option v-for="cat in mutationCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <input v-model="mutasiStartDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" @change="fetchHistory" />
        <input v-model="mutasiEndDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" @change="fetchHistory" />
        <div class="flex-1"></div>
        <span v-if="historyMeta" class="text-xs text-slate-500 dark:text-slate-400 self-center">{{ historyMeta.total }} mutasi</span>
      </div>

      <!-- Loading -->
      <div v-if="historyLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="historyData.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
        <WalletIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada riwayat pembayaran</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tanggal</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tipe</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Jumlah</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Saldo Setelah</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Catatan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="item in historyData" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">{{ formatDateTime(item.createdAt) }}</td>
                <td class="px-4 py-3 text-center"><span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.type === 'CASH_IN' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300']">{{ item.type === 'CASH_IN' ? 'Masuk' : 'Keluar' }}</span></td>
                <td class="px-4 py-3 text-right text-xs font-mono font-semibold" :class="item.type === 'CASH_IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">{{ item.type === 'CASH_IN' ? '+' : '-' }}{{ formatRupiah(item.amount) }}</td>
                <td class="px-4 py-3 text-right text-xs font-mono text-slate-700 dark:text-slate-300">{{ formatRupiah(item.balanceAfter) }}</td>
                <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="historyMeta && historyMeta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p class="text-xs text-slate-500 dark:text-slate-400">Hal. {{ historyMeta.page }} / {{ historyMeta.totalPages }}</p>
          <div class="flex gap-1">
            <button :disabled="historyMeta.page <= 1" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 text-slate-700 dark:text-slate-300" @click="fetchHistoryPage(historyMeta!.page - 1)">Prev</button>
            <button :disabled="historyMeta.page >= historyMeta.totalPages" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 text-slate-700 dark:text-slate-300" @click="fetchHistoryPage(historyMeta!.page + 1)">Next</button>
          </div>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- TAB: Metode Kas                              -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'metode'">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600 dark:text-slate-400">Tambah atau kelola kas terpisah. Setiap kas punya saldo sendiri.</p>
        <button type="button" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5" @click="openCategoryModal(null)">
          <PlusIcon class="w-3.5 h-3.5" /> Tambah Kas Baru
        </button>
      </div>

      <div v-if="categoriesLoading" class="flex items-center justify-center py-16"><Loader2Icon class="w-5 h-5 animate-spin text-slate-400" /></div>

      <div v-else-if="categories.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
        <BoxesIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada kategori</p>
      </div>

      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase w-12">#</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Code</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nama</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Default</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Aktif</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3 text-center text-xs text-slate-400 font-mono">{{ cat.sortOrder }}</td>
                <td class="px-4 py-3"><code class="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{{ cat.code }}</code></td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ cat.name }}</td>
                <td class="px-4 py-3 text-center"><span v-if="cat.isDefault" class="text-[10px] font-bold text-blue-600 dark:text-blue-400">Default</span><span v-else class="text-[10px] text-slate-400">—</span></td>
                <td class="px-4 py-3 text-center"><span :class="['w-2 h-2 rounded-full inline-block', cat.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"></span></td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800" @click="openCategoryModal(cat)"><PencilIcon class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /></button>
                    <button v-if="!cat.isDefault" class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30" @click="handleDeleteCategory(cat)"><Trash2Icon class="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>


    <!-- Mutation Modal -->
    <Teleport to="body">
      <div v-if="showMutationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showMutationModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleMutation">
          <h3 class="text-sm font-bold" :class="mutationType === 'CASH_IN' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">{{ mutationType === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}</h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kas / Kategori *</label>
            <select v-model="mutationCategoryId" required class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="">— Pilih Kas —</option>
              <option v-for="cat in mutationCategories" :key="cat.id" :value="cat.id">{{ cat.name }} ({{ cat.code }})</option>
            </select>
          </div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah (Rp) *</label><input v-model.number="mutationAmount" type="number" min="1" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan</label><input v-model="mutationNotes" type="text" placeholder="Opsional" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          <div v-if="mutationError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ mutationError }}</div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md" @click="showMutationModal = false">Batal</button>
            <button type="submit" :disabled="mutationSaving" :class="['h-9 px-4 text-xs font-semibold text-white rounded-md disabled:opacity-50', mutationType === 'CASH_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700']">{{ mutationType === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}</button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Category Modal -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCategoryModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleSaveCategory">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ editingCategory ? 'Edit Kas' : 'Tambah Kas Baru' }}</h3>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Code *</label><input v-model="categoryForm.code" type="text" required :disabled="!!editingCategory" placeholder="RETAIL" class="w-full h-9 px-3 text-sm font-mono uppercase border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed" /></div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama *</label><input v-model="categoryForm.name" type="text" required placeholder="Kas Retail" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warna</label><input v-model="categoryForm.color" type="text" placeholder="blue" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none" /></div>
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Icon</label><input v-model="categoryForm.icon" type="text" placeholder="shopping-cart" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none" /></div>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2"><input v-model="categoryForm.isDefault" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded" /><span class="text-xs text-slate-700 dark:text-slate-300">Default</span></label>
            <label class="flex items-center gap-2"><input v-model="categoryForm.isActive" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded" /><span class="text-xs text-slate-700 dark:text-slate-300">Aktif</span></label>
          </div>
          <div v-if="categoryError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ categoryError }}</div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md" @click="showCategoryModal = false">Batal</button>
            <button type="submit" :disabled="categorySaving" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{{ editingCategory ? 'Simpan' : 'Tambah' }}</button>
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

const authStore = useAuthStore();
type TabKey = 'mutasi' | 'metode';
const tabs: { key: TabKey; label: string }[] = [{ key: 'mutasi', label: 'Mutasi' }, { key: 'metode', label: 'Kelola Kas' }];
const activeTab = ref<TabKey>('mutasi');

function getShopId(): string | undefined { return authStore.user?.shopId || undefined; }
function formatRupiah(n: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function methodBadge(m: string): string { const map: Record<string, string> = { CASH: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', QRIS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', TRANSFER: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', HUTANG: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' }; return map[m] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'; }

// Mutasi state
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

// Metode state
const categories = ref<CashBoxCategoryDto[]>([]);
const categoriesLoading = ref(false);
const showCategoryModal = ref(false);
const editingCategory = ref<CashBoxCategoryDto | null>(null);
const categorySaving = ref(false);
const categoryError = ref<string | null>(null);
const categoryForm = reactive({ code: '', name: '', color: '', icon: '', isDefault: false, isActive: true });

async function fetchCashBox() { const s = getShopId(); if (!s) return; try { cashBox.value = await kasRetailService.getCashBox(s); } catch { /* */ } }
async function fetchHistory() { const s = getShopId(); if (!s) return; historyLoading.value = true; try { const res = await kasRetailService.getHistory({ shopId: s, categoryId: mutasiCategoryFilter.value || undefined, startDate: mutasiStartDate.value || undefined, endDate: mutasiEndDate.value || undefined, page: 1, limit: 20 }); historyData.value = res.data; historyMeta.value = res.meta; } catch { historyData.value = []; } finally { historyLoading.value = false; } }
async function fetchHistoryPage(p: number) { const s = getShopId(); if (!s) return; historyLoading.value = true; try { const res = await kasRetailService.getHistory({ shopId: s, categoryId: mutasiCategoryFilter.value || undefined, startDate: mutasiStartDate.value || undefined, endDate: mutasiEndDate.value || undefined, page: p, limit: 20 }); historyData.value = res.data; historyMeta.value = res.meta; } catch { /* */ } finally { historyLoading.value = false; } }

function openMutationModal(type: 'CASH_IN' | 'CASH_OUT') { mutationType.value = type; mutationAmount.value = 0; mutationNotes.value = ''; mutationCategoryId.value = ''; mutationError.value = null; showMutationModal.value = true; if (mutationCategories.value.length === 0) { fetchMutationCategories(); } }

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
  mutasiCategoryFilter.value = cb.categoryId || cb.id || '';
  fetchHistory();
}
async function fetchMutationCategories() { try { const res = await cashBoxCategoryService.list(false); mutationCategories.value = res.data; } catch { /* */ } }
async function handleMutation() { const s = getShopId(); if (!s) return; if (!mutationCategoryId.value) { mutationError.value = 'Pilih kas/kategori terlebih dahulu.'; return; } mutationSaving.value = true; mutationError.value = null; try { await kasRetailService.createMutation({ shopId: s, type: mutationType.value, amount: mutationAmount.value, categoryId: mutationCategoryId.value, notes: mutationNotes.value || undefined }); showMutationModal.value = false; await fetchCashBox(); await fetchHistory(); } catch (e: any) { mutationError.value = e?.response?.data?.message || e?.message || 'Gagal.'; } finally { mutationSaving.value = false; } }

async function fetchCategories() { categoriesLoading.value = true; try { const res = await cashBoxCategoryService.list(true); categories.value = res.data; } catch { categories.value = []; } finally { categoriesLoading.value = false; } }
function openCategoryModal(cat: CashBoxCategoryDto | null) { editingCategory.value = cat; categoryError.value = null; if (cat) { Object.assign(categoryForm, { code: cat.code, name: cat.name, color: cat.color || '', icon: cat.icon || '', isDefault: cat.isDefault, isActive: cat.isActive }); } else { Object.assign(categoryForm, { code: '', name: '', color: '', icon: '', isDefault: false, isActive: true }); } showCategoryModal.value = true; }
async function handleSaveCategory() { categorySaving.value = true; categoryError.value = null; try { if (editingCategory.value) { await cashBoxCategoryService.update(editingCategory.value.id, { name: categoryForm.name, color: categoryForm.color || undefined, icon: categoryForm.icon || undefined, isDefault: categoryForm.isDefault, isActive: categoryForm.isActive }); } else { await cashBoxCategoryService.create({ code: categoryForm.code.toUpperCase(), name: categoryForm.name, color: categoryForm.color || undefined, icon: categoryForm.icon || undefined, isDefault: categoryForm.isDefault, isActive: categoryForm.isActive }); } showCategoryModal.value = false; await fetchCategories(); await fetchCashBox(); await fetchMutationCategories(); } catch (e: any) { categoryError.value = e?.response?.data?.message || e?.message || 'Gagal.'; } finally { categorySaving.value = false; } }
async function handleDeleteCategory(cat: CashBoxCategoryDto) { if (!confirm(`Hapus kategori "${cat.name}"?`)) return; try { await cashBoxCategoryService.remove(cat.id); await fetchCategories(); } catch { /* */ } }

function handleTabChange(tab: TabKey) { activeTab.value = tab; if (tab === 'metode' && categories.value.length === 0) fetchCategories(); }

onMounted(() => { fetchCashBox(); fetchHistory(); fetchMutationCategories(); });

useAutoRefresh(() => { fetchCashBox(); fetchHistory(); });
</script>
