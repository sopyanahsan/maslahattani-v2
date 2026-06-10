<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div class="min-w-0"></div>
      <button
        type="button"
        style="background-color: #2563eb; color: white;"
        class="h-10 px-5 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 shrink-0 shadow-sm shadow-violet-200"
        @click="openCreateModal"
      >
        <UserPlusIcon class="w-4 h-4" />
        <span>Tambah User</span>
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat daftar user...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <div v-else-if="kasirList.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
      <UsersIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada kasir terdaftar</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Buat akun kasir pertama lewat tombol di atas.</p>
    </div>

    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">User</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Role</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Cabang</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Login</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Last Login</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="kasir in kasirList" :key="kasir.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div :class="['w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold', roleBg(kasir.role)]">
                    {{ initials(kasir.username || kasir.email) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ kasir.username ?? '—' }}</p>
                    <p v-if="hasRealEmail(kasir.email)" class="text-[10px] text-slate-500 dark:text-slate-400">{{ kasir.email }}</p>
                    <p v-else class="text-[10px] text-slate-400 dark:text-slate-600 italic">Belum ada email</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', roleBadge(kasir.role)]">{{ roleLabel(kasir.role) }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="kasir.shopName" class="text-xs text-slate-700 dark:text-slate-300">{{ kasir.shopName }}</span>
                <span v-else class="text-[10px] text-slate-400 dark:text-slate-600 italic">Belum assign</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(kasir.status)]">{{ kasir.status }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="kasir.role === 'ADMIN'" class="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-semibold">Password</span>
                <span v-else class="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-1.5 py-0.5 rounded font-semibold">PIN</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ kasir.lastLogin ? formatDateTime(kasir.lastLogin) : 'Belum login' }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" :title="kasir.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'" @click="toggleStatus(kasir)">
                    <component :is="kasir.status === 'ACTIVE' ? UserXIcon : UserCheckIcon" :class="['w-3.5 h-3.5', kasir.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600']" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    :title="kasir.role === 'ADMIN' ? 'Reset Password' : 'Reset PIN'"
                    @click="kasir.role === 'ADMIN' ? confirmResetPassword(kasir) : confirmResetPin(kasir)"
                  >
                    <KeyIcon class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal (Username + PIN) -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCreateModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleCreate">
          <h2 class="text-base font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2"><UserPlusIcon class="w-5 h-5 text-violet-600 dark:text-violet-400" /> Tambah User Baru</h2>

          <!-- Role Selection (Super Admin only) -->
          <div v-if="authStore.isSuperAdmin">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <select v-model="createForm.role" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
              <option value="KASIR">Kasir</option>
              <option value="ADMIN">Admin Cabang</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" required minlength="2" placeholder="Nama kasir" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username <span class="text-red-500">*</span></label>
            <input v-model="createForm.username" type="text" required minlength="3" placeholder="username (untuk login)" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none font-mono" />
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Huruf kecil, angka, tanpa spasi. Digunakan kasir untuk login.</p>
          </div>

          <!-- PIN (untuk role KASIR) -->
          <div v-if="createForm.role === 'KASIR'">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIN Awal <span class="text-red-500">*</span></label>
            <input v-model="createForm.pin" type="text" :required="createForm.role === 'KASIR'" minlength="4" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="4-6 digit angka" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none font-mono tracking-widest text-center" />
            <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Kasir wajib ganti PIN saat login pertama kali.</p>
          </div>

          <!-- Password (untuk role ADMIN) -->
          <div v-if="createForm.role === 'ADMIN'">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password <span class="text-red-500">*</span></label>
            <input v-model="createForm.password" type="password" :required="createForm.role === 'ADMIN'" minlength="6" placeholder="Minimal 6 karakter" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Admin login pakai username + password. Wajib ganti password saat login pertama.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (opsional)</label>
            <input v-model="createForm.email" type="email" placeholder="kasir@email.com" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign ke Cabang</label>
            <select v-model="createForm.shopId" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
              <option value="">— Belum assign —</option>
              <option v-for="shop in shopsList" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
            </select>
          </div>

          <div v-if="createError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ createError }}</div>

          <div v-if="createResult" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-4 space-y-2">
            <p class="text-xs font-bold text-emerald-800 dark:text-emerald-200">{{ createForm.role === 'ADMIN' ? 'Admin Cabang' : 'Kasir' }} berhasil dibuat!</p>
            <div class="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 space-y-1">
              <p class="text-[10px] text-slate-500 dark:text-slate-400">Username</p>
              <p class="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{{ createResult.kasir.username }}</p>
            </div>
            <p class="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded px-2 py-1">
              <template v-if="createForm.role === 'KASIR'">
                Kasir login dengan username + PIN. PIN wajib diganti saat login pertama.
              </template>
              <template v-else>
                Admin login dengan username + password di halaman /admin/login. Password wajib diganti saat login pertama.
              </template>
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="closeCreateModal">{{ createResult ? 'Tutup' : 'Batal' }}</button>
            <button v-if="!createResult" type="submit" :disabled="creating" class="h-9 px-4 text-xs font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="creating" class="w-3.5 h-3.5 animate-spin" /> Buat Kasir
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Reset PIN Modal -->
    <Teleport to="body">
      <div v-if="showResetModal && resettingKasir" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showResetModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Reset PIN Kasir</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400">PIN untuk <strong class="text-slate-900 dark:text-slate-100">{{ resettingKasir.username ?? resettingKasir.email }}</strong> akan direset ke PIN baru acak.</p>
          <div v-if="resetError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ resetError }}</div>
          <div v-if="resetResult" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 space-y-2">
            <p class="text-xs font-bold text-emerald-800 dark:text-emerald-200">PIN berhasil direset!</p>
            <div class="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 text-center">
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1">PIN Baru</p>
              <p class="text-2xl font-mono font-bold text-violet-600 dark:text-violet-400 tracking-[0.3em]">{{ resetResult.tempPin }}</p>
            </div>
            <p class="text-[10px] text-amber-700 dark:text-amber-300">Berikan ke kasir. Wajib ganti PIN saat login berikutnya.</p>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showResetModal = false">{{ resetResult ? 'Tutup' : 'Batal' }}</button>
            <button v-if="!resetResult" type="button" :disabled="resetting" class="h-9 px-4 text-xs font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5" @click="handleResetPin">
              <Loader2Icon v-if="resetting" class="w-3.5 h-3.5 animate-spin" /> Reset PIN
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reset Password Modal (for ADMIN role) -->
    <Teleport to="body">
      <div v-if="showResetPwModal && resettingKasir" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showResetPwModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Reset Password Admin</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400">Password untuk <strong class="text-slate-900 dark:text-slate-100">{{ resettingKasir.username ?? resettingKasir.email }}</strong> akan direset ke password baru acak.</p>
          <div v-if="resetPwError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ resetPwError }}</div>
          <div v-if="resetPwResult" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 space-y-2">
            <p class="text-xs font-bold text-emerald-800 dark:text-emerald-200">Password berhasil direset!</p>
            <div class="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 text-center">
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Password Baru</p>
              <p class="text-lg font-mono font-bold text-violet-600 dark:text-violet-400 tracking-wider">{{ resetPwResult.tempPassword }}</p>
            </div>
            <p class="text-[10px] text-amber-700 dark:text-amber-300">Berikan ke admin. Wajib ganti password saat login berikutnya.</p>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showResetPwModal = false">{{ resetPwResult ? 'Tutup' : 'Batal' }}</button>
            <button v-if="!resetPwResult" type="button" :disabled="resettingPw" class="h-9 px-4 text-xs font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5" @click="handleResetPassword">
              <Loader2Icon v-if="resettingPw" class="w-3.5 h-3.5 animate-spin" /> Reset Password
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  UserPlus as UserPlusIcon, Users as UsersIcon, UserX as UserXIcon,
  UserCheck as UserCheckIcon, Key as KeyIcon, Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useToast } from '@/shared/composables/useToast';
