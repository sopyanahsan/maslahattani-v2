<template>
  <div class="settings-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
    <!-- Header with gradient -->
    <header class="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-6 pb-16 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
        <div class="absolute bottom-0 -left-8 w-24 h-24 bg-white rounded-full"></div>
      </div>
      <div class="relative z-10">
        <h1 class="font-bold text-lg text-white">Pengaturan</h1>
        <p class="text-[11px] text-blue-100 mt-0.5">Profil & keamanan akun</p>
      </div>
    </header>

    <!-- Profile Card (floating over header) -->
    <div class="px-4 -mt-10 relative z-10">
      <div class="profile-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
        <!-- View Mode (default) -->
        <template v-if="!editingProfile">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-200 dark:shadow-blue-900/30">
              <UserIcon class="w-7 h-7" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-900 dark:text-white truncate text-base">{{ profileData.fullName || userName }}</p>
              <div class="mt-1.5 space-y-0.5">
                <p v-if="profileData.phone" class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <PhoneIcon class="w-3 h-3" /> {{ profileData.phone }}
                </p>
                <p v-if="profileData.address" class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPinIcon class="w-3 h-3" /> {{ profileData.address }}
                </p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500">Kasir · {{ shopName }}</p>
              </div>
            </div>
          </div>
          <button class="mt-4 w-full h-9 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5" @click="editingProfile = true">
            <EditIcon class="w-3.5 h-3.5" /> Edit Profil
          </button>
        </template>

        <!-- Edit Mode -->
        <template v-else>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <EditIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Edit Profil</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Nama Lengkap</label>
              <input v-model="profileData.fullName" type="text" placeholder="Belum diisi" class="w-full h-9 px-3 mt-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">No HP</label>
              <input v-model="profileData.phone" type="tel" placeholder="08xxxxxxxxxx" class="w-full h-9 px-3 mt-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Alamat</label>
              <input v-model="profileData.address" type="text" placeholder="Alamat lengkap" class="w-full h-9 px-3 mt-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all" />
            </div>
            <div class="flex gap-2 pt-1">
              <button class="flex-1 h-9 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" @click="editingProfile = false">Batal</button>
              <button :disabled="savingProfile" class="flex-1 h-9 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-900/30" @click="handleSaveProfile">
                <Loader2Icon v-if="savingProfile" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ savingProfile ? 'Menyimpan...' : 'Simpan' }}</span>
              </button>
            </div>
            <p v-if="profileSuccess" class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center animate-fade-in">Profil berhasil disimpan!</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Shift Info -->
    <div class="px-4 mt-5">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider px-1">Shift</h3>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4">
          <span class="text-sm text-slate-600 dark:text-slate-300">Status</span>
          <span v-if="hasOpenShift" class="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-300"></span>
            Aktif ({{ shiftDurationLabel }})
          </span>
          <span v-else class="text-sm text-slate-400 dark:text-slate-500">Tidak ada shift aktif</span>
        </div>
        <RouterLink to="/retail/shift" class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
          <span class="text-sm text-slate-700 dark:text-slate-300">Kelola Shift</span>
          <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </RouterLink>
        <div v-if="shiftHistory.length > 0" class="p-4">
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">Riwayat Shift Terakhir</p>
          <div class="space-y-2">
            <div v-for="sh in shiftHistory" :key="sh.id" class="flex items-center justify-between text-xs">
              <span class="text-slate-700 dark:text-slate-300">{{ sh.date }}</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono">{{ sh.duration }}</span>
              <span :class="['font-semibold px-2 py-0.5 rounded-full text-[10px]', sh.status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400']">{{ sh.status === 'CLOSED' ? 'Ditutup' : sh.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="px-4 mt-5">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider px-1">Keamanan</h3>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm overflow-hidden">
        <button @click="showChangePinModal = true" class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <LockIcon class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="text-left">
              <span class="text-sm font-medium text-slate-800 dark:text-white block">Ganti PIN</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500">Ubah PIN login Anda</span>
            </div>
          </div>
          <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </button>
        <button class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <RefreshCwIcon class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div class="text-left">
              <span class="text-sm font-medium text-slate-800 dark:text-white block">Reset PIN</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500">Minta reset ke admin</span>
            </div>
          </div>
          <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>

    <!-- App Info & Logout -->
    <div class="px-4 mt-5">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider px-1">Aplikasi</h3>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <InfoIcon class="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
            </div>
            <span class="text-sm text-slate-700 dark:text-slate-300">Versi Aplikasi</span>
          </div>
          <span class="text-sm font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">v1.0.0</span>
        </div>
        <button @click="handleLogout" class="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
          <div class="w-9 h-9 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
            <LogOutIcon class="w-4.5 h-4.5 text-red-500 dark:text-red-400" />
          </div>
          <span class="text-sm font-semibold text-red-600 dark:text-red-400">Logout</span>
        </button>
      </div>
    </div>

    <!-- Change PIN Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showChangePinModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="showChangePinModal = false"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <LockIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Ganti PIN</h3>
            </div>

            <div v-if="pinError" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md p-3">
              <p class="text-xs text-red-800 dark:text-red-300">{{ pinError }}</p>
            </div>
            <div v-if="pinSuccess" class="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-md p-3">
              <p class="text-xs text-emerald-800 dark:text-emerald-300">{{ pinSuccess }}</p>
            </div>

            <form @submit.prevent="handleChangePin" class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">PIN Lama</label>
                <input v-model="pinForm.oldPin" type="password" inputmode="numeric" maxlength="6" required class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-4 mt-1 text-center tracking-[0.3em] text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all text-slate-900 dark:text-white" placeholder="····">
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">PIN Baru</label>
                <input v-model="pinForm.newPin" type="password" inputmode="numeric" maxlength="6" minlength="4" required class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-4 mt-1 text-center tracking-[0.3em] text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all text-slate-900 dark:text-white" placeholder="····">
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Konfirmasi PIN Baru</label>
                <input v-model="pinForm.confirmPin" type="password" inputmode="numeric" maxlength="6" minlength="4" required class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-4 mt-1 text-center tracking-[0.3em] text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all text-slate-900 dark:text-white" placeholder="····">
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showChangePinModal = false" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Batal</button>
                <button type="submit" :disabled="pinLoading" class="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-900/30">
                  <Loader2Icon v-if="pinLoading" class="w-4 h-4 animate-spin mx-auto" />
                  <span v-else>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import {
  User as UserIcon,
  Lock as LockIcon,
  RefreshCw as RefreshCwIcon,
  LogOut as LogOutIcon,
  ChevronRight as ChevronRightIcon,
  Loader2 as Loader2Icon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Pencil as EditIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import authService from '@/shared/services/auth.service';
import api from '@/shared/services/api';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();
const shiftStore = useShiftStore();

const userName = computed(() => authStore.user?.username || authStore.user?.email || 'Kasir');
const shopName = computed(() => shopStore.currentShopName || 'Toko');
const hasOpenShift = computed(() => shiftStore.hasOpenShift);
const shiftDurationLabel = computed(() => {
  const m = shiftStore.shiftDurationMinutes;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}j ${min}m` : `${min}m`;
});

const shiftHistory = ref<Array<{ id: string; date: string; duration: string; status: string }>>([]);

// Profile edit
const editingProfile = ref(false);
const profileData = reactive({ fullName: '', phone: '', address: '' });
const savingProfile = ref(false);
const profileSuccess = ref(false);

async function handleSaveProfile() {
  savingProfile.value = true;
  profileSuccess.value = false;
  try {
    await api.patch('/profile', {
      fullName: profileData.fullName || undefined,
      phone: profileData.phone || undefined,
      address: profileData.address || undefined,
    });
    profileSuccess.value = true;
    setTimeout(() => { profileSuccess.value = false; editingProfile.value = false; }, 1500);
  } catch { /* silent */ }
  finally { savingProfile.value = false; }
}

async function fetchProfile() {
  try {
    const { data } = await api.get('/profile');
    if (data.profile) {
      profileData.fullName = data.profile.fullName || '';
      profileData.phone = data.profile.phone || '';
      profileData.address = data.profile.address || '';
    }
  } catch { /* silent */ }
}

// Change PIN
const showChangePinModal = ref(false);
const pinLoading = ref(false);
const pinError = ref<string | null>(null);
const pinSuccess = ref<string | null>(null);
const pinForm = reactive({ oldPin: '', newPin: '', confirmPin: '' });

async function handleChangePin() {
  pinError.value = null;
  pinSuccess.value = null;

  if (pinForm.newPin.length < 4) { pinError.value = 'PIN baru minimal 4 digit.'; return; }
  if (pinForm.newPin !== pinForm.confirmPin) { pinError.value = 'Konfirmasi PIN tidak cocok.'; return; }
  if (!/^\d{4,6}$/.test(pinForm.newPin)) { pinError.value = 'PIN harus berupa angka 4-6 digit.'; return; }

  pinLoading.value = true;
  try {
    await authService.changePin(pinForm.oldPin, pinForm.newPin);
    pinSuccess.value = 'PIN berhasil diubah!';
    pinForm.oldPin = '';
    pinForm.newPin = '';
    pinForm.confirmPin = '';
    setTimeout(() => { showChangePinModal.value = false; pinSuccess.value = null; }, 1500);
  } catch (err: any) {
    pinError.value = err?.response?.data?.message || err?.message || 'Gagal mengubah PIN.';
  } finally {
    pinLoading.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}

onMounted(async () => {
  try { await shiftStore.fetchCurrentShift(); } catch {}
  await fetchProfile();
});
</script>

<style scoped>
/* Page entrance */
.settings-page {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Profile card float entrance */
.profile-card {
  animation: floatUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes floatUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Success text fade */
.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

/* Modal transitions */
.modal-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from > div:last-child { transform: scale(0.95) translateY(10px); }
.modal-leave-to > div:last-child { transform: scale(0.95); }
</style>
