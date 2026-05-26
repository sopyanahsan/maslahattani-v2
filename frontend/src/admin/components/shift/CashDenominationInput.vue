<template>
  <div class="space-y-4">
    <div
      v-for="(category, catIdx) in categories"
      :key="category.label"
      class="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <!-- Category header -->
      <div
        class="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <component :is="category.icon" class="w-4 h-4 text-slate-600" />
          <h4 class="text-xs font-bold uppercase tracking-wide text-slate-700">
            {{ category.label }}
          </h4>
        </div>
        <span class="text-xs font-mono font-semibold text-slate-700">
          {{ formatRupiah(categorySubtotal(catIdx)) }}
        </span>
      </div>

      <!-- Denomination rows -->
      <div class="divide-y divide-slate-100">
        <div
          v-for="denom in category.denominations"
          :key="denom"
          class="grid grid-cols-12 gap-2 items-center px-4 py-2 hover:bg-slate-50/60 transition-colors"
        >
          <!-- Denomination label -->
          <div class="col-span-4">
            <p class="text-sm font-mono text-slate-900">
              {{ formatRupiah(denom) }}
            </p>
          </div>

          <!-- Count input -->
          <div class="col-span-3">
            <div class="relative">
              <input
                :value="getCount(catIdx, denom) || ''"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                :disabled="disabled"
                placeholder="0"
                :aria-label="`Jumlah ${formatRupiah(denom)} di ${category.label}`"
                class="w-full h-9 pl-2 pr-8 text-sm font-mono text-right border border-slate-200 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                @input="onCountInput(catIdx, denom, ($event.target as HTMLInputElement).value)"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"
              >
                {{ category.unit }}
              </span>
            </div>
          </div>

          <!-- Multiplier -->
          <div class="col-span-1 text-center">
            <span class="text-xs text-slate-400">×</span>
          </div>

          <!-- Subtotal -->
          <div class="col-span-4 text-right">
            <p
              :class="[
                'text-sm font-mono tabular-nums',
                getCount(catIdx, denom) > 0
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-400',
              ]"
            >
              {{ formatRupiah(denom * getCount(catIdx, denom)) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Grand total bar -->
    <div
      class="rounded-xl border-2 border-slate-900 bg-slate-900 text-white px-4 py-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <component :is="WalletIcon" class="w-4 h-4 text-slate-300" />
        <p class="text-xs font-bold uppercase tracking-wide text-slate-300">
          Total Hitungan
        </p>
      </div>
      <p class="text-base font-mono font-bold tabular-nums">
        {{ formatRupiah(total) }}
      </p>
    </div>

    <!-- Clear button -->
    <button
      v-if="hasAnyCount && !disabled"
      type="button"
      class="w-full h-9 px-3 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
      @click="resetAll"
    >
      <component :is="EraserIcon" class="w-3.5 h-3.5" />
      Reset semua hitungan
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, type Component } from 'vue';
import {
  Banknote as BanknoteIcon,
  Coins as CoinsIcon,
  Wallet as WalletIcon,
  Eraser as EraserIcon,
} from 'lucide-vue-next';

/**
 * CashDenominationInput
 * --------------------
 * Komponen input pecahan kas untuk verifikasi fisik. Admin (atau kasir)
 * menghitung jumlah lembar/keping per pecahan, sistem auto-hitung subtotal
 * dan total. Output total di-emit lewat v-model:total, breakdown dikirim
 * ke parent lewat update:breakdown supaya bisa dilampirkan ke catatan
 * finalisasi shift.
 *
 * Pemakaian:
 *   <CashDenominationInput
 *     v-model:total="actualCash"
 *     :disabled="shift.status !== 'CLOSED'"
 *     @update:breakdown="onBreakdown"
 *   />
 */

interface DenominationCategory {
  label: string;
  icon: Component;
  unit: string;
  denominations: number[];
}

const categories: DenominationCategory[] = [
  {
    label: 'Kertas Besar',
    icon: BanknoteIcon,
    unit: 'lbr',
    denominations: [100_000, 50_000, 20_000],
  },
  {
    label: 'Kertas Kecil',
    icon: BanknoteIcon,
    unit: 'lbr',
    denominations: [10_000, 5_000, 2_000, 1_000],
  },
  {
    label: 'Logam',
    icon: CoinsIcon,
    unit: 'kpg',
    denominations: [1_000, 500, 200, 100],
  },
];

const props = withDefaults(
  defineProps<{
    total?: number;
    disabled?: boolean;
  }>(),
  {
    total: 0,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:total', value: number): void;
  (e: 'update:breakdown', value: Record<string, number>): void;
}>();

// State: counts per (categoryIndex, denomination). Pakai key `${i}:${denom}`
// supaya kertas Rp 1.000 dan koin Rp 1.000 tidak bertabrakan.
const counts = reactive<Record<string, number>>({});

function key(catIdx: number, denom: number): string {
  return `${catIdx}:${denom}`;
}

function getCount(catIdx: number, denom: number): number {
  return counts[key(catIdx, denom)] || 0;
}

function onCountInput(catIdx: number, denom: number, raw: string) {
  if (props.disabled) return;
  // Sanitize: digit saja, max 6 char (999.999 lembar = lebih dari cukup)
  const sanitized = raw.replace(/\D/g, '').slice(0, 6);
  counts[key(catIdx, denom)] = sanitized === '' ? 0 : Number(sanitized);
}

function categorySubtotal(catIdx: number): number {
  const cat = categories[catIdx];
  return cat.denominations.reduce(
    (sum, denom) => sum + denom * getCount(catIdx, denom),
    0,
  );
}

const total = computed(() =>
  categories.reduce((sum, _cat, i) => sum + categorySubtotal(i), 0),
);

const hasAnyCount = computed(() =>
  Object.values(counts).some((c) => c > 0),
);

function resetAll() {
  for (const k of Object.keys(counts)) {
    counts[k] = 0;
  }
}

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
}

// Emit total + breakdown reaktif
watch(
  total,
  (val) => {
    emit('update:total', val);
    // Build breakdown readable: hanya baris dgn count > 0
    const breakdown: Record<string, number> = {};
    categories.forEach((cat, i) => {
      cat.denominations.forEach((denom) => {
        const count = getCount(i, denom);
        if (count > 0) {
          breakdown[`${cat.label} — ${formatRupiah(denom)}`] = count;
        }
      });
    });
    emit('update:breakdown', breakdown);
  },
  { immediate: true },
);

// Sync external prop → kalau parent set total ke 0, reset internal counts
watch(
  () => props.total,
  (val) => {
    if (val === 0 && hasAnyCount.value) {
      resetAll();
    }
  },
);
</script>
