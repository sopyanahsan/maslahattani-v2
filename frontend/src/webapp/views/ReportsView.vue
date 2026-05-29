<template>
  <div class="space-y-5 -mx-4 -mt-4">
    <!-- Header -->
    <header class="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
      <h1 class="font-bold text-lg text-slate-800">Laporan</h1>
      <p class="text-xs text-slate-500 mt-0.5">Ringkasan penjualan & performa</p>
    </header>

    <!-- Today Summary -->
    <div class="px-4">
      <div class="bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl p-5 text-white shadow-md">
        <p class="text-xs font-medium opacity-80 mb-1">Penjualan Hari Ini</p>
        <h2 class="text-2xl font-bold">{{ formatRupiah(todaySales) }}</h2>
        <p class="text-[11px] opacity-70 mt-1">{{ todayTrxCount }} transaksi</p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="px-4 grid grid-cols-2 gap-3">
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-[11px] text-slate-500 font-medium uppercase mb-1">Profit</p>
        <p class="text-lg font-bold text-emerald-600">{{ formatRupiah(todayProfit) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-[11px] text-slate-500 font-medium uppercase mb-1">Hutang Baru</p>
        <p class="text-lg font-bold text-amber-600">{{ formatRupiah(todayDebt) }}</p>
      </div>
    </div>

    <!-- Placeholder for charts -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Grafik 7 Hari</h3>
      <div class="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center h-40">
        <div class="text-center text-slate-400">
          <BarChart3Icon class="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p class="text-xs">Grafik akan tersedia segera</p>
        </div>
      </div>
    </div>

    <!-- Top Products Placeholder -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Produk Terlaris</h3>
      <div class="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center">
        <div class="text-center text-slate-400">
          <TrendingUpIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-xs">Data produk terlaris akan tampil di sini</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BarChart3 as BarChart3Icon, TrendingUp as TrendingUpIcon } from 'lucide-vue-next';

const todaySales = ref(0);
const todayTrxCount = ref(0);
const todayProfit = ref(0);
const todayDebt = ref(0);

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}
</script>
