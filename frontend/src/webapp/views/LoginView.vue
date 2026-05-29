<template>
  <div class="relative min-h-screen bg-gradient-to-br from-white to-violet-50/80 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">

    <!-- Success Animation Overlay -->
    <Transition name="fade-in">
      <div v-if="step === 'success'" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
        <div class="morph-container relative w-20 h-20 mb-6">
          <div class="ring absolute inset-0 border-4 border-violet-100 rounded-full"></div>
          <div class="spinner absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"></div>
          <svg class="success-check absolute inset-0 w-full h-full text-violet-500 scale-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Transition name="slide-up" appear>
          <div class="text-center">
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight mb-2">Selamat datang!</h2>
            <p class="text-slate-600 font-medium">Satu tap, semua beres.</p>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="scale-down" mode="out-in">
      <!-- Step: Change PIN (forced for new accounts) -->
      <div v-if="step === 'change-pin'" class="w-full max-w-sm z-10" key="change-pin">
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div class="flex flex-col items-center mb-6">
            <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500 shadow-sm border border-amber-100">
              <LockIcon class="w-7 h-7" />
            </div>
            <h1 class="text-xl font-bold text-slate-800 tracking-tight">Ganti PIN</h1>
            <p class="text-slate-500 mt-1 text-sm text-center">Akun baru — wajib buat PIN pribadi sebelum mulai.</p>
          </div>

          <div v-if="errorMessage" class="mb-4 bg-red-50 border-l-4 border-red-500 rounded-md p-3">
            <p class="text-xs text-red-800">{{ errorMessage }}</p>
          </div>

          <form @submit.prevent="handleSetNewPin" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700">PIN Baru (4-6 digit)</label>
              <input
                v-model="newPin"
                :type="showNewPin ? 'text' : 'password'"
                required
                minlength="4"
                maxlength="6"
                inputmode="numeric"
                pattern="[0-9]*"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all tracking-widest text-center text-lg"
                placeholder="****"
              >
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700">Konfirmasi PIN Baru</label>
              <input
                v-model="confirmPin"
                :type="showNewPin ? 'text' : 'password'"
                required
                minlength="4"
                maxlength="6"
                inputmode="numeric"
                pattern="[0-9]*"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all tracking-widest text-center text-lg"
                placeholder="****"
              >
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showNewPin" class="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
              <span class="text-xs text-slate-500">Tampilkan PIN</span>
            </label>
            <button type="submit" :disabled="isLoading" class="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center shadow-sm shadow-violet-200 disabled:opacity-50">
              <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
              <span v-else>Simpan PIN & Lanjutkan</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Step: Login Form -->
      <div v-else-if="step === 'login'" class="w-full max-w-sm z-10" key="login">
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <!-- Branding -->
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 text-violet-600 shadow-sm border border-violet-100">
              <DropletsIcon class="w-8 h-8" />
            </div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Ngalir</h1>
            <p class="text-slate-500 mt-1 text-sm">Masuk untuk melanjutkan</p>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="mb-5 bg-red-50 border-l-4 border-red-500 rounded-md p-4">
            <div class="flex items-start gap-2">
              <AlertCircleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Username -->
            <div class="space-y-1.5">
              <label class="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <UserIcon class="w-4 h-4 text-slate-400" />
                Username
              </label>
              <input
                v-model="form.username"
                type="text"
                required
                autocomplete="username"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                placeholder="username"
              >
            </div>

            <!-- PIN -->
            <div class="space-y-1.5">
              <label class="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <LockIcon class="w-4 h-4 text-slate-400" />
                PIN
              </label>
              <div class="relative">
                <input
                  v-model="form.pin"
                  :type="showPin ? 'text' : 'password'"
                  required
                  minlength="4"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  autocomplete="current-password"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pr-11 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all tracking-widest text-center text-lg"
                  placeholder="4-6 digit"
                >
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  @click="showPin = !showPin"
                >
                  <EyeIcon v-if="!showPin" class="w-5 h-5" />
                  <EyeOffIcon v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 mt-2 shadow-sm shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
              <template v-else>
                <LogInIcon class="w-5 h-5" />
                <span>Masuk</span>
              </template>
            </button>
          </form>
        </div>

        <p class="text-center text-xs text-slate-400 mt-6">
          Lupa PIN? Hubungi pemilik toko untuk reset.
        </p>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  Droplets as DropletsIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Lock as LockIcon,
  User as UserIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  LogIn as LogInIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import authService from '@/shared/services/auth.service';

const router = useRouter();
const authStore = useAuthStore();

const step = ref<'login' | 'change-pin' | 'success'>('login');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const showPin = ref(false);
const showNewPin = ref(false);
const newPin = ref('');
const confirmPin = ref('');

const form = reactive({
  username: '',
  pin: '',
});

const handleLogin = async () => {
  if (form.pin.length < 4) {
    errorMessage.value = 'PIN minimal 4 digit.';
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await authStore.loginWithPin(form.username, form.pin);
    if (result.status === 'success') {
      // Check if kasir must change PIN (fresh account)
      if (result.user?.mustChangePin) {
        step.value = 'change-pin';
        return;
      }
      step.value = 'success';
      setTimeout(() => { router.push({ name: 'webapp-dashboard' }); }, 1500);
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Login gagal. Periksa username dan PIN.';
  } finally {
    isLoading.value = false;
  }
};

const handleSetNewPin = async () => {
  errorMessage.value = null;

  if (!/^\d{4,6}$/.test(newPin.value)) {
    errorMessage.value = 'PIN harus 4-6 digit angka.';
    return;
  }
  if (newPin.value !== confirmPin.value) {
    errorMessage.value = 'Konfirmasi PIN tidak cocok.';
    return;
  }
  // Prevent using same PIN as the temp one
  if (newPin.value === form.pin) {
    errorMessage.value = 'PIN baru tidak boleh sama dengan PIN lama.';
    return;
  }

  isLoading.value = true;
  try {
    await authService.setNewPin(newPin.value);
    step.value = 'success';
    setTimeout(() => { router.push({ name: 'webapp-dashboard' }); }, 1500);
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || err?.message || 'Gagal mengubah PIN.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.scale-down-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.scale-down-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
.fade-in-enter-active {
  transition: opacity 0.5s ease 0.2s;
}
.fade-in-enter-from {
  opacity: 0;
}
.morph-container .spinner {
  animation: fade-out-spin 0.4s ease forwards 0.8s;
}
.morph-container .success-check {
  transform-origin: center;
  animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1s;
}
@keyframes fade-out-spin {
  0% { transform: rotate(0deg); opacity: 1; }
  100% { transform: rotate(360deg); opacity: 0; }
}
@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 1.2s;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
