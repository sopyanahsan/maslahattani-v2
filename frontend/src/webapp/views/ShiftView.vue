<template>
  <div class="space-y-4 p-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <!-- ===== STATE 1: No active shift — Open Shift ===== -->
    <template v-else-if="!hasOpenShift && !showClosedSummary">
      <header>
        <h1 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClockIcon class="w-5 h-5 text-blue-600" /> Buka Shift
        </h1>
      </header>

      <!-- Last balance (mode Saldo Mengalir / FLOWING) -->
      <div v-if="!isResetMode" class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <p class="text-xs font-semibold text-slate-600">Saldo Terakhir (saldo mengalir dari shift sebelumnya):</p>
        <div class="flex justify-between text-sm">
          <span class="text-slate-700">Kas Retail</span>
          <span class="font-mono font-bold text-slate-900">{{ formatRupiah(lastBalance.retail) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between text-sm">
          <span class="text-slate-700">Kas BRILink</span>
          <span class="font-mono font-bold text-slate-900">{{ formatRupiah(lastBalance.brilink) }}</span>
        </div>
      </div>

      <!-- Modal awal (mode Shift Reset / RESET) -->
      <div v-else class="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <label class="text-xs font-semibold text-slate-600 block">Modal Awal Kas (Rp)</label>
        <input v-model.number="openForm.startingCash" type="number" min="0" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 rounded-lg text-center focus:border-blue-500 outline-none" />
        <p class="text-[10px] text-slate-400">Mode Shift Reset: masukkan modal kas awal untuk shift ini.</p>
      </div>

      <!-- Correction (optional) -->
      <div v-if="settingsStore.settings.shiftCorrectionRequired" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p class="text-xs font-semibold text-amber-700">Koreksi saldo (jika ada selisih):</p>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-600 w-20">Kas Retail:</span>
          <input v-model.number="correction.retail" type="number" placeholder="0" class="flex-1 h-8 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-right" />
        </div>
        <input v-model="correction.notes" type="text" placeholder="Catatan koreksi (opsional)" class="w-full h-8 px-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
      </div>

      <button :disabled="opening || !defaultCategoryId" class="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50" style="background-color: #2563eb;" @click="handleOpenShift">
        <Loader2Icon v-if="opening" class="w-5 h-5 animate-spin" />
        <template v-else><PlayIcon class="w-5 h-5" /> Buka Shift Sekarang</template>
      </button>
      <p v-if="!defaultCategoryId && !loading" class="text-[11px] text-red-500 text-center">
        Belum ada kategori kas aktif. Hubungi admin untuk setup kategori kas.
      </p>
    </template>

    <!-- ===== STATE 2: Shift Active ===== -->
    <template v-else-if="hasOpenShift">
      <header class="flex items-center justify-between">
        <h1 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          Shift Aktif
        </h1>
        <span class="text-xs text-slate-500">{{ shiftDurationLabel }}</span>
      </header>

      <!-- Real-time balance -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <p class="text-xs font-semibold text-slate-600 mb-2">Saldo Real-time</p>
        <div class="flex justify-between text-sm">
          <span class="text-slate-700">Kas Retail</span>
          <span class="font-mono font-bold text-slate-900">{{ formatRupiah(realtimeBalance.retail) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between text-sm">
          <span class="text-slate-700">Kas BRILink</span>
          <span class="font-mono font-bold text-slate-900">{{ formatRupiah(realtimeBalance.brilink) }}</span>
        </div>
      </div>

      <!-- Today's activity -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <p class="text-xs font-semibold text-slate-600 mb-2">Aktivitas Shift Ini</p>
        <div class="flex justify-between text-xs text-slate-700">
          <span>+ Penjualan Retail</span>
          <span class="font-mono text-emerald-600">{{ formatRupiah(activity.sales) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between text-xs text-slate-700">
          <span>+ Fee BRILink</span>
          <span class="font-mono text-emerald-600">{{ formatRupiah(activity.brilinkFee) }}</span>
        </div>
        <div class="flex justify-between text-xs text-slate-700">
          <span>+ Cash In</span>
          <span class="font-mono text-emerald-600">{{ formatRupiah(activity.cashIn) }}</span>
        </div>
        <div class="flex justify-between text-xs text-slate-700">
          <span>- Cash Out</span>
          <span class="font-mono text-red-500">{{ formatRupiah(activity.cashOut) }}</span>
        </div>
      </div>

      <!-- Cash In / Out buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button class="h-11 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors" @click="showCashModal = 'CASH_IN'">
          <ArrowDownIcon class="w-4 h-4" /> Cash In
        </button>
        <button class="h-11 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors" @click="showCashModal = 'CASH_OUT'">
          <ArrowUpIcon class="w-4 h-4" /> Cash Out
        </button>
      </div>

      <!-- Close Shift -->
      <button class="w-full h-11 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors" @click="showCloseShift = true">
        <SquareIcon class="w-4 h-4" /> Tutup Shift
      </button>
    </template>

    <!-- ===== STATE 3: Closed Summary ===== -->
    <template v-else-if="showClosedSummary">
      <div class="bg-white rounded-xl border border-slate-200 p-5 text-center space-y-3">
        <CheckCircleIcon class="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 class="text-lg font-bold text-slate-800">Shift Ditutup</h2>
        <p class="text-xs text-slate-500">Ringkasan akan tersedia di admin panel.</p>
        <button class="h-10 px-6 bg-blue-600 text-white font-semibold text-sm rounded-xl" @click="showClosedSummary = false">Kembali</button>
      </div>
    </template>

    <!-- ===== CASH IN/OUT MODAL ===== -->
    <Teleport to="body">
      <div v-if="showCashModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCashModal = null"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
          <h3 class="text-base font-bold text-slate-800">{{ showCashModal === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}</h3>
          <!-- Category -->
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Kategori</label>
            <select v-model="cashForm.categoryId" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none">
              <option value="">Pilih kategori...</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <!-- Amount -->
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Jumlah (Rp)</label>
            <input v-model.number="cashForm.amount" type="number" min="0" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 rounded-lg text-center focus:border-blue-500 outline-none" />
          </div>
          <!-- Notes -->
          <input v-model="cashForm.notes" type="text" placeholder="Catatan (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          <!-- Approval hint -->
          <p v-if="showCashModal === 'CASH_OUT' && settingsStore.settings.cashOutApprovalEnabled" class="text-[11px] text-amber-600 flex items-start gap-1">
            <span>&#9888;</span>
            <span>Pengeluaran ini akan berstatus <strong>menunggu persetujuan admin</strong>.</span>
          </p>
          <!-- Error -->
          <div v-if="cashError" class="bg-red-50 rounded-lg p-2 text-xs text-red-700">{{ cashError }}</div>
          <!-- Actions -->
          <div class="flex gap-2">
            <button class="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600" @click="showCashModal = null">Batal</button>
            <button :disabled="cashSubmitting" class="flex-1 h-10 rounded-xl text-white font-semibold text-sm" :style="{ backgroundColor: showCashModal === 'CASH_IN' ? '#059669' : '#dc2626' }" @click="handleCashFlow">
              {{ cashSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== CLOSE SHIFT MODAL ===== -->
    <Teleport to="body">
      <div v-if="showCloseShift" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCloseShift = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
          <h3 class="text-base font-bold text-slate-800">Tutup Shift</h3>
          <template v-if="settingsStore.settings.shiftPhysicalCountRequired">
            <p class="text-xs text-slate-600">Hitung uang fisik di laci kas:</p>
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Kas Retail (Rp)</label>
              <input v-model.number="closeForm.actualRetail" type="number" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 rounded-lg text-center focus:border-blue-500 outline-none" />
            </div>
            <div class="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-slate-500">Expected</span><span class="font-mono">{{ formatRupiah(realtimeBalance.retail) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Actual</span><span class="font-mono">{{ formatRupiah(closeForm.actualRetail || 0) }}</span></div>
              <div class="flex justify-between font-semibold" :class="variance >= 0 ? 'text-emerald-600' : 'text-red-600'"><span>Selisih</span><span class="font-mono">{{ formatRupiah(variance) }}</span></div>
            </div>
          </template>
          <div v-else class="bg-slate-50 rounded-lg p-3 text-xs flex justify-between">
            <span class="text-slate-500">Saldo sistem (hitung fisik dimatikan)</span>
            <span class="font-mono font-semibold text-slate-800">{{ formatRupiah(realtimeBalance.retail) }}</span>
          </div>
          <input v-model="closeForm.notes" type="text" placeholder="Catatan (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          <button :disabled="closing" class="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style="background-color: #2563eb;" @click="handleCloseShift">
            <Loader2Icon v-if="closing" class="w-5 h-5 animate-spin" />
            <template v-else><CheckIcon class="w-5 h-5" /> Konfirmasi Tutup Shift</template>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Clock as ClockIcon, Play as PlayIcon, Loader2 as Loader2Icon,
  ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon,
  Square as SquareIcon, Check as CheckIcon, CheckCircle2 as CheckCircleIcon,
} from 'lucide-vue-next';
import { useShiftStore } from '@/shared/stores/shift.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useAuthStore } from '@/shared/stores/auth.store';
import cashBoxCategoryService from '@/shared/services/cashbox-category.service';
import api from '@/shared/services/api';

const shiftStore = useShiftStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();

// Mode shift dari Pengaturan Sistem: FLOWING (saldo mengalir) | RESET (modal awal).
const isResetMode = computed(() => settingsStore.settings.shiftMode === 'RESET');

// Kategori kas default (dipakai untuk payload buka/tutup shift ke backend).
const defaultCategoryId = ref<string | null>(null);
// Saat tutup: pakai kategori default dari shift aktif (lebih robust).
const closeCategoryId = computed(() => {
  const boxes = shiftStore.currentShift?.cashBoxes ?? [];
  return (
    boxes.find((cb) => cb.category.isDefault)?.categoryId ??
    boxes[0]?.categoryId ??
    defaultCategoryId.value
  );
});

const loading = ref(true);
const opening = ref(false);
const closing = ref(false);
const showClosedSummary = ref(false);
const showCashModal = ref<'CASH_IN' | 'CASH_OUT' | null>(null);
const showCloseShift = ref(false);
const cashSubmitting = ref(false);
const cashError = ref<string | null>(null);
const cashCategories = ref<any[]>([]);

const hasOpenShift = computed(() => shiftStore.hasOpenShift);
const shiftDurationLabel = computed(() => {
  const m = shiftStore.shiftDurationMinutes;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}j ${min}m` : `${min}m`;
});

const lastBalance = reactive({ retail: 0, brilink: 0 });
const realtimeBalance = reactive({ retail: 0, brilink: 0 });
const activity = reactive({ sales: 0, brilinkFee: 0, cashIn: 0, cashOut: 0 });
const correction = reactive({ retail: 0, notes: '' });
const openForm = reactive({ startingCash: 0 });
const cashForm = reactive({ categoryId: '', amount: 0, notes: '' });
const closeForm = reactive({ actualRetail: 0, notes: '' });

const filteredCategories = computed(() =>
  cashCategories.value.filter(c => c.type === showCashModal.value && c.isActive)
);

const variance = computed(() => (closeForm.actualRetail || 0) - realtimeBalance.retail);

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

async function handleOpenShift() {
  if (!defaultCategoryId.value) return;
  opening.value = true;
  try {
    // Hitung modal awal:
    // - RESET: dari input kasir (modal awal)
    // - FLOWING: saldo mengalir (lastBalance) + koreksi opsional
    let startingCash = 0;
    if (isResetMode.value) {
      startingCash = openForm.startingCash || 0;
    } else {
      startingCash = (lastBalance.retail || 0);
      if (settingsStore.settings.shiftCorrectionRequired) {
        startingCash += correction.retail || 0;
      }
    }
    await shiftStore.openShift({
      startingCashByCategory: [
        { categoryId: defaultCategoryId.value, startingCash },
      ],
      notes:
        settingsStore.settings.shiftCorrectionRequired && correction.notes
          ? correction.notes
          : undefined,
    });
  } catch { /* error handled by store */ }
  finally { opening.value = false; }
}

async function handleCashFlow() {
  if (!cashForm.categoryId) { cashError.value = 'Pilih kategori.'; return; }
  if (!cashForm.amount || cashForm.amount <= 0) { cashError.value = 'Jumlah harus > 0.'; return; }
  cashSubmitting.value = true;
  cashError.value = null;
  try {
    await api.post('/cash-flows', {
      categoryId: cashForm.categoryId,
      type: showCashModal.value,
      amount: cashForm.amount,
      notes: cashForm.notes || undefined,
      shiftId: shiftStore.currentShift?.id,
    });
    showCashModal.value = null;
    cashForm.categoryId = '';
    cashForm.amount = 0;
    cashForm.notes = '';
    await refreshActivity();
  } catch (err: any) {
    cashError.value = err.response?.data?.message || 'Gagal menyimpan.';
  } finally { cashSubmitting.value = false; }
}

async function handleCloseShift() {
  if (!shiftStore.currentShift) return;
  if (!closeCategoryId.value) return;
  closing.value = true;
  // Kalau hitung fisik dimatikan, anggap kas fisik = saldo sistem (selisih 0).
  const actualCash = settingsStore.settings.shiftPhysicalCountRequired
    ? closeForm.actualRetail || 0
    : realtimeBalance.retail;
  try {
    await shiftStore.closeShift(shiftStore.currentShift.id, {
      // actualQRIS sengaja tidak dikirim → backend rekonsiliasi otomatis ke expected.
      actualByCategory: [{ categoryId: closeCategoryId.value, actualCash }],
      notes: closeForm.notes || undefined,
    });
    showCloseShift.value = false;
    showClosedSummary.value = true;
  } catch { /* error in store */ }
  finally { closing.value = false; }
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/cash-flows/categories');
    cashCategories.value = data.data || [];
  } catch { cashCategories.value = []; }
}

async function fetchDefaultCategory() {
  try {
    const { data } = await cashBoxCategoryService.list();
    const def =
      data.find((c) => c.isDefault && c.isActive) ??
      data.find((c) => c.isActive) ??
      data[0];
    defaultCategoryId.value = def?.id ?? null;
  } catch {
    defaultCategoryId.value = null;
  }
}

async function refreshActivity() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await api.get('/cash-flows/summary', {
      params: { shiftId: shiftStore.currentShift?.id, startDate: today, endDate: today },
    });
    activity.cashIn = data.cashIn?.total || 0;
    activity.cashOut = data.cashOut?.total || 0;
  } catch { /* silent */ }
}

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([shiftStore.fetchCurrentShift(), fetchDefaultCategory()]);
    if (hasOpenShift.value) {
      await Promise.all([refreshActivity(), fetchCategories()]);
      // Calculate realtime balance (simplified)
      realtimeBalance.retail = shiftStore.totalCashInHand;
    }
  } catch { /* silent */ }
  finally { loading.value = false; }
  await fetchCategories();
});
</script>
