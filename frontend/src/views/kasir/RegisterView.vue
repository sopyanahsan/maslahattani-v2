<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-4">
          <component :is="UserPlusIcon" class="w-8 h-8 text-emerald-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-950">Daftar Akun Kasir</h1>
        <p class="text-sm text-slate-600 mt-1">Maslahat Tani — Buat akun baru</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <!-- Success Alert -->
        <div
          v-if="successMessage"
          class="mb-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-md p-4"
        >
          <div class="flex items-start gap-2">
            <component :is="CheckCircle2Icon" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p class="text-sm text-emerald-800">{{ successMessage }}</p>
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="mb-5 bg-red-50 border-l-4 border-red-500 rounded-md p-4"
        >
          <div class="flex items-start gap-2">
            <component :is="AlertCircleIcon" class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Step 1: Email + Password -->
        <form v-if="step === 'register'" @submit.prevent="handleRegister" class="space-y-5">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Email Gmail
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="MailIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="nama@gmail.com"
                autocomplete="email"
                required
                :disabled="isLoading"
                class="input-field pl-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.email }"
                @input="clearFieldError('email')"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
            <p v-else class="mt-1 text-xs text-slate-500">Gunakan email Gmail untuk menerima kode OTP</p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="LockIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Minimal 8 karakter"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="input-field pl-10 pr-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.password }"
                @input="clearFieldError('password')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <component :is="showPassword ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
            <!-- Password strength indicator -->
            <div v-if="form.password && !errors.password" class="mt-2">
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-200'"
                />
              </div>
              <p class="text-xs mt-1" :class="strengthTextColors[passwordStrength]">
                {{ strengthLabels[passwordStrength] }}
              </p>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Konfirmasi Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="LockIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Ketik ulang password"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="input-field pl-10 pr-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.confirmPassword }"
                @input="clearFieldError('confirmPassword')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showConfirmPassword = !showConfirmPassword"
                tabindex="-1"
              >
                <component :is="showConfirmPassword ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Mendaftarkan...' : 'Daftar' }}
          </button>
        </form>

        <!-- Step 2: OTP Verification -->
        <form v-else-if="step === 'otp'" @submit.prevent="handleVerifyOtp" class="space-y-5">
          <!-- Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <component :is="MailCheckIcon" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-blue-900">Verifikasi Email</p>
                <p class="text-xs text-blue-700 mt-0.5">
                  Kode OTP telah dikirim ke <span class="font-semibold">{{ form.email }}</span>. Cek inbox atau folder spam.
                </p>
              </div>
            </div>
          </div>

          <!-- OTP Input -->
          <div>
            <label for="otp" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Kode OTP
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="KeyRoundIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="otp"
                v-model="form.otp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                required
                :disabled="isLoading"
                class="input-field pl-10 text-center font-mono text-lg tracking-[0.5em]"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.otp }"
                @input="handleOtpInput"
              />
            </div>
            <p v-if="errors.otp" class="mt-1 text-xs text-red-600">{{ errors.otp }}</p>
          </div>

          <!-- OTP Timer / Resend -->
          <div class="flex items-center justify-between">
            <button
              type="button"
              :disabled="otpCooldown > 0 || isLoading"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
              @click="resendOtp"
            >
              {{ otpCooldown > 0 ? `Kirim ulang (${otpCooldown}s)` : 'Kirim ulang kode' }}
            </button>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-slate-700 font-medium"
              @click="backToRegister"
            >
              &larr; Ubah email
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || form.otp.length < 6"
            class="w-full h-12 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Memverifikasi...' : 'Verifikasi & Selesai' }}
          </button>
        </form>

        <!-- Step 3: Success -->
        <div v-else-if="step === 'success'" class="text-center py-4">
          <div class="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <component :is="CheckCircle2Icon" class="w-8 h-8 text-emerald-600" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 mb-2">Registrasi Berhasil!</h2>
          <p class="text-sm text-slate-600 mb-6">
            Akun kasir Anda telah aktif. Silakan login untuk mulai menggunakan aplikasi.
          </p>
          <RouterLink
            to="/kasir/login"
            class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-center gap-2"
          >
            <component :is="LogInIcon" class="w-4 h-4" />
            Masuk ke Akun
          </RouterLink>
        </div>

        <!-- Divider (only on register step) -->
        <div v-if="step === 'register'" class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-slate-500">Sudah punya akun?</span>
          </div>
        </div>

        <!-- Login Link (only on register step) -->
        <RouterLink
          v-if="step === 'register'"
          to="/kasir/login"
          class="w-full h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <component :is="LogInIcon" class="w-4 h-4" />
          Masuk ke Akun
        </RouterLink>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6">
        <RouterLink to="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          &larr; Kembali ke Home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/auth.service';