import kasirService, {
  type KasirDto, type CreateKasirResponse, type ResetPinResponse, type UserStatus,
} from '@/shared/services/kasir.service';
import shopsService, { type ShopDto } from '@/shared/services/shops.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const toast = useToast();

const kasirList = ref<KasirDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const createResult = ref<CreateKasirResponse | null>(null);
const createForm = reactive({ name: '', username: '', pin: '', password: '', email: '', shopId: '', role: 'KASIR' });
const shopsList = ref<ShopDto[]>([]);

const showResetModal = ref(false);
const resettingKasir = ref<KasirDto | null>(null);
const resetting = ref(false);
const resetError = ref<string | null>(null);
const resetResult = ref<ResetPinResponse | null>(null);

// Reset Password (for ADMIN role)
const showResetPwModal = ref(false);
const resettingPw = ref(false);
const resetPwError = ref<string | null>(null);
const resetPwResult = ref<{ tempPassword: string } | null>(null);

async function fetchKasir() {
  loading.value = true; error.value = null;
  try {
    const response = await kasirService.list(shopStore.currentShopId || authStore.user?.shopId || undefined);
    kasirList.value = response.data;
  } catch (err: any) { error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat.'; }
  finally { loading.value = false; }
}

function openCreateModal() {
  createForm.name = ''; createForm.username = ''; createForm.pin = ''; createForm.password = '';
  createForm.email = ''; createForm.shopId = shopStore.currentShopId ?? authStore.user?.shopId ?? ''; createForm.role = 'KASIR';
  createError.value = null; createResult.value = null; showCreateModal.value = true;
  fetchShops();
}

async function fetchShops() {
  try { shopsList.value = await shopsService.list(); } catch { shopsList.value = []; }
}
function closeCreateModal() { showCreateModal.value = false; if (createResult.value) fetchKasir(); }

async function handleCreate() {
  // Validate based on role
  if (createForm.role === 'KASIR') {
    if (!/^\d{4,6}$/.test(createForm.pin)) {
      createError.value = 'PIN harus 4-6 digit angka.';
      return;
    }
  } else if (createForm.role === 'ADMIN') {
    if (!createForm.password || createForm.password.length < 6) {
      createError.value = 'Password minimal 6 karakter.';
      return;
    }
  }

  if (createForm.username.length < 3) {
    createError.value = 'Username minimal 3 karakter.';
    return;
  }

  creating.value = true; createError.value = null;
  try {
    createResult.value = await kasirService.create({
      name: createForm.name,
      username: createForm.username.toLowerCase().trim(),
      pin: createForm.role === 'KASIR' ? createForm.pin : undefined,
      password: createForm.role === 'ADMIN' ? createForm.password : undefined,
      email: createForm.email || undefined,
      shopId: createForm.shopId || undefined,
      role: authStore.isSuperAdmin ? createForm.role : 'KASIR',
    });
  } catch (err: any) { createError.value = err.response?.data?.message ?? err.message ?? 'Gagal membuat user.'; }
  finally { creating.value = false; }
}

async function toggleStatus(kasir: KasirDto) {
  const newStatus: UserStatus = kasir.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  try { await kasirService.update(kasir.id, { status: newStatus }); kasir.status = newStatus; }
  catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal update status.'); }
}

function confirmResetPin(kasir: KasirDto) {
  resettingKasir.value = kasir; resetError.value = null; resetResult.value = null; showResetModal.value = true;
}

async function handleResetPin() {
  if (!resettingKasir.value) return;
  resetting.value = true; resetError.value = null;
  try { resetResult.value = await kasirService.resetPin(resettingKasir.value.id); }
  catch (err: any) { resetError.value = err.response?.data?.message ?? err.message ?? 'Gagal reset PIN.'; }
  finally { resetting.value = false; }
}

function confirmResetPassword(kasir: KasirDto) {
  resettingKasir.value = kasir; resetPwError.value = null; resetPwResult.value = null; showResetPwModal.value = true;
}

async function handleResetPassword() {
  if (!resettingKasir.value) return;
  resettingPw.value = true; resetPwError.value = null;
  try { resetPwResult.value = await kasirService.resetPassword(resettingKasir.value.id); }
  catch (err: any) { resetPwError.value = err.response?.data?.message ?? err.message ?? 'Gagal reset password.'; }
  finally { resettingPw.value = false; }
}

function initials(text: string): string {
  const parts = text.split(/[@\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase().slice(0, 2);
}

/** Email is "real" if it exists and is not a legacy placeholder */
function hasRealEmail(email?: string | null): boolean {
  if (!email) return false;
  // Legacy placeholders from earlier code that auto-generated fake emails
  if (email.endsWith('@posify.local')) return false;
  return true;
}
function formatDateTime(iso: string): string { const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z'); return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

function roleBg(role: string): string {
  switch (role) { case 'SUPER_ADMIN': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'; case 'ADMIN': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'; default: return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'; }
}
function roleBadge(role: string): string {
  switch (role) { case 'SUPER_ADMIN': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'; case 'ADMIN': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'; case 'CASHIER_SUPERVISOR': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'; default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'; }
}
function roleLabel(role: string): string {
  switch (role) { case 'SUPER_ADMIN': return 'Super Admin'; case 'ADMIN': return 'Admin'; case 'CASHIER_SUPERVISOR': return 'Supervisor'; case 'KASIR': return 'Kasir'; default: return role; }
}
function statusBadge(status: UserStatus): string {
  switch (status) { case 'ACTIVE': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'; case 'INACTIVE': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'; case 'SUSPENDED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'; default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'; }
}

onMounted(fetchKasir);

useAutoRefresh(fetchKasir);
</script>
