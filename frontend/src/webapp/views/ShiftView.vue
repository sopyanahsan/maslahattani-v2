<template>
  <div class="shift-page min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 space-y-4">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
      <div class="relative w-10 h-10">
        <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Memuat shift...</p>
    </div>

    <!-- ===== STATE 1: No active shift — Open Shift ===== -->
    <template v-else-if="!hasOpenShift && !showClosedSummary">
      <header class="flex items-center gap-2.5">
        <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <ClockIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-950 dark:text-white">Buka Shift</h1>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">Mulai shift baru untuk hari ini</p>
        </div>
      </header>

      <!-- Last balance (mode Saldo Mengalir / FLOWING) -->
      <div v-if="!isResetMode" class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">Saldo Terakhir <span class="font-normal text-slate-400">(mengalir dari shift sebelumnya)</span></p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">Kas Retail</span>
          <span class="font-mono font-bold text-slate-950 dark:text-white">{{ formatRupiah(lastBalance.retail) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">Kas Tunai Agen</span>
          <span class="font-mono font-bold text-slate-950 dark:text-white">{{ formatRupiah(lastBalance.brilink) }}</span>
        </div>
      </div>

      <!-- Modal awal (mode Shift Reset / RESET) -->
      <div v-else class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-2">
        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Modal Awal Kas (Rp)</label>
        <input v-model.number="openForm.startingCash" type="number" min="0" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
        <p class="text-[10px] text-slate-400 dark:text-slate-500">Mode Shift Reset: masukkan modal kas awal untuk shift ini.</p>
      </div>

      <!-- Correction (optional) -->
      <div v-if="settingsStore.settings.shiftCorrectionRequired" class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-lg p-4 shadow-sm space-y-3">
        <p class="text-xs font-semibold text-amber-700 dark:text-amber-400">Koreksi saldo (jika ada selisih):</p>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-600 dark:text-slate-300 w-24">Kas Retail:</span>
          <input v-model.number="correction.retail" type="number" placeholder="0" class="flex-1 h-8 px-3 text-sm font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-600 outline-none text-right" />
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex items-center gap-2">
          <span class="text-xs text-slate-600 dark:text-slate-300 w-24">Kas Tunai Agen:</span>
          <input v-model.number="correction.brilink" type="number" placeholder="0" class="flex-1 h-8 px-3 text-sm font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-600 outline-none text-right" />
        </div>
        <input v-model="correction.notes" type="text" placeholder="Catatan koreksi (opsional)" class="w-full h-8 px-3 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-600 outline-none" />
      </div>

      <!-- Open error -->
      <div v-if="openError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 text-xs text-red-700 dark:text-red-300 border-l-4 border-l-red-500">
        {{ openError }}
      </div>

      <button :disabled="opening || !defaultCategoryId" class="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-900/30" @click="handleOpenShift">
        <Loader2Icon v-if="opening" class="w-5 h-5 animate-spin" />
        <template v-else><PlayIcon class="w-5 h-5" /> Buka Shift Sekarang</template>
      </button>
      <p v-if="!defaultCategoryId && !loading" class="text-[11px] text-red-500 dark:text-red-400 text-center">
        Belum ada kategori kas aktif. Hubungi admin untuk setup.
      </p>
    </template>

    <!-- ===== STATE 2: Shift Active ===== -->
    <template v-else-if="hasOpenShift">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg relative">
            <ClockIcon class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white dark:ring-slate-950"></span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-950 dark:text-white">Shift Aktif</h1>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Sedang berjalan</p>
          </div>
        </div>
        <span class="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">{{ shiftDurationLabel }}</span>
      </header>

      <!-- Real-time balance -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-2.5">
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo Real-time</p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">Kas Retail</span>
          <span class="font-mono font-bold text-slate-950 dark:text-white text-base">{{ formatRupiah(realtimeBalance.retail) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">Kas Tunai Agen</span>
          <span class="font-mono font-bold text-slate-950 dark:text-white text-base">{{ formatRupiah(realtimeBalance.brilink) }}</span>
        </div>
      </div>

      <!-- Today's activity -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-2.5">
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aktivitas Shift Ini</p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">+ Penjualan Retail</span>
          <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(activity.sales) }}</span>
        </div>
        <div v-if="settingsStore.isBrilinkEnabled" class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">+ Fee BRILink</span>
          <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(activity.brilinkFee) }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">+ Cash In</span>
          <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(activity.cashIn) }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-700 dark:text-slate-300">- Cash Out</span>
          <span class="font-mono font-semibold text-red-500 dark:text-red-400">{{ formatRupiah(activity.cashOut) }}</span>
        </div>
      </div>

      <!-- Close Shift -->
      <button class="w-full h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-[0.98] transition-all" @click="showCloseShift = true">
        <SquareIcon class="w-4 h-4" /> Tutup Shift
      </button>
    </template>

    <!-- ===== STATE 3: Closed Summary ===== -->
    <template v-else-if="showClosedSummary">
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center space-y-4 shadow-sm">
        <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircleIcon class="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h2 class="text-lg font-bold text-slate-950 dark:text-white">Shift Ditutup</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Ringkasan tersedia di admin panel.</p>
        <button class="h-10 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm rounded-lg transition-all shadow-sm shadow-blue-200 dark:shadow-blue-900/30" @click="showClosedSummary = false">Kembali</button>
      </div>
    </template>

    <!-- ===== CLOSE SHIFT MODAL ===== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCloseShift" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="showCloseShift = false"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <SquareIcon class="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <h3 class="text-base font-bold text-slate-950 dark:text-white">Tutup Shift</h3>
            </div>
            <template v-if="settingsStore.settings.shiftPhysicalCountRequired">
              <p class="text-xs text-slate-600 dark:text-slate-300">Hitung uang fisik di laci kas:</p>
              <div>
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Kas Retail (Rp)</label>
                <input v-model.number="closeForm.actualRetail" type="number" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
              </div>
              <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1 text-xs">
                <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Expected</span><span class="font-mono text-slate-800 dark:text-white">{{ formatRupiah(realtimeBalance.retail) }}</span></div>
                <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Actual</span><span class="font-mono text-slate-800 dark:text-white">{{ formatRupiah(closeForm.actualRetail || 0) }}</span></div>
                <div class="flex justify-between font-semibold" :class="variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"><span>Selisih</span><span class="font-mono">{{ formatRupiah(variance) }}</span></div>
              </div>
              <div v-if="settingsStore.isBrilinkEnabled">
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Kas Tunai Agen (Rp)</label>
                <input v-model.number="closeForm.actualBrilink" type="number" placeholder="0" class="w-full h-10 px-3 text-lg font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
              </div>
              <div v-if="settingsStore.isBrilinkEnabled" class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1 text-xs">
                <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Expected</span><span class="font-mono text-slate-800 dark:text-white">{{ formatRupiah(realtimeBalance.brilink) }}</span></div>
                <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Actual</span><span class="font-mono text-slate-800 dark:text-white">{{ formatRupiah(closeForm.actualBrilink || 0) }}</span></div>
                <div class="flex justify-between font-semibold" :class="varianceBrilink >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"><span>Selisih</span><span class="font-mono">{{ formatRupiah(varianceBrilink) }}</span></div>
              </div>
            </template>
            <div v-else class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">Saldo sistem</span>
              <span class="font-mono font-semibold text-slate-900 dark:text-white">{{ formatRupiah(realtimeBalance.retail) }}</span>
            </div>
            <input v-model="closeForm.notes" type="text" placeholder="Catatan (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-all" />
            <button :disabled="closing" class="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-900/30" @click="handleCloseShift">
              <Loader2Icon v-if="closing" class="w-5 h-5 animate-spin" />
              <template v-else><CheckIcon class="w-5 h-5" /> Konfirmasi Tutup Shift</template>
            </button>
          </div>
        </div>
      </Transition>
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
import brilinkCashboxService from '@/shared/services/brilink-cashbox.service';
import api from '@/shared/services/api';

