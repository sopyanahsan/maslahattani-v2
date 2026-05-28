<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Kas &amp; Rekening BRILink</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Mutasi saldo BRI, daftar rekening, dan pengaturan metode kas BRILink.
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>


    <!-- ============================================ -->
    <!-- TAB: Rekening BRI                            -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'rekening'">
      <!-- Actions bar -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600 dark:text-slate-400">Daftar rekening BRI agen.</p>
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg
                 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openAccountModal(null)"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          Tambah Rekening
        </button>
      </div>

      <!-- Loading -->
      <div v-if="accountsLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat rekening...</span>
      </div>


      <!-- Empty -->
      <div
        v-else-if="accounts.length === 0"
        class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center"
      >
        <LandmarkIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada rekening BRI</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tambahkan rekening BRI agen untuk mulai tracking saldo.</p>
      </div>

      <!-- Account cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="account in accounts"
          :key="account.id"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ account.label }}</h4>
                <span
                  v-if="account.isDefault"
                  class="text-[9px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
                >Default</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{{ account.accountNumber }}</p>
              <p v-if="account.accountHolder" class="text-[11px] text-slate-500 dark:text-slate-400">{{ account.accountHolder }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Edit"
                @click="openAccountModal(account)"
              >
                <PencilIcon class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Hapus"
                @click="handleDeleteAccount(account)"
              >
                <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>


          <!-- Balance -->
          <div class="mb-3">
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Saldo</p>
            <p
              :class="[
                'text-lg font-bold font-mono',
                account.balance < account.lowBalanceThreshold
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100',
              ]"
            >
              {{ formatRupiah(account.balance) }}
            </p>
            <p v-if="account.balance < account.lowBalanceThreshold" class="text-[10px] text-red-500 dark:text-red-400">
              ⚠ Di bawah threshold ({{ formatRupiah(account.lowBalanceThreshold) }})
            </p>
          </div>

          <!-- Setor / Tarik buttons -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              @click="openMutationModal(account, 'setor')"
            >
              + Setor
            </button>
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
              @click="openMutationModal(account, 'tarik')"
            >
              - Tarik
            </button>
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              @click="openMutationsHistory(account)"
            >
              Riwayat
            </button>
          </div>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- TAB: Mutasi (placeholder)                    -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'mutasi'">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <WalletIcon class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Mutasi Saldo BRILink</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Riwayat keluar masuk uang per rekening BRILink, filter by tanggal &amp; kategori.
        </p>
        <!-- akan diimplementasi di PRD terpisah (feat/kas-rekening-brilink) -->
        <span class="inline-flex mt-4 text-[10px] font-bold uppercase tracking-wide
                     bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded">
          Akan diimplementasi di PRD terpisah
        </span>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Metode Kas (placeholder)                -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'metode'">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <BoxesIcon class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Metode Kas BRILink</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          CRUD kategori cashbox BRILink (TRANSFER, TARIK_TUNAI, TOPUP_PULSA, dst).
        </p>
        <!-- akan diimplementasi di PRD terpisah (feat/kas-rekening-brilink) -->
        <span class="inline-flex mt-4 text-[10px] font-bold uppercase tracking-wide
                     bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded">
          Akan diimplementasi di PRD terpisah
        </span>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- MODAL: Create/Edit Account                   -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showAccountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showAccountModal = false" />
        <form
          class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleSaveAccount"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ editingAccount ? 'Edit Rekening' : 'Tambah Rekening Baru' }}
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Label <span class="text-red-500">*</span></label>
            <input v-model="accountForm.label" type="text" required placeholder="BRI Default"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No. Rekening <span class="text-red-500">*</span></label>
            <input v-model="accountForm.accountNumber" type="text" required placeholder="1234567890"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik</label>
            <input v-model="accountForm.accountHolder" type="text" placeholder="Nama pemilik rekening"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Threshold Low Balance</label>
              <input v-model.number="accountForm.lowBalanceThreshold" type="number" min="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div class="flex items-end pb-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="accountForm.isDefault" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Default</span>
              </label>
            </div>
          </div>


          <div v-if="accountModalError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ accountModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showAccountModal = false">Batal</button>
            <button type="submit" :disabled="savingAccount" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingAccount" class="w-3.5 h-3.5 animate-spin" />
              {{ editingAccount ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Setor / Tarik                         -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showMutationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showMutationModal = false" />
        <form
          class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleMutationSubmit"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ mutationType === 'setor' ? 'Setor Saldo' : 'Tarik Saldo' }} — {{ mutationAccount?.label }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Saldo saat ini: <span class="font-mono font-bold">{{ formatRupiah(mutationAccount?.balance ?? 0) }}</span>
          </p>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="mutationForm.amount" type="number" min="1" required
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Referensi</label>
            <input v-model="mutationForm.reference" type="text" placeholder="No. setoran / keterangan"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
            <input v-model="mutationForm.notes" type="text" placeholder="Opsional"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>


          <div v-if="mutationModalError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ mutationModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showMutationModal = false">Batal</button>
            <button type="submit" :disabled="savingMutation"
              :class="[
                'h-9 px-4 text-xs font-semibold text-white rounded-md disabled:opacity-50 flex items-center gap-1.5',
                mutationType === 'setor' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
              ]">
              <Loader2Icon v-if="savingMutation" class="w-3.5 h-3.5 animate-spin" />
              {{ mutationType === 'setor' ? 'Setor' : 'Tarik' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Mutations History                      -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showHistoryModal = false" />
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Riwayat Mutasi — {{ historyAccount?.label }}</h3>
            <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" @click="showHistoryModal = false">✕</button>
          </div>


          <div v-if="historyLoading" class="flex items-center justify-center py-8">
            <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          </div>
          <div v-else-if="historyData.length === 0" class="text-center py-8">
            <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada mutasi.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="mut in historyData"
              :key="mut.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
            >
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', mutationTypeStyle(mut.type)]">
                {{ mutationTypeIcon(mut.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ mut.description }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(mut.createdAt) }}
                  <span v-if="mut.createdBy"> &bull; {{ mut.createdBy.username || mut.createdBy.email }}</span>
                </p>
              </div>
              <div class="text-right shrink-0">
                <p :class="['text-xs font-bold font-mono', mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']">
                  {{ mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}
                </p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Saldo: {{ formatRupiah(mut.balanceAfter) }}
                </p>
              </div>
            </div>
          </div>


          <!-- Pagination -->
          <div v-if="historyMeta && historyMeta.totalPages > 1" class="flex items-center justify-between pt-2">
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Hal. {{ historyMeta.page }} / {{ historyMeta.totalPages }}</p>
            <div class="flex gap-1">
              <button :disabled="historyMeta.page <= 1" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page - 1)">Prev</button>
              <button :disabled="historyMeta.page >= historyMeta.totalPages" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page + 1)">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  Loader2 as Loader2Icon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Landmark as LandmarkIcon,
  Wallet as WalletIcon,
  Boxes as BoxesIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import brilinkAccountService, {
  type BrilinkAccount,
  type BrilinkMutationItem,
  type MutationsResponse,
} from '@/shared/services/brilink-account.service';


const authStore = useAuthStore();

// Tabs
type TabKey = 'rekening' | 'mutasi' | 'metode';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'rekening', label: 'Rekening BRI' },
  { key: 'mutasi', label: 'Mutasi' },
  { key: 'metode', label: 'Metode Kas' },
];
const activeTab = ref<TabKey>('rekening');

