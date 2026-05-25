<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Manajemen Kasir</h1>
        <p class="text-sm text-slate-500 mt-0.5">Kelola akun kasir, assign cabang, dan atur akses</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <component :is="UserPlusIcon" class="w-4 h-4" />
        Tambah Kasir
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <component :is="SearchIcon" class="w-4 h-4 text-slate-400" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama, email, atau username..."
            class="input-field pl-10"
          />
        </div>
        <select v-model="filterStatus" class="input-field sm:w-40">
          <option value="all">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select v-model="filterShop" class="input-field sm:w-40">
          <option value="all">Semua Cabang</option>
          <option value="main">Cabang Utama</option>
          <option value="branch-1">Cabang 1</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Kasir</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Username</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden lg:table-cell">Cabang</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden lg:table-cell">Login Terakhir</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="kasir in filteredKasirList"
              :key="kasir.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- Name & Email -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="kasir.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ getInitials(kasir.name) }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">{{ kasir.name }}</p>
                    <p class="text-xs text-slate-500">{{ kasir.email }}</p>
                  </div>
                </div>
              </td>
              <!-- Username -->
              <td class="px-5 py-3.5 hidden md:table-cell">
                <span class="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {{ kasir.username }}
                </span>
              </td>
              <!-- Cabang -->
              <td class="px-5 py-3.5 hidden lg:table-cell">
                <span class="text-slate-700">{{ kasir.shop }}</span>
              </td>
              <!-- Status -->
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  :class="getStatusBadgeClass(kasir.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(kasir.status)"></span>
                  {{ getStatusLabel(kasir.status) }}
                </span>
              </td>
              <!-- Last Login -->
              <td class="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                {{ kasir.lastLogin || 'Belum pernah' }}
              </td>
              <!-- Actions -->
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="toggleStatus(kasir)"
                    class="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    :title="kasir.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'"
                  >
                    <component
                      :is="kasir.status === 'ACTIVE' ? UserXIcon : UserCheckIcon"
                      class="w-4 h-4"
                      :class="kasir.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'"
                    />
                  </button>
                  <button
                    @click="resetPassword(kasir)"
                    class="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    title="Reset Password"
                  >
                    <component :is="KeyRoundIcon" class="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    @click="openEditModal(kasir)"
                    class="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <component :is="PencilIcon" class="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredKasirList.length === 0" class="p-10 text-center">
        <component :is="UsersIcon" class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-medium text-slate-600">Tidak ada kasir ditemukan</p>
        <p class="text-xs text-slate-400 mt-1">Coba ubah filter atau tambah kasir baru</p>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
        <p class="text-xs text-slate-500">
          Menampilkan <span class="font-medium">{{ filteredKasirList.length }}</span> dari <span class="font-medium">{{ kasirList.length }}</span> kasir
        </p>
        <div class="flex items-center gap-1">
          <button class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50" disabled>
            Prev
          </button>
          <button class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md">
            1
          </button>
          <button class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="closeModal" />

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-900">
              {{ editingKasir ? 'Edit Kasir' : 'Tambah Kasir Baru' }}
            </h3>
            <button @click="closeModal" class="p-1 rounded-md hover:bg-slate-100 text-slate-400">
              <component :is="XIcon" class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitKasir" class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Email Gmail</label>
              <input
                v-model="modalForm.email"
                type="email"
                placeholder="kasir@gmail.com"
                class="input-field"
                :disabled="!!editingKasir"
                required
              />
            </div>

            <!-- Username (auto-suggested) -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">
                Username
                <span class="text-slate-400 font-normal">(auto-suggestion)</span>
              </label>
              <input
                v-model="modalForm.username"
                type="text"
                placeholder="Auto-generated dari email"
                class="input-field font-mono"
              />
              <p class="mt-1 text-xs text-slate-500">
                Suggestion: <button type="button" @click="modalForm.username = suggestedUsername" class="text-blue-600 hover:underline">{{ suggestedUsername }}</button>
              </p>
            </div>

            <!-- Cabang -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Assign ke Cabang</label>
              <select v-model="modalForm.shopId" class="input-field" required>
                <option value="">Pilih cabang...</option>
                <option value="main">Cabang Utama</option>
                <option value="branch-1">Cabang 1</option>
              </select>
            </div>

            <!-- Role (only for edit) -->
            <div v-if="editingKasir">
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Role</label>
              <select v-model="modalForm.role" class="input-field">
                <option value="KASIR">Kasir</option>
                <option value="CASHIER_SUPERVISOR">Cashier Supervisor</option>
              </select>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <component v-if="isSubmitting" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
                {{ editingKasir ? 'Simpan Perubahan' : 'Buat Kasir' }}
              </button>
              <button
                type="button"
                @click="closeModal"
                class="h-10 px-4 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Reset Password Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showResetModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showResetModal = false" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 z-10 text-center">
          <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <component :is="KeyRoundIcon" class="w-6 h-6 text-amber-600" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Reset Password?</h3>
          <p class="text-sm text-slate-600 mb-5">
            Password <span class="font-semibold">{{ resetTarget?.name }}</span> akan di-reset. Password baru akan digenerate otomatis.
          </p>
          <div v-if="tempPassword" class="bg-slate-100 rounded-lg p-3 mb-5">
            <p class="text-xs text-slate-500 mb-1">Password sementara:</p>
            <p class="text-lg font-mono font-bold text-slate-900">{{ tempPassword }}</p>
          </div>
          <div class="flex gap-3">
            <button
              v-if="!tempPassword"
              @click="confirmResetPassword"
              :disabled="isSubmitting"
              class="flex-1 h-10 px-4 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <component v-if="isSubmitting" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
              Ya, Reset
            </button>
            <button
              @click="showResetModal = false; tempPassword = ''"
              class="flex-1 h-10 px-4 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              {{ tempPassword ? 'Tutup' : 'Batal' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  UserPlus as UserPlusIcon,
  Search as SearchIcon,
  Users as UsersIcon,
  UserX as UserXIcon,
  UserCheck as UserCheckIcon,
  KeyRound as KeyRoundIcon,
  Pencil as PencilIcon,
  X as XIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';