const shiftStore = useShiftStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();

const isResetMode = computed(() => settingsStore.settings.shiftMode === 'RESET');
const defaultCategoryId = ref<string | null>(null);
const closeCategoryId = computed(() => {
  const boxes = shiftStore.currentShift?.cashBoxes ?? [];
  return boxes.find((cb) => cb.category.isDefault)?.categoryId ?? boxes[0]?.categoryId ?? defaultCategoryId.value;
});

const loading = ref(true);
const opening = ref(false);
const openError = ref<string | null>(null);
const closing = ref(false);
const showClosedSummary = ref(false);
const showCloseShift = ref(false);

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
const correction = reactive({ retail: 0, brilink: 0, notes: '' });
const openForm = reactive({ startingCash: 0 });
const closeForm = reactive({ actualRetail: 0, actualBrilink: 0, notes: '' });

const variance = computed(() => (closeForm.actualRetail || 0) - realtimeBalance.retail);
const varianceBrilink = computed(() => (closeForm.actualBrilink || 0) - realtimeBalance.brilink);

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

async function handleOpenShift() {
  if (!defaultCategoryId.value) return;
  opening.value = true;
  openError.value = null;
  try {
    let startingCash = 0;
    if (isResetMode.value) {
      startingCash = openForm.startingCash || 0;
    } else {
      startingCash = lastBalance.retail || 0;
      if (settingsStore.settings.shiftCorrectionRequired) startingCash += correction.retail || 0;
    }
    await shiftStore.openShift({
      startingCashByCategory: [{ categoryId: defaultCategoryId.value, startingCash }],
      notes: settingsStore.settings.shiftCorrectionRequired && correction.notes ? correction.notes : undefined,
    });
    if (settingsStore.isBrilinkEnabled && settingsStore.settings.shiftCorrectionRequired && correction.brilink !== 0) {
      try {
        const shopId = authStore.user?.shopId || '';
        if (shopId) {
          const amount = Math.abs(correction.brilink);
          const notes = `Koreksi buka shift${correction.notes ? ': ' + correction.notes : ''}`;
          if (correction.brilink > 0) await brilinkCashboxService.setor(shopId, { amount, notes });
          else await brilinkCashboxService.tarik(shopId, { amount, notes });
        }
      } catch { /* non-blocking */ }
    }
  } catch (err: any) {
    openError.value = err?.message || 'Gagal membuka shift.';
  } finally { opening.value = false; }
}