// ============================================
// Accounts State
// ============================================
const accounts = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(false);
const showAccountModal = ref(false);
const editingAccount = ref<BrilinkAccount | null>(null);
const savingAccount = ref(false);
const accountModalError = ref<string | null>(null);
const accountForm = reactive({
  label: '',
  accountNumber: '',
  accountHolder: '',
  lowBalanceThreshold: 1000000,
  isDefault: false,
});

// ============================================
// Mutation (Setor/Tarik) State
// ============================================
const showMutationModal = ref(false);
const mutationType = ref<'setor' | 'tarik'>('setor');
const mutationAccount = ref<BrilinkAccount | null>(null);
const savingMutation = ref(false);
const mutationModalError = ref<string | null>(null);
const mutationForm = reactive({
  amount: 0,
  reference: '',
  notes: '',
});

// ============================================
// History State
// ============================================
const showHistoryModal = ref(false);
const historyAccount = ref<BrilinkAccount | null>(null);
const historyLoading = ref(false);
const historyData = ref<BrilinkMutationItem[]>([]);
const historyMeta = ref<MutationsResponse['meta'] | null>(null);


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
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function mutationTypeIcon(type: string): string {
  switch (type) {
    case 'SETOR': return '↑';
    case 'TARIK': return '↓';
    case 'TRX_DEBIT': return '−';
    case 'TRX_CREDIT': return '+';
    case 'ADJUSTMENT': return '⟳';
    default: return '?';
  }
}

