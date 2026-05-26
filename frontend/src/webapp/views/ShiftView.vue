<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">Shift Kasir</h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Buka shift di awal hari, tutup di akhir dengan input nominal kas fisik.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="initialLoading"
      class="bg-white border border-slate-200 rounded-lg p-8 text-center"
    >
      <component :is="Loader2Icon" class="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
      <p class="text-xs text-slate-500">Memuat status shift…</p>
    </div>

    <!-- Closed summary (just finished closing shift) -->
    <ShiftClosedSummary
      v-else-if="lastClosedSummary"
      :summary="lastClosedSummary"
      :total-transactions="lastClosedTotalTransactions"
      @done="handleDone"
    />

    <!-- Open Shift Form (no active shift) -->
    <ShiftOpenForm
      v-else-if="!hasOpenShift"
      :loading="shiftStore.loading"
      :error-message="shiftStore.error"
      @submit="handleOpenShift"
      @clear-error="shiftStore.clearError"
    />

    <!-- Active Shift Panel -->
    <ShiftActivePanel
      v-else-if="currentShift"
      :shift="currentShift"
      :transaction-count="transactionCount"
      :duration-minutes="shiftDurationMinutes"
      :loading="shiftStore.loading"
      :error-message="shiftStore.error"
      @close-shift="handleCloseShift"
      @clear-error="shiftStore.clearError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2 as Loader2Icon } from 'lucide-vue-next';
import { useShiftStore } from '@/shared/stores/shift.store';
import type {
  OpenShiftPayload,
  CloseShiftPayload,
} from '@/shared/services/shift.service';
import ShiftOpenForm from '@/webapp/components/shift/ShiftOpenForm.vue';
import ShiftActivePanel from '@/webapp/components/shift/ShiftActivePanel.vue';
import ShiftClosedSummary from '@/webapp/components/shift/ShiftClosedSummary.vue';

const router = useRouter();
const shiftStore = useShiftStore();

const initialLoading = ref(true);

const currentShift = computed(() => shiftStore.currentShift);
const hasOpenShift = computed(() => shiftStore.hasOpenShift);
const transactionCount = computed(() => shiftStore.transactionCount);
const shiftDurationMinutes = computed(() => shiftStore.shiftDurationMinutes);
const lastClosedSummary = computed(() => shiftStore.lastClosedSummary);
const lastClosedTotalTransactions = computed(
  () => shiftStore.lastClosedTotalTransactions,
);

async function handleOpenShift(payload: OpenShiftPayload) {
  try {
    await shiftStore.openShift(payload);
  } catch {
    // Error sudah diset di store, ditampilin via shiftStore.error
  }
}

async function handleCloseShift(payload: CloseShiftPayload) {
  if (!currentShift.value) return;
  try {
    await shiftStore.closeShift(currentShift.value.id, payload);
  } catch {
    // Error sudah diset di store
  }
}

function handleDone() {
  // Setelah lihat ringkasan close shift, balik ke beranda
  shiftStore.clearLastSummary();
  router.push({ name: 'webapp-dashboard' });
}

onMounted(async () => {
  try {
    await shiftStore.fetchCurrentShift();
  } catch {
    // Error sudah di store
  } finally {
    initialLoading.value = false;
  }
});
</script>
