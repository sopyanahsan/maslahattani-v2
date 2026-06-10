<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Card -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#00A19B] to-teal-500 p-6 text-center text-white">
          <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <MailIcon class="w-7 h-7 text-white" />
          </div>
          <h1 class="text-lg font-bold">Verifikasi Email</h1>
          <p class="text-xs text-teal-100 mt-1">Masukkan kode yang dikirim ke email Anda</p>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          <!-- Email info -->
          <div class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center">
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Kode dikirim ke:</p>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {{ maskedEmail }}
            </p>
          </div>

          <!-- OTP Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Kode Verifikasi (6 digit)
            </label>
            <input
              ref="codeInput"
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              :disabled="verifying"
              class="w-full h-12 text-center text-2xl font-mono font-bold tracking-[0.5em] border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:border-[#00A19B] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
              @input="onCodeInput"
            />
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center"
          >
            <p class="text-xs text-red-700 dark:text-red-300">{{ error }}</p>
          </div>

          <!-- Success -->
          <div
            v-if="success"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center"
          >
            <CheckCircleIcon class="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p class="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{{ success }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="button"
            :disabled="code.length !== 6 || verifying"
            class="w-full h-11 bg-[#00A19B] text-white font-semibold text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            @click="handleVerify"
          >
            <Loader2Icon v-if="verifying" class="w-4 h-4 animate-spin" />
            {{ verifying ? 'Memverifikasi...' : 'Verifikasi' }}
          </button>

          <!-- Resend -->
          <div class="text-center">
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Belum menerima kode?</p>
            <button
              type="button"
              :disabled="resendCooldown > 0 || resending"
              class="text-xs font-semibold text-[#00A19B] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleResend"
            >
              <template v-if="resending">Mengirim ulang...</template>
              <template v-else-if="resendCooldown > 0">Kirim ulang ({{ resendCooldown }}s)</template>
              <template v-else>Kirim Ulang Kode</template>
            </button>
          </div>
        </div>

        <!-- Footer info -->
        <div class="border-t border-slate-100 dark:border-slate-800 px-6 py-3 bg-amber-50 dark:bg-amber-950/20">
          <p class="text-[10px] text-amber-800 dark:text-amber-300 text-center leading-relaxed">
            ⚠️ Dengan memverifikasi, Anda menyetujui bahwa akun ini digunakan secara sah
            dan bertanggung jawab atas semua aktivitas transaksi.
          </p>
        </div>
      </div>

      <!-- Logout link -->
      <p class="text-center mt-4">
        <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="handleLogout">
          Keluar / Ganti Akun
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Mail as MailIcon, Loader2 as Loader2Icon, CheckCircle2 as CheckCircleIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const router = useRouter();
const authStore = useAuthStore();

const code = ref('');
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const verifying = ref(false);
const resending = ref(false);
const resendCooldown = ref(0);
const codeInput = ref<HTMLInputElement | null>(null);

const maskedEmail = computed(() => {
  const email = authStore.user?.email || '';
  if (!email) return '***@***.com';
  const [local, domain] = email.split('@');
  const masked = local.length > 2 ? local.slice(0, 2) + '***' : local[0] + '***';
  return `${masked}@${domain}`;
});

function onCodeInput() {
  // Strip non-numeric characters
  code.value = code.value.replace(/\D/g, '').slice(0, 6);
  // Auto-submit when 6 digits entered
  if (code.value.length === 6) {
    handleVerify();
  }
}

async function handleVerify() {
  if (code.value.length !== 6) return;
  verifying.value = true;
  error.value = null;
  success.value = null;

  try {
    const { data } = await api.post('/auth/verify-email', { code: code.value });
    success.value = data.message || 'Email berhasil diverifikasi!';

    // Update user state
    if (authStore.user) {
      (authStore.user as any).emailVerified = true;
    }

    // Redirect after short delay
    setTimeout(() => {
      // If mustChangePin, the KasirLayout will handle redirect to change-pin page
      router.replace({ name: 'webapp-dashboard' });
    }, 1500);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Verifikasi gagal. Coba lagi.';
    code.value = '';
    codeInput.value?.focus();
  } finally {
    verifying.value = false;
  }
}

async function handleResend() {
  resending.value = true;
  error.value = null;

  try {
    const { data } = await api.post('/auth/send-verification');
    success.value = data.message || 'Kode baru telah dikirim.';
    startCooldown();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal mengirim ulang kode.';
  } finally {
    resending.value = false;
  }
}

function startCooldown() {
  resendCooldown.value = 60;
  const timer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) clearInterval(timer);
  }, 1000);
}

function handleLogout() {
  authStore.clearAuth();
  router.replace({ name: 'login' });
}

onMounted(() => {
  // If already verified, skip this page
  if ((authStore.user as any)?.emailVerified !== false) {
    router.replace({ name: 'webapp-dashboard' });
    return;
  }
  codeInput.value?.focus();
  startCooldown(); // Cooldown on mount since code was sent during account creation
});
</script>