import {
  UserPlus as UserPlusIcon,
  Mail as MailIcon,
  MailCheck as MailCheckIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  KeyRound as KeyRoundIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle2 as CheckCircle2Icon,
  Loader2 as Loader2Icon,
  LogIn as LogInIcon,
} from 'lucide-vue-next';

const router = useRouter();

type Step = 'register' | 'otp' | 'success';

const step = ref<Step>('register');

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  otp: '',
});

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  otp: '',
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const otpCooldown = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

// Password strength
const strengthLabels: Record<number, string> = {
  0: '',
  1: 'Lemah',
  2: 'Cukup',
  3: 'Kuat',
  4: 'Sangat kuat',
};

const strengthColors: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-blue-400',
  4: 'bg-emerald-400',
};

const strengthTextColors: Record<number, string> = {
  0: 'text-slate-400',
  1: 'text-red-600',
  2: 'text-amber-600',
  3: 'text-blue-600',
  4: 'text-emerald-600',
};

const passwordStrength = computed(() => {
  const pwd = form.password;
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
});

function clearFieldError(field: 'email' | 'password' | 'confirmPassword' | 'otp') {
  errors[field] = '';
  errorMessage.value = '';
}

function validateRegister(): boolean {
  let valid = true;

  if (!form.email.trim()) {
    errors.email = 'Email wajib diisi';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid';
    valid = false;
  }

  if (!form.password) {
    errors.password = 'Password wajib diisi';
    valid = false;
  } else if (form.password.length < 8) {
    errors.password = 'Password minimal 8 karakter';
    valid = false;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi';
    valid = false;
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Password tidak sama';
    valid = false;
  }

  return valid;
}

function startOtpCooldown() {
  otpCooldown.value = 60;
  cooldownInterval = setInterval(() => {
    otpCooldown.value--;
    if (otpCooldown.value <= 0) {
      if (cooldownInterval) clearInterval(cooldownInterval);
    }
  }, 1000);
}

function handleOtpInput() {
  form.otp = form.otp.replace(/\D/g, '').slice(0, 6);
  clearFieldError('otp');
}

async function handleRegister() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateRegister()) return;

  isLoading.value = true;

  try {
    await authService.registerKasir({
      email: form.email.trim(),
      password: form.password,
    });

    // Move to OTP step
    step.value = 'otp';
    startOtpCooldown();
    successMessage.value = '';
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Registrasi gagal. Silakan coba lagi.';
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function handleVerifyOtp() {
  errorMessage.value = '';

  if (!form.otp || form.otp.length < 6) {
    errors.otp = 'Masukkan 6 digit kode OTP';
    return;
  }

  isLoading.value = true;

  try {
    await authService.verifyOtp({
      email: form.email.trim(),
      otp: form.otp,
    });

    // Registration complete
    step.value = 'success';
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Kode OTP salah atau sudah kadaluarsa.';
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function resendOtp() {
  if (otpCooldown.value > 0) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await authService.registerKasir({
      email: form.email.trim(),
      password: form.password,
    });
    successMessage.value = 'Kode OTP baru telah dikirim ke email Anda.';
    startOtpCooldown();
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal mengirim ulang OTP.';
  } finally {
    isLoading.value = false;
  }
}

function backToRegister() {
  step.value = 'register';
  form.otp = '';
  errors.otp = '';
  errorMessage.value = '';
  successMessage.value = '';
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
});
</script>
