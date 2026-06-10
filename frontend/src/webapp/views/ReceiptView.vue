<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] -mx-4 -mt-4 p-4 bg-slate-50">
    <!-- Receipt Card -->
    <div ref="receiptRef" class="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <!-- Success Header -->
      <div class="bg-emerald-500 p-5 text-center text-white">
        <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircleIcon class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-lg font-bold">Pembayaran Berhasil!</h2>
        <p v-if="isOffline" class="text-xs text-emerald-100 mt-1 bg-emerald-600 rounded px-2 py-0.5 inline-block">Tersimpan offline — sync otomatis</p>
      </div>

      <!-- Receipt Body -->
      <div class="p-5 space-y-4">
        <!-- Store Info -->
        <div class="text-center border-b border-dashed border-slate-200 pb-3">
          <p class="text-sm font-bold text-slate-800">Maslahat Tani</p>
          <p class="text-[10px] text-slate-500">Jl. Jenderal Sudirman No. 1, Bekasi</p>
          <p class="text-[10px] text-slate-500">{{ currentDate }}</p>
        </div>

        <!-- Transaction Number -->
        <div class="text-center">
          <code class="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{{ trxNumber }}</code>
        </div>

        <!-- Summary -->
        <div class="space-y-2 border-b border-dashed border-slate-200 pb-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Total</span>
            <span class="font-mono font-bold text-slate-800">{{ formatRupiah(total) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Metode</span>
            <span class="font-semibold text-slate-800">{{ method === 'CASH' ? 'Tunai' : 'QRIS' }}</span>
          </div>
          <div v-if="method === 'CASH'" class="flex justify-between text-sm">
            <span class="text-slate-600">Dibayar</span>
            <span class="font-mono text-slate-800">{{ formatRupiah(paid) }}</span>
          </div>
          <div v-if="method === 'CASH' && change > 0" class="flex justify-between text-sm">
            <span class="text-slate-600">Kembalian</span>
            <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(change) }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-[10px] text-slate-400">Terima kasih sudah berbelanja!</p>
          <p class="text-[10px] text-slate-400">— Maslahat Tani —</p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="w-full max-w-sm mt-5 space-y-2">
      <button class="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2" @click="handlePrint">
        <PrinterIcon class="w-4 h-4" />
        Print Struk
      </button>
      <button class="w-full h-11 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors" @click="handleNewTransaction">
        Transaksi Baru
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CheckCircle2 as CheckCircleIcon, Printer as PrinterIcon } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const receiptRef = ref<HTMLElement | null>(null);

const trxNumber = computed(() => String(route.query.trxNumber || 'TRX-000'));
const total = computed(() => Number(route.query.total) || 0);
const paid = computed(() => Number(route.query.paid) || 0);
const change = computed(() => Number(route.query.change) || 0);
const method = computed(() => String(route.query.method || 'CASH'));
const isOffline = computed(() => route.query.offline === '1');

const currentDate = computed(() =>
  new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
);

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

function handlePrint() {
  window.print();
}

function handleNewTransaction() {
  router.push({ name: 'webapp-retail-pos' });
}
</script>

<style>
@media print {
  body * { visibility: hidden; }
  .receipt-print, .receipt-print * { visibility: visible; }
  .receipt-print { position: absolute; left: 0; top: 0; width: 80mm; }
}
</style>
