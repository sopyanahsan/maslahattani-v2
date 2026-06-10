<template>
  <div class="flex flex-col items-center">
    <!-- Thermal receipt simulation (80mm paper) -->
    <div
      class="w-[300px] bg-white border border-slate-200 dark:border-slate-700 rounded shadow-lg font-mono text-[11px] leading-relaxed text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <!-- Paper top edge -->
      <div class="h-1.5 bg-gradient-to-b from-slate-100 to-white dark:from-slate-800 dark:to-slate-900" />

      <div class="px-4 py-3 space-y-2">
        <!-- Shop Header (center, bold, double height) -->
        <div class="text-center">
          <p class="text-sm font-extrabold uppercase tracking-wider">
            {{ shopName || 'Nama Toko' }}
          </p>
          <p v-if="shopAddress" class="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
            {{ shopAddress }}
          </p>
          <p v-if="shopPhone" class="text-[9px] text-slate-500 dark:text-slate-400">
            Telp: {{ shopPhone }}
          </p>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-300 dark:text-slate-600 select-none">--------------------------------</p>

        <!-- Transaction info (left align) -->
        <div class="space-y-0.5">
          <p>No: TRX-20260610-001</p>
          <p>{{ sampleDate }}&nbsp;&nbsp;&nbsp;&nbsp;Tunai</p>
          <p>Kasir: Kasir 1</p>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-300 dark:text-slate-600 select-none">--------------------------------</p>

        <!-- Items -->
        <div class="space-y-1">
          <div v-for="item in sampleItems" :key="item.name">
            <p>{{ item.name }}</p>
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">{{ item.qty }} x {{ fmtRp(item.price) }}</span>
              <span>{{ fmtRp(item.subtotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-300 dark:text-slate-600 select-none">--------------------------------</p>

        <!-- Totals -->
        <div class="space-y-0.5">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>{{ fmtRp(sampleSubtotal) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{{ fmtRp(sampleTotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Bayar</span>
            <span>{{ fmtRp(samplePaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Kembali</span>
            <span>{{ fmtRp(sampleChange) }}</span>
          </div>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-300 dark:text-slate-600 select-none">--------------------------------</p>

        <!-- Footer message -->
        <div class="text-center">
          <p class="text-[10px] italic text-slate-600 dark:text-slate-300">
            {{ footerMessage || 'Terima kasih atas kunjungan Anda!' }}
          </p>
        </div>
      </div>

      <!-- Paper torn edge bottom -->
      <div class="h-2 bg-gradient-to-t from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t border-dashed border-slate-200 dark:border-slate-700" />
    </div>

    <!-- Caption -->
    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
      Simulasi struk thermal 80mm
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
    timeZone: 'Asia/Jakarta',
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

const sampleSubtotal = sampleItems.reduce((s, i) => s + i.subtotal, 0);
const sampleTotal = sampleSubtotal; // no discount in sample
const samplePaid = 300000;
const sampleChange = samplePaid - sampleTotal;

function fmtRp(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}
</script>
