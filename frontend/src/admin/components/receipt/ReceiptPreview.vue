<template>
  <div class="flex flex-col items-center">
    <!-- Thermal receipt simulation (80mm paper) — always white/black regardless of dark mode -->
    <div
      class="w-[300px] bg-white border border-slate-300 rounded shadow-lg font-mono text-[11px] leading-relaxed text-slate-900 overflow-hidden"
    >
      <!-- Paper top edge -->
      <div class="h-1.5 bg-gradient-to-b from-slate-100 to-white" />

      <div class="px-4 py-3 space-y-2">
        <!-- Shop Header (center, bold, double height) -->
        <div class="text-center">
          <div v-if="logoUrl" class="flex justify-center mb-1.5">
            <img :src="logoUrl" alt="Logo" class="max-h-10 max-w-[120px] object-contain" />
          </div>
          <p class="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            {{ shopName || 'Nama Toko' }}
          </p>
          <p v-if="shopAddress" class="text-[9px] text-slate-500 mt-0.5">
            {{ shopAddress }}
          </p>
          <p v-if="shopPhone" class="text-[9px] text-slate-500">
            Telp: {{ shopPhone }}
          </p>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-400 select-none">--------------------------------</p>

        <!-- Transaction info (left align) -->
        <div class="space-y-0.5 text-slate-700">
          <p>No: TRX-20260610-001</p>
          <p>{{ sampleDate }}&nbsp;&nbsp;&nbsp;&nbsp;Tunai</p>
          <p>Kasir: Kasir 1</p>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-400 select-none">--------------------------------</p>

        <!-- Items -->
        <div class="space-y-1">
          <div v-for="item in sampleItems" :key="item.name">
            <p class="text-slate-800">{{ item.name }}</p>
            <div class="flex justify-between">
              <span class="text-slate-500">{{ item.qty }} x {{ fmtRp(item.price) }}</span>
              <span class="text-slate-800">{{ fmtRp(item.subtotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <p class="text-center text-slate-400 select-none">--------------------------------</p>

        <!-- Totals -->
        <div class="space-y-0.5 text-slate-700">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>{{ fmtRp(sampleSubtotal) }}</span>
          </div>
          <div class="flex justify-between font-bold text-slate-900">
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
        <p class="text-center text-slate-400 select-none">--------------------------------</p>

        <!-- Footer message -->
        <div class="text-center">
          <p class="text-[10px] italic text-slate-600">
            {{ footerMessage || 'Terima kasih atas kunjungan Anda!' }}
          </p>
        </div>
      </div>

      <!-- Paper torn edge bottom -->
      <div class="h-2 bg-gradient-to-t from-slate-100 to-white border-t border-dashed border-slate-300" />
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
    logoUrl?: string;
  }>(),
  {
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    footerMessage: '',
    logoUrl: '',
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
