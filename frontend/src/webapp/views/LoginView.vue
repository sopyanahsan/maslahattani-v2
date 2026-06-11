<template>
  <div class="relative min-h-dvh bg-posify-surface text-posify-on-surface font-hanken flex flex-col items-center justify-center p-5 overflow-hidden">

    <!-- Ambient background glow -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-posify-primary/10 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-posify-primary-container/10 blur-3xl"></div>
    </div>

    <!-- ============================================ -->
    <!-- Success Animation Overlay -->
    <!-- ============================================ -->
    <Transition name="fade-in">
      <div v-if="step === 'success'" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-posify-surface/80 backdrop-blur-sm">
        <div class="morph-container relative w-20 h-20 mb-6">
          <div class="ring absolute inset-0 border-4 border-posify-primary/20 rounded-full"></div>
          <div class="spinner absolute inset-0 border-4 border-posify-primary rounded-full border-t-transparent animate-spin"></div>
          <svg class="success-check absolute inset-0 w-full h-full text-posify-primary scale-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Transition name="slide-up" appear>
          <div class="text-center">
            <h2 class="text-posify-headline-md font-bold text-posify-on-surface tracking-tight mb-1">Selamat datang!</h2>
            <p class="text-posify-on-surface-variant text-sm">Satu tap, semua beres.</p>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="step" mode="out-in">
      <!-- ============================================ -->
      <!-- STEP: Welcome / Get Started -->
      <!-- ============================================ -->
      <div v-if="step === 'welcome'" key="welcome" class="w-full max-w-sm z-10">
        <div class="welcome-card flex flex-col items-center text-center">
          <!-- Logo with glow -->
          <div class="welcome-item welcome-d0 w-20 h-20 rounded-posify-xl bg-posify-primary-container/20 border border-posify-primary/30 flex items-center justify-center text-posify-primary mb-6 animate-posify-glow">
            <DropletsIcon class="w-10 h-10" />
          </div>

          <!-- Greeting -->
          <span class="welcome-item welcome-d1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-posify-primary/10 border border-posify-primary/20 mb-4">
            <span class="w-1.5 h-1.5 rounded-full bg-posify-primary animate-posify-pulse"></span>
            <span class="text-[11px] font-bold text-posify-primary uppercase tracking-widest">Sistem Kasir Modern</span>
          </span>

          <h1 class="welcome-item welcome-d2 text-posify-headline-lg font-bold text-posify-on-surface tracking-tight mb-2">
            Selamat datang di Posify
          </h1>
          <p class="welcome-item welcome-d3 text-posify-on-surface-variant text-sm leading-relaxed mb-8 max-w-[18rem]">
            Kelola transaksi retail & BRILink, pantau shift, dan lihat laporan — semua dalam satu aplikasi.
          </p>

          <!-- Feature highlights -->
          <div class="welcome-item welcome-d4 w-full space-y-2.5 mb-8">
            <div
              v-for="(feat, i) in features"
              :key="feat.label"
              class="flex items-center gap-3 px-4 py-3 rounded-posify-md bg-posify-surface-container border border-posify-outline-variant text-left"
              :style="{ animationDelay: `${0.5 + i * 0.1}s` }"
            >
              <div class="w-9 h-9 rounded-posify-md bg-posify-primary/10 flex items-center justify-center shrink-0 text-posify-primary">
                <component :is="feat.icon" class="w-[18px] h-[18px]" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-posify-on-surface leading-tight">{{ feat.label }}</p>
                <p class="text-[11px] text-posify-on-surface-variant leading-tight mt-0.5">{{ feat.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Get Started CTA -->
          <button
            class="welcome-item welcome-d5 w-full h-12 rounded-posify-md bg-posify-primary-container text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-posify-glow"
            @click="goToLogin"
          >
            Mulai Sekarang
            <ArrowRightIcon class="w-4 h-4" />
          </button>

          <p class="welcome-item welcome-d6 mt-5 flex items-center justify-center gap-1.5 text-[11px] text-posify-on-surface-variant">
            <ShieldCheckIcon class="w-3.5 h-3.5 text-posify-primary" />
            Aman & terenkripsi
          </p>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- STEP: Change PIN (forced for new accounts) -->
      <!-- ============================================ -->
      <div v-else-if="step === 'change-pin'" key="change-pin" class="w-full max-w-sm z-10">
        <div class="bg-posify-surface-container border border-posify-outline-variant rounded-posify-lg p-8 shadow-posify-lg">
          <div class="flex flex-col items-center mb-6">
            <div class="w-14 h-14 bg-posify-primary-container/20 rounded-posify-lg flex items-center justify-center mb-4 text-posify-primary border border-posify-primary/30">
              <LockIcon class="w-7 h-7" />
            </div>
            <h1 class="text-posify-title font-bold text-posify-on-surface tracking-tight">Ganti PIN</h1>
            <p class="text-posify-on-surface-variant mt-1 text-sm text-center">Akun baru — wajib buat PIN pribadi sebelum mulai.</p>
          </div>

          <div v-if="errorMessage" class="mb-4 bg-posify-error-container/20 border border-posify-error/40 rounded-posify-md p-3 flex items-start gap-2">
            <AlertCircleIcon class="w-4 h-4 text-posify-error shrink-0 mt-0.5" />
            <p class="text-xs text-posify-error">{{ errorMessage }}</p>
          </div>

          <form @submit.prevent="handleSetNewPin" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-posify-on-surface-variant">PIN Baru (4-6 digit)</label>
              <input
                v-model="newPin"
                :type="showNewPin ? 'text' : 'password'"
                required minlength="4" maxlength="6" inputmode="numeric" pattern="[0-9]*"
                class="w-full bg-posify-surface-low border border-posify-outline-variant rounded-posify-md py-3 px-4 text-posify-on-surface placeholder:text-posify-on-surface-variant/50 focus:outline-none focus:border-posify-primary focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all tracking-[0.5em] text-center text-lg"
                placeholder="••••"
              >
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-posify-on-surface-variant">Konfirmasi PIN Baru</label>
              <input
                v-model="confirmPin"
                :type="showNewPin ? 'text' : 'password'"
                required minlength="4" maxlength="6" inputmode="numeric" pattern="[0-9]*"
                class="w-full bg-posify-surface-low border border-posify-outline-variant rounded-posify-md py-3 px-4 text-posify-on-surface placeholder:text-posify-on-surface-variant/50 focus:outline-none focus:border-posify-primary focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all tracking-[0.5em] text-center text-lg"
                placeholder="••••"
              >
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showNewPin" class="rounded border-posify-outline-variant bg-posify-surface-low text-posify-primary focus:ring-posify-primary/40" />
              <span class="text-xs text-posify-on-surface-variant">Tampilkan PIN</span>
            </label>
            <button type="submit" :disabled="isLoading" class="w-full h-12 bg-posify-primary-container text-white font-semibold rounded-posify-md transition-all flex justify-center items-center gap-2 hover:brightness-110 active:scale-[0.98] shadow-posify-glow disabled:opacity-50 disabled:active:scale-100">
              <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
              <span v-else>Simpan PIN & Lanjutkan</span>
            </button>
          </form>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- STEP: Login Form -->
      <!-- ============================================ -->
      <div v-else key="login" class="w-full max-w-sm z-10">
        <div class="bg-posify-surface-container border border-posify-outline-variant rounded-posify-lg p-8 shadow-posify-lg">
          <!-- Branding -->
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 bg-posify-primary-container/20 rounded-posify-lg flex items-center justify-center mb-4 text-posify-primary border border-posify-primary/30">
              <DropletsIcon class="w-8 h-8" />
            </div>
            <h1 class="text-posify-headline-md font-bold text-posify-on-surface tracking-tight">Masuk Kasir</h1>
            <p class="text-posify-on-surface-variant mt-1 text-sm">Login untuk mulai bekerja</p>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="mb-5 bg-posify-error-container/20 border border-posify-error/40 rounded-posify-md p-4">
            <div class="flex items-start gap-2">
              <AlertCircleIcon class="w-5 h-5 text-posify-error shrink-0 mt-0.5" />
              <p class="text-sm text-posify-error">{{ errorMessage }}</p>
            </div>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Username -->
            <div class="space-y-1.5">
              <label class="flex items-center gap-1.5 text-[11px] font-medium text-posify-on-surface-variant">
                <UserIcon class="w-3.5 h-3.5" />
                Username
              </label>
              <input
                v-model="form.username"
                type="text" required autocomplete="username"
                class="w-full bg-posify-surface-low border border-posify-outline-variant rounded-posify-md py-3 px-4 text-posify-on-surface placeholder:text-posify-on-surface-variant/50 focus:outline-none focus:border-posify-primary focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all"
                placeholder="username"
              >
            </div>

            <!-- PIN -->
            <div class="space-y-1.5">
              <label class="flex items-center gap-1.5 text-[11px] font-medium text-posify-on-surface-variant">
                <LockIcon class="w-3.5 h-3.5" />
                PIN
              </label>
              <div class="relative">
                <input
                  v-model="form.pin"
                  :type="showPin ? 'text' : 'password'"
                  required minlength="4" maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password"
                  class="w-full bg-posify-surface-low border border-posify-outline-variant rounded-posify-md py-3 px-4 pr-11 text-posify-on-surface placeholder:text-posify-on-surface-variant/50 focus:outline-none focus:border-posify-primary focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all tracking-[0.5em] text-center text-lg"
                  placeholder="••••"
                >
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-posify-on-surface-variant hover:text-posify-primary transition-colors"
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
              class="w-full h-12 bg-posify-primary-container text-white font-semibold rounded-posify-md transition-all flex justify-center items-center gap-2 mt-2 hover:brightness-110 active:scale-[0.98] shadow-posify-glow disabled:opacity-50 disabled:active:scale-100"
            >
              <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
              <template v-else>
                <LogInIcon class="w-5 h-5" />
                <span>Masuk</span>
              </template>
            </button>
          </form>
        </div>

        <p class="text-center text-xs text-posify-on-surface-variant/70 mt-6">
          Lupa PIN? Hubungi pemilik toko untuk reset.
        </p>
        <p class="text-center mt-3">
          <a
            href="/admin/login"
            class="inline-flex items-center gap-1 text-xs font-semibold text-posify-primary hover:brightness-110 transition-all"
          >
            <ShieldIcon class="w-3.5 h-3.5" />
            Login sebagai Admin
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </a>
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
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  ArrowRight as ArrowRightIcon,
  ShoppingCart as ShoppingCartIcon,
  Landmark as LandmarkIcon,
  BarChart3 as BarChart3Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import authService from '@/shared/services/auth.service';

const router = useRouter();
const authStore = useAuthStore();

const step = ref<'welcome' | 'login' | 'change-pin' | 'success'>('welcome');
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

const features = [
  { icon: ShoppingCartIcon, label: 'Kasir Cepat', desc: 'Transaksi retail dalam hitungan detik' },
  { icon: LandmarkIcon, label: 'BRILink Terintegrasi', desc: 'Transfer, tarik tunai, & top up' },
  { icon: BarChart3Icon, label: 'Laporan Real-time', desc: 'Pantau omzet & shift langsung' },
];

const goToLogin = () => {
  errorMessage.value = null;
  step.value = 'login';
};

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
/* === Step transitions (between welcome / login / change-pin) === */
.step-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(12px);
}
.step-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-12px);
}

/* === Welcome card staggered entrance === */
.welcome-item {
  opacity: 0;
  animation: welcome-rise 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.welcome-d0 { animation-delay: 0.05s; }
.welcome-d1 { animation-delay: 0.15s; }
.welcome-d2 { animation-delay: 0.25s; }
.welcome-d3 { animation-delay: 0.35s; }
.welcome-d4 { animation-delay: 0.45s; }
.welcome-d5 { animation-delay: 0.6s; }
.welcome-d6 { animation-delay: 0.7s; }

@keyframes welcome-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* === Success overlay === */
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

/* === Respect reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .welcome-item,
  .step-enter-active,
  .step-leave-active,
  .fade-in-enter-active,
  .slide-up-enter-active {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    opacity: 1 !important;
  }
}
</style>
