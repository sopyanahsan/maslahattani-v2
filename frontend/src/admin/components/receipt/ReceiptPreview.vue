<template>
  <div class="flex flex-col items-center">
    <!-- Thermal receipt paper simulation -->
    <div
      class="w-[280px] bg-white border border-slate-200 dark:border-slate-700 rounded-md shadow-md font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-hidden"
    >
      <!-- Paper edge top -->
      <div class="h-2 bg-gradient-to-b from-slate-100 to-white dark:from-slate-800 dark:to-slate-900" />

      <!-- Receipt content -->
      <div class="px-4 py-3 space-y-3">
        <!-- Store Header -->
        <div class="text-center space-y-0.5">
          <p class="text-xs font-bold uppercase tracking-wide">{{ shopName || 'Nama Toko' }}</p>
          <p class="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
            {{ shopAddress || 'Alamat Toko' }}
          </p>
          <p v-if="shopPhone" class="text-[9px] text-slate-500 dark:text-slate-400">
            Telp: {{ shopPhone }}
          </p>
        </div>

        <!-- Separator -->
        <div class="border-t border-dashed border-slate-300 dark:border-slate-600" />

        <!-- Transaction Info -->
        <div class="space-y-0.5">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">No.</span>
            <span>TRX-20260610-001</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Tanggal</span>
            <span>{{ sampleDate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Kasir</span>
            <span>Kasir 1</span>
          </div>
        </div>

        <!-- Separator -->
        <div class="border-t border-dashed border-slate-300 dark:border-slate-600" />

        <!-- Items -->
        <div class="space-y-1.5">
          <div v-for="item in sampleItems" :key="item.name">
            <div class="flex justify-between">
              <span class="truncate max-w-[160px]">{{ item.name }}</span>
              <span>{{ formatRp(item.subtotal) }}</span>
            </div>
            <div class="text-[9px] text-slate-500 dark:text-slate-400 pl-1">
              {{ item.qty }} x {{ formatRp(item.price) }}
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div class="border-t border-dashed border-slate-300 dark:border-slate-600" />

        <!-- Totals -->
        <div class="space-y-0.5">
          <div class="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{{ formatRp(sampleTotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Tunai</span>
            <span>{{ formatRp(samplePaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Kembalian</span>
            <span>{{ formatRp(sampleChange) }}</span>
          </div>
        </div>

        <!-- Separator -->
        <div class="border-t border-dashed border-slate-300 dark:border-slate-600" />

        <!-- Footer -->
        <div class="text-center space-y-1">
          <p class="text-[10px] text-slate-600 dark:text-slate-300 italic">
            {{ footerMessage || 'Terima kasih sudah berbelanja!' }}
          </p>
          <p class="text-[9px] text-slate-400 dark:text-slate-500">
            — {{ shopName || 'Nama Toko' }} —
          </p>
        </div>
      </div>

      <!-- Paper edge bottom (torn paper effect) -->
      <div class="h-3 bg-gradient-to-t from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t border-dashed border-slate-200 dark:border-slate-700" />
    </div>

    <!-- Label -->
    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
      Preview struk thermal (80mm)
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    footerMessage?: string;
  }>(),
  {
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    footerMessage: '',
  },
);

const sampleDate = computed(() =>
  new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const sampleItems = [
  { name: 'Pupuk NPK 5kg', qty: 2, price: 75000, subtotal: 150000 },
  { name: 'Benih Padi Ciherang', qty: 1, price: 65000, subtotal: 65000 },
  { name: 'Pestisida 500ml', qty: 3, price: 28000, subtotal: 84000 },
];

const sampleTotal = computed(() => sampleItems.reduce((s, i) => s + i.subtotal, 0));
const samplePaid = 300000;
const sampleChange = computed(() => samplePaid - sampleTotal.value);

function formatRp(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}
</script>
