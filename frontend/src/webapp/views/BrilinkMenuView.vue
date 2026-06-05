<template>
  <div class="space-y-5 -mx-4 -mt-4">
    <!-- Header -->
    <header class="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white shadow-md relative overflow-hidden">
      <LandmarkIcon class="absolute -right-6 -bottom-4 w-32 h-32 text-white opacity-10" />
      <div class="relative z-10 flex items-center gap-3">
        <RouterLink to="/dashboard" class="p-1 hover:bg-emerald-700/30 rounded-lg transition-colors">
          <ChevronLeftIcon class="w-6 h-6" />
        </RouterLink>
        <h1 class="font-bold text-lg">Agen BRILink</h1>
      </div>
      <div class="relative z-10 mt-6 mb-2">
        <p class="text-emerald-100 text-sm mb-1">Saldo Tersedia{{ accountLabel ? ` — ${accountLabel}` : '' }}</p>
        <p class="text-3xl font-bold">{{ formatRupiah(saldoBrilink) }}</p>
        <div
          v-if="isLowBalance"
          class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
        >
          <AlertTriangleIcon class="w-3.5 h-3.5" />
          Saldo di bawah batas minimum
        </div>
        <p v-else-if="!hasAccount && !loading" class="mt-2 text-[11px] text-emerald-100/80">
          Belum ada rekening BRI. Admin perlu menambah rekening di panel admin.
        </p>
      </div>
    </header>

    <!-- Services Grid -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-4">Layanan Transaksi</h3>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink to="/brilink/transaction?cat=TRANSFER_BRI" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <ArrowLeftRightIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Transfer Sesama</span>
          <span class="text-xs text-slate-400 mt-1 text-left">Kirim dana ke rekening BRI</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TRANSFER_OTHER" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <SendIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Transfer Antar Bank</span>
          <span class="text-xs text-slate-400 mt-1 text-left">Kirim ke bank lain</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TARIK_TUNAI" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <BanknoteIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Tarik Tunai</span>
          <span class="text-xs text-slate-400 mt-1 text-left">Penarikan tunai via agen</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_EWALLET" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <SmartphoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Top Up e-Wallet</span>
          <span class="text-xs text-slate-400 mt-1 text-left">DANA, OVO, GoPay, dll</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PULSA" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <PhoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Pulsa & Data</span>
          <span class="text-xs text-slate-400 mt-1 text-left">Pulsa HP & paket data</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PLN" class="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <ZapIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 text-sm">Token Listrik</span>
          <span class="text-xs text-slate-400 mt-1 text-left">Beli token PLN prabayar</span>
        </RouterLink>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="px-4 pb-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Transaksi Terakhir</h3>

      <div v-if="loading" class="flex items-center justify-center py-6 text-slate-400">
        <Loader2Icon class="w-5 h-5 animate-spin" />
      </div>

      <div
        v-else-if="recentTransactions.length === 0"
        class="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center"
      >
        <p class="text-xs text-slate-400">Belum ada transaksi BRILink.</p>
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="trx in recentTransactions"
          :key="trx.id"
          class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">
              {{ BRILINK_CATEGORY_LABELS[trx.category] }}
            </p>
            <p class="text-xs text-slate-400 truncate">
              {{ trx.customerName }} · {{ formatTime(trx.createdAt) }}
            </p>
          </div>
          <div class="text-right shrink-0 ml-3">
            <p class="text-sm font-bold text-slate-900 font-mono">{{ formatRupiah(trx.amount) }}</p>
            <p class="text-[10px] text-emerald-600 font-mono">+{{ formatRupiah(trx.fee) }} fee</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Landmark as LandmarkIcon, ChevronLeft as ChevronLeftIcon,
  ArrowLeftRight as ArrowLeftRightIcon, Send as SendIcon,
  Banknote as BanknoteIcon, Smartphone as SmartphoneIcon,
  Phone as PhoneIcon, Zap as ZapIcon,
  AlertTriangle as AlertTriangleIcon, Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import brilinkAccountService from '@/shared/services/brilink-account.service';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  type BrilinkTransactionDto,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

const saldoBrilink = ref(0);
const lowBalanceThreshold = ref(0);
const accountLabel = ref('');
const hasAccount = ref(false);
const recentTransactions = ref<BrilinkTransactionDto[]>([]);
const loading = ref(true);

const isLowBalance = computed(
  () => hasAccount.value && saldoBrilink.value <= lowBalanceThreshold.value,
);

function shopId(): string {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? '';
}

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  const id = shopId();
  if (!id) {
    loading.value = false;
    return;
  }
  try {
    const [accounts, txResponse] = await Promise.all([
      brilinkAccountService.list(id),
      brilinkService.listTransactions({ shopId: id, limit: 3 }),
    ]);

    const account =
      accounts.find((a) => a.isDefault && a.isActive) ??
      accounts.find((a) => a.isActive) ??
      accounts[0];
    if (account) {
      hasAccount.value = true;
      saldoBrilink.value = account.balance;
      lowBalanceThreshold.value = account.lowBalanceThreshold;
      accountLabel.value = account.label;
    }

    recentTransactions.value = txResponse.data;
  } catch {
    /* keep defaults */
  } finally {
    loading.value = false;
  }
});
</script>
