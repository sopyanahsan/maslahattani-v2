<template>
  <div class="bg-white dark:bg-[#1e2020] rounded-lg border border-slate-200 dark:border-[#3d4948] overflow-hidden">
    <!-- Header -->
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-950 dark:text-[#e3e2e2]">Riwayat Transaksi BRILink</h3>
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">
          {{ filtered.length }} transaksi ditampilkan dari {{ transactions.length }} total
        </p>
      </div>
      <RouterLink
        to="/admin/brilink/mutations"
        class="text-xs text-blue-600 hover:text-blue-700 font-medium hidden sm:inline"
      >
        Mutasi lengkap →
      </RouterLink>
    </div>

    <!-- Filter Chips -->
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]/50 overflow-x-auto">
      <div class="flex items-center gap-1.5 flex-nowrap min-w-max">
        <!-- Semua -->
        <FilterChip
          :active="activeFilter === 'ALL'"
          @click="activeFilter = 'ALL'"
        >
          Semua
        </FilterChip>

        <span class="h-5 w-px bg-slate-300 mx-1"></span>

        <!-- Tarik / Transfer group -->
        <FilterChip
          :active="activeFilter === 'TARIK_TUNAI'"
          tone="amber"
          @click="activeFilter = 'TARIK_TUNAI'"
        >
          Tarik Tunai
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TRANSFER_BRI'"
          tone="blue"
          @click="activeFilter = 'TRANSFER_BRI'"
        >
          Transfer BRI
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TRANSFER_OTHER'"
          tone="indigo"
          @click="activeFilter = 'TRANSFER_OTHER'"
        >
          Transfer Bank Lain
        </FilterChip>

        <span class="h-5 w-px bg-slate-300 mx-1"></span>

        <!-- Top Up group -->
        <FilterChip
          :active="activeFilter === 'TOPUP_ALL'"
          tone="emerald"
          @click="activeFilter = 'TOPUP_ALL'"
        >
          Top Up
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TOPUP_PULSA'"
          tone="emerald"
          subtle
          @click="activeFilter = 'TOPUP_PULSA'"
        >
          Pulsa
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TOPUP_EWALLET'"
          tone="emerald"
          subtle
          @click="activeFilter = 'TOPUP_EWALLET'"
        >
          E-Wallet
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TOPUP_PLN'"
          tone="emerald"
          subtle
          @click="activeFilter = 'TOPUP_PLN'"
        >
          PLN
        </FilterChip>
        <FilterChip
          :active="activeFilter === 'TOPUP_DATA'"
          tone="emerald"
          subtle
          @click="activeFilter = 'TOPUP_DATA'"
        >
          Paket Data
        </FilterChip>
      </div>
    </div>

    <!-- Table -->
    <div v-if="filtered.length === 0" class="px-4 sm:px-5 py-10 text-center">
      <p class="text-sm font-semibold text-slate-700">Tidak ada transaksi</p>
      <p class="text-xs text-slate-500 mt-1">
        Coba ubah filter atau tunggu transaksi BRILink masuk.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[760px]">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Waktu
            </th>
            <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              No Ref
            </th>
            <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Jenis
            </th>
            <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Tujuan / Customer
            </th>
            <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Nominal
            </th>
            <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Fee
            </th>
            <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="trx in filtered"
            :key="trx.id"
            class="hover:bg-slate-50 transition-colors"
          >
            <td class="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
              {{ formatTime(trx.createdAt) }}
            </td>
            <td class="px-4 py-2.5 text-xs font-mono text-slate-900 whitespace-nowrap">
              {{ trx.refNumber }}
            </td>
            <td class="px-4 py-2.5">
              <span
                :class="[
                  'inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap',
                  categoryBadgeClass(trx.category),
                ]"
              >
                {{ categoryLabel(trx.category) }}
              </span>
            </td>
            <td class="px-4 py-2.5">
              <p class="text-sm text-slate-900 truncate max-w-[200px]">
                {{ trx.customerName || '—' }}
              </p>
              <p class="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                {{ trx.destination }}
              </p>
            </td>
            <td class="px-4 py-2.5 text-sm font-mono font-medium text-right text-slate-900 whitespace-nowrap">
              {{ formatRupiah(trx.amount) }}
            </td>
            <td class="px-4 py-2.5 text-sm font-mono text-right text-emerald-700 whitespace-nowrap">
              {{ trx.fee > 0 ? '+' + formatRupiah(trx.fee) : '—' }}
            </td>
            <td class="px-4 py-2.5 text-center">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                  statusBadgeClass(trx.status),
                ]"
              >
                {{ statusLabel(trx.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import FilterChip from './FilterChip.vue';

export type BrilinkCategory =
  | 'TARIK_TUNAI'
  | 'TRANSFER_BRI'
  | 'TRANSFER_OTHER'
  | 'TOPUP_PULSA'
  | 'TOPUP_EWALLET'
  | 'TOPUP_PLN'
  | 'TOPUP_DATA';

export type BrilinkFilter =
  | 'ALL'
  | 'TOPUP_ALL'
  | BrilinkCategory;

export type BrilinkStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface BrilinkTransaction {
  id: string;
  refNumber: string;
  category: BrilinkCategory;
  amount: number;
  fee: number;
  status: BrilinkStatus;
  cashier: string;
  customerName?: string;
  destination: string;
  createdAt: string;
}

const props = defineProps<{
  transactions: BrilinkTransaction[];
}>();

const activeFilter = ref<BrilinkFilter>('ALL');

const filtered = computed(() => {
  if (activeFilter.value === 'ALL') return props.transactions;

  if (activeFilter.value === 'TOPUP_ALL') {
    return props.transactions.filter((t) => t.category.startsWith('TOPUP_'));
  }

  return props.transactions.filter((t) => t.category === activeFilter.value);
});

function categoryLabel(c: BrilinkCategory): string {
  const map: Record<BrilinkCategory, string> = {
    TARIK_TUNAI: 'Tarik Tunai',
    TRANSFER_BRI: 'Transfer BRI',
    TRANSFER_OTHER: 'Transfer Bank Lain',
    TOPUP_PULSA: 'Top Up Pulsa',
    TOPUP_EWALLET: 'Top Up E-Wallet',
    TOPUP_PLN: 'Top Up PLN',
    TOPUP_DATA: 'Paket Data',
  };
  return map[c];
}

function categoryBadgeClass(c: BrilinkCategory): string {
  const map: Record<BrilinkCategory, string> = {
    TARIK_TUNAI: 'bg-amber-100 text-amber-700',
    TRANSFER_BRI: 'bg-blue-100 text-blue-700',
    TRANSFER_OTHER: 'bg-indigo-100 text-indigo-700',
    TOPUP_PULSA: 'bg-emerald-100 text-emerald-700',
    TOPUP_EWALLET: 'bg-emerald-100 text-emerald-700',
    TOPUP_PLN: 'bg-emerald-100 text-emerald-700',
    TOPUP_DATA: 'bg-emerald-100 text-emerald-700',
  };
  return map[c];
}

function statusLabel(s: BrilinkStatus): string {
  const map: Record<BrilinkStatus, string> = {
    SUCCESS: 'Berhasil',
    PENDING: 'Pending',
    FAILED: 'Gagal',
  };
  return map[s];
}

function statusBadgeClass(s: BrilinkStatus): string {
  const map: Record<BrilinkStatus, string> = {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return map[s];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
</script>
