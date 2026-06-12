<template>
  <div>
    <!-- Receipt Content (printable) -->
    <div ref="receiptRef" class="receipt-ppob bg-white text-slate-900 w-[300px] mx-auto p-5 font-mono text-xs leading-relaxed">
      <!-- Header -->
      <div class="text-center mb-3">
        <p class="text-sm font-bold">{{ shopName || 'Posify' }}</p>
        <p class="text-[10px] text-slate-500">Struk Pembayaran PPOB</p>
      </div>

      <div class="border-t border-dashed border-slate-300 my-2"></div>

      <!-- Transaction Info -->
      <div class="space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Tanggal</span>
          <span>{{ formatDate(transaction.createdAt) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Ref ID</span>
          <span class="text-[10px]">{{ transaction.refId }}</span>
        </div>
        <div v-if="transaction.tripayRef" class="flex justify-between">
          <span class="text-slate-500">Tripay ID</span>
          <span class="text-[10px]">{{ transaction.tripayRef }}</span>
        </div>
      </div>

      <div class="border-t border-dashed border-slate-300 my-2"></div>

      <!-- Product -->
      <div class="space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Produk</span>
          <span class="font-semibold">{{ transaction.productCode }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Tipe</span>
          <span>{{ transaction.type === 'prepaid' ? 'Prabayar' : 'Pascabayar' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">No. Pelanggan</span>
          <span>{{ transaction.customerId }}</span>
        </div>
        <div v-if="transaction.customerName" class="flex justify-between">
          <span class="text-slate-500">Nama</span>
          <span>{{ transaction.customerName }}</span>
        </div>
      </div>

      <div class="border-t border-dashed border-slate-300 my-2"></div>

      <!-- Amounts -->
      <div class="space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Nominal</span>
          <span>{{ formatRupiah(transaction.amount) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Biaya Admin</span>
          <span>{{ formatRupiah(transaction.fee) }}</span>
        </div>
        <div class="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{{ formatRupiah(transaction.total) }}</span>
        </div>
      </div>

      <div class="border-t border-dashed border-slate-300 my-2"></div>

      <!-- SN / Token -->
      <div v-if="transaction.serialNumber" class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center my-2">
        <p class="text-[9px] text-slate-500 uppercase font-bold mb-0.5">SN / Token</p>
        <p class="text-sm font-bold tracking-wide break-all">{{ transaction.serialNumber }}</p>
      </div>

      <!-- Status -->
      <div class="text-center my-2">
        <span :class="['inline-block px-3 py-1 rounded-full text-[10px] font-bold', statusClass]">
          {{ statusText }}
        </span>
      </div>

      <div class="border-t border-dashed border-slate-300 my-2"></div>

      <!-- Footer -->
      <div class="text-center text-[10px] text-slate-400">
        <p>Terima kasih atas transaksi Anda</p>
        <p>{{ shopName || 'Posify' }} — Powered by Tripay</p>
        <p class="mt-1">{{ formatDate(transaction.createdAt) }}</p>
      </div>
    </div>

    <!-- Action Buttons (not printed) -->
    <div class="flex gap-2 justify-center mt-4 no-print">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
        @click="handlePrint"
      >
        <PrinterIcon class="w-4 h-4" />
        Cetak Struk
      </button>
      <button
        v-if="canShare"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
        @click="handleShare"
      >
        <ShareIcon class="w-4 h-4" />
        Bagikan
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        @click="handleCopy"
      >
        <CopyIcon class="w-4 h-4" />
        {{ copySuccess ? 'Tersalin!' : 'Salin' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Printer as PrinterIcon, Share2 as ShareIcon, Copy as CopyIcon } from 'lucide-vue-next';
import type { PpobTransaction } from '@/shared/services/tripay.service';

const props = defineProps<{
  transaction: PpobTransaction;
  shopName?: string;
}>();

const receiptRef = ref<HTMLElement | null>(null);
const copySuccess = ref(false);

const canShare = computed(() => !!navigator.share);

const statusText = computed(() => {
  return { SUCCESS: 'SUKSES', FAILED: 'GAGAL', PROCESSING: 'DIPROSES', REFUNDED: 'REFUND' }[props.transaction.status] || props.transaction.status;
});

const statusClass = computed(() => {
  return {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    REFUNDED: 'bg-amber-100 text-amber-700',
  }[props.transaction.status] || 'bg-slate-100 text-slate-600';
});

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildTextReceipt(): string {
  const t = props.transaction;
  const lines = [
    `================================`,
    `      ${props.shopName || 'Posify'}`,
    `    Struk Pembayaran PPOB`,
    `================================`,
    `Tanggal  : ${formatDate(t.createdAt)}`,
    `Ref ID   : ${t.refId}`,
    t.tripayRef ? `Tripay ID: ${t.tripayRef}` : '',
    `--------------------------------`,
    `Produk   : ${t.productCode}`,
    `Tipe     : ${t.type === 'prepaid' ? 'Prabayar' : 'Pascabayar'}`,
    `No. Pel  : ${t.customerId}`,
    t.customerName ? `Nama     : ${t.customerName}` : '',
    `--------------------------------`,
    `Nominal  : ${formatRupiah(t.amount)}`,
    `Admin    : ${formatRupiah(t.fee)}`,
    `TOTAL    : ${formatRupiah(t.total)}`,
    `--------------------------------`,
    t.serialNumber ? `SN/Token : ${t.serialNumber}` : '',
    t.serialNumber ? `--------------------------------` : '',
    `Status   : ${statusText.value}`,
    `================================`,
    `  Terima kasih atas transaksi`,
    `         Anda!`,
    `================================`,
  ].filter(Boolean);
  return lines.join('\n');
}

function handlePrint() {
  const printContent = receiptRef.value?.innerHTML;
  if (!printContent) return;

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Struk PPOB</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
          .receipt-ppob { width: 280px; margin: 0 auto; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .text-\\[10px\\] { font-size: 10px; }
          .text-\\[9px\\] { font-size: 9px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .space-y-1 > * + * { margin-top: 4px; }
          .my-2 { margin-top: 8px; margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .p-2 { padding: 8px; }
          .p-5 { padding: 20px; }
          .border-t { border-top: 1px dashed #ccc; }
          .border-dashed { border-style: dashed; }
          .rounded-lg { border-radius: 8px; }
          .bg-slate-50 { background: #f8fafc; }
          .border-slate-200 { border: 1px solid #e2e8f0; }
          .text-slate-500 { color: #64748b; }
          .text-slate-400 { color: #94a3b8; }
          .tracking-wide { letter-spacing: 0.5px; }
          .break-all { word-break: break-all; }
          .inline-block { display: inline-block; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .rounded-full { border-radius: 9999px; }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

async function handleShare() {
  const text = buildTextReceipt();
  try {
    await navigator.share({
      title: `Struk PPOB - ${props.transaction.productCode}`,
      text,
    });
  } catch {
    // User cancelled or not supported
  }
}

function handleCopy() {
  const text = buildTextReceipt();
  navigator.clipboard.writeText(text).then(() => {
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2000);
  });
}
</script>

<style>
@media print {
  .no-print { display: none !important; }
}
</style>
