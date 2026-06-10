<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Customer</h1>
        <p class="text-xs text-slate-500 mt-0.5">Kelola data pelanggan. Nama customer unik per cabang (anti-double).</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Total Customer</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ customers.length }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Aktif</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ activeCount }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nonaktif</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ customers.length - activeCount }}</p>
      </div>
    </div>

    <!-- Search + Add -->
    <div class="flex items-center justify-between gap-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari nama / HP..."
        class="flex-1 max-w-xs h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none"
        @input="handleSearch"
      />
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        @click="openModal(null)"
      >+ Tambah Customer</button>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
    <div v-else-if="customers.length === 0" class="text-center py-10 text-slate-400 text-sm">Belum ada customer.</div>
    <div v-else class="space-y-2">
      <div
        v-for="c in customers"
        :key="c.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        <div class="cursor-pointer" @click="$router.push(`/admin/customers/${c.id}`)">
          <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#00A19B] transition-colors">{{ c.name }}</p>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ c.phone || '-' }} &middot; {{ c.address || 'Alamat belum diisi' }}
          </p>
          <p v-if="c.notes" class="text-[10px] text-slate-400 mt-0.5 italic">{{ c.notes }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span :class="['text-[10px] font-bold uppercase px-2 py-0.5 rounded', c.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400']">
            {{ c.isActive ? 'Aktif' : 'Nonaktif' }}
          </span>
          <button @click="openModal(c)" class="text-xs text-blue-600 hover:underline">Edit</button>
          <button @click="confirmDelete(c)" class="text-xs text-red-500 hover:underline">Hapus</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Customer Modal (Create / Edit)               -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showModal = false">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{{ editing ? 'Edit Customer' : 'Tambah Customer' }}</h2>
          <form @submit.prevent="handleSave" class="space-y-3">
            <!-- Name with anti-double check -->
            <div>
              <input
                v-model="form.name"
                placeholder="Nama customer *"
                required
                class="w-full h-9 px-3 text-sm border rounded-lg focus:outline-none transition-colors"
                :class="nameStatus === 'duplicate'
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                  : nameStatus === 'available'
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
                    : 'border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'"
                @input="checkDuplicateName"
              />
              <p v-if="nameStatus === 'duplicate'" class="text-[11px] text-red-500 mt-1 font-medium">
                Nama "{{ form.name.trim() }}" sudah terdaftar di cabang ini.
              </p>
              <p v-else-if="nameStatus === 'checking'" class="text-[11px] text-slate-400 mt-1">
                Memeriksa...
              </p>
              <p v-else-if="nameStatus === 'available'" class="text-[11px] text-emerald-600 mt-1">
                Nama tersedia.
              </p>
            </div>
            <input v-model="form.phone" placeholder="No. HP" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" />
            <input v-model="form.address" placeholder="Alamat" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" />
            <textarea v-model="form.notes" placeholder="Catatan" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none resize-none"></textarea>
            <div v-if="editing" class="flex items-center gap-2">
              <input type="checkbox" id="isActive" v-model="form.isActive" class="rounded" />
              <label for="isActive" class="text-xs text-slate-600 dark:text-slate-400">Aktif</label>
            </div>
            <div v-if="saveError" class="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{{ saveError }}</div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showModal = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button>
              <button
                type="submit"
                :disabled="saving || nameStatus === 'duplicate'"
                class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation -->
    <teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDeleteConfirm = false">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p class="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Hapus customer <strong>"{{ deleteTarget?.name }}"</strong>?
          </p>
          <div class="flex justify-center gap-3">
            <button type="button" @click="showDeleteConfirm = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
            <button type="button" @click="handleDelete" :disabled="deleting" class="h-9 px-4 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
              {{ deleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/shared/services/api';
import { useShopStore } from '@/shared/stores/shop.store';

const shopStore = useShopStore();

interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// STATE
// ============================================

const customers = ref<Customer[]>([]);
const loading = ref(false);
const searchQuery = ref('');
let searchTimer: any = null;

const activeCount = computed(() => customers.value.filter((c) => c.isActive).length);

// Modal state
const showModal = ref(false);
const editing = ref<Customer | null>(null);
const form = ref({ name: '', phone: '', address: '', notes: '', isActive: true });
const saving = ref(false);
const saveError = ref('');

// Name check state
const nameStatus = ref<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
let nameCheckTimer: any = null;

// Delete state
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Customer | null>(null);
const deleting = ref(false);

// ============================================
// FETCH
// ============================================

async function fetchCustomers() {
  const shopId = shopStore.currentShopId;
  if (!shopId) return;
  loading.value = true;
  try {
    const params: any = { shopId, limit: 200 };
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    const { data } = await api.get('/customers', { params });
    customers.value = data.data;
  } catch (e: any) {
    console.error('Fetch customers error:', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchCustomers(), 300);
}

// ============================================
// DUPLICATE NAME CHECK (real-time)
// ============================================

function checkDuplicateName() {
  const name = form.value.name.trim();
  if (!name) {
    nameStatus.value = 'idle';
    return;
  }

  nameStatus.value = 'checking';
  clearTimeout(nameCheckTimer);
  nameCheckTimer = setTimeout(async () => {
    try {
      const shopId = shopStore.currentShopId;
      const excludeId = editing.value?.id || '';
      const { data } = await api.get('/customers/check-name', {
        params: { shopId, name, excludeId },
      });
      nameStatus.value = data.exists ? 'duplicate' : 'available';
    } catch {
      nameStatus.value = 'idle';
    }
  }, 400);
}

// ============================================
// MODAL
// ============================================

function openModal(customer: Customer | null) {
  editing.value = customer;
  if (customer) {
    form.value = {
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      isActive: customer.isActive,
    };
  } else {
    form.value = { name: '', phone: '', address: '', notes: '', isActive: true };
  }
  nameStatus.value = 'idle';
  saveError.value = '';
  showModal.value = true;
}

async function handleSave() {
  if (nameStatus.value === 'duplicate') return;

  const shopId = shopStore.currentShopId;
  if (!shopId) return;

  saving.value = true;
  saveError.value = '';

  try {
    if (editing.value) {
      await api.patch(`/customers/${editing.value.id}`, {
        name: form.value.name.trim(),
        phone: form.value.phone.trim() || undefined,
        address: form.value.address.trim() || undefined,
        notes: form.value.notes.trim() || undefined,
        isActive: form.value.isActive,
      });
    } else {
      await api.post('/customers', {
        shopId,
        name: form.value.name.trim(),
        phone: form.value.phone.trim() || undefined,
        address: form.value.address.trim() || undefined,
        notes: form.value.notes.trim() || undefined,
      });
    }
    showModal.value = false;
    await fetchCustomers();
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Gagal menyimpan.';
    saveError.value = msg;
  } finally {
    saving.value = false;
  }
}

// ============================================
// DELETE
// ============================================

function confirmDelete(customer: Customer) {
  deleteTarget.value = customer;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await api.delete(`/customers/${deleteTarget.value.id}`);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
    await fetchCustomers();
  } catch (e: any) {
    console.error('Delete error:', e);
  } finally {
    deleting.value = false;
  }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  fetchCustomers();
});
</script>
