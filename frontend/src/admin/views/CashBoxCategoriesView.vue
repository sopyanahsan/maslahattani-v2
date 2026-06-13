<template>
  <div class="space-y-4">
    <!-- Action bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            v-model="includeInactive"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            @change="loadCategories"
          />
          Tampilkan kategori non-aktif
        </label>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-center gap-2"
        @click="openCreateModal"
      >
        <component :is="PlusIcon" class="w-4 h-4" />
        Tambah Kategori
      </button>
    </div>

    <!-- Permission notice for non-superadmin -->
    <div
      v-if="!canEdit"
      class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2"
    >
      <component :is="InfoIcon" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <p class="text-xs text-blue-800 leading-relaxed">
        Kategori cashbox dikelola oleh super-admin. Anda hanya bisa melihat
        daftar.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-white border border-slate-200 rounded-2xl p-12 text-center"
    >
      <component :is="Loader2Icon" class="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
      <p class="text-xs text-slate-500 dark:text-[#869392]">Memuat kategori…</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="bg-white border border-slate-200 rounded-2xl p-6"
    >
      <div class="flex items-start gap-2 bg-red-50 border-l-4 border-red-500 rounded-md p-3">
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-semibold text-red-800">Gagal memuat data</p>
          <p class="text-xs text-red-700 mt-0.5">{{ loadError }}</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 h-9 px-4 bg-slate-100 text-slate-900 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
        @click="loadCategories"
      >
        Coba lagi
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="categories.length === 0"
      class="bg-white border border-slate-200 rounded-2xl p-12 text-center"
    >
      <component :is="WalletIcon" class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-900 dark:text-[#e3e2e2]">Belum ada kategori</p>
      <p class="text-xs text-slate-500 dark:text-[#869392] mt-1 max-w-sm mx-auto">
        Klik tombol "Tambah Kategori" untuk membuat kategori cashbox pertama.
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <!-- Desktop table -->
      <table class="hidden md:table w-full">
        <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
          <tr>
            <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Kategori
            </th>
            <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Code
            </th>
            <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Default
            </th>
            <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Status
            </th>
            <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Urutan
            </th>
            <th
              v-if="canEdit"
              class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="cat in categories"
            :key="cat.id"
            class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
                    colorBg(cat.color),
                  ]"
                >
                  <span :class="['text-sm font-bold', colorText(cat.color)]">
                    {{ initials(cat.name) }}
                  </span>
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900 truncate">
                    {{ cat.name }}
                  </p>
                  <p
                    v-if="cat.description"
                    class="text-[11px] text-slate-500 truncate max-w-md"
                  >
                    {{ cat.description }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <code class="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {{ cat.code }}
              </code>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                v-if="cat.isDefault"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide"
              >
                <component :is="CheckIcon" class="w-3 h-3" />
                Default
              </span>
              <span v-else class="text-slate-300">—</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                  cat.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600',
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    cat.isActive ? 'bg-emerald-500' : 'bg-slate-400',
                  ]"
                ></span>
                {{ cat.isActive ? 'Aktif' : 'Non-aktif' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center text-xs font-mono text-slate-600">
              {{ cat.sortOrder }}
            </td>
            <td v-if="canEdit" class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit"
                  @click="openEditModal(cat)"
                >
                  <component :is="EditIcon" class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  :disabled="cat.isDefault"
                  class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  :title="cat.isDefault ? 'Default tidak bisa dihapus' : 'Hapus'"
                  @click="openDeleteDialog(cat)"
                >
                  <component :is="TrashIcon" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile cards -->
      <div class="md:hidden divide-y divide-slate-100">
        <div v-for="cat in categories" :key="cat.id" class="p-4">
          <div class="flex items-start gap-3 mb-3">
            <span
              :class="[
                'inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                colorBg(cat.color),
              ]"
            >
              <span :class="['text-sm font-bold', colorText(cat.color)]">
                {{ initials(cat.name) }}
              </span>
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <p class="text-sm font-semibold text-slate-900 dark:text-[#e3e2e2]">{{ cat.name }}</p>
                <span
                  v-if="cat.isDefault"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wide"
                >
                  Default
                </span>
                <span
                  :class="[
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                    cat.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600',
                  ]"
                >
                  {{ cat.isActive ? 'Aktif' : 'Non' }}
                </span>
              </div>
              <code class="text-[11px] font-mono text-slate-500 dark:text-[#869392]">{{ cat.code }}</code>
              <p
                v-if="cat.description"
                class="text-[11px] text-slate-500 mt-0.5"
              >
                {{ cat.description }}
              </p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center gap-2">
            <button
              type="button"
              class="flex-1 h-9 px-3 bg-slate-100 text-slate-900 text-xs font-semibold rounded-md hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              @click="openEditModal(cat)"
            >
              <component :is="EditIcon" class="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              :disabled="cat.isDefault"
              class="h-9 px-3 bg-red-50 text-red-700 text-xs font-semibold rounded-md hover:bg-red-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
              @click="openDeleteDialog(cat)"
            >
              <component :is="TrashIcon" class="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CashBoxCategoryFormModal
      v-if="showFormModal"
      :category="editingCategory"
      :loading="formLoading"
      :error-message="formError"
      @submit="handleFormSubmit"
      @cancel="closeFormModal"
    />

    <CashBoxCategoryDeleteDialog
      v-if="deletingCategory"
      :category="deletingCategory"
      :loading="deleteLoading"
      :error-message="deleteError"
      @confirm="handleDelete"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  Plus as PlusIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  Wallet as WalletIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import cashBoxCategoryService, {
  type CashBoxCategoryDto,
  type CreateCashBoxCategoryPayload,
  type UpdateCashBoxCategoryPayload,
} from '@/shared/services/cashbox-category.service';
import CashBoxCategoryFormModal from '@/admin/components/cashbox/CashBoxCategoryFormModal.vue';
import CashBoxCategoryDeleteDialog from '@/admin/components/cashbox/CashBoxCategoryDeleteDialog.vue';

