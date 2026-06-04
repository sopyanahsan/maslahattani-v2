<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Top Bar -->
    <header class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
      <div class="min-w-0">
        <p class="text-sm font-bold text-slate-900 leading-tight truncate">Stock Opname</p>
        <p class="text-[10px] text-slate-500 leading-tight">
          {{ participantName }} &middot; {{ sessionNumber }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold font-mono">
          {{ passcode }}
        </span>
        <button
          type="button"
          class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Keluar sesi"
          @click="handleExit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="bg-white border-b border-slate-100 px-4 py-2.5">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[11px] font-semibold text-slate-600">Progress</span>
        <span class="text-[11px] font-bold text-slate-800">{{ countedCount }}/{{ items.length }}</span>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-300"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="w-8 h-8 animate-spin text-violet-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        <p class="text-sm text-slate-500">Memuat produk...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="flex-1 flex items-center justify-center p-4">
      <div class="bg-red-50 border border-red-200 rounded-xl p-5 text-center max-w-sm w-full">
        <p class="text-sm text-red-700 mb-3">{{ loadError }}</p>
        <button
          type="button"
          class="h-9 px-4 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
          @click="fetchItems"
        >
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Items List -->
    <main v-else class="flex-1 overflow-y-auto pb-24">
      <!-- Search -->
      <div class="sticky top-0 z-10 bg-slate-50 px-4 pt-3 pb-2">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk..."
            class="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg
                   focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
          />
        </div>
        <!-- Filter tabs -->
        <div class="flex gap-2 mt-2">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            type="button"
            :class="[
              'px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors',
              activeFilter === tab.key
                ? 'bg-violet-100 text-violet-700'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            ]"
            @click="activeFilter = tab.key"
          >
            {{ tab.label }} ({{ tab.count }})
          </button>
        </div>
      </div>

      <!-- Product Cards -->
      <div class="px-4 pt-2 space-y-2">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :class="[
            'bg-white border rounded-xl p-3.5 transition-all',
            item.actualQty !== null ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <!-- Product Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ item.productName }}</p>
              <p class="text-[10px] text-slate-400 font-mono">{{ item.productSku }}</p>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  Sistem: {{ item.systemQty }}
                </span>
                <span
                  v-if="item.variance !== null"
                  :class="[
                    'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded',
                    item.variance === 0 ? 'bg-emerald-100 text-emerald-700' :
                    item.variance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ item.variance === 0 ? 'Cocok' : (item.variance > 0 ? '+' + item.variance : item.variance) }}
                </span>
              </div>
            </div>

            <!-- Qty Input -->
            <div class="flex flex-col items-center gap-1">
              <label class="text-[9px] font-semibold text-slate-500 uppercase">Fisik</label>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                  @click="decrementQty(item)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                  </svg>
                </button>
                <input
                  :value="item.inputQty"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="w-14 h-8 text-center text-sm font-bold border border-slate-200 rounded-lg
                         focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                  @input="(e) => handleQtyInput(item, (e.target as HTMLInputElement).value)"
                  @blur="submitCount(item)"
                />
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                  @click="incrementQty(item)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>
              <!-- Quick set to system qty -->
              <button
                v-if="item.actualQty === null"
                type="button"
                class="text-[9px] text-violet-600 font-medium hover:underline"
                @click="setToSystemQty(item)"
              >
                = Sama ({{ item.systemQty }})
              </button>
              <span v-else class="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Tercatat
              </span>
            </div>
          </div>
        </div>

        <!-- Empty search -->
        <div v-if="filteredItems.length === 0 && items.length > 0" class="text-center py-10 text-slate-400 text-sm">
          Produk tidak ditemukan.
        </div>
      </div>
    </main>

    <!-- Bottom Summary Bar -->
    <div v-if="!loading && !loadError" class="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 px-4 py-3 safe-bottom">
      <div class="flex items-center justify-between max-w-3xl mx-auto">
        <div>
          <p class="text-xs text-slate-500">
            <span class="font-bold text-emerald-600">{{ countedCount }}</span> tercatat &middot;
            <span class="font-bold text-slate-700">{{ items.length - countedCount }}</span> tersisa
          </p>
        </div>
        <!-- Button: Selesai & Kirim ke Admin -->
        <button
          v-if="countedCount === items.length && items.length > 0"
          type="button"
          :disabled="submitting"
          class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg
                 hover:bg-emerald-700 active:scale-[0.97] transition-all flex items-center gap-1.5
                 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSubmitToAdmin"
        >
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ submitting ? 'Mengirim...' : 'Selesai & Kirim ke Admin' }}
        </button>
        <!-- Progress indicator if not all counted -->
        <span v-else-if="countedCount > 0" class="text-[10px] text-slate-400">
          {{ Math.round(progressPercent) }}%
        </span>
      </div>
    </div>

    <!-- Success Modal (after submit) -->
    <teleport to="body">
      <div
        v-if="showSuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
          <!-- Success animation -->
          <div class="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-900">Opname Selesai!</h2>
            <p class="text-sm text-slate-500 mt-1">
              Hasil hitung stok sudah dikirim ke admin. Admin akan review dan memutuskan apakah stok perlu disesuaikan.
            </p>
          </div>

          <!-- Summary -->
          <div class="bg-slate-50 rounded-xl p-4 text-left space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Total produk dihitung</span>
              <span class="text-xs font-bold text-slate-800">{{ items.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Cocok (selisih 0)</span>
              <span class="text-xs font-bold text-emerald-600">{{ matchedCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Ada selisih</span>
              <span class="text-xs font-bold text-amber-600">{{ items.length - matchedCount }}</span>
            </div>
          </div>

          <button
            type="button"
            class="w-full h-10 bg-emerald-600 text-white text-sm font-semibold rounded-xl
                   hover:bg-emerald-700 transition-colors"
            @click="handleDone"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </teleport>

    <!-- Custom Confirm Modal -->
    <teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="handleConfirmNo"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <div class="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900">{{ confirmTitle }}</h3>
            <p class="text-sm text-slate-500 mt-1.5">{{ confirmMessage }}</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-10 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl
                     hover:bg-slate-200 transition-colors"
              @click="handleConfirmNo"
            >
              Batal
            </button>
            <button
              type="button"
              :class="['flex-1 h-10 text-sm font-semibold text-white rounded-xl transition-colors', confirmButtonClass]"
              @click="handleConfirmYes"
            >
              {{ confirmButtonText }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import opnameService, {
  type OpnameItemDto,
  type OpnameSessionDetailDto,
} from '@/shared/services/opname.service';

// ============================================
// Props & Router
// ============================================
const props = defineProps<{ sessionId: string }>();
const router = useRouter();

// ============================================
// State
// ============================================
const loading = ref(true);
const loadError = ref<string | null>(null);
const items = ref<CountableItem[]>([]);
const sessionNumber = ref('');
const searchQuery = ref('');
const activeFilter = ref<'all' | 'pending' | 'counted'>('all');

// From sessionStorage (set in OpnameJoinView)
const participantName = sessionStorage.getItem('opname_participant_name') || 'Petugas';
const participantId = sessionStorage.getItem('opname_participant_id') || '';
const passcode = sessionStorage.getItem('opname_passcode') || '';

// Submit state
const submitting = ref(false);
const showSuccessModal = ref(false);

// Custom confirm modal state
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmAction = ref<(() => void) | null>(null);
const confirmButtonText = ref('Ya');
const confirmButtonClass = ref('bg-blue-600 hover:bg-blue-700');

// ============================================
// Types
// ============================================
interface CountableItem extends OpnameItemDto {
  inputQty: string; // string for input binding
  saving: boolean;
}

// ============================================
// Computed
// ============================================
const countedCount = computed(() => items.value.filter((i) => i.actualQty !== null).length);
const matchedCount = computed(() => items.value.filter((i) => i.variance === 0).length);
const progressPercent = computed(() => {
  if (items.value.length === 0) return 0;
  return Math.round((countedCount.value / items.value.length) * 100);
});

const filterTabs = computed(() => [
  { key: 'all' as const, label: 'Semua', count: items.value.length },
  { key: 'pending' as const, label: 'Belum', count: items.value.length - countedCount.value },
  { key: 'counted' as const, label: 'Sudah', count: countedCount.value },
]);

const filteredItems = computed(() => {
  let result = items.value;

  // Filter by tab
  if (activeFilter.value === 'pending') {
    result = result.filter((i) => i.actualQty === null);
  } else if (activeFilter.value === 'counted') {
    result = result.filter((i) => i.actualQty !== null);
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.productSku.toLowerCase().includes(q),
    );
  }

  return result;
});

// ============================================
// Methods
// ============================================

async function fetchItems() {
  loading.value = true;
  loadError.value = null;

  try {
    // Use the public session detail endpoint
    const session: OpnameSessionDetailDto = await opnameService.getSessionPublic(props.sessionId);
    sessionNumber.value = session.sessionNumber;
    items.value = session.items.map((item) => ({
      ...item,
      inputQty: item.actualQty !== null ? String(item.actualQty) : '',
      saving: false,
    }));
  } catch (err: any) {
    loadError.value = err.response?.data?.message || err.message || 'Gagal memuat data produk.';
  } finally {
    loading.value = false;
  }
}

function handleQtyInput(item: CountableItem, value: string) {
  item.inputQty = value;
}

function incrementQty(item: CountableItem) {
  const current = parseInt(item.inputQty) || 0;
  item.inputQty = String(current + 1);
  submitCount(item);
}

function decrementQty(item: CountableItem) {
  const current = parseInt(item.inputQty) || 0;
  if (current > 0) {
    item.inputQty = String(current - 1);
    submitCount(item);
  }
}

function setToSystemQty(item: CountableItem) {
  item.inputQty = String(item.systemQty);
  submitCount(item);
}

async function submitCount(item: CountableItem) {
  const qty = parseInt(item.inputQty);
  if (isNaN(qty) || qty < 0) return;
  if (item.saving) return;

  // Skip if same value already saved
  if (item.actualQty === qty) return;

  item.saving = true;
  try {
    const result = await opnameService.updateItemPublic(item.id, {
      actualQty: qty,
      countedById: participantId,
    });
    item.actualQty = result.actualQty;
    item.variance = result.variance;
  } catch {
    // Revert input on failure
    item.inputQty = item.actualQty !== null ? String(item.actualQty) : '';
  } finally {
    item.saving = false;
  }
}

function handleExit() {
  if (countedCount.value < items.value.length) {
    showCustomConfirm(
      'Keluar Sesi?',
      `Masih ada ${items.value.length - countedCount.value} produk belum dihitung. Yakin keluar?`,
      doExit,
      'Ya, Keluar',
      'bg-red-600 hover:bg-red-700',
    );
    return;
  }
  doExit();
}

function doExit() {
  sessionStorage.removeItem('opname_participant_id');
  sessionStorage.removeItem('opname_participant_name');
  sessionStorage.removeItem('opname_session_id');
  sessionStorage.removeItem('opname_passcode');
  router.push({ name: 'webapp-opname-join' });
}

async function handleSubmitToAdmin() {
  if (countedCount.value < items.value.length) return;

  showCustomConfirm(
    'Kirim Hasil Opname?',
    'Semua produk sudah dihitung. Kirim hasil ke admin untuk di-review?',
    doSubmit,
    'Kirim ke Admin',
    'bg-emerald-600 hover:bg-emerald-700',
  );
}

async function doSubmit() {
  submitting.value = true;
  try {
    await opnameService.notifyCountingComplete(props.sessionId, participantId);
    showSuccessModal.value = true;
  } catch {
    showSuccessModal.value = true;
  } finally {
    submitting.value = false;
  }
}

function showCustomConfirm(
  title: string,
  message: string,
  action: () => void,
  btnText: string = 'Ya',
  btnClass: string = 'bg-blue-600 hover:bg-blue-700',
) {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction.value = action;
  confirmButtonText.value = btnText;
  confirmButtonClass.value = btnClass;
  showConfirmModal.value = true;
}

function handleConfirmYes() {
  showConfirmModal.value = false;
  if (confirmAction.value) confirmAction.value();
}

function handleConfirmNo() {
  showConfirmModal.value = false;
  confirmAction.value = null;
}

function handleDone() {
  // Clear session data
  sessionStorage.removeItem('opname_participant_id');
  sessionStorage.removeItem('opname_participant_name');
  sessionStorage.removeItem('opname_session_id');
  sessionStorage.removeItem('opname_passcode');
  showSuccessModal.value = false;
  router.push({ name: 'webapp-opname-join' });
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  // Guard: if no participant info, redirect back to join
  if (!participantId) {
    router.replace({ name: 'webapp-opname-join' });
    return;
  }
  fetchItems();
});
</script>

<style scoped>
.safe-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

/* Hide number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
