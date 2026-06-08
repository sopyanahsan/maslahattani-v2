<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-slate-100">Posify Owner</h1>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">Platform Dashboard</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- Tabs -->
        <div class="hidden sm:flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button v-for="t in tabs" :key="t.key" :class="['h-7 px-3 text-[11px] font-semibold rounded-md transition-colors', activeTab === t.key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400']" @click="activeTab = t.key">{{ t.label }}</button>
        </div>
      </div>
    </header>

    <div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <!-- Mobile tabs -->
      <div class="sm:hidden flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        <button v-for="t in tabs" :key="t.key" :class="['shrink-0 h-8 px-3 text-xs font-semibold rounded-md transition-colors', activeTab === t.key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400']" @click="activeTab = t.key">{{ t.label }}</button>
      </div>

      <!-- ============================================ -->
      <!-- TAB: Dashboard (Stats)                      -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'dashboard'">
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Total Tenant</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ stats.totalTenants }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Aktif (Bayar)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.activeSubs }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Trial</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ stats.trialSubs }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Expired/Suspend</p>
            <p class="text-2xl font-bold text-red-500 mt-1">{{ stats.expiredSubs }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Total Revenue</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(stats.totalRevenue) }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-400">Pending Bayar</p>
            <p class="text-2xl font-bold text-amber-500 mt-1">{{ stats.pendingPayments }}</p>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Tenants                                -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'tenants'">
        <!-- Search -->
        <div class="flex gap-2">
          <input v-model="searchTenant" type="text" placeholder="Cari nama toko / email..." class="flex-1 h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500" @keyup.enter="fetchTenants" />
          <button class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg" @click="fetchTenants">Cari</button>
        </div>

        <!-- Table -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Toko</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Owner</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Plan</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Cabang</th>
                  <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="t in tenants" :key="t.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-4 py-3">
                    <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ t.name }}</p>
                    <p class="text-[10px] text-slate-500">{{ t.ownerEmail }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-700 dark:text-slate-300">{{ t.ownerName }}</p>
                    <p class="text-[10px] text-slate-500">{{ t.ownerPhone }}</p>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold uppercase rounded-full', planBadge(t.subscription?.plan)]">{{ t.subscription?.plan || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold uppercase rounded-full', statusBadge(t.subscription?.status)]">{{ t.subscription?.status || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center text-xs text-slate-600 dark:text-slate-400">{{ t.shopCount }}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="text-[10px] font-semibold text-blue-600 hover:underline mr-2" @click="activateTenant(t)">Activate</button>
                    <button class="text-[10px] font-semibold text-red-500 hover:underline" @click="suspend(t.id)">Suspend</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Payments                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'payments'">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Pending Payments</h3>
          </div>
          <div v-if="pendingPayments.length === 0" class="p-10 text-center">
            <p class="text-xs text-slate-500">Tidak ada pembayaran pending.</p>
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-for="p in pendingPayments" :key="p.id" class="px-5 py-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ p.tenant?.name }} — {{ p.plan }} ({{ p.cycle }})</p>
                <p class="text-[10px] text-slate-500">{{ p.method }} • Rp {{ p.amount.toLocaleString('id-ID') }} • {{ new Date(p.createdAt).toLocaleDateString('id-ID') }}</p>
              </div>
              <div class="flex gap-2">
                <button class="h-7 px-3 text-[10px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="verifyPayment(p.id)">Verify</button>
                <button class="h-7 px-3 text-[10px] font-bold border border-red-300 text-red-600 rounded-md hover:bg-red-50" @click="rejectPayment(p.id)">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Activate Modal -->
    <div v-if="showActivateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showActivateModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Activate Subscription</h3>
        <p class="text-xs text-slate-500">Tenant: <strong>{{ activatingTenant?.name }}</strong></p>
        <select v-model="activatePlan" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select v-model="activateCycle" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
          <option value="MONTHLY">Bulanan</option>
          <option value="YEARLY">Tahunan</option>
          <option value="LIFETIME">Lifetime</option>
        </select>
        <div class="flex justify-end gap-2">
          <button class="h-9 px-4 text-xs font-semibold border border-slate-300 rounded-lg" @click="showActivateModal = false">Batal</button>
          <button class="h-9 px-4 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700" @click="confirmActivate">Activate</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/shared/services/api';

type Tab = 'dashboard' | 'tenants' | 'payments';
const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'payments', label: 'Payments' },
];
const activeTab = ref<Tab>('dashboard');

// Stats
const stats = ref({ totalTenants: 0, activeSubs: 0, trialSubs: 0, expiredSubs: 0, totalRevenue: 0, pendingPayments: 0 });

// Tenants
const tenants = ref<any[]>([]);
const searchTenant = ref('');

// Payments
const pendingPayments = ref<any[]>([]);

// Activate modal
const showActivateModal = ref(false);
const activatingTenant = ref<any>(null);
const activatePlan = ref('PRO');
const activateCycle = ref('MONTHLY');

async function fetchStats() {
  try {
    const { data } = await api.get('/tenants/stats/overview');
    stats.value = data;
  } catch { /* */ }
}

async function fetchTenants() {
  try {
    const { data } = await api.get('/tenants', { params: { search: searchTenant.value || undefined } });
    tenants.value = data.data || [];
  } catch { tenants.value = []; }
}

async function fetchPayments() {
  try {
    const { data } = await api.get('/tenants/payments/pending');
    pendingPayments.value = data.data || [];
  } catch { pendingPayments.value = []; }
}

function activateTenant(t: any) {
  activatingTenant.value = t;
  showActivateModal.value = true;
}

async function confirmActivate() {
  if (!activatingTenant.value) return;
  try {
    await api.put(`/tenants/${activatingTenant.value.id}/activate`, { plan: activatePlan.value, cycle: activateCycle.value });
    showActivateModal.value = false;
    fetchTenants();
    fetchStats();
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Gagal activate');
  }
}

async function suspend(id: string) {
  if (!confirm('Suspend tenant ini?')) return;
  try {
    await api.put(`/tenants/${id}/suspend`);
    fetchTenants();
  } catch { /* */ }
}

async function verifyPayment(id: string) {
  if (!confirm('Verify payment ini? Subscription akan aktif.')) return;
  try {
    await api.put(`/tenants/payments/${id}/verify`, {});
    fetchPayments();
    fetchStats();
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Gagal verify');
  }
}

async function rejectPayment(id: string) {
  const reason = prompt('Alasan reject:');
  if (!reason) return;
  try {
    await api.put(`/tenants/payments/${id}/reject`, { reason });
    fetchPayments();
  } catch { /* */ }
}

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function planBadge(plan?: string) {
  if (plan === 'ENTERPRISE') return 'bg-purple-100 text-purple-700';
  if (plan === 'PRO') return 'bg-blue-100 text-blue-700';
  if (plan === 'BASIC') return 'bg-slate-100 text-slate-700';
  if (plan === 'TRIAL') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

function statusBadge(status?: string) {
  if (status === 'ACTIVE' || status === 'LIFETIME') return 'bg-emerald-100 text-emerald-700';
  if (status === 'TRIAL') return 'bg-blue-100 text-blue-700';
  if (status === 'EXPIRED') return 'bg-amber-100 text-amber-700';
  if (status === 'SUSPENDED') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-500';
}

onMounted(() => {
  fetchStats();
  fetchTenants();
  fetchPayments();
});
</script>
