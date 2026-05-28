<template>
  <div class="relative min-h-screen bg-gradient-to-br from-white to-blue-50/80 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
    
    <div v-if="step === 'success'" class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="confetti-piece" v-for="n in 15" :key="n" :style="`--x: ${Math.random() * 100}vw; --delay: ${Math.random() * 0.5}s; --duration: ${1 + Math.random()}s; --color: ${['#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 3)]}`"></div>
    </div>

    <Transition name="fade-in">
      <div v-if="step === 'success'" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
        
        <div class="morph-container relative w-20 h-20 mb-6">
          <div class="ring absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div class="spinner absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
          <svg class="success-check absolute inset-0 w-full h-full text-emerald-500 scale-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <Transition name="slide-up" appear>
          <div class="text-center">
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight mb-2">Shift siap!</h2>
            <p class="text-slate-600 font-medium">Selamat bekerja, {{ userName }}</p>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="scale-down" mode="out-in">
      <div v-if="step === 'login'" class="w-full max-w-sm z-10">
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div class="flex flex-col items-center mb-8">
            <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 text-emerald-500 shadow-sm border border-emerald-100">
              <StoreIcon class="w-7 h-7" />
            </div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Masuk ke Kasir</h1>
            <p class="text-slate-500 mt-1 text-sm">Maslahat Tani — Sistem POS</p>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="mb-5 bg-red-50 border-l-4 border-red-500 rounded-md p-4">
            <div class="flex items-start gap-2">
              <AlertCircleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700">Email Kasir</label>
              <input v-model="form.email" type="email" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="kasir@maslahattani.my.id">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700">Password</label>
              <input v-model="form.password" type="password" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="••••••••">
            </div>

            <button type="submit" :disabled="isLoading" class="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center mt-2 shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
              <span v-else>Buka Shift</span>
            </button>
          </form>
        </div>

        <p class="text-center text-xs text-slate-400 mt-6">v2.0 • Maslahat Tani POS</p>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Store as StoreIcon, Loader2 as Loader2Icon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const step = ref<'login' | 'success'>('login');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const form = reactive({
  email: '',
  password: '',
});

const userName = computed(() => {
  const u = authStore.user;
  return u?.username || u?.email || 'Kasir';
});

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.login(form.email, form.password);
    step.value = 'success';

    // Redirect setelah animasi selesai (2s)
    setTimeout(() => {
      router.push('/kasir/dashboard');
    }, 2000);
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || err?.message || 'Login gagal. Periksa email dan password.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Card Transitions */
.scale-down-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.scale-down-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

/* Background Transition */
.fade-in-enter-active {
  transition: opacity 0.5s ease 0.2s;
}
.fade-in-enter-from {
  opacity: 0;
}

/* Morph Animation Container */
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

/* Text Slide Up Transition */
.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 1.2s;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Simple CSS Confetti (Fall & Spin) */
.confetti-piece {
  position: absolute;
  top: -10px;
  left: var(--x);
  width: 8px;
  height: 16px;
  background-color: var(--color);
  border-radius: 4px;
  animation: fall var(--duration) linear var(--delay) forwards;
  opacity: 0;
}

@keyframes fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
</style>
