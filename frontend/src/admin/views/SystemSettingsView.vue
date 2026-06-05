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
        <button :disabled="saving || !hasChanges" class="h-10 px-6 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2" @click="showConfirmModal = true">
          <span>Simpan Pengaturan</span>
        </button>
        <p v-if="!hasChanges && !saving && !saveSuccess" class="text-xs text-slate-400">Tidak ada perubahan.</p>
        <p v-if="saveSuccess" class="text-xs text-emerald-600 font-medium">Berhasil disimpan & diterapkan ke webapp kasir!</p>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- Confirmation Modal                           -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showConfirmModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Konfirmasi Perubahan Pengaturan</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Perubahan ini akan <strong>langsung diterapkan</strong> ke webapp kasir yang sedang aktif.
              </p>
            </div>
          </div>

          <!-- Target shop emphasis -->
          <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p class="text-xs text-blue-900 dark:text-blue-100">
              <span class="font-semibold">Diterapkan ke cabang:</span>
              <span class="font-bold ml-1">{{ shopStore.currentShopName || '—' }}</span>
            </p>
          </div>

          <!-- Changes list -->
          <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto">
            <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Perubahan yang akan diterapkan:</p>
            <ul class="space-y-1.5">
              <li v-for="change in pendingChanges" :key="change.key" class="flex items-center justify-between text-xs">
                <span class="text-slate-700 dark:text-slate-300">{{ change.label }}</span>
                <span :class="['font-bold px-2 py-0.5 rounded', change.newValue ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400']">
                  {{ change.display }}
                </span>
              </li>
            </ul>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p class="text-[11px] text-amber-700 dark:text-amber-300">
              <strong>Perhatian:</strong> Kasir yang sedang menggunakan webapp akan menerima notifikasi perubahan dalam waktu 30 detik.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="showConfirmModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="saving"
              class="h-9 px-5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              @click="confirmAndSave"
            >
              <Loader2Icon v-if="saving" class="w-3.5 h-3.5 animate-spin" />
              {{ saving ? 'Menyimpan...' : 'Ya, Terapkan Sekarang' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

const shopId = computed(
  () => shopStore.currentShopId ?? authStore.user?.shopId ?? null,
);

const loading = ref(true);
const saving = ref(false);
const saveSuccess = ref(false);
const showConfirmModal = ref(false);

/** Human-readable labels for each toggle field. */
const TOGGLE_LABELS: Record<string, string> = {
  brilinkEnabled: 'Modul BRILink',
  shiftMode: 'Mode Shift',
  shiftGuardEnabled: 'Shift Guard (POS)',
  shiftForceCloseOnSwitch: 'Wajib Tutup Shift Ganti Kasir',
  shiftCorrectionRequired: 'Koreksi Saldo Buka Shift',
  shiftPhysicalCountRequired: 'Hitung Fisik Tutup Shift',
  cashOutApprovalEnabled: 'Approval Pengeluaran',
  paymentCashEnabled: 'Metode Tunai',
  paymentQrisEnabled: 'Metode QRIS',
  paymentHutangEnabled: 'Metode Hutang',
  saveBillEnabled: 'Simpan Bill',
  discountPerItemEnabled: 'Diskon Per Produk',
  discountTotalEnabled: 'Diskon Total Transaksi',
  notePerItemEnabled: 'Catatan Per Item',
};

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

/** Snapshot of settings as loaded from server (original state). */
const originalSettings = ref<Record<string, any>>({});

interface PendingChange {
  key: string;
  label: string;
  oldValue: any;
  newValue: any;
  display: string;
}

/** Computed list of pending changes (diff form vs original). */
const pendingChanges = computed<PendingChange[]>(() => {
  const changes: PendingChange[] = [];
  for (const key of Object.keys(TOGGLE_LABELS)) {
    const formVal = (form as any)[key];
    const origVal = originalSettings.value[key];
    if (formVal !== origVal) {
      const display =
        typeof formVal === 'boolean'
          ? formVal ? 'ON' : 'OFF'
          : String(formVal);
      changes.push({
        key,
        label: TOGGLE_LABELS[key] || key,
        oldValue: origVal,
        newValue: formVal,
        display,
      });
    }
  }
  return changes;
});

const hasChanges = computed(() => pendingChanges.value.length > 0);

async function fetchSettings() {
  if (!shopId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.get(`/shops/${shopId.value}/settings`);
    Object.assign(form, data);
    // Snapshot original state for change detection
    originalSettings.value = { ...form };
  } catch { /* use defaults */ }
  finally { loading.value = false; }
}

async function confirmAndSave() {
  if (!shopId.value) return;
  saving.value = true;
  saveSuccess.value = false;
  try {
    await api.patch(`/shops/${shopId.value}/settings`, form);
    // Update original snapshot to match saved state
    originalSettings.value = { ...form };
    saveSuccess.value = true;
    showConfirmModal.value = false;
    setTimeout(() => { saveSuccess.value = false; }, 5000);
  } catch { /* silent */ }
  finally { saving.value = false; }
}

onMounted(fetchSettings);

watch(shopId, (next, prev) => {
  if (next && next !== prev) fetchSettings();
});
</script>
