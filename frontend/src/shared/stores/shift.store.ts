import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import shiftService, {
  type ShiftDto,
  type CloseShiftCategorySummary,
  type OpenShiftPayload,
  type CloseShiftPayload,
} from '@/shared/services/shift.service';

/**
 * Shift store: manage current open shift untuk kasir.
 *
 * Bekerja bareng auth.store + shop.store:
 * - currentShift: shift aktif user saat ini (atau null kalau belum buka).
 *   Selalu termasuk array `cashBoxes` per kategori.
 * - lastClosedSummary: array per-kategori summary saat selesai close shift,
 *   untuk UI confirm screen.
 *
 * Tidak persist ke localStorage karena shift state harus selalu fresh dari
 * server (backend yang authoritative).
 */
export const useShiftStore = defineStore('shift', () => {
  // ============================================
  // State
  // ============================================
  const currentShift = ref<ShiftDto | null>(null);
  const transactionCount = ref<number>(0);
  const lastClosedSummary = ref<CloseShiftCategorySummary[] | null>(null);
  const lastClosedTotalTransactions = ref<number>(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================
  // Getters
  // ============================================
  const hasOpenShift = computed(
    () => currentShift.value?.status === 'OPEN',
  );

  const shiftStartTime = computed(() =>
    currentShift.value?.startTime
      ? new Date(currentShift.value.startTime)
      : null,
  );

  /** Durasi shift dalam menit (live, hitung dari startTime ke now). */
  const shiftDurationMinutes = computed(() => {
    if (!shiftStartTime.value) return 0;
    return Math.floor(
      (Date.now() - shiftStartTime.value.getTime()) / 60000,
    );
  });

  /** Total tunai di tangan = sum(startingCash + expectedCash) per kategori. */
  const totalCashInHand = computed(() => {
    if (!currentShift.value) return 0;
    return currentShift.value.cashBoxes.reduce(
      (sum, cb) => sum + cb.startingCash + cb.expectedCash,
      0,
    );
  });

  /** Total expected QRIS = sum dari semua kategori. */
  const totalExpectedQRIS = computed(() => {
    if (!currentShift.value) return 0;
    return currentShift.value.cashBoxes.reduce(
      (sum, cb) => sum + cb.expectedQRIS,
      0,
    );
  });

  // ============================================
  // Actions
  // ============================================

  function clearError() {
    error.value = null;
  }

  function clearLastSummary() {
    lastClosedSummary.value = null;
    lastClosedTotalTransactions.value = 0;
  }

  /**
   * Fetch shift aktif user saat ini dari /shifts/current.
   * Update currentShift dan transactionCount.
   */
  async function fetchCurrentShift() {
    loading.value = true;
    error.value = null;
    try {
      const response = await shiftService.getCurrentShift();
      currentShift.value = response.shift;
      transactionCount.value = response.transactionCount ?? 0;
      return response;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ??
        err.message ??
        'Gagal memuat status shift.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Buka shift baru. Update currentShift dengan response.
   * Backend reject (409) kalau user sudah punya shift OPEN.
   */
  async function openShift(payload: OpenShiftPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await shiftService.openShift(payload);
      currentShift.value = response.shift;
      transactionCount.value = 0;
      return response;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ??
        err.message ??
        'Gagal membuka shift.';
      throw new Error(error.value!);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Tutup shift aktif. Backend hitung expectedCash/QRIS per kategori dari
   * transaksi dalam shift, lalu compute variance.
   *
   * Set lastClosedSummary supaya UI bisa render layar "Shift Ditutup"
   * dengan ringkasan variance per kategori.
   */
  async function closeShift(shiftId: string, payload: CloseShiftPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await shiftService.closeShift(shiftId, payload);
      // Setelah close: shift bukan OPEN lagi → clear currentShift.
      currentShift.value = null;
      transactionCount.value = 0;
      lastClosedSummary.value = response.summary;
      lastClosedTotalTransactions.value = response.totalTransactions;
      return response;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ??
        err.message ??
        'Gagal menutup shift.';
      throw new Error(error.value!);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reset semua state. Dipanggil dari auth.store saat logout.
   */
  function clear() {
    currentShift.value = null;
    transactionCount.value = 0;
    lastClosedSummary.value = null;
    lastClosedTotalTransactions.value = 0;
    error.value = null;
  }

  return {
    // State
    currentShift,
    transactionCount,
    lastClosedSummary,
    lastClosedTotalTransactions,
    loading,
    error,
    // Getters
    hasOpenShift,
    shiftStartTime,
    shiftDurationMinutes,
    totalCashInHand,
    totalExpectedQRIS,
    // Actions
    fetchCurrentShift,
    openShift,
    closeShift,
    clear,
    clearError,
    clearLastSummary,
  };
});
