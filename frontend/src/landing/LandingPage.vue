<template>
  <div class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span class="text-xl font-bold text-slate-900">Posify</span>
        </div>
        <div class="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#fitur" class="hover:text-blue-600 transition-colors">Fitur</a>
          <a href="#harga" class="hover:text-blue-600 transition-colors">Harga</a>
          <a href="#faq" class="hover:text-blue-600 transition-colors">FAQ</a>
        </div>
        <div class="flex items-center gap-3">
          <a href="/admin/login" class="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Login</a>
          <a href="#register" class="h-9 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center">Coba Gratis</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="pt-20 pb-16 sm:pt-28 sm:pb-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 mb-6">
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Trial 14 Hari Gratis — Tanpa Kartu Kredit
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto">
          Kelola Toko Lebih <span class="text-blue-600">Cerdas</span> dengan Posify
        </h1>
        <p class="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Sistem POS modern untuk UMKM Indonesia. Retail, BRILink, multi-cabang, laporan otomatis — semua dalam satu platform.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#register" class="w-full sm:w-auto h-12 px-8 bg-blue-600 text-white text-base font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
            Mulai Gratis 14 Hari
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
          <a href="#fitur" class="w-full sm:w-auto h-12 px-8 border border-slate-200 text-slate-700 text-base font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
            Lihat Fitur
          </a>
        </div>
        <p class="mt-4 text-xs text-slate-400">Sudah dipercaya 100+ toko di Indonesia</p>
      </div>
    </section>

    <!-- Features -->
    <section id="fitur" class="py-16 sm:py-24 bg-slate-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">Semua yang Toko Kamu Butuhkan</h2>
          <p class="mt-3 text-lg text-slate-600">Fitur lengkap, mudah dipakai, bisa diakses dari mana saja.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="feature in features" :key="feature.title" class="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all">
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.iconBg]">
              <span class="text-2xl">{{ feature.icon }}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="harga" class="py-16 sm:py-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">Harga Transparan, Tanpa Biaya Tersembunyi</h2>
          <p class="mt-3 text-lg text-slate-600">Pilih paket sesuai kebutuhan. Upgrade kapan saja.</p>
        </div>

        <!-- Cycle toggle -->
        <div class="flex justify-center mb-8">
          <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button v-for="c in cycles" :key="c.key" :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors', cycle === c.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900']" @click="cycle = c.key">{{ c.label }}</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div v-for="plan in plans" :key="plan.name" :class="['rounded-2xl p-6 border-2 transition-all', plan.popular ? 'border-blue-500 shadow-xl scale-[1.02]' : 'border-slate-200 hover:border-blue-200']">
            <div v-if="plan.popular" class="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mb-3">Paling Populer</div>
            <h3 class="text-lg font-bold text-slate-900">{{ plan.name }}</h3>
            <div class="mt-3 flex items-baseline gap-1">
              <span class="text-3xl font-bold text-slate-900">Rp {{ formatPrice(plan.price[cycle]) }}</span>
              <span class="text-sm text-slate-500">{{ cycle === 'lifetime' ? '/selamanya' : cycle === 'yearly' ? '/tahun' : '/bulan' }}</span>
            </div>
            <ul class="mt-5 space-y-2.5">
              <li v-for="f in plan.features" :key="f" class="flex items-start gap-2 text-sm text-slate-700">
                <svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {{ f }}
              </li>
            </ul>
            <a href="#register" :class="['mt-6 block h-10 text-sm font-bold rounded-lg flex items-center justify-center transition-colors', plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200']">
              {{ cycle === 'lifetime' ? 'Beli Lifetime' : 'Mulai Sekarang' }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-16 sm:py-24 bg-slate-50">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 class="text-3xl font-bold text-slate-900 text-center mb-10">Pertanyaan Umum</h2>
        <div class="space-y-4">
          <div v-for="(faq, i) in faqs" :key="i" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button class="w-full px-5 py-4 text-left flex items-center justify-between" @click="faq.open = !faq.open">
              <span class="text-sm font-semibold text-slate-900">{{ faq.q }}</span>
              <svg :class="['w-4 h-4 text-slate-400 transition-transform', faq.open && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div v-show="faq.open" class="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{{ faq.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Register CTA -->
    <section id="register" class="py-16 sm:py-24">
      <div class="max-w-lg mx-auto px-4 sm:px-6">
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-10 text-center text-white shadow-2xl">
          <h2 class="text-2xl sm:text-3xl font-bold">Mulai Gratis Sekarang</h2>
          <p class="mt-3 text-blue-100 text-sm">14 hari trial penuh. Tidak perlu kartu kredit.</p>

          <form class="mt-6 space-y-3 text-left" @submit.prevent="handleRegister">
            <input v-model="regForm.storeName" type="text" required placeholder="Nama Toko" class="w-full h-10 px-4 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input v-model="regForm.ownerName" type="text" required placeholder="Nama Pemilik" class="w-full h-10 px-4 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input v-model="regForm.phone" type="tel" required placeholder="No WhatsApp" class="w-full h-10 px-4 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input v-model="regForm.email" type="email" required placeholder="Email" class="w-full h-10 px-4 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input v-model="regForm.password" type="password" required placeholder="Password" minlength="6" class="w-full h-10 px-4 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />

            <p v-if="regError" class="text-xs text-red-200 bg-red-500/20 px-3 py-1.5 rounded-md">{{ regError }}</p>
            <p v-if="regSuccess" class="text-xs text-emerald-200 bg-emerald-500/20 px-3 py-1.5 rounded-md">{{ regSuccess }}</p>

            <button type="submit" :disabled="regLoading" class="w-full h-11 bg-white text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <svg v-if="regLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ regLoading ? 'Membuat akun...' : 'Daftar Gratis' }}
            </button>
          </form>

          <p class="mt-4 text-[11px] text-blue-200">Sudah punya akun? <a href="/admin/login" class="underline text-white font-medium">Login di sini</a></p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 border-t border-slate-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div class="flex items-center justify-center gap-2 mb-3">
          <div class="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span class="text-sm font-bold text-slate-900">Posify</span>
        </div>
        <p class="text-xs text-slate-500">Sistem POS Modern untuk UMKM Indonesia</p>
        <p class="text-xs text-slate-400 mt-2">© 2026 Posify. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

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
    name: 'Basic',
    popular: false,
    price: { monthly: 49_000, yearly: 499_000, lifetime: 400_000 },
    features: ['1 cabang', '3 kasir', '500 produk', 'Stock Opname', 'Laporan dasar'],
  },
  {
    name: 'Pro',
    popular: true,
    price: { monthly: 99_000, yearly: 999_000, lifetime: 700_000 },
    features: ['3 cabang', '10 kasir', 'Unlimited produk', 'BRILink', 'Export PDF/Excel', 'Supplier & PO', 'Transfer Stok'],
  },
  {
    name: 'Enterprise',
    popular: false,
    price: { monthly: 199_000, yearly: 1_999_000, lifetime: 1_200_000 },
    features: ['Unlimited cabang', 'Unlimited kasir', 'Semua fitur Pro', 'Priority support', 'Custom branding'],
  },
];

