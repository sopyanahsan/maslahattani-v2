<template>
  <div class="space-y-5 p-4">
    <!-- Header -->
    <header class="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
      <h1 class="font-bold text-lg text-slate-800">Pengaturan</h1>
      <p class="text-xs text-slate-500 mt-0.5">Profil & keamanan akun</p>
    </header>

    <!-- Profile Card -->
    <div class="px-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
        <div class="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 shrink-0">
          <UserIcon class="w-7 h-7" />
        </div>
        <div class="min-w-0">
          <p class="font-bold text-slate-800 truncate">{{ userName }}</p>
          <p class="text-xs text-slate-500">Kasir · {{ shopName }}</p>
        </div>
      </div>
    </div>

    <!-- Shift Info -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Shift</h3>
      <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <div class="flex items-center justify-between p-4">
          <span class="text-sm text-slate-600">Status</span>
          <span v-if="hasOpenShift" class="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif
          </span>
          <span v-else class="text-sm text-slate-400">Tidak ada shift aktif</span>
        </div>
        <RouterLink to="/retail/shift" class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <span class="text-sm text-slate-600">Kelola Shift</span>
          <ChevronRightIcon class="w-4 h-4 text-slate-400" />
        </RouterLink>
      </div>
    </div>

    <!-- Security -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Keamanan</h3>
      <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <button @click="showChangePinModal = true" class="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div class="flex items-center gap-3">
            <LockIcon class="w-5 h-5 text-violet-600" />
            <span class="text-sm text-slate-700">Ganti PIN</span>
          </div>
          <ChevronRightIcon class="w-4 h-4 text-slate-400" />
        </button>
        <button class="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div class="flex items-center gap-3">
            <RefreshCwIcon class="w-5 h-5 text-amber-600" />
            <span class="text-sm text-slate-700">Minta Reset PIN ke Admin</span>
          </div>
          <ChevronRightIcon class="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>

    <!-- App Info & Logout -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Aplikasi</h3>
      <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <div class="flex items-center justify-between p-4">
          <span class="text-sm text-slate-600">Versi</span>
          <span class="text-sm text-slate-400">1.0.0</span>
        </div>
        <button @click="handleLogout" class="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors">
          <LogOutIcon class="w-5 h-5 text-red-500" />
          <span class="text-sm font-semibold text-red-600">Logout</span>
        </button>
      </div>
    </div>

    <!-- Change PIN Modal -->
    <Teleport to="body">
      <div v-if="showChangePinModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showChangePinModal = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-lg font-bold text-slate-800">Ganti PIN</h3>

          <div v-if="pinError" class="bg-red-50 border-l-4 border-red-500 rounded-md p-3">
            <p class="text-xs text-red-800">{{ pinError }}</p>
          </div>
          <div v-if="pinSuccess" class="bg-emerald-50 border-l-4 border-emerald-500 rounded-md p-3">
            <p class="text-xs text-emerald-800">{{ pinSuccess }}</p>
          </div>

          <form @submit.prevent="handleChangePin" class="space-y-3">
            <div>
              <label class="text-sm font-medium text-slate-700">PIN Lama</label>
              <input v-model="pinForm.oldPin" type="password" inputmode="numeric" maxlength="6" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 mt-1 text-center tracking-widest focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none" placeholder="****">
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">PIN Baru</label>
              <input v-model="pinForm.newPin" type="password" inputmode="numeric" maxlength="6" minlength="4" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 mt-1 text-center tracking-widest focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none" placeholder="****">
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Konfirmasi PIN Baru</label>
              <input v-model="pinForm.confirmPin" type="password" inputmode="numeric" maxlength="6" minlength="4" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 mt-1 text-center tracking-widest focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none" placeholder="****">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="showChangePinModal = false" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
              <button type="submit" :disabled="pinLoading" class="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                <Loader2Icon v-if="pinLoading" class="w-4 h-4 animate-spin mx-auto" />
                <span v-else>Simpan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  User as UserIcon,
  Lock as LockIcon,
  RefreshCw as RefreshCwIcon,
  LogOut as LogOutIcon,
  ChevronRight as ChevronRightIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import authService from '@/shared/services/auth.service';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();
const shiftStore = useShiftStore();

const userName = computed(() => authStore.user?.username || authStore.user?.email || 'Kasir');
const shopName = computed(() => shopStore.currentShopName || 'Toko');
const hasOpenShift = computed(() => shiftStore.hasOpenShift);

// Change PIN
const showChangePinModal = ref(false);
const pinLoading = ref(false);
const pinError = ref<string | null>(null);
const pinSuccess = ref<string | null>(null);
const pinForm = reactive({ oldPin: '', newPin: '', confirmPin: '' });

async function handleChangePin() {
  pinError.value = null;
  pinSuccess.value = null;

  if (pinForm.newPin.length < 4) { pinError.value = 'PIN baru minimal 4 digit.'; return; }
  if (pinForm.newPin !== pinForm.confirmPin) { pinError.value = 'Konfirmasi PIN tidak cocok.'; return; }
  if (!/^\d{4,6}$/.test(pinForm.newPin)) { pinError.value = 'PIN harus berupa angka 4-6 digit.'; return; }

  pinLoading.value = true;
  try {
    await authService.changePin(pinForm.oldPin, pinForm.newPin);
    pinSuccess.value = 'PIN berhasil diubah!';
    pinForm.oldPin = '';
    pinForm.newPin = '';
    pinForm.confirmPin = '';
    setTimeout(() => { showChangePinModal.value = false; pinSuccess.value = null; }, 1500);
  } catch (err: any) {
    pinError.value = err?.response?.data?.message || err?.message || 'Gagal mengubah PIN.';
  } finally {
    pinLoading.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
