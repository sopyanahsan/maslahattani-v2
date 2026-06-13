<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900">Posify Owner</h1>
          <p class="text-[10px] text-slate-500">Platform Dashboard</p>
        </div>
      </div>
      <a href="/admin/home" class="text-[11px] font-semibold text-blue-600 hover:underline">← Admin Panel</a>
    </header>

    <!-- Tabs -->
    <div class="sticky top-14 z-20 bg-white border-b border-slate-200 px-4 sm:px-6">
      <div class="flex gap-1 py-2 overflow-x-auto">
        <button v-for="t in tabs" :key="t.key" :class="['shrink-0 h-8 px-4 text-xs font-semibold rounded-md transition-colors', activeTab === t.key ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100']" @click="activeTab = t.key">{{ t.label }}</button>
      </div>
    </div>

    <div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      <!-- ============================================ -->
      <!-- TAB: Dashboard                              -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'dashboard'">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Total Tenant</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stats.totalTenants }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Aktif (Bayar)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.activeSubs }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Trial</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ stats.trialSubs }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Revenue Total</p>
            <p class="text-xl font-bold text-slate-900 mt-1">{{ formatRupiah(stats.totalRevenue) }}</p>
          </div>
        </div>

        <!-- Two columns: Expiring Soon + Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Expiring Soon -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-100 bg-amber-50 flex items-center justify-between">
              <h3 class="text-xs font-bold text-amber-800">Expiring Soon (7 hari)</h3>
              <span class="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{{ expiringSoon.length }}</span>
            </div>
            <div v-if="expiringSoon.length === 0" class="p-6 text-center">
              <p class="text-xs text-slate-500">Tidak ada yang expire dalam 7 hari.</p>
            </div>
            <div v-else class="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
              <div v-for="t in expiringSoon" :key="t.id" class="px-5 py-3 flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-900">{{ t.name }}</p>
                  <p class="text-[10px] text-slate-500">{{ t.ownerPhone }} • expire {{ formatDate(t.subscription?.endDate) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="['px-1.5 py-0.5 text-[8px] font-bold rounded', daysUntil(t.subscription?.endDate) <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700']">H-{{ daysUntil(t.subscription?.endDate) }}</span>
                  <button class="text-[10px] font-semibold text-blue-600 hover:underline" @click="copyWaReminder(t)">WA</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 class="text-xs font-bold text-slate-700">Aktivitas Terbaru</h3>
            </div>
            <div v-if="recentActivity.length === 0" class="p-6 text-center">
              <p class="text-xs text-slate-500">Belum ada aktivitas.</p>
            </div>
            <div v-else class="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
              <div v-for="a in recentActivity" :key="a.id" class="px-5 py-3 flex items-start gap-3">
                <span :class="['w-2 h-2 rounded-full shrink-0 mt-1.5', activityDot(a.type)]"></span>
                <div>
                  <p class="text-xs text-slate-800"><strong>{{ a.tenantName }}</strong> {{ a.description }}</p>
                  <p class="text-[10px] text-slate-400">{{ timeAgo(a.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Conversion + Revenue Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Conversion (Trial→Bayar)</p>
            <p class="text-xl font-bold text-indigo-600 mt-1">{{ stats.totalTenants > 0 ? Math.round((stats.activeSubs / stats.totalTenants) * 100) : 0 }}%</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Expired/Suspend</p>
            <p class="text-xl font-bold text-red-500 mt-1">{{ stats.expiredSubs }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p class="text-[9px] font-bold uppercase text-slate-400">Pending Bayar</p>
            <p class="text-xl font-bold text-amber-500 mt-1">{{ stats.pendingPayments }}</p>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Tenants                                -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'tenants'">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="searchTenant" type="text" placeholder="Cari nama toko / email / WA..." class="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500" @keyup.enter="fetchTenants" />
          <select v-model="filterStatus" class="h-9 px-3 text-sm border border-slate-200 rounded-lg" @change="fetchTenants">
            <option value="">Semua Status</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="LIFETIME">Lifetime</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg" @click="fetchTenants">Cari</button>
        </div>

        <!-- Table -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Toko</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Owner</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Plan</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase">Expire</th>
                  <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="t in tenants" :key="t.id" class="hover:bg-slate-50/50">
                  <td class="px-4 py-3">
                    <p class="text-xs font-semibold text-slate-900">{{ t.name }}</p>
                    <p class="text-[10px] text-slate-500">{{ t.shopCount }} cabang • {{ t.userCount || 0 }} user</p>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-xs text-slate-700">{{ t.ownerName }}</p>
                    <p class="text-[10px] text-slate-500">{{ t.ownerPhone }}</p>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold uppercase rounded-full', planBadge(t.subscription?.plan)]">{{ t.subscription?.plan || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold uppercase rounded-full', statusBadge(t.subscription?.status)]">{{ t.subscription?.status || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center text-[10px] text-slate-600">{{ t.subscription?.endDate ? formatDate(t.subscription.endDate) : '∞' }}</td>
                  <td class="px-4 py-3 text-right space-x-1">
                    <button class="text-[10px] font-semibold text-blue-600 hover:underline" @click="activateTenant(t)">Activate</button>
                    <button class="text-[10px] font-semibold text-emerald-600 hover:underline" @click="extendTenant(t)">Extend</button>
                    <button class="text-[10px] font-semibold text-red-500 hover:underline" @click="suspend(t.id)">Suspend</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tenants.length === 0" class="p-10 text-center">
            <p class="text-xs text-slate-500">Belum ada tenant terdaftar.</p>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Payments                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'payments'">
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900">Pending Payments</h3>
            <button class="text-[10px] font-semibold text-blue-600 hover:underline" @click="fetchPayments">Refresh</button>
          </div>
          <div v-if="pendingPayments.length === 0" class="p-10 text-center">
            <p class="text-xs text-slate-500">Tidak ada pembayaran pending.</p>
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="p in pendingPayments" :key="p.id" class="px-5 py-4 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-900 truncate">{{ p.tenant?.name }} — {{ p.plan }} ({{ p.cycle }})</p>
                <p class="text-[10px] text-slate-500">{{ p.method }} • Rp {{ p.amount?.toLocaleString('id-ID') }} • {{ new Date(p.createdAt).toLocaleDateString('id-ID') }}</p>
                <p v-if="p.uniqueCode" class="text-[10px] text-amber-600 font-mono">Kode: {{ p.uniqueCode }}</p>
              </div>
              <div class="flex gap-2 shrink-0">
                <button class="h-7 px-3 text-[10px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="verifyPayment(p.id)">Verify</button>
                <button class="h-7 px-3 text-[10px] font-bold border border-red-300 text-red-600 rounded-md hover:bg-red-50" @click="rejectPayment(p.id)">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: WA Reminder                            -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'reminder'">
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 class="text-xs font-bold text-slate-700">Template WA Reminder — klik untuk copy</h3>
          </div>
          <div v-if="expiringSoon.length === 0" class="p-10 text-center">
            <p class="text-xs text-slate-500">Semua tenant aman — tidak ada yang expire dalam 7 hari.</p>
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="t in expiringSoon" :key="t.id" class="px-5 py-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-xs font-semibold text-slate-900">{{ t.name }} — {{ t.ownerName }}</p>
                  <p class="text-[10px] text-slate-500">{{ t.ownerPhone }} • Plan: {{ t.subscription?.plan }} • Expire: {{ formatDate(t.subscription?.endDate) }}</p>
                </div>
                <span :class="['px-1.5 py-0.5 text-[8px] font-bold rounded', daysUntil(t.subscription?.endDate) <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700']">H-{{ daysUntil(t.subscription?.endDate) }}</span>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 relative group">
                <pre class="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{{ generateWaMessage(t) }}</pre>
                <button class="absolute top-2 right-2 h-6 px-2 text-[9px] font-bold bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity" @click="copyText(generateWaMessage(t))">Copy</button>
              </div>
              <a :href="'https://wa.me/' + cleanPhone(t.ownerPhone) + '?text=' + encodeURIComponent(generateWaMessage(t))" target="_blank" class="inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600 hover:underline">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                Buka WhatsApp
              </a>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: System                                 -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'system'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <h3 class="text-sm font-bold text-slate-900 mb-3">Maintenance Mode</h3>
            <p class="text-xs text-slate-500 mb-3">Block akses semua tenant (kecuali owner) saat maintenance.</p>
            <button :class="['h-9 px-4 text-xs font-bold rounded-lg transition-colors', maintenanceMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']" @click="toggleMaintenance">
              {{ maintenanceMode ? 'Maintenance ON — Klik untuk OFF' : 'OFF — Klik untuk ON' }}
            </button>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-5">
            <h3 class="text-sm font-bold text-slate-900 mb-3">Quick Stats</h3>
            <ul class="space-y-2 text-xs text-slate-600">
              <li>Tenants total: <strong class="text-slate-900">{{ stats.totalTenants }}</strong></li>
              <li>Pending payments: <strong class="text-amber-600">{{ stats.pendingPayments }}</strong></li>
              <li>Expiring (7d): <strong class="text-red-500">{{ expiringSoon.length }}</strong></li>
            </ul>
          </div>
        </div>
      </template>
    </div>

    <!-- Activate Modal -->
    <Teleport to="body">
      <div v-if="showActivateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showActivateModal = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-base font-bold text-slate-900">Activate Subscription</h3>
          <p class="text-xs text-slate-500">Tenant: <strong>{{ activatingTenant?.name }}</strong></p>
          <select v-model="activatePlan" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg">
            <option value="STARTER">Starter — Rp 29rb/bln</option>
            <option value="BRILINK">BRILink — Rp 49rb/bln</option>
            <option value="PRO">Pro — Rp 79rb/bln</option>
            <option value="BUSINESS">Business — Rp 149rb/bln</option>
          </select>
          <select v-model="activateCycle" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg">
            <option value="MONTHLY">Bulanan</option>
            <option value="YEARLY">Tahunan</option>
            <option value="LIFETIME">Lifetime</option>
          </select>
          <div class="flex justify-end gap-2">
            <button class="h-9 px-4 text-xs font-semibold border border-slate-200 rounded-lg" @click="showActivateModal = false">Batal</button>
            <button class="h-9 px-4 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700" @click="confirmActivate">Activate</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Copied Toast -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCopied" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/shared/services/api';

type Tab = 'dashboard' | 'tenants' | 'payments' | 'reminder' | 'system';
const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'payments', label: 'Payments' },
  { key: 'reminder', label: 'WA Reminder' },
  { key: 'system', label: 'System' },
];
const activeTab = ref<Tab>('dashboard');

// ============================================
// State
// ============================================
const stats = ref({ totalTenants: 0, activeSubs: 0, trialSubs: 0, expiredSubs: 0, totalRevenue: 0, pendingPayments: 0 });
const tenants = ref<any[]>([]);
const expiringSoon = ref<any[]>([]);
const recentActivity = ref<any[]>([]);
const pendingPayments = ref<any[]>([]);
const searchTenant = ref('');
const filterStatus = ref('');
const maintenanceMode = ref(false);
const showCopied = ref(false);

// Activate modal
const showActivateModal = ref(false);
const activatingTenant = ref<any>(null);
const activatePlan = ref('PRO');
const activateCycle = ref('MONTHLY');

// ============================================
// Fetch
// ============================================
async function fetchStats() {
  try { const { data } = await api.get('/tenants/stats/overview'); stats.value = data; } catch { /* */ }
}

async function fetchTenants() {
  try {
    const { data } = await api.get('/tenants', { params: { search: searchTenant.value || undefined, status: filterStatus.value || undefined } });
    tenants.value = data.data || [];
    // Build expiring soon list (within 7 days)
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expiringSoon.value = tenants.value.filter((t: any) => {
      if (!t.subscription?.endDate) return false;
      const end = new Date(t.subscription.endDate).getTime();
      return end > now && end - now < sevenDays;
    }).sort((a: any, b: any) => new Date(a.subscription.endDate).getTime() - new Date(b.subscription.endDate).getTime());

    // Build recent activity (from tenants sorted by date)
    recentActivity.value = tenants.value.slice(0, 10).map((t: any) => ({
      id: t.id,
      tenantName: t.name,
      type: t.subscription?.status === 'TRIAL' ? 'register' : t.subscription?.status === 'ACTIVE' ? 'paid' : 'expired',
      description: t.subscription?.status === 'TRIAL' ? 'registered (Trial)' : t.subscription?.status === 'ACTIVE' ? `paid ${t.subscription.plan}/${t.subscription.cycle}` : `status: ${t.subscription?.status}`,
      createdAt: t.createdAt,
    }));
  } catch { tenants.value = []; }
}

async function fetchPayments() {
  try { const { data } = await api.get('/tenants/payments/pending'); pendingPayments.value = data.data || []; } catch { pendingPayments.value = []; }
}

// ============================================
// Actions
// ============================================
function activateTenant(t: any) { activatingTenant.value = t; showActivateModal.value = true; }

async function confirmActivate() {
  if (!activatingTenant.value) return;
  try {
    await api.put(`/tenants/${activatingTenant.value.id}/activate`, { plan: activatePlan.value, cycle: activateCycle.value });
    showActivateModal.value = false;
    fetchTenants(); fetchStats();
  } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); }
}

async function extendTenant(t: any) {
  const days = prompt(`Extend "${t.name}" berapa hari? (gratis, tanpa bayar)`, '30');
  if (!days) return;
  try {
    await api.put(`/tenants/${t.id}/activate`, { plan: t.subscription?.plan || 'STARTER', cycle: 'MONTHLY' });
    fetchTenants(); fetchStats();
    alert(`Extended +30 hari!`);
  } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); }
}

