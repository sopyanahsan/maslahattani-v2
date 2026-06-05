<template>
  <div class="max-w-3xl space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Profil Saya</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Kelola data pribadi, password, dan keamanan akun.
      </p>
    </div>

    <!-- Profile photo + name section -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700
                      flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-300">
            {{ initials }}
          </div>
          <button
            type="button"
            class="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
            disabled
            title="Upload foto (segera)"
          >
            <component :is="CameraIcon" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ user?.email }}</p>
          <span class="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wide
                       bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded">
            {{ roleLabel }}
          </span>
        </div>
      </div>
    </section>

    <!-- Personal data form -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Data Pribadi</h2>
      <form @submit.prevent="handleSavePersonal" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Nama Lengkap
          </label>
          <input
            v-model="form.name"
            type="text"
            class="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-slate-800
                   border border-slate-300 dark:border-slate-700 rounded-lg
                   text-slate-900 dark:text-slate-100
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Email
          </label>
          <input
            :value="user?.email"
            type="email"
            disabled
            class="mt-1 w-full h-9 px-3 text-sm bg-slate-50 dark:bg-slate-800/50
                   border border-slate-200 dark:border-slate-700 rounded-lg
                   text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            No. HP
          </label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            class="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-slate-800
                   border border-slate-300 dark:border-slate-700 rounded-lg
                   text-slate-900 dark:text-slate-100
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Alamat
          </label>
          <textarea
            v-model="form.address"
            rows="2"
            class="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800
                   border border-slate-300 dark:border-slate-700 rounded-lg
                   text-slate-900 dark:text-slate-100
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          ></textarea>
        </div>
        <div class="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            :disabled="savingPersonal"
            class="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {{ savingPersonal ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Security section -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Keamanan</h2>

      <!-- Reset password -->
      <div class="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Password</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Terakhir diganti: {{ lastPasswordResetLabel }}
          </p>
        </div>
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold border border-slate-300 dark:border-slate-700
                 text-slate-700 dark:text-slate-300 rounded-lg
                 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled
        >
          Ganti Password
        </button>
      </div>

      <!-- 2FA toggle -->
      <div class="flex items-center justify-between py-3">
        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tambahkan lapisan keamanan dengan OTP via email.
          </p>
        </div>
        <button
          type="button"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors',
            twoFAEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
          ]"
          @click="twoFAEnabled = !twoFAEnabled"
          disabled
          title="Segera tersedia"
        >
          <span
            :class="[
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              twoFAEnabled ? 'translate-x-5' : 'translate-x-0.5',
            ]"
          ></span>
        </button>
      </div>
    </section>

    <p class="text-xs text-slate-400 dark:text-slate-500 text-center">
      Beberapa fitur (upload foto, ganti password, 2FA) akan tersedia di update berikutnya.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import { Camera as CameraIcon } from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();

const user = computed(() => authStore.user);

const form = reactive({
  name: user.value?.username || '',
  phone: '',
  address: '',
});

const twoFAEnabled = ref(false);
const savingPersonal = ref(false);

const displayName = computed(() => {
  const u = user.value;
  if (!u) return '-';
  return u.username || u.email?.split('@')[0] || 'User';
});

const initials = computed(() => {
  const name = displayName.value;
  const parts = name.split(/[@\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase().slice(0, 2);
});

const roleLabel = computed(() => {
  const r = user.value?.role;
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'CASHIER_SUPERVISOR') return 'Supervisor Kasir';
  if (r === 'KASIR') return 'Kasir';
  return '-';
});

const lastPasswordResetLabel = computed(() => {
  const d = (user.value as any)?.lastPasswordReset;
  if (!d) return 'Belum pernah diganti';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
});

async function handleSavePersonal() {
  savingPersonal.value = true;
  // TODO: implement API call to update profile
  await new Promise((r) => setTimeout(r, 600));
  savingPersonal.value = false;
  toast.info('Fitur update profil akan segera tersedia.');
}
</script>
