<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Pengaturan</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Konfigurasi toko, struk, bahasa, alert, dan preferensi sistem.
      </p>
    </div>

    <!-- Tab switcher -->
    <div
      class="border-b border-slate-200 dark:border-slate-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
    >
      <nav class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0',
            activeTab === tab.value
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          ]"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat pengaturan...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- TAB: TOKO                                    -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'shop'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <StoreIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" /> Data Toko
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveShop">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Toko
              </label>
              <input
                v-model="shopForm.name"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Telepon
              </label>
              <input
                v-model="shopForm.phone"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat
            </label>
            <textarea
              v-model="shopForm.address"
              rows="2"
              class="w-full text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div
            v-if="shopSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ shopSuccess }}
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="savingShop"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingShop" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================ -->
      <!-- TAB: BAHASA                                  -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'language'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GlobeIcon class="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Bahasa
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveLanguage">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bahasa Sistem
            </label>
            <select
              v-model="languageForm.language"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
              <option value="su">Basa Sunda</option>
              <option value="jv">Basa Jawa</option>
            </select>
          </div>
          <div
            v-if="langSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ langSuccess }}
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="savingLang"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingLang" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================ -->
      <!-- TAB: STRUK                                   -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'receipt'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PrinterIcon class="w-4 h-4 text-amber-600 dark:text-amber-400" /> Pengaturan Struk
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveReceipt">
          <div class="flex items-center gap-3">
            <input
              id="autoPrint"
              v-model="receiptForm.autoPrint"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="autoPrint" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Auto-print setelah transaksi
            </label>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="mergeReceipts"
              v-model="receiptForm.mergeReceipts"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="mergeReceipts" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gabungkan struk multi-item
            </label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pesan di Footer Struk
            </label>
            <input
              v-model="receiptForm.footerMessage"
              type="text"
              placeholder="Terima kasih sudah berbelanja!"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div
            v-if="receiptSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ receiptSuccess }}
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="savingReceipt"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingReceipt" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================ -->
      <!-- TAB: NOTIFIKASI & ALERT                      -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'alerts'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BellIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            Notifikasi & Alert
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi threshold yang muncul di Dashboard Retail.
          </p>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveAlert">
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="lowStockThreshold"
            >
              Threshold Stok Menipis (unit)
            </label>
            <input
              id="lowStockThreshold"
              v-model.number="alertForm.lowStockThreshold"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Produk dengan stok ≤ angka ini akan masuk alert "Stok Menipis".
              Default: 5 unit.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="shiftDurationWarningHours"
            >
              Threshold Shift Lama (jam)
            </label>
            <input
              id="shiftDurationWarningHours"
              v-model.number="alertForm.shiftDurationWarningHours"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Shift OPEN yang sudah lebih dari sekian jam akan dianggap "lupa
              ditutup". Default: 8 jam.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="overdueDebtDaysBeforeNotice"
            >
              H- Notifikasi Hutang Jatuh Tempo (hari)
            </label>
            <input
              id="overdueDebtDaysBeforeNotice"
              v-model.number="alertForm.overdueDebtDaysBeforeNotice"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              0 = tampil saat tepat jatuh tempo. 3 = tampil 3 hari sebelumnya.
              Default: 0.
            </p>
          </div>

          <div
            v-if="alertSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ alertSuccess }}
          </div>
          <div
            v-if="alertError"
            class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300"
          >
            {{ alertError }}
          </div>

          <div class="flex items-center justify-between">
            <button
              type="button"
              class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              @click="resetAlertToDefault"
            >
              Reset ke default
            </button>
            <button
              type="submit"
              :disabled="savingAlert"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingAlert" class="w-3.5 h-3.5 animate-spin" />
              Simpan Threshold
            </button>
          </div>
        </form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, type Component } from 'vue';
