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
        <p class="text-emerald-100 text-sm mb-1">Saldo Tersedia</p>
        <p class="text-3xl font-bold">{{ formatRupiah(saldoBrilink) }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Landmark as LandmarkIcon, ChevronLeft as ChevronLeftIcon,
  ArrowLeftRight as ArrowLeftRightIcon, Send as SendIcon,
  Banknote as BanknoteIcon, Smartphone as SmartphoneIcon,
  Phone as PhoneIcon, Zap as ZapIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';

const authStore = useAuthStore();
const saldoBrilink = ref(0);

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

onMounted(() => {
  // TODO: fetch saldo dari BRILink accounts
});
</script>