function mutationTypeStyle(type: string): string {
  switch (type) {
    case 'SETOR':
    case 'TRX_CREDIT':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    case 'TARIK':
    case 'TRX_DEBIT':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'ADJUSTMENT':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}


// ============================================
// Accounts Methods
// ============================================
async function fetchAccounts() {
  const shopId = getShopId();
  if (!shopId) return;
  accountsLoading.value = true;
  try {
    accounts.value = await brilinkAccountService.list(shopId);
  } catch {
    accounts.value = [];
  } finally {
    accountsLoading.value = false;
  }
}

function openAccountModal(account: BrilinkAccount | null) {
  editingAccount.value = account;
  accountModalError.value = null;
  if (account) {
    accountForm.label = account.label;
    accountForm.accountNumber = account.accountNumber;
    accountForm.accountHolder = account.accountHolder || '';
    accountForm.lowBalanceThreshold = account.lowBalanceThreshold;
    accountForm.isDefault = account.isDefault;
  } else {
    accountForm.label = '';
    accountForm.accountNumber = '';
    accountForm.accountHolder = '';
    accountForm.lowBalanceThreshold = 1000000;
    accountForm.isDefault = false;
  }
  showAccountModal.value = true;
}

async function handleSaveAccount() {
  const shopId = getShopId();
  if (!shopId) return;
  savingAccount.value = true;
  accountModalError.value = null;
  try {
    if (editingAccount.value) {
      await brilinkAccountService.update(editingAccount.value.id, {
        label: accountForm.label,
        accountNumber: accountForm.accountNumber,
        accountHolder: accountForm.accountHolder || undefined,
        lowBalanceThreshold: accountForm.lowBalanceThreshold,
        isDefault: accountForm.isDefault,
      });
    } else {
      await brilinkAccountService.create({
        shopId,
        label: accountForm.label,
        accountNumber: accountForm.accountNumber,
        accountHolder: accountForm.accountHolder || undefined,
        lowBalanceThreshold: accountForm.lowBalanceThreshold,
        isDefault: accountForm.isDefault,
      });
    }
    showAccountModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    accountModalError.value = err?.response?.data?.message || err?.message || 'Gagal menyimpan.';
  } finally {
    savingAccount.value = false;
  }
}


async function handleDeleteAccount(account: BrilinkAccount) {
  if (!confirm(`Hapus rekening "${account.label}"?`)) return;
  try {
    await brilinkAccountService.remove(account.id);
    await fetchAccounts();
  } catch {
    /* silent */
  }
}

// ============================================
// Setor / Tarik Methods
// ============================================
function openMutationModal(account: BrilinkAccount, type: 'setor' | 'tarik') {
  mutationAccount.value = account;
  mutationType.value = type;
  mutationModalError.value = null;
  mutationForm.amount = 0;
  mutationForm.reference = '';
  mutationForm.notes = '';
  showMutationModal.value = true;
}

async function handleMutationSubmit() {
  if (!mutationAccount.value) return;
  savingMutation.value = true;
  mutationModalError.value = null;
  try {
    const payload = {
      amount: mutationForm.amount,
      reference: mutationForm.reference || undefined,
      notes: mutationForm.notes || undefined,
    };
    if (mutationType.value === 'setor') {
      await brilinkAccountService.setor(mutationAccount.value.id, payload);
    } else {
      await brilinkAccountService.tarik(mutationAccount.value.id, payload);
    }
    showMutationModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    mutationModalError.value = err?.response?.data?.message || err?.message || 'Gagal.';
  } finally {
    savingMutation.value = false;
  }
}

// ============================================
// History Methods
// ============================================
function openMutationsHistory(account: BrilinkAccount) {
  historyAccount.value = account;
  historyData.value = [];
  historyMeta.value = null;
  showHistoryModal.value = true;
  fetchHistory(1);
}

async function fetchHistory(page: number) {
  if (!historyAccount.value) return;
  historyLoading.value = true;
  try {
    const res = await brilinkAccountService.getMutations(historyAccount.value.id, page, 10);
    historyData.value = res.data;
    historyMeta.value = res.meta;
  } catch {
    historyData.value = [];
  } finally {
    historyLoading.value = false;
  }
}

onMounted(fetchAccounts);
</script>
