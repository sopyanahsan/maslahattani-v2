<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-base font-bold text-slate-950">
            {{ isEdit ? 'Edit Kategori' : 'Kategori Baru' }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            {{
              isEdit
                ? 'Code tidak bisa diubah. Field lain bebas diubah.'
                : 'Tambah kategori cashbox baru (mis. SUBSIDI_PUPUK).'
            }}
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 -mr-2 p-2 rounded-md hover:bg-slate-100"
          @click="$emit('cancel')"
        >
          <component :is="XIcon" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <form
        class="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Submit error -->
        <div
          v-if="errorMessage"
          class="bg-red-50 border-l-4 border-red-500 rounded-md p-3 flex items-start gap-2"
        >
          <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p class="text-xs text-red-800">{{ errorMessage }}</p>
        </div>

        <!-- Code -->
        <div>
          <label for="cat-code" class="block text-xs font-semibold text-slate-900 mb-1.5">
            Code <span class="text-red-500">*</span>
          </label>
          <input
            id="cat-code"
            v-model="form.code"
            type="text"
            placeholder="SUBSIDI_PUPUK"
            required
            :disabled="loading || isEdit"
            class="input-field font-mono uppercase"
            :class="{
              '!bg-slate-50 cursor-not-allowed': isEdit,
              '!border-red-500 !ring-2 !ring-red-100': fieldErrors.code,
            }"
            @input="onCodeInput"
            @blur="validateCode"
          />
          <p v-if="fieldErrors.code" class="mt-1 text-xs text-red-600">
            {{ fieldErrors.code }}
          </p>
          <p v-else class="mt-1 text-xs text-slate-500">
            UPPERCASE_SNAKE_CASE. Tidak bisa diubah setelah dibuat.
          </p>
        </div>

        <!-- Name -->
        <div>
          <label for="cat-name" class="block text-xs font-semibold text-slate-900 mb-1.5">
            Nama <span class="text-red-500">*</span>
          </label>
          <input
            id="cat-name"
            v-model="form.name"
            type="text"
            placeholder="Kas Subsidi Pupuk"
            required
            maxlength="100"
            :disabled="loading"
            class="input-field"
            :class="{ '!border-red-500 !ring-2 !ring-red-100': fieldErrors.name }"
          />
          <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">
            {{ fieldErrors.name }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label for="cat-desc" class="block text-xs font-semibold text-slate-900 mb-1.5">
            Deskripsi <span class="text-slate-400">(opsional)</span>
          </label>
          <textarea
            id="cat-desc"
            v-model="form.description"
            rows="2"
            placeholder="Penjualan pupuk subsidi pemerintah, terpisah dari kas retail."
            maxlength="500"
            :disabled="loading"
            class="input-field resize-none"
          ></textarea>
        </div>

        <!-- Color -->
        <div>
          <label class="block text-xs font-semibold text-slate-900 mb-1.5">
            Warna Badge
          </label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="color in COLOR_OPTIONS"
              :key="color"
              type="button"
              :disabled="loading"
              :class="[
                'h-8 rounded-md border-2 transition-all flex items-center justify-center',
                colorBg(color),
                form.color === color
                  ? 'ring-2 ring-offset-1 ring-slate-900 scale-110'
                  : 'hover:scale-105',
              ]"
              :title="color"
              @click="form.color = color"
            >
              <span :class="['text-xs font-bold', colorText(color)]">A</span>
            </button>
          </div>
        </div>

        <!-- Icon -->
        <div>
          <label class="block text-xs font-semibold text-slate-900 mb-1.5">
            Icon (Lucide)
          </label>
          <input
            v-model="form.icon"
            type="text"
            placeholder="shopping-cart"
            maxlength="50"
            :disabled="loading"
            class="input-field font-mono text-sm"
          />
          <p class="mt-1 text-xs text-slate-500">
            Nama icon dari
            <a
              href="https://lucide.dev/icons"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:underline"
              >lucide.dev/icons</a
            >
            (kebab-case). Mis: shopping-cart, wheat, fuel, banknote.
          </p>
        </div>

        <!-- Sort order -->
        <div>
          <label for="cat-sort" class="block text-xs font-semibold text-slate-900 mb-1.5">
            Urutan
          </label>
          <input
            id="cat-sort"
            v-model.number="form.sortOrder"
            type="number"
            min="0"
            :disabled="loading"
            class="input-field font-mono w-32"
          />
          <p class="mt-1 text-xs text-slate-500">
            Angka kecil tampil duluan di UI buka shift.
          </p>
        </div>

        <!-- Toggles -->
        <div class="space-y-2 pt-2 border-t border-slate-200">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              v-model="form.isDefault"
              type="checkbox"
              :disabled="loading"
              class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900">Jadikan Default</p>
              <p class="text-[11px] text-slate-500">
                Kategori default dipakai untuk produk yang belum di-tag. Hanya
                boleh ada 1 default — sistem auto-unset default lainnya.
              </p>
            </div>
          </label>

          <label class="flex items-start gap-3 cursor-pointer">
            <input
              v-model="form.isActive"
              type="checkbox"
              :disabled="loading"
              class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900">Aktif</p>
              <p class="text-[11px] text-slate-500">
                Hanya kategori aktif yang muncul di form buka shift kasir.
              </p>
            </div>
          </label>
        </div>
      </form>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          :disabled="loading"
          class="h-10 px-4 bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          @click="$emit('cancel')"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="loading || !canSubmit"
          class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="handleSubmit"
        >
          <component v-if="loading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Buat Kategori' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  X as XIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import type {
  CashBoxCategoryDto,
  CreateCashBoxCategoryPayload,
  UpdateCashBoxCategoryPayload,
} from '@/shared/services/cashbox-category.service';