import {
  Store as StoreIcon,
  Globe as GlobeIcon,
  Printer as PrinterIcon,
  Bell as BellIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import settingsService from '@/shared/services/settings.service';
import dashboardService from '@/shared/services/dashboard.service';

const authStore = useAuthStore();

const loading = ref(false);
const error = ref<string | null>(null);

// Tabs
type TabValue = 'shop' | 'language' | 'receipt' | 'alerts';
const tabs: Array<{ value: TabValue; label: string; icon: Component }> = [
  { value: 'shop', label: 'Data Toko', icon: StoreIcon },
  { value: 'language', label: 'Bahasa', icon: GlobeIcon },
  { value: 'receipt', label: 'Struk', icon: PrinterIcon },
  { value: 'alerts', label: 'Notifikasi & Alert', icon: BellIcon },
];
const activeTab = ref<TabValue>('shop');

// Shop form
const shopForm = reactive({ name: '', address: '', phone: '' });
const savingShop = ref(false);
const shopSuccess = ref<string | null>(null);

// Language form
const languageForm = reactive({ language: 'id' });
const savingLang = ref(false);
const langSuccess = ref<string | null>(null);

// Receipt form
const receiptForm = reactive({
  autoPrint: true,
  mergeReceipts: false,
  footerMessage: '',
});
const savingReceipt = ref(false);
const receiptSuccess = ref<string | null>(null);

// Alert form
const alertForm = reactive({
  lowStockThreshold: 5,
  shiftDurationWarningHours: 8,
  overdueDebtDaysBeforeNotice: 0,
});
const savingAlert = ref(false);
const alertSuccess = ref<string | null>(null);
const alertError = ref<string | null>(null);

async function fetchSettings() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  loading.value = true;
  error.value = null;
  try {
    const data = await settingsService.getSettings(shopId);
    shopForm.name = data.shop.name;
    shopForm.address = data.shop.address;
    shopForm.phone = data.shop.phone;
    languageForm.language = data.settings?.language ?? 'id';
    if (data.settings?.receiptConfig) {
      try {
        const rc =
          typeof data.settings.receiptConfig === 'string'
            ? JSON.parse(data.settings.receiptConfig)
            : data.settings.receiptConfig;
        receiptForm.autoPrint = rc.autoPrint ?? true;
        receiptForm.mergeReceipts = rc.mergeReceipts ?? false;
        receiptForm.footerMessage = rc.footerMessage ?? '';
      } catch {
        /* ignore parse error */
      }
    }

    // Alert config (separate endpoint)
    try {
      const alertCfg = await dashboardService.getAlertConfig(shopId);
      alertForm.lowStockThreshold = alertCfg.lowStockThreshold;
      alertForm.shiftDurationWarningHours = alertCfg.shiftDurationWarningHours;
      alertForm.overdueDebtDaysBeforeNotice =
        alertCfg.overdueDebtDaysBeforeNotice;
    } catch {
      /* keep defaults */
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message ?? err.message ?? 'Gagal memuat pengaturan.';
  } finally {
    loading.value = false;
  }
}

async function handleSaveShop() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingShop.value = true;
  shopSuccess.value = null;
  try {
    await settingsService.updateShop(shopId, {
      name: shopForm.name,
      address: shopForm.address,
      phone: shopForm.phone,
    });
    shopSuccess.value = 'Data toko berhasil disimpan.';
    setTimeout(() => {
      shopSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingShop.value = false;
  }
}

async function handleSaveLanguage() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingLang.value = true;
  langSuccess.value = null;
  try {
    await settingsService.updateLanguage({
      shopId,
      language: languageForm.language,
    });
    langSuccess.value = 'Bahasa berhasil disimpan.';
    setTimeout(() => {
      langSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingLang.value = false;
  }
}

async function handleSaveReceipt() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingReceipt.value = true;
  receiptSuccess.value = null;
  try {
    await settingsService.updateReceiptConfig({
      shopId,
      autoPrint: receiptForm.autoPrint,
      mergeReceipts: receiptForm.mergeReceipts,
      footerMessage: receiptForm.footerMessage,
    });
    receiptSuccess.value = 'Pengaturan struk berhasil disimpan.';
    setTimeout(() => {
      receiptSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingReceipt.value = false;
  }
}

async function handleSaveAlert() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingAlert.value = true;
  alertSuccess.value = null;
  alertError.value = null;
  try {
    const updated = await dashboardService.updateAlertConfig(shopId, {
      lowStockThreshold: Number(alertForm.lowStockThreshold) || 0,
      shiftDurationWarningHours:
        Number(alertForm.shiftDurationWarningHours) || 0,
      overdueDebtDaysBeforeNotice:
        Number(alertForm.overdueDebtDaysBeforeNotice) || 0,
    });
    alertForm.lowStockThreshold = updated.lowStockThreshold;
    alertForm.shiftDurationWarningHours = updated.shiftDurationWarningHours;
    alertForm.overdueDebtDaysBeforeNotice = updated.overdueDebtDaysBeforeNotice;
    alertSuccess.value = 'Threshold berhasil disimpan.';
    setTimeout(() => {
      alertSuccess.value = null;
    }, 3000);
  } catch (err: any) {
    alertError.value =
      err?.response?.data?.message || err?.message || 'Gagal menyimpan threshold.';
  } finally {
    savingAlert.value = false;
  }
}

function resetAlertToDefault() {
  alertForm.lowStockThreshold = 5;
  alertForm.shiftDurationWarningHours = 8;
  alertForm.overdueDebtDaysBeforeNotice = 0;
}

onMounted(fetchSettings);
</script>
