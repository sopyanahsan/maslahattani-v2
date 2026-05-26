<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
  >
    <div
      class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
    >
      <div>
        <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
          Produk Terlaris
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">
          Top {{ products.length || 5 }} berdasarkan omzet
        </p>
      </div>
      <RouterLink
        to="/admin/products"
        class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
      >
        Semua →
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="products.length === 0"
      class="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500"
    >
      <component :is="PackageIcon" class="w-10 h-10 mb-2 opacity-60" />
      <p class="text-sm font-semibold">Belum ada produk terjual</p>
      <p class="text-[11px] mt-0.5">Top produk akan muncul setelah ada penjualan.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide w-8">
              #
            </th>
            <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Produk
            </th>
            <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Qty
            </th>
            <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Omzet
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr
            v-for="(p, idx) in products"
            :key="p.productId"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            @click="$emit('select', p.productId)"
          >
            <td class="px-4 py-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              {{ idx + 1 }}
            </td>
            <td class="px-4 py-2">
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {{ p.name }}
              </p>
            </td>
            <td class="px-4 py-2 text-sm text-right font-mono text-slate-700 dark:text-slate-300">
              {{ p.qty }}
            </td>
            <td class="px-4 py-2 text-sm text-right font-mono font-medium text-slate-950 dark:text-slate-100">
              {{ formatRupiah(p.revenue) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package as PackageIcon } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import type { TopProduct } from '@/shared/services/dashboard.service';

defineProps<{
  products: TopProduct[];
  loading?: boolean;
}>();

defineEmits<{ (e: 'select', productId: string): void }>();

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}
</script>