interface Props {
  /** Pass kategori existing untuk mode edit. Null = create mode. */
  category?: CashBoxCategoryDto | null;
  loading?: boolean;
  errorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'submit', payload: CreateCashBoxCategoryPayload | UpdateCashBoxCategoryPayload): void;
  (e: 'cancel'): void;
}>();

const isEdit = computed(() => !!props.category);

const COLOR_OPTIONS = [
  'blue',
  'emerald',
  'amber',
  'red',
  'purple',
  'pink',
  'indigo',
  'orange',
];

const form = reactive<{
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}>({
  code: '',
  name: '',
  description: '',
  color: 'blue',
  icon: '',
  isDefault: false,
  isActive: true,
  sortOrder: 0,
});

const fieldErrors = reactive<{ code: string; name: string }>({
  code: '',
  name: '',
});

// Hydrate form kalau edit mode
watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.code = cat.code;
      form.name = cat.name;
      form.description = cat.description ?? '';
      form.color = cat.color ?? 'blue';
      form.icon = cat.icon ?? '';
      form.isDefault = cat.isDefault;
      form.isActive = cat.isActive;
      form.sortOrder = cat.sortOrder;
    } else {
      form.code = '';
      form.name = '';
      form.description = '';
      form.color = 'blue';
      form.icon = '';
      form.isDefault = false;
      form.isActive = true;
      form.sortOrder = 0;
    }
    fieldErrors.code = '';
    fieldErrors.name = '';
  },
  { immediate: true },
);

const canSubmit = computed(
  () =>
    form.name.trim().length > 0 &&
    (isEdit.value || /^[A-Z][A-Z0-9_]*$/.test(form.code)),
);

function onCodeInput() {
  // Auto uppercase + replace invalid chars dengan underscore
  form.code = form.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  fieldErrors.code = '';
}

function validateCode() {
  if (!isEdit.value && !/^[A-Z][A-Z0-9_]*$/.test(form.code)) {
    fieldErrors.code =
      'Code harus dimulai huruf, hanya UPPERCASE / angka / underscore.';
  }
}

function handleSubmit() {
  if (!form.name.trim()) {
    fieldErrors.name = 'Nama wajib diisi.';
    return;
  }
  if (!isEdit.value) {
    validateCode();
    if (fieldErrors.code) return;
  }

  const payload: CreateCashBoxCategoryPayload = {
    code: form.code,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    color: form.color,
    icon: form.icon.trim() || undefined,
    isDefault: form.isDefault,
    isActive: form.isActive,
    sortOrder: form.sortOrder ?? 0,
  };

  if (isEdit.value) {
    // Strip code dari update payload (immutable)
    const { code: _code, ...updatePayload } = payload;
    void _code;
    emit('submit', updatePayload);
  } else {
    emit('submit', payload);
  }
}

function colorBg(color: string): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-100 border-amber-300';
    case 'emerald':
      return 'bg-emerald-100 border-emerald-300';
    case 'red':
      return 'bg-red-100 border-red-300';
    case 'purple':
      return 'bg-purple-100 border-purple-300';
    case 'pink':
      return 'bg-pink-100 border-pink-300';
    case 'indigo':
      return 'bg-indigo-100 border-indigo-300';
    case 'orange':
      return 'bg-orange-100 border-orange-300';
    case 'blue':
    default:
      return 'bg-blue-100 border-blue-300';
  }
}

function colorText(color: string): string {
  switch (color) {
    case 'amber':
      return 'text-amber-700';
    case 'emerald':
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
</script>
