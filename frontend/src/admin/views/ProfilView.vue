<template>
  <div class="max-w-3xl space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Profil Saya</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Kelola data pribadi, username, dan keamanan akun.
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
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ user?.email || 'Belum ada email' }}</p>
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
      <form @submit.prevent="handleSaveProfile" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Username
          </label>
          <input
            v-model="form.username"
            type="text"
            placeholder="username"
            class="mt-1 w-full h-9 px-3 text-sm font-mono bg-white dark:bg-slate-800
                   border border-slate-300 dark:border-slate-700 rounded-lg
                   text-slate-900 dark:text-slate-100
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <p class="text-[9px] text-slate-400 mt-0.5">Huruf kecil, angka, tanpa spasi. Dipakai untuk login.</p>
        </div>
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Nama Lengkap
          </label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="Nama lengkap Anda"
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
            :value="user?.email || ''"
            type="email"
            disabled
            class="mt-1 w-full h-9 px-3 text-sm bg-slate-50 dark:bg-slate-800/50
                   border border-slate-200 dark:border-slate-700 rounded-lg
                   text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <p class="text-[9px] text-slate-400 mt-0.5">Email tidak bisa diubah langsung.</p>
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
            placeholder="Alamat lengkap"
            class="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800
                   border border-slate-300 dark:border-slate-700 rounded-lg
                   text-slate-900 dark:text-slate-100
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          ></textarea>
        </div>

        <div v-if="profileError" class="sm:col-span-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
          {{ profileError }}
        </div>

        <div class="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            :disabled="savingProfile"
            class="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Loader2Icon v-if="savingProfile" class="w-3.5 h-3.5 animate-spin" />
            {{ savingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Security section -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Keamanan</h2>

      <!-- Change password -->
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
          @click="showChangePassword = true"
        >
          Ganti Password
        </button>
      </div>

      <!-- 2FA OTP toggle -->
      <div class="flex items-center justify-between py-3">
        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ otpEnabled
              ? 'Aktif — Kode OTP dikirim ke email saat login.'
              : 'Nonaktif — Login langsung tanpa OTP.'
            }}
          </p>
          <p v-if="!user?.email && !otpEnabled" class="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
            Perlu email untuk mengaktifkan 2FA.
          </p>
        </div>
        <button
          type="button"
          :disabled="togglingOtp || (!user?.email && !otpEnabled)"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors disabled:opacity-50',
            otpEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
          ]"
          @click="handleToggleOtp"
        >
          <span
            :class="[
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              otpEnabled ? 'translate-x-5' : 'translate-x-0.5',
            ]"
          ></span>
        </button>
      </div>
    </section>

    <!-- Change Password Modal -->
    <teleport to="body">
      <div v-if="showChangePassword" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showChangePassword = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleChangePassword">
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Ganti Password</h3>

          <div>
            <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Password Lama</label>
            <input
              v-model="pwForm.currentPassword"
              type="password"
              required
              placeholder="Masukkan password saat ini"
              class="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Password Baru</label>
            <input
              v-model="pwForm.newPassword"
              type="password"
              required
              minlength="6"
              placeholder="Minimal 6 karakter"
              class="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Konfirmasi Password Baru</label>
            <input
              v-model="pwForm.confirmPassword"
              type="password"
              required
              minlength="6"
              placeholder="Ulangi password baru"
              class="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none"
            />
          </div>

          <div v-if="pwError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ pwError }}
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" @click="showChangePassword = false">Batal</button>
            <button type="submit" :disabled="changingPassword" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="changingPassword" class="w-3.5 h-3.5 animate-spin" />
              {{ changingPassword ? 'Mengubah...' : 'Simpan Password' }}
            </button>
          </div>
        </form>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import { Loader2 as Loader2Icon } from 'lucide-vue-next';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const toast = useToast();

const user = computed(() => authStore.user);

// Form state
const form = reactive({
  username: '',
  fullName: '',
  phone: '',
  address: '',
});

const otpEnabled = ref(false);
const togglingOtp = ref(false);
const savingProfile = ref(false);
const profileError = ref<string | null>(null);

// Change password state
const showChangePassword = ref(false);
const changingPassword = ref(false);
const pwError = ref<string | null>(null);
const pwForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// ============================================
// Computed
// ============================================

const displayName = computed(() => {
  const u = user.value;
  if (!u) return '-';
  return (u as any).fullName || u.username || u.email?.split('@')[0] || 'User';
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
  if (r === 'ADMIN') return 'Admin Cabang';
  if (r === 'CASHIER_SUPERVISOR') return 'Supervisor Kasir';
  if (r === 'KASIR') return 'Kasir';
  return '-';
});

const lastPasswordResetLabel = computed(() => {
  const d = (user.value as any)?.lastPasswordReset;
  if (!d) return 'Belum pernah diganti';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
});

// ============================================
// Methods
// ============================================

async function loadProfile() {
  try {
    const { data } = await api.get('/auth/me');
    form.username = data.username || '';
    form.fullName = data.fullName || '';
    form.phone = data.phone || '';
    form.address = data.address || '';
    otpEnabled.value = data.otpEnabled ?? false;
  } catch {
    // Use whatever auth store has
    form.username = user.value?.username || '';
  }
}

async function handleSaveProfile() {
  savingProfile.value = true;
  profileError.value = null;
  try {
    const { data } = await api.post('/auth/update-profile', {
      username: form.username.trim() || undefined,
      fullName: form.fullName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    });
    toast.success(data.message || 'Profil berhasil disimpan.');
    // Update auth store user
    if (data.user) {
      await authStore.fetchUser();
    }
  } catch (err: any) {
    profileError.value = err.response?.data?.message || err.message || 'Gagal menyimpan profil.';
  } finally {
    savingProfile.value = false;
  }
}

async function handleChangePassword() {
  pwError.value = null;

  if (pwForm.newPassword.length < 6) {
    pwError.value = 'Password baru minimal 6 karakter.';
    return;
  }
  if (pwForm.newPassword !== pwForm.confirmPassword) {
    pwError.value = 'Konfirmasi password tidak cocok.';
    return;
  }

  changingPassword.value = true;
  try {
    const { data } = await api.post('/auth/change-password-with-old', {
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
    toast.success(data.message || 'Password berhasil diubah.');
    showChangePassword.value = false;
    pwForm.currentPassword = '';
    pwForm.newPassword = '';
    pwForm.confirmPassword = '';
    // Reload profile to update lastPasswordReset
    await loadProfile();
  } catch (err: any) {
    pwError.value = err.response?.data?.message || err.message || 'Gagal mengubah password.';
  } finally {
    changingPassword.value = false;
  }
}

async function handleToggleOtp() {
  const newState = !otpEnabled.value;
  togglingOtp.value = true;
  try {
    const { data } = await api.post('/auth/toggle-otp', { enabled: newState });
    otpEnabled.value = newState;
    toast.success(data.message || (newState ? '2FA diaktifkan.' : '2FA dinonaktifkan.'));
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Gagal mengubah pengaturan 2FA.');
  } finally {
    togglingOtp.value = false;
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  loadProfile();
});
</script>