const authStore = useAuthStore();

const canEdit = computed(() => authStore.isSuperAdmin);

const categories = ref<CashBoxCategoryDto[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const includeInactive = ref(false);

const showFormModal = ref(false);
const editingCategory = ref<CashBoxCategoryDto | null>(null);
const formLoading = ref(false);
const formError = ref<string | null>(null);

const deletingCategory = ref<CashBoxCategoryDto | null>(null);
const deleteLoading = ref(false);
const deleteError = ref<string | null>(null);

async function loadCategories() {
  loading.value = true;
  loadError.value = null;
  try {
    const response = await cashBoxCategoryService.list(includeInactive.value);
    categories.value = response.data;
  } catch (err: any) {
    loadError.value =
      err?.response?.data?.message ??
      err?.message ??
      'Gagal memuat kategori cashbox.';
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  editingCategory.value = null;
  formError.value = null;
  showFormModal.value = true;
}

function openEditModal(cat: CashBoxCategoryDto) {
  editingCategory.value = cat;
  formError.value = null;
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
  editingCategory.value = null;
  formError.value = null;
}

async function handleFormSubmit(
  payload: CreateCashBoxCategoryPayload | UpdateCashBoxCategoryPayload,
) {
  formLoading.value = true;
  formError.value = null;
  try {
    if (editingCategory.value) {
      await cashBoxCategoryService.update(
        editingCategory.value.id,
        payload as UpdateCashBoxCategoryPayload,
      );
    } else {
      await cashBoxCategoryService.create(
        payload as CreateCashBoxCategoryPayload,
      );
    }
    closeFormModal();
    await loadCategories();
  } catch (err: any) {
    formError.value =
      err?.response?.data?.message ??
      err?.message ??
      'Gagal menyimpan kategori.';
  } finally {
    formLoading.value = false;
  }
}

function openDeleteDialog(cat: CashBoxCategoryDto) {
  deletingCategory.value = cat;
  deleteError.value = null;
}

function closeDeleteDialog() {
  deletingCategory.value = null;
  deleteError.value = null;
}

async function handleDelete() {
  if (!deletingCategory.value) return;
  deleteLoading.value = true;
  deleteError.value = null;
  try {
    await cashBoxCategoryService.remove(deletingCategory.value.id);
    closeDeleteDialog();
    await loadCategories();
  } catch (err: any) {
    deleteError.value =
      err?.response?.data?.message ??
      err?.message ??
      'Gagal menghapus kategori.';
  } finally {
    deleteLoading.value = false;
  }
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2);
}

function colorBg(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'bg-amber-100 border border-amber-200';
    case 'emerald':
    case 'green':
      return 'bg-emerald-100 border border-emerald-200';
    case 'red':
      return 'bg-red-100 border border-red-200';
    case 'purple':
      return 'bg-purple-100 border border-purple-200';
    case 'pink':
      return 'bg-pink-100 border border-pink-200';
    case 'indigo':
      return 'bg-indigo-100 border border-indigo-200';
    case 'orange':
      return 'bg-orange-100 border border-orange-200';
    case 'blue':
    default:
      return 'bg-blue-100 border border-blue-200';
  }
}

function colorText(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'text-amber-700';
    case 'emerald':
    case 'green':
      return 'text-emerald-700';
    case 'red':
      return 'text-red-700';
    case 'purple':
      return 'text-purple-700';
    case 'pink':
      return 'text-pink-700';
    case 'indigo':
      return 'text-indigo-700';
    case 'orange':
      return 'text-orange-700';
    case 'blue':
    default:
      return 'text-blue-700';
  }
}

onMounted(loadCategories);
</script>
