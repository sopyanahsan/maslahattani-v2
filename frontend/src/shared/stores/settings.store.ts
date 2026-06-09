import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/shared/services/api';
import { setShopTimezone } from '@/shared/utils/formatDate';

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
  timezone: string;
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
  timezone: 'Asia/Jakarta',
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
  'timezone',
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

/** Polling interval: 10 seconds. */
const POLL_INTERVAL_MS = 10_000;

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<ShopSettings>({ ...DEFAULT_SETTINGS });
  const loaded = ref(false);

  // Change detection state
  const settingsChanged = ref(false);
  const changedFields = ref<string[]>([]);
  const lastChangeTimestamp = ref<number | null>(null);

  // Snapshot of last-known server values (for comparison on next poll)
  const lastKnownSnapshot = ref<Record<string, any>>({});

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
  const timezone = computed(() => settings.value.timezone || 'Asia/Jakarta');

  // ============================================
  // Actions
  // ============================================

  async function fetchSettings(shopId: string) {
    currentShopId = shopId;
    try {
      const { data } = await api.get(`/shops/${shopId}/settings`);

      // Extract only toggle values from server response
      const serverToggles: Record<string, any> = {};
      for (const key of TOGGLE_KEYS) {
        serverToggles[key] = data[key];
      }

      console.log('[SettingsStore] Poll response toggles:', JSON.stringify(serverToggles));

      // Detect changes: compare SNAPSHOT (last known state) vs SERVER (new state)
      if (loaded.value && Object.keys(lastKnownSnapshot.value).length > 0) {
        const changes = detectChanges(lastKnownSnapshot.value, serverToggles);
        console.log('[SettingsStore] Comparing snapshot vs server. Changes:', changes);
        if (changes.length > 0) {
          console.log('[SettingsStore] 🔔 Perubahan terdeteksi dari admin:', changes);
          settingsChanged.value = true;
          changedFields.value = changes;
          lastChangeTimestamp.value = Date.now();
        }
      }

      // Update settings (triggers UI reactivity)
      const newSettings: ShopSettings = { ...DEFAULT_SETTINGS };
      for (const key of TOGGLE_KEYS) {
        if (data[key] !== undefined) {
          (newSettings as any)[key] = data[key];
        }
      }
      settings.value = newSettings;

      // Sync timezone to localStorage for utility functions
      setShopTimezone(newSettings.timezone || 'Asia/Jakarta');

      // Update snapshot to current server state
      lastKnownSnapshot.value = { ...serverToggles };
      loaded.value = true;
    } catch (err) {
      console.warn('[SettingsStore] fetchSettings gagal:', err);
      if (!loaded.value) {
        settings.value = { ...DEFAULT_SETTINGS };
        loaded.value = true;
      }
    }
  }

  /**
   * Compare old snapshot and new server values.
   * Returns list of human-readable change descriptions.
   */
  function detectChanges(
    snapshot: Record<string, any>,
    server: Record<string, any>,
  ): string[] {
    const changes: string[] = [];
    for (const key of TOGGLE_KEYS) {
      const oldVal = snapshot[key];
      const newVal = server[key];
      if (oldVal !== newVal && newVal !== undefined) {
        const label = TOGGLE_LABELS[key] || key;
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

  function dismissChange() {
    settingsChanged.value = false;
    changedFields.value = [];
  }

  function startPolling(shopId?: string) {
    if (shopId) currentShopId = shopId;
    stopPolling();
    if (!currentShopId) return;

    console.log('[SettingsStore] Polling dimulai — interval:', POLL_INTERVAL_MS, 'ms, shopId:', currentShopId);
    pollTimer = setInterval(async () => {
      if (currentShopId) {
        await fetchSettings(currentShopId);
      }
    }, POLL_INTERVAL_MS);
  }

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
    lastKnownSnapshot.value = {};
    currentShopId = null;
  }

  return {
    settings,
    loaded,
    settingsChanged,
    changedFields,
    lastChangeTimestamp,
    isBrilinkEnabled,
    isShiftGuardEnabled,
    isQrisEnabled,
    isHutangEnabled,
    isSaveBillEnabled,
    isDiscountPerItemEnabled,
    isDiscountTotalEnabled,
    isNotePerItemEnabled,
    timezone,
    fetchSettings,
    dismissChange,
    startPolling,
    stopPolling,
    clear,
  };
});
