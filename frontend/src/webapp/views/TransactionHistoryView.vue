<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">Riwayat Transaksi</h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Transaksi yang Anda kerjakan hari ini.
      </p>
    </div>

    <!-- Stats row -->
    <div v-if="!loading && transactions.length > 0" class="grid grid-cols-3 gap-3">
      <div class="bg-white border border-slate-200 rounded-lg p-3 text-center">
        <p class="text-[10px] text-slate-500">Transaksi</p>
        <p class="text-base font-bold font-mono text-slate-950 mt-0.5">{{ transactions.length }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-3 text-center">
        <p class="text-[10px] text-slate-500">Total Omzet</p>
        <p class="text-base font-bold font-mono text-slate-950 mt-0.5">{{ formatRupiah(totalOmzet) }}</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-3 text-center">
        <p class="text-[10px] text-slate-500">Void</p>
        <p class="text-base font-bold font-mono text-red-600 mt-0.5">{{ voidCount }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat riwayat...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="transactions.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <ReceiptIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada transaksi hari ini</p>
      <p class="text-xs text-slate-500 mt-1">Transaksi yang Anda buat lewat POS akan muncul di sini.</p>
      <RouterLink
        :to="{ name: 'webapp-retail-pos' }"
        class="inline-flex items-center gap-1.5 mt-4 h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ShoppingCartIcon class="w-3.5 h-3.5" />
        Buka POS
      </RouterLink>
    </div>

    <!-- Transaction list -->
    <div v-else class="space-y-2">
      <div
        v-for="trx in transactions"
        :key="trx.id"
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        @click="toggleDetail(trx.id)"
      >
        <!-- Row header -->
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <code class="text-xs font-mono text-slate-900 font-semibold">{{ trx.transactionNumber }}</code>
              <span
                :class="[
                  'inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                  trx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  trx.status === 'VOIDED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700',
                ]"
              >
                {{ trx.status === 'COMPLETED' ? 'OK' : trx.status }}
              </span>
            </div>
            <p class="text-[10px] text-slate-500 mt-0.5">
              {{ formatTime(trx.createdAt) }} · {{ trx.items.length }} item
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-mono font-bold text-slate-900">{{ formatRupiah(trx.totalPrice) }}</p>
            <div class="flex items-center justify-end gap-1 mt-0.5">
              <span
                v-for="p in trx.payments"
                :key="p.id"
                :class="['text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', methodBadge(p.method)]"
              >
                {{ p.method }}
              </span>
            </div>
          </div>
        </div>

        <!-- Expandable detail -->
        <div v-if="expandedId === trx.id" class="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div
            v-for="item in trx.items"
            :key="item.id"
            class="flex items-center justify-between text-xs"
          >
            <div class="min-w-0 flex-1">
              <p class="text-slate-700 truncate">{{ item.product.name }}</p>
              <p class="text-[10px] text-slate-400 font-mono">
                {{ item.quantity }} × {{ formatRupiah(item.unitPrice) }}
              </p>
            </div>
            <span class="font-mono font-semibold text-slate-900 shrink-0 ml-3">
              {{ formatRupiah(item.subtotal) }}
            </span>
          </div>

          <!-- Void info -->
          <div v-if="trx.status === 'VOIDED' && trx.voidReason" class="bg-red-50 rounded-md px-3 py-2 mt-2">
            <p class="text-[10px] font-bold text-red-700">Alasan void:</p>
            <p class="text-[11px] text-red-600">{{ trx.voidReason }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import posService from '@/shared/services/pos.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const transactions = ref<any[]>([]);
const loading = ref(false);
const expandedId = ref<string | null>(null);

// ============================================
// Computed
// ============================================
const totalOmzet = computed(() =>
  transactions.value
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.totalPrice, 0),
);

const voidCount = computed(() =>
  transactions.value.filter((t) => t.status === 'VOIDED').length,
);

// ============================================
// Methods
// ============================================

async function fetchHistory() {
  const shopId = authStore.user?.shopId;
  const userId = authStore.user?.id;
  if (!shopId) return;

  loading.value = true;
  try {
    const response = await posService.getTodayTransactions(shopId, userId);
    transactions.value = response.data ?? [];
  } catch {
    transactions.value = [];
  } finally {
    loading.value = false;
  }
}

function toggleDetail(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchHistory);
</script>