async function handleCloseShift() {
  if (!shiftStore.currentShift || !closeCategoryId.value) return;
  closing.value = true;
  const actualCash = settingsStore.settings.shiftPhysicalCountRequired ? closeForm.actualRetail || 0 : realtimeBalance.retail;
  try {
    await shiftStore.closeShift(shiftStore.currentShift.id, {
      actualByCategory: [{ categoryId: closeCategoryId.value, actualCash }],
      actualBrilinkCash: settingsStore.isBrilinkEnabled && settingsStore.settings.shiftPhysicalCountRequired ? (closeForm.actualBrilink || 0) : undefined,
      notes: closeForm.notes || undefined,
    });
    showCloseShift.value = false;
    showClosedSummary.value = true;
  } catch { /* error in store */ }
  finally { closing.value = false; }
}

async function fetchDefaultCategory() {
  try {
    const { data } = await cashBoxCategoryService.list();
    const def = data.find((c) => c.isDefault && c.isActive) ?? data.find((c) => c.isActive) ?? data[0];
    defaultCategoryId.value = def?.id ?? null;
  } catch { defaultCategoryId.value = null; }
}

async function refreshActivity() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const shopId = authStore.user?.shopId || '';
    const requests: Promise<any>[] = [
      api.get('/cash-flows/summary', { params: { shiftId: shiftStore.currentShift?.id, startDate: today, endDate: today } }),
      api.get('/transactions/stats', { params: { shopId, startDate: today, endDate: today } }),
    ];
    if (settingsStore.isBrilinkEnabled && shopId) requests.push(api.get('/brilink/transactions/kpi', { params: { shopId } }));
    const results = await Promise.allSettled(requests);
    if (results[0].status === 'fulfilled') { const d = results[0].value.data; activity.cashIn = d.cashIn?.total || 0; activity.cashOut = d.cashOut?.total || 0; }
    if (results[1].status === 'fulfilled') { const s = results[1].value.data; activity.sales = s.omzet || s.totalOmzet || s.totalSales || 0; }
    if (results.length > 2 && results[2].status === 'fulfilled') {
      const kpi = results[2].value.data;
      const feeVal = kpi.fee?.current ?? kpi.currentFee ?? kpi.fee ?? 0;
      activity.brilinkFee = typeof feeVal === 'number' ? feeVal : 0;
    }
  } catch { /* silent */ }
}

onMounted(async () => {
  loading.value = true;
  try {
    const [shiftRes] = await Promise.all([shiftStore.fetchCurrentShift(), fetchDefaultCategory()]);
    if (shiftRes?.lastBalance) { lastBalance.retail = shiftRes.lastBalance.retail ?? 0; lastBalance.brilink = shiftRes.lastBalance.brilink ?? 0; }
    if (hasOpenShift.value) {
      await refreshActivity();
      realtimeBalance.retail = shiftStore.totalCashInHand;
      if (settingsStore.isBrilinkEnabled) {
        try { const shopId = authStore.user?.shopId || ''; if (shopId) { const cb = await brilinkCashboxService.getCashBox(shopId); realtimeBalance.brilink = cb.balance; } } catch {}
      }
    }
  } catch {}
  finally { loading.value = false; }
});
</script>

<style scoped>
.shift-page { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div:last-child { transform: scale(0.95) translateY(10px); }
.modal-leave-to > div:last-child { transform: scale(0.95); }
</style>
