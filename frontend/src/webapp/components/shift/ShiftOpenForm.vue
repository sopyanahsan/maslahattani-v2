<template>
  <form
    class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5"
    @submit.prevent="handleSubmit"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <div
        class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0"
      >
        <component :is="PlayCircleIcon" class="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h2 class="text-base font-bold text-slate-950">Buka Shift Baru</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Hitung uang fisik di laci kas dulu, lalu masukkan jumlah saldo awal
          per kategori.
        </p>
      </div>
    </div>

    <!-- Loading categories -->
    <div
      v-if="loadingCategories"
      class="text-center py-6"
    >
      <component :is="Loader2Icon" class="w-5 h-5 animate-spin text-slate-400 mx-auto mb-1" />
      <p class="text-xs text-slate-500">Memuat kategori cashbox…</p>
    </div>

    <!-- Categories load error -->
    <div
      v-else-if="categoriesError"
      class="bg-red-50 border-l-4 border-red-500 rounded-md p-3 flex items-start gap-2"
    >
      <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="text-xs text-red-800">{{ categoriesError }}</p>
        <button
          type="button"
          class="mt-2 text-xs font-semibold text-red-700 hover:text-red-900"
          @click="loadCategories"
        >
          Coba lagi
        </button>
      </div>
    </div>

    <!-- No active categories -->
    <div
      v-else-if="categories.length === 0"
      class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center"
    >
      <component :is="AlertTriangleIcon" class="w-6 h-6 text-amber-600 mx-auto mb-2" />
      <p class="text-sm font-semibold text-amber-900">Belum ada kategori cashbox</p>
      <p class="text-xs text-amber-700 mt-1">
        Hubungi super-admin untuk setup kategori cashbox.
      </p>
    </div>

    <!-- Main form -->
    <template v-else>
      <!-- Submit Error -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border-l-4 border-red-500 rounded-md p-3 flex items-start gap-2"
      >
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p class="text-xs text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Per-category starting cash inputs -->
      <div class="space-y-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Saldo Kas Awal per Kategori
        </p>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              :class="[
                'inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                colorBg(cat.color),
              ]"
            >
              <span :class="['text-sm font-bold', colorText(cat.color)]">
                {{ initials(cat.name) }}
              </span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">
                {{ cat.name }}
              </p>
              <p
                v-if="cat.description"
                class="text-[11px] text-slate-500 truncate"
              >
                {{ cat.description }}
              </p>
            </div>
            <span
              v-if="cat.isDefault"
              class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
            >
              Default
            </span>
          </div>

          <div class="relative">
            <span
              class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500"
            >
              Rp
            </span>
            <input
              :value="formattedAmounts[cat.id] || ''"
              type="text"
              inputmode="numeric"
              placeholder="0"
              :disabled="loading"
              class="input-field pl-10 font-mono text-right text-base"
              @input="(e) => handleCashInput(cat.id, e)"
            />
          </div>
        </div>
      </div>

      <!-- Notes (optional) -->
      <div>
        <label for="shift-notes" class="block text-xs font-semibold text-slate-900 mb-1.5">
          Catatan <span class="text-slate-400">(opsional)</span>
        </label>
        <textarea
          id="shift-notes"
          v-model="notes"
          rows="2"
          placeholder="Mis. Saldo dari shift kemarin, sudah dihitung 2x"
          :disabled="loading"
          class="input-field resize-none"
        ></textarea>
      </div>

      <!-- Total summary (kalau >1 kategori) -->
      <div
        v-if="categories.length > 1"
        class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between"
      >
        <p class="text-xs font-semibold text-slate-700">Total Saldo Awal</p>
        <p class="text-sm font-mono font-bold text-slate-900">
          Rp {{ formatNumber(totalStartingCash) }}
        </p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full h-12 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <component v-if="loading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
        <component v-else :is="PlayCircleIcon" class="w-4 h-4" />
        {{ loading ? 'Membuka shift…' : 'Mulai Shift' }}
      </button>

      <!-- Helper -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <component :is="InfoIcon" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p class="text-[11px] text-blue-800 leading-relaxed">
          Setiap kategori punya kas terpisah untuk audit. Saat tutup shift,
          variance dihitung per kategori. Kategori yang tidak diisi otomatis
          dianggap saldo Rp 0.
        </p>
      </div>
    </template>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  PlayCircle as PlayCircleIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
  Info as InfoIcon,
} from 'lucide-vue-next';
import cashBoxCategoryService, {
  type CashBoxCategoryDto,
} from '@/shared/services/cashbox-category.service';
import type { OpenShiftPayload } from '@/shared/services/shift.service';

interface Props {
  loading?: boolean;
  errorMessage?: string | null;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'submit', payload: OpenShiftPayload): void;
  (e: 'clear-error'): void;
}>();

const categories = ref<CashBoxCategoryDto[]>([]);
const loadingCategories = ref(false);
const categoriesError = ref<string | null>(null);

/** Map categoryId → starting cash (number). */
const amounts = reactive<Record<string, number>>({});
/** Map categoryId → display string (formatted dengan separator ribuan). */
const formattedAmounts = reactive<Record<string, string>>({});

const notes = ref('');

const totalStartingCash = computed(() =>
  Object.values(amounts).reduce((sum, v) => sum + (v || 0), 0),
);

async function loadCategories() {
  loadingCategories.value = true;
  categoriesError.value = null;
  try {
    const response = await cashBoxCategoryService.list();
    categories.value = response.data;
    // Init amounts for setiap category
    for (const cat of categories.value) {
      if (!(cat.id in amounts)) {
        amounts[cat.id] = 0;
        formattedAmounts[cat.id] = '';
      }
    }
  } catch (err: any) {
    categoriesError.value =
      err?.response?.data?.message ??
      err?.message ??
      'Gagal memuat kategori cashbox.';
  } finally {
    loadingCategories.value = false;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function handleCashInput(categoryId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);
  amounts[categoryId] = parsed;
  formattedAmounts[categoryId] = parsed === 0 ? '' : formatNumber(parsed);
  emit('clear-error');
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2);
}

/** Map color name dari CashBoxCategory ke Tailwind bg class. */
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

function handleSubmit() {
  emit('submit', {
    startingCashByCategory: categories.value.map((cat) => ({
      categoryId: cat.id,
      startingCash: amounts[cat.id] ?? 0,
    })),
    notes: notes.value.trim() || undefined,
  });
}

onMounted(loadCategories);
</script>