async function suspend(id: string) {
  if (!confirm('Suspend tenant ini? Mereka tidak bisa akses sampai di-activate lagi.')) return;
  try { await api.put(`/tenants/${id}/suspend`); fetchTenants(); fetchStats(); } catch { /* */ }
}

async function verifyPayment(id: string) {
  if (!confirm('Verify payment ini? Subscription tenant akan langsung aktif.')) return;
  try { await api.put(`/tenants/payments/${id}/verify`, {}); fetchPayments(); fetchStats(); fetchTenants(); } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); }
}

async function rejectPayment(id: string) {
  const reason = prompt('Alasan reject:');
  if (!reason) return;
  try { await api.put(`/tenants/payments/${id}/reject`, { reason }); fetchPayments(); } catch { /* */ }
}

function toggleMaintenance() {
  maintenanceMode.value = !maintenanceMode.value;
  api.put('/settings/system', { maintenanceMode: maintenanceMode.value }).catch(() => {});
}

// ============================================
// WA Reminder
// ============================================
function generateWaMessage(t: any): string {
  const plan = t.subscription?.plan || 'Basic';
  const endDate = t.subscription?.endDate ? formatDate(t.subscription.endDate) : '-';
  const days = daysUntil(t.subscription?.endDate);
  return `Halo ${t.ownerName},\n\nIni reminder dari Posify bahwa langganan toko "${t.name}" (plan ${plan}) akan berakhir dalam ${days} hari (${endDate}).\n\nUntuk perpanjang, silakan transfer sesuai paket yang dipilih dan konfirmasi di halaman Billing.\n\nTerima kasih!\n— Tim Posify`;
}

