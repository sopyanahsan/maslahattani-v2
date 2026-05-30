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

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<ShopSettings>({ ...DEFAULT_SETTINGS });
  const loaded = ref(false);

  // Getters
  const isBrilinkEnabled = computed(() => settings.value.brilinkEnabled);
  const isShiftGuardEnabled = computed(() => settings.value.shiftGuardEnabled);
  const isQrisEnabled = computed(() => settings.value.paymentQrisEnabled);
  const isHutangEnabled = computed(() => settings.value.paymentHutangEnabled);
  const isSaveBillEnabled = computed(() => settings.value.saveBillEnabled);
  const isDiscountPerItemEnabled = computed(() => settings.value.discountPerItemEnabled);
  const isDiscountTotalEnabled = computed(() => settings.value.discountTotalEnabled);
  const isNotePerItemEnabled = computed(() => settings.value.notePerItemEnabled);

  async function fetchSettings(shopId: string) {
    try {
      const { data } = await api.get(`/shops/${shopId}/settings`);
      settings.value = { ...DEFAULT_SETTINGS, ...data };
      loaded.value = true;
    } catch {
      settings.value = { ...DEFAULT_SETTINGS };
      loaded.value = true;
    }
  }

  function clear() {
    settings.value = { ...DEFAULT_SETTINGS };
    loaded.value = false;
  }

  return {
    settings,
    loaded,
    isBrilinkEnabled,
    isShiftGuardEnabled,
    isQrisEnabled,
    isHutangEnabled,
    isSaveBillEnabled,
    isDiscountPerItemEnabled,
    isDiscountTotalEnabled,
    isNotePerItemEnabled,
    fetchSettings,
    clear,
  };
});
