<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Manajemen Kasir</h1>
        <p class="text-xs text-slate-500 mt-0.5">Buat akun kasir, assign ke cabang, reset password, nonaktifkan.</p>
      </div>
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0" @click="openCreateModal">
        <UserPlusIcon class="w-4 h-4" /> Tambah Kasir
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat daftar kasir...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <div v-else-if="kasirList.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <UsersIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada kasir terdaftar</p>
      <p class="text-xs text-slate-500 mt-1">Buat akun kasir pertama lewat tombol di atas.</p>
    </div>

    <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[650px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Kasir</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Email</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">Last Login</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="kasir in kasirList" :key="kasir.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                    {{ initials(kasir.username || kasir.email) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-900">{{ kasir.username ?? '—' }}</p>
                    <p class="text-[10px] text-slate-500">Bergabung {{ formatDate(kasir.createdAt) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ kasir.email }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(kasir.status)]">{{ kasir.status }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 font-mono">{{ kasir.lastLogin ? formatDateTime(kasir.lastLogin) : 'Belum login' }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors" :title="kasir.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'" @click="toggleStatus(kasir)">
                    <component :is="kasir.status === 'ACTIVE' ? UserXIcon : UserCheckIcon" :class="['w-3.5 h-3.5', kasir.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600']" />
                  </button>
                  <button class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors" title="Reset Password" @click="confirmResetPassword(kasir)">
                    <KeyIcon class="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCreateModal = false"></div>
        <form class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleCreate">
          <h2 class="text-base font-bold text-slate-950 flex items-center gap-2"><UserPlusIcon class="w-5 h-5 text-blue-600" /> Tambah Kasir Baru</h2>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email (Gmail) <span class="text-red-500">*</span></label>
            <input v-model="createForm.email" type="email" required placeholder="kasir.baru@gmail.com" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Assign ke Cabang</label>
            <input v-model="createForm.shopId" type="text" placeholder="Shop ID (opsional)" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            <p class="text-[10px] text-slate-400 mt-1">Kosongkan jika belum ingin assign.</p>
          </div>
          <div v-if="createError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ createError }}</div>
          <div v-if="createResult" class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <p class="text-xs font-bold text-emerald-800">Kasir berhasil dibuat!</p>
            <div class="bg-white border border-emerald-200 rounded-md px-3 py-2 space-y-1">
              <p class="text-[10px] text-slate-500">Username</p>
              <p class="text-sm font-mono font-semibold text-slate-900">{{ createResult.kasir.username }}</p>
            </div>
            <div class="bg-white border border-emerald-200 rounded-md px-3 py-2 space-y-1">
              <p class="text-[10px] text-slate-500">Password Sementara</p>
              <p class="text-sm font-mono font-bold text-red-600">{{ createResult.tempPassword }}</p>
            </div>
            <p class="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">Catat password di atas! Kasir harus ganti password saat login pertama.</p>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="closeCreateModal">{{ createResult ? 'Tutup' : 'Batal' }}</button>
            <button v-if="!createResult" type="submit" :disabled="creating" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="creating" class="w-3.5 h-3.5 animate-spin" /> Buat Kasir
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Reset Password Modal -->
    <Teleport to="body">
      <div v-if="showResetModal && resettingKasir" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showResetModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900">Reset Password Kasir</h3>
          <p class="text-xs text-slate-600">Password untuk <strong>{{ resettingKasir.username ?? resettingKasir.email }}</strong> akan direset. Semua session aktif akan dihapus.</p>
          <div v-if="resetError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ resetError }}</div>
          <div v-if="resetResult" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-bold text-emerald-800">Password berhasil direset!</p>
            <p class="text-sm font-mono font-bold text-red-600">{{ resetResult.tempPassword }}</p>
            <p class="text-[10px] text-amber-700">Berikan ke kasir. Harus diganti saat login.</p>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showResetModal = false">{{ resetResult ? 'Tutup' : 'Batal' }}</button>
            <button v-if="!resetResult" type="button" :disabled="resetting" class="h-9 px-4 text-xs font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5" @click="handleResetPassword">
              <Loader2Icon v-if="resetting" class="w-3.5 h-3.5 animate-spin" /> Reset Password
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  UserPlus as UserPlusIcon, Users as UsersIcon, UserX as UserXIcon,
  UserCheck as UserCheckIcon, Key as KeyIcon, Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import kasirService, {
  type KasirDto, type CreateKasirResponse, type ResetPasswordResponse, type UserStatus,
} from '@/shared/services/kasir.service';

const authStore = useAuthStore();

const kasirList = ref<KasirDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const createResult = ref<CreateKasirResponse | null>(null);
const createForm = reactive({ email: '', shopId: '' });

const showResetModal = ref(false);
const resettingKasir = ref<KasirDto | null>(null);
const resetting = ref(false);
const resetError = ref<string | null>(null);
const resetResult = ref<ResetPasswordResponse | null>(null);

async function fetchKasir() {
  loading.value = true; error.value = null;
  try {
    const response = await kasirService.list(authStore.user?.shopId || undefined);
    kasirList.value = response.data;
  } catch (err: any) { error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat daftar kasir.'; }
  finally { loading.value = false; }
}

function openCreateModal() {
  createForm.email = ''; createForm.shopId = authStore.user?.shopId ?? '';
  createError.value = null; createResult.value = null; showCreateModal.value = true;
}
function closeCreateModal() { showCreateModal.value = false; if (createResult.value) fetchKasir(); }

async function handleCreate() {
  creating.value = true; createError.value = null;
  try { createResult.value = await kasirService.create({ email: createForm.email, shopId: createForm.shopId || undefined }); }
  catch (err: any) { createError.value = err.response?.data?.message ?? err.message ?? 'Gagal membuat kasir.'; }
  finally { creating.value = false; }
}

async function toggleStatus(kasir: KasirDto) {
  const newStatus: UserStatus = kasir.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  try { await kasirService.update(kasir.id, { status: newStatus }); kasir.status = newStatus; }
  catch (err: any) { alert(err.response?.data?.message ?? 'Gagal update status.'); }
}

function confirmResetPassword(kasir: KasirDto) {
  resettingKasir.value = kasir; resetError.value = null; resetResult.value = null; showResetModal.value = true;
}

async function handleResetPassword() {
  if (!resettingKasir.value) return;
  resetting.value = true; resetError.value = null;
  try { resetResult.value = await kasirService.resetPassword(resettingKasir.value.id); }
  catch (err: any) { resetError.value = err.response?.data?.message ?? err.message ?? 'Gagal reset password.'; }
  finally { resetting.value = false; }
}

function initials(text: string): string {
  const parts = text.split(/[@\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase().slice(0, 2);
}
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function statusBadge(status: UserStatus): string {
  switch (status) { case 'ACTIVE': return 'bg-emerald-100 text-emerald-700'; case 'INACTIVE': return 'bg-slate-100 text-slate-600'; case 'SUSPENDED': return 'bg-red-100 text-red-700'; default: return 'bg-slate-100 text-slate-600'; }
}

onMounted(fetchKasir);
</script>
