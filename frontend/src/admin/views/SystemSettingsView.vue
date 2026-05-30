<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Pengaturan Sistem</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle fitur ON/OFF untuk menyesuaikan webapp kasir sesuai kebutuhan toko.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <template v-else>
      <!-- Modul -->
      <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Modul</h2>
        <ToggleRow v-model="form.brilinkEnabled" label="Modul BRILink" desc="Menu BRILink, transaksi, fee, laporan BRILink. Jika OFF: bottom nav hanya 4 tab, dashboard retail only." />
      </section>

      <!-- Shift -->
      <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Shift</h2>
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Mode Shift</label>
          <select v-model="form.shiftMode" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none">
            <option value="FLOWING">Saldo Mengalir (rekomendasi UMKM)</option>
            <option value="RESET">Shift Reset (setiap shift input modal awal)</option>
          </select>
        </div>
        <ToggleRow v-model="form.shiftGuardEnabled" label="Shift Guard" desc="Block POS jika kasir belum buka shift." />
        <ToggleRow v-model="form.shiftForceCloseOnSwitch" label="Wajib Tutup Shift Saat Ganti Kasir" desc="Kasir harus tutup shift sebelum kasir lain bisa buka shift baru." />
        <ToggleRow v-model="form.shiftCorrectionRequired" label="Koreksi Saldo Saat Buka Shift" desc="Kasir harus konfirmasi/koreksi saldo sebelum memulai shift." />
        <ToggleRow v-model="form.shiftPhysicalCountRequired" label="Hitung Fisik Saat Tutup Shift" desc="Kasir wajib input jumlah uang fisik saat tutup shift." />
      </section>

      <!-- Kas & Pengeluaran -->
      <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Kas & Pengeluaran</h2>
        <ToggleRow v-model="form.cashOutApprovalEnabled" label="Approval Pengeluaran (Cash Out)" desc="Kasir bisa cash out langsung, admin verifikasi belakangan. Jika OFF: tanpa approval." />
      </section>

      <!-- Metode Pembayaran -->
      <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Metode Pembayaran</h2>
        <ToggleRow v-model="form.paymentCashEnabled" label="Tunai" desc="Pembayaran cash/tunai di POS." />
        <ToggleRow v-model="form.paymentQrisEnabled" label="QRIS" desc="Pembayaran via QRIS (QR Code)." />
        <ToggleRow v-model="form.paymentHutangEnabled" label="Hutang" desc="Pelanggan bisa hutang (full atau partial)." />
      </section>

      <!-- Fitur POS -->
      <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Fitur POS</h2>
        <ToggleRow v-model="form.saveBillEnabled" label="Simpan Bill (Open Bill)" desc="Kasir bisa park transaksi dan buka kembali nanti." />
        <ToggleRow v-model="form.discountPerItemEnabled" label="Diskon Per Produk" desc="Kasir bisa beri diskon per item di keranjang." />
        <ToggleRow v-model="form.discountTotalEnabled" label="Diskon Total Transaksi" desc="Kasir bisa beri diskon untuk keseluruhan transaksi." />
        <ToggleRow v-model="form.notePerItemEnabled" label="Catatan Per Item" desc="Kasir bisa tambah catatan per item (misal: pedas, tanpa es)." />
      </section>

      <!-- Save Button -->
      <div class="flex items-center gap-3">
        <button :disabled="saving" class="h-10 px-6 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2" @click="handleSave">
          <Loader2Icon v-if="saving" class="w-4 h-4 animate-spin" />
          <span>{{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}</span>
        </button>
        <p v-if="saveSuccess" class="text-xs text-emerald-600 font-medium">Berhasil disimpan!</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { Loader2 as Loader2Icon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import api from '@/shared/services/api';
import ToggleRow from '@/admin/components/ToggleRow.vue';

const authStore = useAuthStore();
const shopStore = useShopStore();

/**
 * Sumber shopId yang reliable:
 * - shopStore.currentShopId di-hydrate sync dari localStorage saat store init,
 *   jadi sudah tersedia ketika komponen child ini mount.
 * - authStore.user?.shopId di-set async (fetchUser/login) & untuk super-admin
 *   nilainya null (currentShop yang dipakai). Dipakai sebagai fallback saja.
 */
const shopId = computed(
  () => shopStore.currentShopId ?? authStore.user?.shopId ?? null,
);

const loading = ref(true);
const saving = ref(false);
const saveSuccess = ref(false);

const form = reactive({
  brilinkEnabled: true,
  shiftMode: 'FLOWING',
  shiftGuardEnabled: true,
  shiftForceCloseOnSwitch: true,
  shiftCorrectionRequired: true,
  shiftPhysicalCountRequired: true,
  cashOutApprovalEnabled: true,
  paymentCashEnabled: true,
  paymentQrisEnabled: true,
  paymentHutangEnabled: true,
  saveBillEnabled: true,
  discountPerItemEnabled: true,
  discountTotalEnabled: true,
  notePerItemEnabled: true,
});

async function fetchSettings() {
  if (!shopId.value) {
    // Tidak ada shop aktif → jangan biarkan spinner muter selamanya.
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.get(`/shops/${shopId.value}/settings`);
    Object.assign(form, data);
  } catch { /* use defaults */ }
  finally { loading.value = false; }
}

async function handleSave() {
  if (!shopId.value) return;
  saving.value = true;
  saveSuccess.value = false;
  try {
    await api.patch(`/shops/${shopId.value}/settings`, form);
    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false; }, 3000);
  } catch { /* silent */ }
  finally { saving.value = false; }
}

onMounted(fetchSettings);

// Kalau shop aktif baru tersedia/berubah setelah mount (mis. fetchUser async
// selesai atau super-admin ganti cabang), fetch ulang settings.
watch(shopId, (next, prev) => {
  if (next && next !== prev) fetchSettings();
});
</script>