function copyWaReminder(t: any) { copyText(generateWaMessage(t)); }

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  showCopied.value = true;
  setTimeout(() => { showCopied.value = false; }, 2000);
}

function cleanPhone(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  return clean;
}

// ============================================
// Helpers
// ============================================
function formatRupiah(n: number) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }

function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso?: string): number {
  if (!iso) return 999;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function activityDot(type: string) {
  if (type === 'register') return 'bg-blue-500';
  if (type === 'paid') return 'bg-emerald-500';
  return 'bg-red-400';
}

function planBadge(plan?: string) {
  if (plan === 'BUSINESS') return 'bg-purple-100 text-purple-700';
  if (plan === 'PRO') return 'bg-blue-100 text-blue-700';
  if (plan === 'BRILINK') return 'bg-teal-100 text-teal-700';
  if (plan === 'STARTER') return 'bg-slate-100 text-slate-700';
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

// ============================================
// Init
// ============================================
onMounted(() => { fetchStats(); fetchTenants(); fetchPayments(); });
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.3s 1.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Fancy CSS */
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-6 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-6 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-6 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-6 > *:nth-child(3) { animation-delay: 160ms; }
.space-y-6 > *:nth-child(4) { animation-delay: 240ms; }

@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.grid > div[class*="rounded-lg"] { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.grid > div:nth-child(1) { animation-delay: 100ms; }
.grid > div:nth-child(2) { animation-delay: 180ms; }
.grid > div:nth-child(3) { animation-delay: 260ms; }
.grid > div:nth-child(4) { animation-delay: 340ms; }

table tbody tr { transition: all 0.15s ease; }
table tbody tr:hover { box-shadow: inset 3px 0 0 #7C3AED; }

@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
div[class*="rounded-lg"][class*="shadow-xl"] { animation: scaleIn 0.25s ease-out; }
</style>
