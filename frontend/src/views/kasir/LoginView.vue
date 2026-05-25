<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-4">
          <component :is="StoreIcon" class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-950">Masuk ke Kasir</h1>
        <p class="text-sm text-slate-600 mt-1">Maslahat Tani — Sistem POS</p>
      </div>

      <!-- Login Card -->
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

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
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

          <!-- Password Field -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-xs font-semibold text-slate-900">
                Password
              </label>
              <RouterLink
                to="/kasir/forgot-password"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Lupa password?
              </RouterLink>
            </div>
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

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <component
              v-if="isLoading"
              :is="Loader2Icon"
              class="w-4 h-4 animate-spin"
            />
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-slate-500">Belum punya akun?</span>
          </div>
        </div>

        <!-- Register Link -->
        <RouterLink
          to="/kasir/register"
          class="w-full h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <component :is="UserPlusIcon" class="w-4 h-4" />
          Daftar Akun Kasir
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import {
  Store as StoreIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  UserPlus as UserPlusIcon,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

function clearFieldError(field: 'email' | 'password') {
  errors[field] = '';
  errorMessage.value = '';
}

function validate(): boolean {
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
  } else if (form.password.length < 6) {
    errors.password = 'Password minimal 6 karakter';
    valid = false;
  }

  return valid;
}

async function handleLogin() {
  errorMessage.value = '';

  if (!validate()) return;

  isLoading.value = true;

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    });

    // Redirect based on role
    if (authStore.isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/kasir/dashboard');
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Login gagal. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
}
</script>