function formatPrice(amount: number): string {
  return amount.toLocaleString('id-ID');
}

// ============================================
// Features
// ============================================
const features = [
  { icon: '🛒', title: 'POS Kasir', desc: 'Webapp kasir modern, scan barcode, multi-metode bayar (Cash, QRIS, Hutang). Bisa offline.', iconBg: 'bg-blue-50' },
  { icon: '🏦', title: 'BRILink Agent', desc: 'Transfer, tarik tunai, top-up — dual-impact otomatis ke saldo rekening + kas tunai.', iconBg: 'bg-amber-50' },
  { icon: '🏪', title: 'Multi-Cabang', desc: 'Kelola banyak cabang dari 1 dashboard. Transfer stok antar cabang, laporan per-cabang.', iconBg: 'bg-emerald-50' },
  { icon: '📊', title: 'Laporan Otomatis', desc: 'Dashboard real-time, laporan harian/bulanan, breakdown per kategori & kasir.', iconBg: 'bg-indigo-50' },
  { icon: '📦', title: 'Inventaris', desc: 'Stock opname, supplier & PO, riwayat stok lengkap, notifikasi stok habis.', iconBg: 'bg-pink-50' },
  { icon: '👥', title: 'Multi-User & Role', desc: 'Super Admin, Admin Cabang, Kasir — atur permission per role secara detail.', iconBg: 'bg-purple-50' },
];

// ============================================
// FAQ
// ============================================
const faqs = reactive([
  { q: 'Apakah bisa dicoba gratis?', a: 'Ya! Trial 14 hari dengan semua fitur aktif, tanpa perlu kartu kredit. Setelah trial, pilih paket yang sesuai.', open: false },
  { q: 'Apa bedanya Lifetime dengan bulanan?', a: 'Lifetime = bayar 1x, pakai selamanya tanpa biaya bulanan. Tetap dapat update fitur. Cocok untuk yang yakin mau pakai jangka panjang.', open: false },
  { q: 'Bisa pakai di HP?', a: 'Ya, Posify berbasis web responsive. Bisa diakses dari HP, tablet, atau laptop — cukup buka browser.', open: false },
  { q: 'Bagaimana cara bayar?', a: 'Transfer bank (SeaBank/BCA) atau QRIS (DANA/OVO/GoPay). Setelah transfer, konfirmasi via WhatsApp dan akun langsung aktif.', open: false },
  { q: 'Data aman?', a: 'Data disimpan di server Indonesia dengan enkripsi. Backup otomatis setiap hari. Hanya Anda yang bisa akses data toko Anda.', open: false },
  { q: 'Bisa upgrade/downgrade kapan saja?', a: 'Bisa! Upgrade langsung aktif. Downgrade berlaku di periode berikutnya.', open: false },
]);

// ============================================
// Registration
// ============================================
const regForm = reactive({
  storeName: '',
  ownerName: '',
  phone: '',
  email: '',
  password: '',
});
const regLoading = ref(false);
const regError = ref('');
const regSuccess = ref('');

async function handleRegister() {
  regLoading.value = true;
  regError.value = '';
  regSuccess.value = '';
  try {
    const res = await fetch(
      (import.meta.env.VITE_API_BASE_URL || '/api') + '/tenants/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mendaftar');
    regSuccess.value = 'Akun berhasil dibuat! Redirecting ke dashboard...';
    setTimeout(() => {
      window.location.href = '/admin/login';
    }, 2000);
  } catch (err: any) {
    regError.value = err.message || 'Terjadi kesalahan. Coba lagi.';
  } finally {
    regLoading.value = false;
  }
}
</script>
