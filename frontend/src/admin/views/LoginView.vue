<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-900 px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <component :is="ShieldCheckIcon" class="w-8 h-8 text-blue-400" />
        </div>
        <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
        <p class="text-sm text-slate-400 mt-1">Maslahat Tani — Dashboard Management</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
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

        <!-- Info Alert (mis. setelah OTP terkirim) -->
        <div
          v-if="infoMessage && !errorMessage"
          class="mb-5 bg-blue-50 border-l-4 border-blue-500 rounded-md p-4"
        >
          <div class="flex items-start gap-2">
            <component :is="ShieldCheckIcon" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p class="text-sm text-blue-800">{{ infoMessage }}</p>
          </div>
        </div>

        <!-- Step 1: Username/Email + Password -->
        <form v-if="step === 'credentials'" @submit.prevent="handleCredentials" class="space-y-5">
          <!-- Identifier Field (email / username) -->
          <div>
            <label for="identifier" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Email atau Username
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="UserIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="identifier"
                v-model="form.identifier"
                type="text"
                placeholder="admin@maslahat-tani.com"
                autocomplete="username"
                required
                :disabled="isLoading"
                class="input-field pl-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.identifier }"
                @input="clearFieldError('identifier')"
              />
            </div>
            <p v-if="errors.identifier" class="mt-1 text-xs text-red-600">
              {{ errors.identifier }}
            </p>
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
                placeholder="Masukkan password"
                autocomplete="current-password"
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
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Memverifikasi...' : 'Lanjutkan' }}
          </button>
        </form>

        <!-- Step 2: OTP Verification -->
        <form v-else-if="step === 'otp'" @submit.prevent="handleOtpLogin" class="space-y-5">
          <!-- Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <component :is="ShieldCheckIcon" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-blue-900">Verifikasi 2FA</p>
                <p class="text-xs text-blue-700 mt-0.5">
                  Kode OTP telah dikirim ke email admin. Masukkan kode untuk melanjutkan.
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
              @click="backToCredentials"
            >
              &larr; Kembali
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || form.otp.length < 6"
            class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Masuk...' : 'Masuk ke Admin' }}
          </button>
        </form>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6">
        <RouterLink to="/" class="text-sm text-slate-400 hover:text-slate-300 transition-colors">
          &larr; Kembali ke Home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import {
  ShieldCheck as ShieldCheckIcon,
  User as UserIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  KeyRound as KeyRoundIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

type Step = 'credentials' | 'otp';

const step = ref<Step>('credentials');

const form = reactive({
  identifier: '',
  password: '',
  otp: '',
});

const errors = reactive({
  identifier: '',
  password: '',
  otp: '',
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');
const otpCooldown = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

function clearFieldError(field: 'identifier' | 'password' | 'otp') {
  errors[field] = '';
  errorMessage.value = '';
}

function validateCredentials(): boolean {
  let valid = true;

  if (!form.identifier.trim()) {
    errors.identifier = 'Email/username wajib diisi';
    valid = false;
  }

  if (!form.password) {
    errors.password = 'Password wajib diisi';
    valid = false;
  } else if (form.password.length < 8) {
    // Backend LoginDto: @MinLength(8)
    errors.password = 'Password minimal 8 karakter';
    valid = false;
  }

  return valid;
}

function validateOtp(): boolean {
  if (!form.otp || form.otp.length < 6) {
    errors.otp = 'Masukkan 6 digit kode OTP';
    return false;
  }
  return true;
}

function startOtpCooldown() {
  if (cooldownInterval) clearInterval(cooldownInterval);
  otpCooldown.value = 60;
  cooldownInterval = setInterval(() => {
    otpCooldown.value--;
    if (otpCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
  }, 1000);
}

function handleOtpInput() {
  // Hanya angka, max 6 digit
  form.otp = form.otp.replace(/\D/g, '').slice(0, 6);
  clearFieldError('otp');
}

function redirectAfterLogin() {
  const redirectTo = (route.query.redirect as string) || '/admin/dashboard';
  router.push(redirectTo);
}

async function handleCredentials() {
  errorMessage.value = '';
  infoMessage.value = '';

  if (!validateCredentials()) return;

  isLoading.value = true;

  try {
    const outcome = await authStore.login({
      identifier: form.identifier.trim(),
      password: form.password,
    });

    if (outcome.status === 'otp_required') {
      step.value = 'otp';
      infoMessage.value = outcome.message;
      startOtpCooldown();
      return;
    }

    if (outcome.status === 'shop_selection_required') {
      // Super-admin: token sudah ada, langsung ke dashboard.
      // Branch switcher di AdminLayout header akan handle pemilihan cabang.
      redirectAfterLogin();
      return;
    }

    // Sukses (kasir/non-admin tanpa OTP — tetap pastikan role admin)
    if (!authStore.isAdmin) {
      errorMessage.value = 'Akun ini bukan admin. Gunakan login kasir.';
      authStore.clearAuth();
      return;
    }
    redirectAfterLogin();
  } catch (err: any) {
    errorMessage.value = err.message || 'Email/username atau password salah.';
  } finally {
    isLoading.value = false;
  }
}

async function handleOtpLogin() {
  errorMessage.value = '';

  if (!validateOtp()) return;

  isLoading.value = true;

  try {
    const outcome = await authStore.login({
      identifier: form.identifier.trim(),
      password: form.password,
      otp: form.otp,
    });

    if (outcome.status === 'success') {
      redirectAfterLogin();
    } else if (outcome.status === 'shop_selection_required') {
      // Super-admin: token sudah ada, langsung ke dashboard
      redirectAfterLogin();
    } else {
      // Backend masih minta OTP (mis. OTP-nya udah expired & dikirim baru)
      infoMessage.value = outcome.message;
      startOtpCooldown();
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Kode OTP salah atau sudah kadaluarsa.';
  } finally {
    isLoading.value = false;
  }
}

async function resendOtp() {
  if (otpCooldown.value > 0 || isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const outcome = await authStore.login({
      identifier: form.identifier.trim(),
      password: form.password,
    });

    if (outcome.status === 'otp_required') {
      infoMessage.value = outcome.message;
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal kirim ulang OTP.';
  } finally {
    startOtpCooldown();
    isLoading.value = false;
  }
}

function backToCredentials() {
  step.value = 'credentials';
  form.otp = '';
  errors.otp = '';
  errorMessage.value = '';
  infoMessage.value = '';
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
  otpCooldown.value = 0;
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
});
</script>
