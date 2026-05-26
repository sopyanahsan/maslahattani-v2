<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6"
    >
      <div class="flex items-start gap-3 mb-4">
        <div
          class="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0"
        >
          <component :is="AlertTriangleIcon" class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-950">Hapus Kategori?</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Konfirmasi hapus kategori cashbox.
          </p>
        </div>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        <p class="text-xs text-slate-500">Kategori</p>
        <p class="text-sm font-bold text-slate-900 mt-0.5">
          {{ category.name }}
        </p>
        <p class="text-[11px] font-mono text-slate-500 mt-0.5">
          {{ category.code }}
        </p>
      </div>

      <!-- Cannot delete: default category -->
      <div
        v-if="category.isDefault"
        class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2"
      >
        <component :is="AlertTriangleIcon" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p class="text-[11px] text-amber-800 leading-relaxed">
          Ini kategori <strong>default</strong>. Set kategori lain sebagai
          default dulu sebelum menghapus ini.
        </p>
      </div>

      <!-- Info for non-default -->
      <div
        v-else
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2"
      >
        <component :is="InfoIcon" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p class="text-[11px] text-blue-800 leading-relaxed">
          Kalau kategori ini sudah dipakai di shift, sistem akan
          <strong>nonaktifkan</strong> (soft-delete) supaya history shift tetap
          utuh. Kalau belum pernah dipakai, akan di-hard-delete.
        </p>
      </div>

      <!-- Submit error -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border-l-4 border-red-500 rounded-md p-3 mb-4 flex items-start gap-2"
      >
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p class="text-xs text-red-800">{{ errorMessage }}</p>
      </div>

      <div class="flex items-center justify-end gap-2">
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
          :disabled="loading || category.isDefault"
          class="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="$emit('confirm')"
        >
          <component v-if="loading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Menghapus…' : 'Hapus' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import type { CashBoxCategoryDto } from '@/shared/services/cashbox-category.service';

interface Props {
  category: CashBoxCategoryDto;
  loading?: boolean;
  errorMessage?: string | null;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: null,
});

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
