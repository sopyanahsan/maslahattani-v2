<template>
  <div class="relative min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-200 overflow-hidden">
    <Transition name="fade-in-blur">
      <div v-if="step === 'success'" class="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-slate-900/80">
        <svg class="checkmark w-24 h-24 mb-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark__circle stroke-blue-500 stroke-2" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark__check stroke-blue-500 stroke-[3] stroke-linecap-round stroke-linejoin-round" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
        <Transition name="slide-up-text" appear>
          <h2 class="text-2xl font-semibold text-white tracking-tight">Selamat datang, {{ userName }}</h2>
        </Transition>
      </div>
    </Transition>

    <Transition name="fade-up" mode="out-in">
      <div v-if="step !== 'success'" class="w-full max-w-md z-0">
        <div class="flex flex-col items-center mb-8">
          <div class="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <ShieldIcon class="w-6 h-6 text-blue-500" />
          </div>
          <h1 class="text-2xl font-semibold text-white tracking-tight">Admin Panel</h1>
          <p class="text-slate-400 mt-1 text-sm">Maslahat Tani</p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <!-- Error Alert -->
          <div v-if="errorMessage" class="mb-5 bg-red-900/30 border-l-4 border-red-500 rounded-md p-4">
            <div class="flex items-start gap-2">
              <AlertCircleIcon class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p class="text-sm text-red-200">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Info Alert -->
          <div v-if="infoMessage && !errorMessage" class="mb-5 bg-blue-900/30 border-l-4 border-blue-500 rounded-md p-4">
            <div class="flex items-start gap-2">
              <ShieldIcon class="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p class="text-sm text-blue-200">{{ infoMessage }}</p>
            </div>
          </div>

          <Transition name="fade" mode="out-in">
            <!-- Step 1: Credentials -->
            <form v-if="step === 'credentials'" @submit.prevent="handleCredentials" class="space-y-5" key="credentials">
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-300">Email atau Username</label>
                <div class="relative">
                  <MailIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input v-model="form.identifier" type="text" required class="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="admin@maslahattani.my.id">
                </div>
              </div>
              
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-300">Password</label>
                <div class="relative">
                  <LockIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input v-model="form.password" type="password" required class="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="••••••••">
                </div>
              </div>

              <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
                <span v-else>Lanjutkan</span>
              </button>
            </form>

            <!-- Step 2: OTP -->
            <form v-else-if="step === 'otp'" @submit.prevent="handleOTP" class="space-y-5" key="otp">
              <div class="text-center mb-6">
                <p class="text-sm text-slate-400">Masukkan kode 6 digit yang dikirimkan ke email Anda untuk verifikasi.</p>
              </div>
              <div class="space-y-1 text-center">
                <input v-model="form.otp" type="text" maxlength="6" required class="w-full text-center tracking-[0.5em] font-mono text-2xl bg-slate-900/50 border border-slate-700 rounded-lg py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="000000">
              </div>

              <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
                <span v-else>Verifikasi Login</span>
              </button>
              
              <button type="button" @click="step = 'credentials'; errorMessage = null;" class="w-full text-sm text-slate-400 hover:text-white transition-colors mt-4">
                Kembali
              </button>
            </form>
          </Transition>
        </div>
      </div>
    </Transition>

    <div v-if="step !== 'success'" class="absolute bottom-6 text-center text-xs text-slate-500 space-y-2">
      <p>Maslahat Tani POS System v2.0</p>
      <a href="/webapp/login" class="text-blue-400 hover:underline font-medium">Login sebagai Kasir →</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Shield as ShieldIcon, Lock as LockIcon, Mail as MailIcon, Loader2 as Loader2Icon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const step = ref<'credentials' | 'otp' | 'success'>('credentials');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const infoMessage = ref<string | null>(null);

const form = reactive({
  identifier: '',
  password: '',
  otp: '',
});

const userName = computed(() => {
  const u = authStore.user;
  return u?.username || u?.email || 'Admin';
});

const handleCredentials = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    // Step 1: validate credentials + trigger OTP send
    await authStore.loginStep1(form.identifier, form.password);
    infoMessage.value = 'Kode OTP telah dikirim ke email Anda.';
    step.value = 'otp';
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || err?.message || 'Email/username atau password salah.';
  } finally {
    isLoading.value = false;
  }
};

const handleOTP = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    // Step 2: verify OTP + get token
    await authStore.loginStep2(form.identifier, form.password, form.otp);
    step.value = 'success';

    // Redirect after animation completes (2s)
    setTimeout(() => {
      router.push('/admin/home');
    }, 2000);
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || err?.message || 'Kode OTP tidak valid atau sudah expired.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Card Transitions */
.fade-up-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Background Blur Transition */
.fade-in-blur-enter-active {
  transition: all 0.8s ease;
}
.fade-in-blur-enter-from {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Text Slide Up Transition */
.slide-up-text-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
}
.slide-up-text-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

/* SVG Draw Animation */
.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
}

@keyframes stroke {
  100% { stroke-dashoffset: 0; }
}
</style>
