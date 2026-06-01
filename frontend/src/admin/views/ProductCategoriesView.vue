<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div></div>
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0" @click="openCreate">
        <PlusIcon class="w-4 h-4" /> Tambah Kategori
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <!-- Empty -->
    <div v-else-if="categories.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
      <TagIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada kategori</p>
      <p class="text-xs text-slate-500 mt-1">Buat kategori pertama untuk mengelompokkan produk.</p>
    </div>

    <!-- List -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="cat in categories" :key="cat.id" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-lg">
            {{ cat.icon || '📦' }}
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ cat.name }}</p>
            <p class="text-[10px] text-slate-500">{{ cat._count?.products || 0 }} produk</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800" @click="openEdit(cat)">
            <Edit3Icon class="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20" @click="handleDelete(cat)">
            <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleSubmit">
          <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">{{ editing ? 'Edit Kategori' : 'Tambah Kategori' }}</h2>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kategori *</label>
            <input v-model="form.name" type="text" required placeholder="Makanan, Minuman, dll" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Icon (emoji)</label>
            <input v-model="form.icon" type="text" placeholder="🍔 🥤 🧴" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none" />
          </div>
          <div v-if="formError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ formError }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showModal = false">Batal</button>
            <button type="submit" :disabled="submitting" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {{ submitting ? 'Menyimpan...' : (editing ? 'Simpan' : 'Buat') }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { Plus as PlusIcon, Tag as TagIcon, Edit3 as Edit3Icon, Trash2 as Trash2Icon, Loader2 as Loader2Icon } from 'lucide-vue-next';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import api from '@/shared/services/api';

const { ask } = useConfirm();
const toast = useToast();

const loading = ref(false);
const categories = ref<any[]>([]);
const showModal = ref(false);
const editing = ref<string | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);
const form = reactive({ name: '', icon: '' });

async function fetchCategories() {
  loading.value = true;
  try {
    const { data } = await api.get('/product-categories');
    categories.value = data.data || [];
  } catch { categories.value = []; }
  finally { loading.value = false; }
}

function openCreate() {
  editing.value = null;
  form.name = ''; form.icon = '';
  formError.value = null;
  showModal.value = true;
}

function openEdit(cat: any) {
  editing.value = cat.id;
  form.name = cat.name; form.icon = cat.icon || '';
  formError.value = null;
  showModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim()) { formError.value = 'Nama kategori wajib diisi.'; return; }
  submitting.value = true; formError.value = null;
  try {
    if (editing.value) {
      await api.put(`/product-categories/${editing.value}`, { name: form.name, icon: form.icon || null });
    } else {
      await api.post('/product-categories', { name: form.name, icon: form.icon || null });
    }
    showModal.value = false;
    await fetchCategories();
  } catch (err: any) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan.';
  } finally { submitting.value = false; }
}

async function handleDelete(cat: any) {
  const confirmed = await ask({ title: 'Hapus Kategori?', message: `Hapus kategori "${cat.name}"? Produk yang terkait akan menjadi tanpa kategori.`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!confirmed) return;
  try {
    await api.delete(`/product-categories/${cat.id}`);
    await fetchCategories();
  } catch (err: any) { toast.error(err.response?.data?.message || 'Gagal menghapus.'); }
}

onMounted(fetchCategories);

useAutoRefresh(fetchCategories);
</script>
