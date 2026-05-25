<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-4">
          <component :is="KeyRoundIcon" class="w-8 h-8 text-amber-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-950">Lupa Password</h1>
        <p class="text-sm text-slate-600 mt-1">Reset password akun kasir Anda</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
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

        <!-- Step 1: Input Email -->
        <form v-if="step === 'email'" @submit.prevent="handleSendOtp" class="space-y-5">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-1">
            <p class="text-xs text-slate-600">
              Masukkan email yang terdaftar. Kami akan mengirim kode OTP untuk verifikasi reset password.
            </p>
          </div>

          <!-- Email Field -->
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="MailIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="kasir@gmail.com"
                autocomplete="email"
                required
                :disabled="isLoading"
                class="input-field pl-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.email }"
                @input="clearFieldError('email')"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 px-6 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Mengirim...' : 'Kirim Kode OTP' }}
          </button>
        </form>

        <!-- Step 2: Verify OTP -->
        <form v-else-if="step === 'otp'" @submit.prevent="handleVerifyOtp" class="space-y-5">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <component :is="MailCheckIcon" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-blue-900">Cek Email Anda</p>
                <p class="text-xs text-blue-700 mt-0.5">
                  Kode OTP dikirim ke <span class="font-semibold">{{ form.email }}</span>
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

          <!-- Resend / Back -->
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
              @click="backToEmail"
            >
              &larr; Ubah email
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || form.otp.length < 6"
            class="w-full h-12 px-6 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Memverifikasi...' : 'Verifikasi OTP' }}
          </button>
        </form>

        <!-- Step 3: New Password -->
        <form v-else-if="step === 'reset'" @submit.prevent="handleResetPassword" class="space-y-5">
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <component :is="CheckCircle2Icon" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-emerald-900">OTP Terverifikasi</p>
                <p class="text-xs text-emerald-700 mt-0.5">Silakan buat password baru untuk akun Anda.</p>
              </div>
            </div>
          </div>

          <!-- New Password -->
          <div>
            <label for="newPassword" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Password Baru
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="LockIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="newPassword"
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="Minimal 8 karakter"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="input-field pl-10 pr-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.newPassword }"
                @input="clearFieldError('newPassword')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showNewPassword = !showNewPassword"
                tabindex="-1"
              >
                <component :is="showNewPassword ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.newPassword" class="mt-1 text-xs text-red-600">{{ errors.newPassword }}</p>
          </div>

          <!-- Confirm New Password -->
          <div>
            <label for="confirmNewPassword" class="block text-xs font-semibold text-slate-900 mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <component :is="LockIcon" class="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="confirmNewPassword"
                v-model="form.confirmNewPassword"
                :type="showConfirmNewPassword ? 'text' : 'password'"
                placeholder="Ketik ulang password baru"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="input-field pl-10 pr-10"
                :class="{ '!border-red-500 !ring-2 !ring-red-100': errors.confirmNewPassword }"
                @input="clearFieldError('confirmNewPassword')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showConfirmNewPassword = !showConfirmNewPassword"
                tabindex="-1"
              >
                <component :is="showConfirmNewPassword ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.confirmNewPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmNewPassword }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component v-if="isLoading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
            {{ isLoading ? 'Menyimpan...' : 'Simpan Password Baru' }}
          </button>
        </form>

        <!-- Step 4: Success -->
        <div v-else-if="step === 'success'" class="text-center py-4">
          <div class="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <component :is="CheckCircle2Icon" class="w-8 h-8 text-emerald-600" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 mb-2">Password Berhasil Direset!</h2>
          <p class="text-sm text-slate-600 mb-6">
            Password baru Anda telah tersimpan. Silakan login dengan password baru.
          </p>
          <RouterLink
            to="/kasir/login"
            class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-center gap-2"
          >
            <component :is="LogInIcon" class="w-4 h-4" />
            Masuk ke Akun
          </RouterLink>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 space-x-4">
        <RouterLink to="/kasir/login" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          &larr; Kembali ke Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import authService from '@/services/auth.service';
import {
  KeyRound as KeyRoundIcon,
  Mail as MailIcon,
  MailCheck as MailCheckIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle2 as CheckCircle2Icon,
  Loader2 as Loader2Icon,
  LogIn as LogInIcon,
} from 'lucide-vue-next';

type Step = 'email' | 'otp' | 'reset' | 'success';

const step = ref<Step>('email');

const form = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmNewPassword: '',
});

const errors = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmNewPassword: '',
});

const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const otpCooldown = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

function clearFieldError(field: 'email' | 'otp' | 'newPassword' | 'confirmNewPassword') {
  errors[field] = '';
  errorMessage.value = '';
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

// Step 1: Send OTP to email
async function handleSendOtp() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!form.email.trim()) {
    errors.email = 'Email wajib diisi';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid';
    return;
  }

  isLoading.value = true;

  try {
    await authService.forgotPassword({ email: form.email.trim() });
    step.value = 'otp';
    startOtpCooldown();
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Gagal mengirim OTP. Pastikan email terdaftar.';
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

// Step 2: Verify OTP
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
    step.value = 'reset';
    successMessage.value = '';
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Kode OTP salah atau sudah kadaluarsa.';
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

// Step 3: Set new password
async function handleResetPassword() {
  errorMessage.value = '';
  let valid = true;

  if (!form.newPassword) {
    errors.newPassword = 'Password baru wajib diisi';
    valid = false;
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'Password minimal 8 karakter';
    valid = false;
  }

  if (!form.confirmNewPassword) {
    errors.confirmNewPassword = 'Konfirmasi password wajib diisi';
    valid = false;
  } else if (form.newPassword !== form.confirmNewPassword) {
    errors.confirmNewPassword = 'Password tidak sama';
    valid = false;
  }

  if (!valid) return;

  isLoading.value = true;

  try {
    await authService.resetPassword({
      email: form.email.trim(),
      otp: form.otp,
      newPassword: form.newPassword,
    });
    step.value = 'success';
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Gagal mereset password. Silakan coba lagi.';
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
    await authService.forgotPassword({ email: form.email.trim() });
    successMessage.value = 'Kode OTP baru telah dikirim ke email Anda.';
    startOtpCooldown();
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal mengirim ulang OTP.';
  } finally {
    isLoading.value = false;
  }
}

function backToEmail() {
  step.value = 'email';
  form.otp = '';
  errors.otp = '';
  errorMessage.value = '';
  successMessage.value = '';
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
});
</script>
