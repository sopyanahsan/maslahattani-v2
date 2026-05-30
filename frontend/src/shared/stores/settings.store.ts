import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/shared/services/api';

export interface ShopSettings {
  brilinkEnabled: boolean;
  shiftMode: string;
  shiftForceCloseOnSwitch: boolean;
  shiftCorrectionRequired: boolean;
  shiftPhysicalCountRequired: boolean;
  shiftGuardEnabled: boolean;
  cashOutApprovalEnabled: boolean;
  paymentCashEnabled: boolean;
  paymentQrisEnabled: boolean;
  paymentHutangEnabled: boolean;
  saveBillEnabled: boolean;
  discountPerItemEnabled: boolean;
  discountTotalEnabled: boolean;
  notePerItemEnabled: boolean;
}

const DEFAULT_SETTINGS: ShopSettings = {
  brilinkEnabled: true,
  shiftMode: 'FLOWING',
  shiftForceCloseOnSwitch: true,
  shiftCorrectionRequired: true,
  shiftPhysicalCountRequired: true,
  shiftGuardEnabled: true,
  cashOutApprovalEnabled: true,
  paymentCashEnabled: true,
  paymentQrisEnabled: true,
  paymentHutangEnabled: true,
  saveBillEnabled: true,
  discountPerItemEnabled: true,
  discountTotalEnabled: true,
  notePerItemEnabled: true,
};

/** Toggle fields that the store watches for changes. */
const TOGGLE_KEYS: (keyof ShopSettings)[] = [
  'brilinkEnabled',
  'shiftMode',
  'shiftForceCloseOnSwitch',
  'shiftCorrectionRequired',
  'shiftPhysicalCountRequired',
  'shiftGuardEnabled',
  'cashOutApprovalEnabled',
  'paymentCashEnabled',
  'paymentQrisEnabled',
  'paymentHutangEnabled',
  'saveBillEnabled',
  'discountPerItemEnabled',
  'discountTotalEnabled',
  'notePerItemEnabled',
];

/** Human-readable labels for change notification. */
const TOGGLE_LABELS: Record<string, string> = {
  brilinkEnabled: 'Modul BRILink',
  shiftMode: 'Mode Shift',
  shiftForceCloseOnSwitch: 'Wajib Tutup Shift Ganti Kasir',
  shiftCorrectionRequired: 'Koreksi Saldo Shift',
  shiftPhysicalCountRequired: 'Hitung Fisik Tutup Shift',
  shiftGuardEnabled: 'Shift Guard (POS)',
  cashOutApprovalEnabled: 'Persetujuan Pengeluaran',
  paymentCashEnabled: 'Metode Tunai',
  paymentQrisEnabled: 'Metode QRIS',
  paymentHutangEnabled: 'Metode Hutang',
  saveBillEnabled: 'Simpan Bill',
  discountPerItemEnabled: 'Diskon Per-Item',
  discountTotalEnabled: 'Diskon Total',
  notePerItemEnabled: 'Catatan Per-Item',
};

/** Polling interval: 10 seconds for responsive change detection. */
const POLL_INTERVAL_MS = 10_000;

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<ShopSettings>({ ...DEFAULT_SETTINGS });
  const loaded = ref(false);

  // Change detection state
  const settingsChanged = ref(false);
  const changedFields = ref<string[]>([]);
  const lastChangeTimestamp = ref<number | null>(null);

  // Polling internals
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let currentShopId: string | null = null;

  // ============================================
  // Getters
  // ============================================
  const isBrilinkEnabled = computed(() => settings.value.brilinkEnabled);
  const isShiftGuardEnabled = computed(() => settings.value.shiftGuardEnabled);
  const isQrisEnabled = computed(() => settings.value.paymentQrisEnabled);
  const isHutangEnabled = computed(() => settings.value.paymentHutangEnabled);
  const isSaveBillEnabled = computed(() => settings.value.saveBillEnabled);
  const isDiscountPerItemEnabled = computed(() => settings.value.discountPerItemEnabled);
  const isDiscountTotalEnabled = computed(() => settings.value.discountTotalEnabled);
  const isNotePerItemEnabled = computed(() => settings.value.notePerItemEnabled);

  // ============================================
  // Actions
  // ============================================

  async function fetchSettings(shopId: string) {
    currentShopId = shopId;
    try {
      const { data } = await api.get(`/shops/${shopId}/settings`);
      const newSettings: ShopSettings = { ...DEFAULT_SETTINGS, ...data };

      // Detect changes (only if settings were already loaded once)
      if (loaded.value) {
        const changes = detectChanges(settings.value, newSettings);
        if (changes.length > 0) {
          console.log('[SettingsStore] Perubahan terdeteksi dari admin:', changes);
          settingsChanged.value = true;
          changedFields.value = changes;
          lastChangeTimestamp.value = Date.now();
        }
      }

      settings.value = newSettings;
      loaded.value = true;
    } catch (err) {
      console.warn('[SettingsStore] fetchSettings gagal:', err);
      // Only set defaults if we never loaded successfully
      if (!loaded.value) {
        settings.value = { ...DEFAULT_SETTINGS };
        loaded.value = true;
      }
    }
  }

  /**
   * Compare old and new settings, return list of human-readable labels
   * for fields that changed.
   */
  function detectChanges(
    oldSettings: ShopSettings,
    newSettings: ShopSettings,
  ): string[] {
    const changes: string[] = [];
    for (const key of TOGGLE_KEYS) {
      if (oldSettings[key] !== newSettings[key]) {
        const label = TOGGLE_LABELS[key] || key;
        const newVal = newSettings[key];
        const status =
          typeof newVal === 'boolean'
            ? newVal
              ? 'ON'
              : 'OFF'
            : String(newVal);
        changes.push(`${label}: ${status}`);
      }
    }
    return changes;
  }

  /**
   * Dismiss the change notification (kasir acknowledged).
   */
  function dismissChange() {
    settingsChanged.value = false;
    changedFields.value = [];
  }

  /**
   * Start polling for settings changes. Call from KasirLayout mount.
   * Silently re-fetches settings every POLL_INTERVAL_MS.
   */
  function startPolling(shopId?: string) {
    if (shopId) currentShopId = shopId;
    stopPolling(); // Clear any existing timer
    if (!currentShopId) return;

    console.log('[SettingsStore] Polling dimulai — interval:', POLL_INTERVAL_MS, 'ms, shopId:', currentShopId);
    pollTimer = setInterval(async () => {
      if (currentShopId) {
        await fetchSettings(currentShopId);
      }
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop polling. Call from KasirLayout unmount / logout.
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function clear() {
    stopPolling();
    settings.value = { ...DEFAULT_SETTINGS };
    loaded.value = false;
    settingsChanged.value = false;
    changedFields.value = [];
    lastChangeTimestamp.value = null;
    currentShopId = null;
  }

  return {
    settings,
    loaded,
    // Change detection
    settingsChanged,
    changedFields,
    lastChangeTimestamp,
    // Getters
    isBrilinkEnabled,
    isShiftGuardEnabled,
    isQrisEnabled,
    isHutangEnabled,
    isSaveBillEnabled,
    isDiscountPerItemEnabled,
    isDiscountTotalEnabled,
    isNotePerItemEnabled,
    // Actions
    fetchSettings,
    dismissChange,
    startPolling,
    stopPolling,
    clear,
  };
});
