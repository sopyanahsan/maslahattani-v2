<template>
  <div class="space-y-6">
    <!-- Current Plan Status -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Langganan Saat Ini</h2>
          <div class="flex items-center gap-2 mt-2">
            <span :class="['px-2.5 py-1 text-xs font-bold uppercase rounded-full', planBadge(subscription?.plan)]">{{ subscription?.plan || 'FREE' }}</span>
            <span :class="['px-2.5 py-1 text-xs font-bold uppercase rounded-full', statusBadge(subscription?.status)]">{{ subscription?.status || '-' }}</span>
          </div>
        </div>
        <div v-if="subscription?.endDate" class="text-right">
          <p class="text-xs text-slate-500 dark:text-slate-400">Berakhir</p>
          <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ formatDate(subscription.endDate) }}</p>
          <p v-if="daysRemaining !== null" :class="['text-xs font-semibold mt-0.5', daysRemaining <= 7 ? 'text-red-500' : 'text-emerald-600']">{{ daysRemaining }} hari lagi</p>
        </div>
        <div v-else-if="subscription?.status === 'LIFETIME'" class="text-right">
          <p class="text-xs text-slate-500">Durasi</p>
          <p class="text-sm font-bold text-emerald-600">Selamanya</p>
        </div>
      </div>
    </div>

    <!-- Pricing Plans -->
    <div>
      <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Pilih Paket</h3>

      <!-- Cycle toggle -->
      <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit mb-6">
        <button v-for="c in cycles" :key="c.key" :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors', cycle === c.key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400']" @click="cycle = c.key">{{ c.label }}</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="plan in plans" :key="plan.key" :class="['rounded-2xl p-5 border-2 transition-all cursor-pointer', selectedPlan === plan.key ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200']" @click="selectedPlan = plan.key">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ plan.name }}</h4>
            <div v-if="selectedPlan === plan.key" class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <p class="text-xl font-bold text-slate-900 dark:text-slate-100">Rp {{ formatPrice(plan.price[cycle]) }}</p>
          <p class="text-[10px] text-slate-500">{{ cycle === 'lifetime' ? 'sekali bayar' : cycle === 'yearly' ? 'per tahun' : 'per bulan' }}</p>
          <ul class="mt-3 space-y-1.5">
            <li v-for="f in plan.features" :key="f" class="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
              <svg class="w-3 h-3 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ f }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Payment Instructions -->
    <div v-if="selectedPlan" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
      <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Instruksi Pembayaran</h3>

      <div class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p class="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Bayar:</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">Rp {{ formatPrice(selectedPlanPrice) }}<span v-if="uniqueCode" class="text-amber-600">.{{ uniqueCode }}</span></p>
        <p v-if="uniqueCode" class="text-[10px] text-blue-600 dark:text-blue-400 mt-1">3 digit terakhir adalah kode unik untuk verifikasi otomatis</p>
      </div>

      <div class="space-y-3">
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Transfer ke salah satu rekening:</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- SeaBank -->
          <div class="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">SeaBank</p>
            <p class="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">9012 3456 7890</p>
            <p class="text-[10px] text-slate-500">a.n. Sopyan Ahsan</p>
          </div>
          <!-- BCA -->
          <div class="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">BCA</p>
            <p class="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">1234 5678 90</p>
            <p class="text-[10px] text-slate-500">a.n. Sopyan Ahsan</p>
          </div>
        </div>

        <!-- QRIS -->
        <div class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <p class="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">QRIS (DANA / OVO / GoPay)</p>
          <div class="w-40 h-40 mx-auto bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <p class="text-xs text-slate-500">QR Code di sini</p>
          </div>
        </div>
      </div>

      <!-- Confirmation -->
      <div class="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Setelah transfer:</p>
        <ol class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-decimal list-inside">
          <li>Screenshot bukti transfer</li>
          <li>Kirim ke WhatsApp: <strong class="text-slate-900 dark:text-slate-100">0812-xxxx-xxxx</strong></li>
          <li>Atau klik tombol di bawah untuk submit bukti</li>
        </ol>

        <button :disabled="submitting" class="w-full h-11 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2" @click="submitPayment">
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ submitting ? 'Mengirim...' : 'Saya Sudah Transfer — Aktifkan Langganan' }}
        </button>

        <p v-if="submitSuccess" class="text-xs text-emerald-600 font-semibold text-center">Pembayaran tercatat! Admin akan verifikasi dalam 1x24 jam.</p>
        <p v-if="submitError" class="text-xs text-red-500 font-semibold text-center">{{ submitError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/shared/services/api';
import { useAuthStore } from '@/shared/stores/auth.store';

const authStore = useAuthStore();

// ============================================
// Subscription state
// ============================================
const subscription = ref<any>(null);

const daysRemaining = computed(() => {
  if (!subscription.value?.endDate) return null;
  const end = new Date(subscription.value.endDate);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
});

async function fetchSubscription() {
  try {
    const { data } = await api.get('/subscription/me');
    subscription.value = data;
  } catch { /* */ }
}

// ============================================
// Pricing
// ============================================
type Cycle = 'monthly' | 'yearly' | 'lifetime';
const cycle = ref<Cycle>('monthly');
const cycles = [
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' },
  { key: 'lifetime', label: 'Lifetime' },
];

const plans = [
  {
    key: 'BASIC', name: 'Basic',
    price: { monthly: 49_000, yearly: 499_000, lifetime: 400_000 },
    features: ['1 cabang', '3 kasir', '500 produk', 'Stock Opname'],
  },
  {
    key: 'PRO', name: 'Pro',
    price: { monthly: 99_000, yearly: 999_000, lifetime: 700_000 },
    features: ['3 cabang', '10 kasir', 'Unlimited produk', '+ BRILink', '+ Export', '+ Supplier & Transfer'],
  },
  {
    key: 'ENTERPRISE', name: 'Enterprise',
    price: { monthly: 199_000, yearly: 1_999_000, lifetime: 1_200_000 },
    features: ['Unlimited cabang', 'Unlimited kasir', 'Semua fitur', 'Priority support'],
  },
];

const selectedPlan = ref('PRO');

const selectedPlanPrice = computed(() => {
  const plan = plans.find(p => p.key === selectedPlan.value);
  return plan ? plan.price[cycle.value] : 0;
});

// 3-digit unique code for transfer verification
const uniqueCode = computed(() => {
  return String(Math.floor(Math.random() * 900) + 100);
});

function formatPrice(amount: number): string {
  return amount.toLocaleString('id-ID');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function planBadge(plan?: string) {
  if (plan === 'ENTERPRISE') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  if (plan === 'PRO') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  if (plan === 'BASIC') return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
}

function statusBadge(status?: string) {
  if (status === 'ACTIVE' || status === 'LIFETIME') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
  if (status === 'TRIAL') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  if (status === 'EXPIRED') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
  if (status === 'SUSPENDED') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
}

// ============================================
// Submit Payment
// ============================================
const submitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref('');

async function submitPayment() {
  submitting.value = true;
  submitSuccess.value = false;
  submitError.value = '';
  try {
    await api.post('/subscription/payment', {
      plan: selectedPlan.value,
      cycle: cycle.value.toUpperCase(),
      method: 'MANUAL_TRANSFER',
      amount: selectedPlanPrice.value,
      uniqueCode: uniqueCode.value,
    });
    submitSuccess.value = true;
  } catch (err: any) {
    submitError.value = err?.response?.data?.message || 'Gagal submit. Coba lagi.';
  } finally {
    submitting.value = false;
  }
}

// ============================================
// Init
// ============================================
onMounted(fetchSubscription);
</script>
