<template>
  <div class="space-y-4">
    <!-- Header card -->
    <div
      :class="[
        'rounded-2xl border p-5 text-center',
        statusTone.bg,
        statusTone.border,
      ]"
    >
      <div
        :class="[
          'mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3',
          statusTone.iconBg,
        ]"
      >
        <component :is="statusTone.icon" :class="['w-7 h-7', statusTone.iconColor]" />
      </div>
      <h2 :class="['text-lg font-bold', statusTone.titleColor]">
        {{ statusTone.title }}
      </h2>
      <p :class="['text-xs mt-1', statusTone.subtitleColor]">
        {{ statusTone.subtitle }}
      </p>
    </div>

    <!-- Per-category variance breakdown -->
    <div class="space-y-3">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
        Ringkasan per Kategori
      </p>
      <div
        v-for="cat in summary"
        :key="cat.categoryId"
        class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <!-- Category header -->
        <div class="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p class="text-sm font-semibold text-slate-900">{{ cat.categoryName }}</p>
        </div>

        <!-- Cash row -->
        <div class="p-4 border-b border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-slate-700">Uang Tunai</p>
            <span
              :class="[
                'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                cat.varianceCash === 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : cat.varianceCash > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ cat.varianceCash === 0 ? 'Cocok' : cat.varianceCash > 0 ? 'Lebih' : 'Kurang' }}
            </span>
          </div>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div>
              <p class="text-[10px] text-slate-500">Saldo Awal</p>
              <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                {{ formatRupiah(cat.startingCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Ekspektasi</p>
              <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                {{ formatRupiah(cat.startingCash + cat.expectedCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Aktual</p>
              <p class="text-[11px] font-mono font-semibold text-slate-900 mt-0.5">
                {{ formatRupiah(cat.actualCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Selisih</p>
              <p
                :class="[
                  'text-[11px] font-mono font-bold mt-0.5',
                  cat.varianceCash === 0
                    ? 'text-emerald-700'
                    : cat.varianceCash > 0
                      ? 'text-blue-700'
                      : 'text-amber-700',
                ]"
              >
                {{ cat.varianceCash > 0 ? '+' : ''
                }}{{ formatRupiah(cat.varianceCash) }}
              </p>
            </div>
          </div>
        </div>

        <!-- QRIS row (only show if there's QRIS expected/actual) -->
        <div
          v-if="cat.expectedQRIS > 0 || cat.actualQRIS > 0"
          class="p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-slate-700">QRIS</p>
            <span
              :class="[
                'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                cat.varianceQRIS === 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : cat.varianceQRIS > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ cat.varianceQRIS === 0 ? 'Cocok' : cat.varianceQRIS > 0 ? 'Lebih' : 'Kurang' }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] text-slate-500">Ekspektasi</p>
              <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                {{ formatRupiah(cat.expectedQRIS) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Aktual</p>
              <p class="text-[11px] font-mono font-semibold text-slate-900 mt-0.5">
                {{ formatRupiah(cat.actualQRIS) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Selisih</p>
              <p
                :class="[
                  'text-[11px] font-mono font-bold mt-0.5',
                  cat.varianceQRIS === 0
                    ? 'text-emerald-700'
                    : cat.varianceQRIS > 0
                      ? 'text-blue-700'
                      : 'text-amber-700',
                ]"
              >
                {{ cat.varianceQRIS > 0 ? '+' : ''
                }}{{ formatRupiah(cat.varianceQRIS) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Total transactions -->
    <div class="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
      <p class="text-xs text-slate-600">Total transaksi shift</p>
      <p class="text-sm font-mono font-bold text-slate-900">
        {{ totalTransactions }}
      </p>
    </div>

    <!-- Note for big variance -->
    <div
      v-if="hasSignificantVariance"
      class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2"
    >
      <component :is="AlertTriangleIcon" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p class="text-[11px] text-amber-800 leading-relaxed">
        Total variance Anda di atas Rp 10.000. Admin akan review shift ini
        sebelum difinalisasi. Pastikan uang fisik sudah dihitung dengan benar
        per kategori.
      </p>
    </div>

    <!-- Done button -->
    <button
      type="button"
      class="w-full h-12 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
      @click="$emit('done')"
    >
      Selesai
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CheckCircle2 as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import type { CloseShiftCategorySummary } from '@/shared/services/shift.service';

interface Props {
  summary: CloseShiftCategorySummary[];
  totalTransactions: number;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'done'): void;
}>();

const totalVariance = computed(() =>
  props.summary.reduce(
    (sum, cat) => sum + cat.varianceCash + cat.varianceQRIS,
    0,
  ),
);

const hasSignificantVariance = computed(
  () => Math.abs(totalVariance.value) > 10000,
);

const allCocok = computed(() =>
  props.summary.every(
    (cat) => cat.varianceCash === 0 && cat.varianceQRIS === 0,
  ),
);

const statusTone = computed(() => {
  if (allCocok.value) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 border border-emerald-200',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
      subtitleColor: 'text-emerald-700',
      icon: CheckCircleIcon,
      title: 'Shift Berhasil Ditutup',
      subtitle: 'Saldo semua kategori cocok, terima kasih atas ketelitiannya!',
    };
  }
  if (hasSignificantVariance.value) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 border border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      subtitleColor: 'text-amber-700',
      icon: AlertTriangleIcon,
      title: 'Shift Ditutup dengan Variance',
      subtitle: 'Selisih kas perlu di-review oleh admin.',
    };
  }
  return {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100 border border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    subtitleColor: 'text-blue-700',
    icon: AlertCircleIcon,
    title: 'Shift Ditutup',
    subtitle: 'Variance kecil masih wajar (uang receh kembalian).',
  };
});

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
}
</script>
