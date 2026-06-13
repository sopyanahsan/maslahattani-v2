<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <!-- Progress -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div v-for="s in totalSteps" :key="s" :class="['w-10 h-1.5 rounded-full transition-colors', step >= s ? 'bg-[#00A19B]' : 'bg-slate-200 dark:bg-slate-700']" />
      </div>

      <!-- Step 1: Selamat Datang -->
      <div v-if="step === 1" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
        <div class="w-16 h-16 bg-[#00A19B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-[#00A19B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Selamat Datang di Posify!</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          Sistem POS modern untuk toko & agen BRILink Anda.<br>
          Mari setup toko dalam 3 langkah mudah.
        </p>
        <div class="mt-8 grid grid-cols-3 gap-3 text-center">
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p class="text-lg font-bold text-[#00A19B]">1</p>
            <p class="text-[10px] text-slate-500 dark:text-[#869392] mt-0.5">Data Toko</p>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p class="text-lg font-bold text-[#00A19B]">2</p>
            <p class="text-[10px] text-slate-500 dark:text-[#869392] mt-0.5">Fitur</p>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p class="text-lg font-bold text-[#00A19B]">3</p>
            <p class="text-[10px] text-slate-500 dark:text-[#869392] mt-0.5">Selesai</p>
          </div>
        </div>
        <button @click="step = 2" class="w-full h-11 bg-[#00A19B] text-white text-sm font-bold rounded-xl hover:opacity-90 mt-6 transition-colors">
          Mulai Setup →
        </button>
      </div>

      <!-- Step 2: Data Toko -->
      <div v-else-if="step === 2" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Data Toko</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Isi informasi dasar toko Anda.</p>

        <form @submit.prevent="step = 3" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Toko <span class="text-red-500">*</span></label>
            <input v-model="shopForm.name" type="text" required placeholder="Contoh: Toko Makmur Jaya" class="w-full h-10 px-4 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] focus:ring-1 focus:ring-[#00A19B] outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat <span class="text-red-500">*</span></label>
            <input v-model="shopForm.address" type="text" required placeholder="Jl. Raya No. 123, Kota" class="w-full h-10 px-4 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] focus:ring-1 focus:ring-[#00A19B] outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No. Telepon / WhatsApp <span class="text-red-500">*</span></label>
            <input v-model="shopForm.phone" type="tel" required placeholder="08xxxxxxxxxx" class="w-full h-10 px-4 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] focus:ring-1 focus:ring-[#00A19B] outline-none" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="step = 1" class="flex-1 h-10 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Kembali</button>
            <button type="submit" class="flex-1 h-10 bg-[#00A19B] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors">Lanjut →</button>
          </div>
        </form>
      </div>

      <!-- Step 3: Penjelasan Fitur -->
      <div v-else-if="step === 3" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Fitur Posify</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Ini yang bisa kamu lakukan dengan Posify:</p>

        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span class="text-lg">🛒</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">POS Kasir</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Scan barcode, multi-metode bayar (Tunai, QRIS, Hutang). Bisa offline.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span class="text-lg">🏦</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">BRILink</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Transfer, tarik tunai, top-up — otomatis hitung fee & saldo.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span class="text-lg">📊</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Laporan Otomatis</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Dashboard real-time, laba rugi, produk terlaris, export PDF/Excel.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span class="text-lg">📦</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Stok & Inventaris</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Opname, supplier, transfer antar cabang, notifikasi stok habis.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span class="text-lg">👥</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Multi-User & Shift</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Admin, Kasir — atur permission, shift kasir, hitung variance.</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-5">
          <button type="button" @click="step = 2" class="flex-1 h-10 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Kembali</button>
          <button type="button" :disabled="saving" @click="handleFinish" class="flex-1 h-10 bg-[#00A19B] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2">
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ saving ? 'Menyimpan...' : 'Selesai & Masuk Dashboard' }}
          </button>
        </div>

        <p v-if="error" class="text-xs text-red-500 mt-3 text-center">{{ error }}</p>
      </div>

      <!-- Step 4: Sukses -->
      <div v-else-if="step === 4" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
        <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Toko Siap!</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          <strong>{{ shopForm.name }}</strong> berhasil di-setup. Selamat menggunakan Posify!
        </p>
        <p class="text-xs text-slate-400 dark:text-[#869392] mt-4">Mengarahkan ke dashboard...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/shared/services/api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();

const step = ref(1);
const totalSteps = 4;
const saving = ref(false);
const error = ref('');

const shopForm = reactive({
  name: '',
  address: '',
  phone: '',
});

async function handleFinish() {
  if (!shopForm.name || !shopForm.address || !shopForm.phone) {
    error.value = 'Semua field wajib diisi.';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const shopId = authStore.user?.shopId;
    if (!shopId) throw new Error('Shop ID tidak ditemukan.');

    // Update shop data
    await api.put(`/settings/shop/${shopId}`, {
      name: shopForm.name,
      address: shopForm.address,
      phone: shopForm.phone,
    });

    // Refresh user data
    await authStore.fetchUser();
    await shopStore.fetchShops();

    // Show success then redirect
    step.value = 4;
    setTimeout(() => {
      router.push('/admin/home');
    }, 2000);
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || 'Gagal menyimpan.';
  } finally {
    saving.value = false;
  }
}
</script>