interface Kasir {
  id: string;
  name: string;
  email: string;
  username: string;
  shop: string;
  shopId: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin: string;
}

// Search & Filters
const searchQuery = ref('');
const filterStatus = ref('all');
const filterShop = ref('all');

// Modal
const showModal = ref(false);
const editingKasir = ref<Kasir | null>(null);
const isSubmitting = ref(false);

const modalForm = reactive({
  email: '',
  username: '',
  shopId: '',
  role: 'KASIR',
});

// Reset Password Modal
const showResetModal = ref(false);
const resetTarget = ref<Kasir | null>(null);
const tempPassword = ref('');

// Dummy kasir data
const kasirList = ref<Kasir[]>([
  { id: '1', name: 'Rina Sari', email: 'rina@gmail.com', username: 'rina.kasir', shop: 'Cabang Utama', shopId: 'main', role: 'KASIR', status: 'ACTIVE', lastLogin: '25 Mei 2026, 14:30' },
  { id: '2', name: 'Budi Santoso', email: 'budi@gmail.com', username: 'budi.kasir', shop: 'Cabang Utama', shopId: 'main', role: 'KASIR', status: 'ACTIVE', lastLogin: '25 Mei 2026, 08:15' },
  { id: '3', name: 'Dewi Lestari', email: 'dewi@gmail.com', username: 'dewi.kasir', shop: 'Cabang 1', shopId: 'branch-1', role: 'KASIR', status: 'INACTIVE', lastLogin: '20 Mei 2026, 16:00' },
  { id: '4', name: 'Ahmad Fauzi', email: 'ahmad@gmail.com', username: 'ahmad.kasir', shop: 'Cabang 1', shopId: 'branch-1', role: 'CASHIER_SUPERVISOR', status: 'ACTIVE', lastLogin: '24 Mei 2026, 12:45' },
  { id: '5', name: 'Siti Nurhaliza', email: 'siti@gmail.com', username: 'siti.kasir', shop: 'Cabang Utama', shopId: 'main', role: 'KASIR', status: 'SUSPENDED', lastLogin: '15 Mei 2026, 09:00' },
]);

// Computed
const suggestedUsername = computed(() => {
  if (!modalForm.email) return 'username';
  const prefix = modalForm.email.split('@')[0];
  return `${prefix}.kasir`;
});

const filteredKasirList = computed(() => {
  return kasirList.value.filter((k) => {
    const matchSearch =
      !searchQuery.value ||
      k.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      k.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      k.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchStatus = filterStatus.value === 'all' || k.status === filterStatus.value;
    const matchShop = filterShop.value === 'all' || k.shopId === filterShop.value;

    return matchSearch && matchStatus && matchShop;
  });
});

// Helpers
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-50 text-emerald-700';
    case 'INACTIVE': return 'bg-slate-100 text-slate-600';
    case 'SUSPENDED': return 'bg-red-50 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function getStatusDotClass(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500';
    case 'INACTIVE': return 'bg-slate-400';
    case 'SUSPENDED': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Aktif';
    case 'INACTIVE': return 'Nonaktif';
    case 'SUSPENDED': return 'Suspended';
    default: return status;
  }
}

// Actions
function openCreateModal() {
  editingKasir.value = null;
  modalForm.email = '';
  modalForm.username = '';
  modalForm.shopId = '';
  modalForm.role = 'KASIR';
  showModal.value = true;
}

function openEditModal(kasir: Kasir) {
  editingKasir.value = kasir;
  modalForm.email = kasir.email;
  modalForm.username = kasir.username;
  modalForm.shopId = kasir.shopId;
  modalForm.role = kasir.role;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingKasir.value = null;
}

async function handleSubmitKasir() {
  isSubmitting.value = true;

  // Simulate API call
  await new Promise((r) => setTimeout(r, 1000));

  if (editingKasir.value) {
    // Update existing kasir
    const idx = kasirList.value.findIndex((k) => k.id === editingKasir.value!.id);
    if (idx !== -1) {
      kasirList.value[idx].username = modalForm.username;
      kasirList.value[idx].shopId = modalForm.shopId;
      kasirList.value[idx].shop = modalForm.shopId === 'main' ? 'Cabang Utama' : 'Cabang 1';
      kasirList.value[idx].role = modalForm.role;
    }
  } else {
    // Create new kasir
    const newKasir: Kasir = {
      id: String(Date.now()),
      name: modalForm.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: modalForm.email,
      username: modalForm.username || suggestedUsername.value,
      shop: modalForm.shopId === 'main' ? 'Cabang Utama' : 'Cabang 1',
      shopId: modalForm.shopId,
      role: 'KASIR',
      status: 'ACTIVE',
      lastLogin: '',
    };
    kasirList.value.unshift(newKasir);
  }

  isSubmitting.value = false;
  closeModal();
}

function toggleStatus(kasir: Kasir) {
  const idx = kasirList.value.findIndex((k) => k.id === kasir.id);
  if (idx !== -1) {
    kasirList.value[idx].status = kasir.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
}

function resetPassword(kasir: Kasir) {
  resetTarget.value = kasir;
  tempPassword.value = '';
  showResetModal.value = true;
}

async function confirmResetPassword() {
  isSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 1000));
  // Simulate generated password
  tempPassword.value = Math.random().toString(36).slice(-8).toUpperCase();
  isSubmitting.value = false;
}
</script>
