<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-950">Pengaturan</h1>
      <p class="text-xs text-slate-500 mt-0.5">Konfigurasi toko, struk, bahasa, dan preferensi sistem.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat pengaturan...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Shop Data -->
      <section class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <StoreIcon class="w-4 h-4 text-blue-600" /> Data Toko
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveShop">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Toko</label>
              <input v-model="shopForm.name" type="text" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">No. Telepon</label>
              <input v-model="shopForm.phone" type="text" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
            <textarea v-model="shopForm.address" rows="2" class="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div v-if="shopSuccess" class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700">{{ shopSuccess }}</div>
          <div class="flex justify-end">
            <button type="submit" :disabled="savingShop" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingShop" class="w-3.5 h-3.5 animate-spin" /> Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- Language -->
      <section class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GlobeIcon class="w-4 h-4 text-indigo-600" /> Bahasa
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveLanguage">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Bahasa Sistem</label>
            <select v-model="languageForm.language" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
              <option value="su">Basa Sunda</option>
              <option value="jv">Basa Jawa</option>
            </select>
          </div>
          <div v-if="langSuccess" class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700">{{ langSuccess }}</div>
          <div class="flex justify-end">
            <button type="submit" :disabled="savingLang" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingLang" class="w-3.5 h-3.5 animate-spin" /> Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- Receipt Config -->
      <section class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PrinterIcon class="w-4 h-4 text-amber-600" /> Pengaturan Struk
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveReceipt">
          <div class="flex items-center gap-3">
            <input id="autoPrint" v-model="receiptForm.autoPrint" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
            <label for="autoPrint" class="text-xs font-semibold text-slate-700">Auto-print setelah transaksi</label>
          </div>
          <div class="flex items-center gap-3">
            <input id="mergeReceipts" v-model="receiptForm.mergeReceipts" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
            <label for="mergeReceipts" class="text-xs font-semibold text-slate-700">Gabungkan struk multi-item</label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Pesan di Footer Struk</label>
            <input v-model="receiptForm.footerMessage" type="text" placeholder="Terima kasih sudah berbelanja!" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div v-if="receiptSuccess" class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700">{{ receiptSuccess }}</div>
          <div class="flex justify-end">
            <button type="submit" :disabled="savingReceipt" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingReceipt" class="w-3.5 h-3.5 animate-spin" /> Simpan
            </button>
          </div>
        </form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  Store as StoreIcon, Globe as GlobeIcon, Printer as PrinterIcon,
  Loader2 as Loader2Icon, AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import settingsService from '@/shared/services/settings.service';

const authStore = useAuthStore();

const loading = ref(false);
const error = ref<string | null>(null);

// Shop form
const shopForm = reactive({ name: '', address: '', phone: '' });
const savingShop = ref(false);
const shopSuccess = ref<string | null>(null);

// Language form
const languageForm = reactive({ language: 'id' });
const savingLang = ref(false);
const langSuccess = ref<string | null>(null);

// Receipt form
const receiptForm = reactive({ autoPrint: true, mergeReceipts: false, footerMessage: '' });
const savingReceipt = ref(false);
const receiptSuccess = ref<string | null>(null);

async function fetchSettings() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  loading.value = true; error.value = null;
  try {
    const data = await settingsService.getSettings(shopId);
    shopForm.name = data.shop.name; shopForm.address = data.shop.address; shopForm.phone = data.shop.phone;
    languageForm.language = data.settings?.language ?? 'id';
    if (data.settings?.receiptConfig) {
      try {
        const rc = typeof data.settings.receiptConfig === 'string' ? JSON.parse(data.settings.receiptConfig) : data.settings.receiptConfig;
        receiptForm.autoPrint = rc.autoPrint ?? true;
        receiptForm.mergeReceipts = rc.mergeReceipts ?? false;
        receiptForm.footerMessage = rc.footerMessage ?? '';
      } catch { /* ignore parse error */ }
    }
  } catch (err: any) { error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat pengaturan.'; }
  finally { loading.value = false; }
}

async function handleSaveShop() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingShop.value = true; shopSuccess.value = null;
  try {
    await settingsService.updateShop(shopId, { name: shopForm.name, address: shopForm.address, phone: shopForm.phone });
    shopSuccess.value = 'Data toko berhasil disimpan.';
    setTimeout(() => { shopSuccess.value = null; }, 3000);
  } catch { /* silent */ }
  finally { savingShop.value = false; }
}

async function handleSaveLanguage() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingLang.value = true; langSuccess.value = null;
  try {
    await settingsService.updateLanguage({ shopId, language: languageForm.language });
    langSuccess.value = 'Bahasa berhasil disimpan.';
    setTimeout(() => { langSuccess.value = null; }, 3000);
  } catch { /* silent */ }
  finally { savingLang.value = false; }
}

async function handleSaveReceipt() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  savingReceipt.value = true; receiptSuccess.value = null;
  try {
    await settingsService.updateReceiptConfig({
      shopId, autoPrint: receiptForm.autoPrint,
      mergeReceipts: receiptForm.mergeReceipts, footerMessage: receiptForm.footerMessage,
    });
    receiptSuccess.value = 'Pengaturan struk berhasil disimpan.';
    setTimeout(() => { receiptSuccess.value = null; }, 3000);
  } catch { /* silent */ }
  finally { savingReceipt.value = false; }
}

onMounted(fetchSettings);
</script>
