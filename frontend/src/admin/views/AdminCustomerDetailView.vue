<template>
  <div class="space-y-5">
    <!-- Back + Header -->
    <div class="flex items-center gap-3">
      <button @click="$router.push('/admin/customers')" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
        <svg class="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">{{ data?.customer?.name || 'Customer' }}</h1>
        <p class="text-xs text-slate-500 dark:text-[#869392] mt-0.5">
          {{ data?.customer?.phone || '-' }}
          <span v-if="data?.customer?.address"> · {{ data.customer.address }}</span>
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-slate-500 text-sm">Memuat data customer...</div>

    <template v-else-if="data">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <p class="text-[10px] font-semibold text-[#00A19B] uppercase tracking-wide">Total Kunjungan</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ data.stats.totalVisits }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ data.stats.retailCount }} retail · {{ data.stats.brilinkCount }} brilink</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <p class="text-[10px] font-semibold text-[#00A19B] uppercase tracking-wide">Total Belanja</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(data.stats.grandTotal) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">retail {{ formatRupiah(data.stats.retailTotal) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <p class="text-[10px] font-semibold text-[#00A19B] uppercase tracking-wide">Rata-rata / Kunjungan</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(data.stats.avgPerVisit) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <p class="text-[10px] font-semibold text-[#00A19B] uppercase tracking-wide">Terakhir Datang</p>
          <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ data.stats.lastVisit ? formatDate(data.stats.lastVisit) : '-' }}</p>
        </div>
      </div>

      <!-- Top Products -->
      <div v-if="data.topProducts.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Produk Sering Dibeli</h2>
        <div class="space-y-2">
          <div v-for="(p, i) in data.topProducts" :key="i" class="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-bold text-slate-400 w-5 text-center">{{ i + 1 }}</span>
              <p class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ p.name }}</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] text-slate-500 dark:text-[#869392]">{{ p.qty }}x</span>
              <span class="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">{{ formatRupiah(p.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Retail / BRILink -->
      <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button
          :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors',
            activeTab === 'retail' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']"
          @click="activeTab = 'retail'"
        >Retail ({{ data.recentRetail.length }})</button>
        <button
          :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors',
            activeTab === 'brilink' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']"
          @click="activeTab = 'brilink'"
        >BRILink ({{ data.recentBrilink.length }})</button>
      </div>

      <!-- Retail History -->
      <div v-if="activeTab === 'retail'" class="space-y-2">
        <div v-if="data.recentRetail.length === 0" class="text-center py-8 text-slate-400 text-sm">Belum ada transaksi retail.</div>
        <div v-for="t in data.recentRetail" :key="t.id" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono">{{ t.transactionNumber }}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">{{ formatDate(t.createdAt) }} · {{ t.itemCount }} item</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(t.totalPrice) }}</p>
            <span v-if="t.paymentMethod" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{{ t.paymentMethod }}</span>
          </div>
        </div>
      </div>

      <!-- BRILink History -->
      <div v-if="activeTab === 'brilink'" class="space-y-2">
        <div v-if="data.recentBrilink.length === 0" class="text-center py-8 text-slate-400 text-sm">Belum ada transaksi BRILink.</div>
        <div v-for="t in data.recentBrilink" :key="t.id" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono">{{ t.refNumber }}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">{{ t.category }} · {{ t.destination }}</p>
            <p class="text-[10px] text-slate-400">{{ formatDate(t.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(t.total) }}</p>
            <p class="text-[10px] text-slate-500 dark:text-[#869392]">nominal {{ formatRupiah(t.amount) }} + fee {{ formatRupiah(t.fee) }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/shared/services/api';

const route = useRoute();
const loading = ref(true);
const data = ref<any>(null);
const activeTab = ref<'retail' | 'brilink'>('retail');

function formatRupiah(n: number): string {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function fetchDetail() {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const res = await api.get(`/customers/${id}/detail`);
    data.value = res.data;
  } catch (e) {
    console.error('Failed to load customer detail', e);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDetail);
</script>
