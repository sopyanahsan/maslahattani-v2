<template>
  <div class="space-y-6 max-w-5xl">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white shadow-lg">
      <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
      <h1 class="relative text-xl font-bold">Langganan & Lisensi</h1>
      <p class="relative text-xs text-purple-100 mt-1">Kelola paket, perpanjang, atau upgrade lisensi Posify Anda.</p>
    </div>

    <!-- Current Plan Status -->
    <div class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Paket Aktif</p>
          <div class="flex items-center gap-2 mt-2">
            <span :class="['px-3 py-1 text-xs font-bold uppercase rounded-full', planBadge(subscription?.plan)]">{{ subscription?.planLabel || subscription?.plan || 'TRIAL' }}</span>
            <span :class="['px-2.5 py-1 text-xs font-bold uppercase rounded-full', statusBadge(subscription?.status)]">{{ subscription?.status || '-' }}</span>
            <span v-if="subscription?.cycle" class="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">{{ cycleLabel(subscription.cycle) }}</span>
          </div>
        </div>
        <div v-if="subscription?.endDate" class="text-right">
          <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Jatuh Tempo</p>
          <p class="text-base font-bold text-slate-950 mt-0.5">{{ formatDate(subscription.endDate) }}</p>
          <p v-if="subscription.daysRemaining !== null" :class="['text-xs font-bold mt-0.5', subscription.daysRemaining <= 7 ? 'text-red-600' : subscription.daysRemaining <= 14 ? 'text-amber-600' : 'text-emerald-600']">
            {{ subscription.daysRemaining }} hari lagi
          </p>
          <p v-if="subscription.isExpiringSoon" class="text-[10px] text-red-500 font-semibold mt-1 animate-pulse">⚠️ Segera perpanjang!</p>
        </div>
        <div v-else-if="subscription?.status === 'LIFETIME'" class="text-right">
          <p class="text-[10px] text-slate-500 uppercase">Durasi</p>
          <p class="text-base font-bold text-emerald-600">Selamanya ∞</p>
        </div>
      </div>
    </div>

    <!-- Warning Banner -->
    <div v-if="subscription?.status === 'EXPIRED' || subscription?.status === 'SUSPENDED'" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </div>
      <div>
        <p class="text-sm font-bold text-red-800">Lisensi Anda Telah Berakhir</p>
        <p class="text-xs text-red-700 mt-0.5">Fitur terkunci. Pilih paket di bawah dan bayar untuk mengaktifkan kembali semua fitur.</p>
      </div>
    </div>

    <!-- Pricing Plans -->
    <div>
      <h3 class="text-base font-bold text-slate-950 mb-1">Pilih Paket</h3>
      <p class="text-xs text-slate-500 mb-4">Upgrade kapan saja. Downgrade berlaku di periode berikutnya.</p>

      <!-- Cycle toggle -->
      <div class="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
        <button v-for="c in cycles" :key="c.key" :class="['h-8 px-4 text-xs font-semibold rounded-md transition-all', cycle === c.key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900']" @click="cycle = c.key">
          {{ c.label }}
          <span v-if="c.key === 'yearly'" class="ml-1 text-[9px] text-emerald-600 font-bold">-17%</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="plan in plans" :key="plan.key"
          :class="['plan-card rounded-lg p-5 border-2 transition-all cursor-pointer relative overflow-hidden', selectedPlan === plan.key ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm']"
          @click="selectedPlan = plan.key"
        >
          <div v-if="plan.popular" class="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">POPULER</div>
          <div class="flex items-center justify-between mb-3">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', plan.iconBg]">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="plan.iconPath"/></svg>
            </div>
            <div v-if="selectedPlan === plan.key" class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <h4 class="text-sm font-bold text-slate-950">{{ plan.name }}</h4>
          <p class="text-xl font-bold text-slate-950 mt-1">Rp {{ formatPrice(plan.price[cycle]) }}</p>
          <p class="text-[10px] text-slate-500">{{ cycle === 'lifetime' ? 'sekali bayar selamanya' : cycle === 'yearly' ? 'per tahun' : 'per bulan' }}</p>
          <ul class="mt-3 space-y-1.5">
            <li v-for="f in plan.features" :key="f" class="text-[11px] text-slate-600 flex items-start gap-1.5">
              <svg class="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ f }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Payment Instructions -->
    <div v-if="selectedPlan" class="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
      <h3 class="text-base font-bold text-slate-950">Pembayaran</h3>

      <!-- Total -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Total Bayar</p>
        <p class="text-2xl font-bold text-blue-700 mt-1">Rp {{ formatPrice(selectedPlanPrice) }}<span v-if="uniqueCode" class="text-amber-600 text-lg">.{{ uniqueCode }}</span></p>
        <p v-if="uniqueCode" class="text-[10px] text-blue-600 mt-1">3 digit terakhir = kode unik untuk verifikasi</p>
      </div>

      <!-- Transfer Info -->
      <div class="space-y-3">
        <p class="text-xs font-bold text-slate-900 uppercase tracking-wide">Transfer ke:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <p class="text-xs font-bold text-slate-950 mb-1">SeaBank</p>
            <p class="text-lg font-mono font-bold text-slate-950">9012 3456 7890</p>
            <p class="text-[10px] text-slate-500">a.n. Sopyan Ahsan</p>
          </div>
          <div class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <p class="text-xs font-bold text-slate-950 mb-1">BCA</p>
            <p class="text-lg font-mono font-bold text-slate-950">1234 5678 90</p>
            <p class="text-[10px] text-slate-500">a.n. Sopyan Ahsan</p>
          </div>
        </div>
      </div>

      <!-- Steps -->
      <div class="border-t border-slate-200 pt-4 space-y-3">
        <p class="text-xs font-bold text-slate-900 uppercase tracking-wide">Setelah transfer:</p>
        <ol class="space-y-1.5 text-xs text-slate-600 list-decimal list-inside">
          <li>Transfer sesuai nominal + kode unik (3 digit terakhir)</li>
          <li>Screenshot bukti transfer</li>
          <li>Klik tombol "Konfirmasi" di bawah</li>
          <li>Lisensi aktif dalam 1x24 jam setelah verifikasi admin</li>
        </ol>

        <button :disabled="submitting" class="w-full h-12 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors" @click="submitPayment">
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ submitting ? 'Mengirim...' : 'Saya Sudah Transfer — Konfirmasi Pembayaran' }}
        </button>

        <p v-if="submitSuccess" class="text-xs text-emerald-600 font-semibold text-center bg-emerald-50 border border-emerald-200 rounded-md p-3">
          ✅ Pembayaran tercatat! Admin akan verifikasi dalam 1x24 jam. Cek kembali halaman ini nanti.
        </p>
        <p v-if="submitError" class="text-xs text-red-600 font-semibold text-center">{{ submitError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/shared/services/api';

// ============================================
// Subscription state
// ============================================
const subscription = ref<any>(null);

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
  { key: 'monthly' as const, label: 'Bulanan' },
  { key: 'yearly' as const, label: 'Tahunan' },
  { key: 'lifetime' as const, label: 'Lifetime' },
];

const plans = [
  {
    key: 'STARTER', name: 'Starter',
    iconBg: 'bg-slate-600', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    price: { monthly: 29_000, yearly: 290_000, lifetime: 799_000 },
    features: ['1 cabang', '1 kasir + 1 admin', '500 produk', 'POS + Hutang + Kas', 'Laporan dasar', 'Opname cepat'],
  },
  {
    key: 'BRILINK', name: 'BRILink',
    iconBg: 'bg-teal-600', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    price: { monthly: 49_000, yearly: 490_000, lifetime: 1_299_000 },
    features: ['1 cabang', '2 kasir + 1 admin', 'Semua fitur Starter', '+ Modul BRILink', '+ PPOB (Pulsa, PLN, dll)', '+ Shift Management', '+ Export PDF/Excel'],
    popular: true,
  },
  {
    key: 'PRO', name: 'Pro',
    iconBg: 'bg-blue-600', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    price: { monthly: 79_000, yearly: 790_000, lifetime: 1_999_000 },
    features: ['3 cabang', '5 kasir + 3 admin', 'Semua fitur BRILink', '+ Multi-User penuh', '+ Produk unlimited'],
  },
  {
    key: 'BUSINESS', name: 'Business',
    iconBg: 'bg-purple-600', iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    price: { monthly: 149_000, yearly: 1_490_000, lifetime: 3_499_000 },
    features: ['10 cabang', 'Unlimited kasir & admin', 'Semua fitur Pro', '+ Transfer Stok antar cabang', '+ Stock Opname Session', '+ Cetak Label & Label Rak', '+ Supplier & Purchase Order', '+ API Integrasi (Tripay)'],
  },
];

const selectedPlan = ref('BRILINK');

const selectedPlanPrice = computed(() => {
  const plan = plans.find(p => p.key === selectedPlan.value);
  return plan ? plan.price[cycle.value] : 0;
});

const uniqueCode = ref(String(Math.floor(Math.random() * 900) + 100));

function formatPrice(amount: number): string {
  return amount.toLocaleString('id-ID');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function cycleLabel(c: string): string {
  if (c === 'MONTHLY') return 'Bulanan';
  if (c === 'YEARLY') return 'Tahunan';
  if (c === 'LIFETIME') return 'Lifetime';
  return c;
}

function planBadge(plan?: string) {
  if (plan === 'BUSINESS') return 'bg-purple-100 text-purple-700';
  if (plan === 'PRO') return 'bg-blue-100 text-blue-700';
  if (plan === 'BRILINK') return 'bg-teal-100 text-teal-700';
  if (plan === 'STARTER') return 'bg-slate-100 text-slate-700';
  return 'bg-amber-100 text-amber-700';
}

function statusBadge(status?: string) {
  if (status === 'ACTIVE' || status === 'LIFETIME') return 'bg-emerald-100 text-emerald-700';
  if (status === 'TRIAL') return 'bg-blue-100 text-blue-700';
  if (status === 'EXPIRED') return 'bg-red-100 text-red-700';
  if (status === 'SUSPENDED') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-500';
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

<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-6 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-6 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-6 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-6 > *:nth-child(3) { animation-delay: 160ms; }
.space-y-6 > *:nth-child(4) { animation-delay: 240ms; }
.space-y-6 > *:nth-child(5) { animation-delay: 320ms; }

@keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
.plan-card { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.plan-card:nth-child(1) { animation-delay: 200ms; }
.plan-card:nth-child(2) { animation-delay: 280ms; }
.plan-card:nth-child(3) { animation-delay: 360ms; }
.plan-card:nth-child(4) { animation-delay: 440ms; }

div[class*="bg-gradient-to-r"][class*="from-purple"] { background-size: 200% 200%; animation: headerShimmer 6s ease infinite; }
@keyframes headerShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
</style>
