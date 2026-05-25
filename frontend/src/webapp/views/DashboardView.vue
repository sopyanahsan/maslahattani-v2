<template>
  <div class="space-y-4">
    <!-- Greeting -->
    <div>
      <p class="text-xs text-slate-500">Selamat datang,</p>
      <h1 class="text-xl font-bold text-slate-950">{{ userName }}</h1>
      <p class="text-xs text-slate-500 mt-0.5">{{ todayLabel }}</p>
    </div>

    <!-- Two big mode buttons: Retail + BRILink -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <RouterLink
        to="/retail/pos"
        class="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all rounded-xl p-5 group"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <component :is="POSIcon" class="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Aktif
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-950">Mulai Retail</h3>
        <p class="text-xs text-slate-500 mt-0.5">
          POS — scan/cari produk, transaksi, struk
        </p>
      </RouterLink>

      <RouterLink
        to="/brilink/transfer"
        class="bg-white border border-dashed border-slate-300 rounded-xl p-5 group opacity-80"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <component :is="LandmarkIcon" class="w-6 h-6 text-slate-600" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
            Phase 2
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-700">Mulai BRILink</h3>
        <p class="text-xs text-slate-500 mt-0.5">
          Transfer, tarik tunai, top-up, mutasi
        </p>
      </RouterLink>
    </div>

    <!-- Quick stats today -->
    <section>
      <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
        Hari Ini
      </h2>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Transaksi</p>
          <p class="text-lg font-bold text-slate-950 font-mono mt-1">
            {{ shiftLoading ? '…' : transactionCount || '—' }}
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Omzet</p>
          <p class="text-lg font-bold text-slate-950 font-mono mt-1">—</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Tunai di Tangan</p>
          <p class="text-lg font-bold text-slate-950 font-mono mt-1">
            {{ shiftLoading ? '…' : expectedCashLabel }}
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Status Shift</p>
          <p :class="['text-sm font-semibold mt-1', shiftStatusColor]">
            {{ shiftStatusLabel }}
          </p>
        </div>
      </div>
    </section>

    <!-- Shift quick action -->
    <section
      v-if="!hasOpenShift"
      class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3"
    >
      <component :is="ClockIcon" class="w-5 h-5 text-blue-600 shrink-0" />
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-900">Mulai shift baru?</p>
        <p class="text-[11px] text-slate-600">
          Catat saldo kas awal supaya audit harian akurat.
        </p>
      </div>
      <RouterLink
        to="/retail/shift"
        class="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
      >
        Buka Shift →
      </RouterLink>
    </section>

    <section
      v-else
      class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3"
    >
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-900">Shift sedang berjalan</p>
        <p class="text-[11px] text-slate-600">
          Dimulai {{ shiftStartLabel }} · {{ durationLabel }}
        </p>
      </div>
      <RouterLink
        to="/retail/shift"
        class="text-xs font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap"
      >
        Lihat / Tutup →
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  ShoppingCart as POSIcon,
  Landmark as LandmarkIcon,
  Clock as ClockIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';

const authStore = useAuthStore();
const shiftStore = useShiftStore();

const userName = computed(
  () => authStore.user?.username || authStore.user?.email?.split('@')[0] || 'Kasir',
);

const todayLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
);

// Shift state
const shiftLoading = computed(() => shiftStore.loading);
const hasOpenShift = computed(() => shiftStore.hasOpenShift);
const transactionCount = computed(() => shiftStore.transactionCount);
const currentShift = computed(() => shiftStore.currentShift);

const expectedCashLabel = computed(() => {
  if (!currentShift.value) return '—';
  const total = currentShift.value.expectedCash || 0;
  if (total === 0) return 'Rp 0';
  return `Rp ${new Intl.NumberFormat('id-ID').format(total)}`;
});

const shiftStatusLabel = computed(() => {
  if (shiftLoading.value && !currentShift.value) return 'Memuat…';
  if (hasOpenShift.value) return 'Aktif';
  return 'Belum dibuka';
});

const shiftStatusColor = computed(() =>
  hasOpenShift.value ? 'text-emerald-600' : 'text-amber-600',
);

const shiftStartLabel = computed(() => {
  if (!currentShift.value?.startTime) return '';
  return new Date(currentShift.value.startTime).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Live ticker for duration label (refresh every minute)
const tick = ref(0);
let tickInterval: ReturnType<typeof setInterval> | null = null;

const durationLabel = computed(() => {
  // Re-compute setiap tick
  void tick.value;
  const total = shiftStore.shiftDurationMinutes;
  if (total <= 0) return 'baru saja';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} menit`;
  return `${hours} jam ${minutes} menit`;
});

onMounted(async () => {
  try {
    await shiftStore.fetchCurrentShift();
  } catch {
    // silent: status shift gagal load, UI tampilkan "—"
  }
  tickInterval = setInterval(() => {
    tick.value++;
  }, 60000);
});

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval);
});
</script>
