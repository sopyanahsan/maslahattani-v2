<template>
  <div class="space-y-5">
    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Role & Permission                      -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'permissions'">
      <!-- Role selector -->
      <div class="flex items-center gap-3 mb-4">
        <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Role:</label>
        <select
          v-model="selectedRole"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="fetchRolePermissions"
        >
          <option value="ADMIN">Admin Cabang</option>
        </select>
        <span class="text-[10px] text-slate-400 dark:text-slate-500">Super Admin selalu punya semua akses. Kasir hanya akses webapp POS.</span>
      </div>

      <!-- Loading -->
      <div v-if="permLoading" class="flex items-center justify-center py-12">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      </div>

      <!-- Permission Groups -->
      <div v-else class="space-y-4">
        <div
          v-for="group in permissionGroups"
          :key="group.group"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
        >
          <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{{ group.group }}</h3>
          </div>
          <div class="px-5 py-3 space-y-3">
            <label
              v-for="perm in group.permissions"
              :key="perm.key"
              class="flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ perm.label }}</span>
                <span class="text-[9px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">{{ perm.key }}</span>
              </div>
              <button
                type="button"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                  rolePermissions[perm.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
                ]"
                @click="togglePermission(perm.key)"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    rolePermissions[perm.key] ? 'translate-x-6' : 'translate-x-1',
                  ]"
                />
              </button>
            </label>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex items-center justify-between pt-2">
          <p v-if="saveSuccess" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Perubahan tersimpan!</p>
          <p v-if="saveError" class="text-xs font-semibold text-red-600 dark:text-red-400">{{ saveError }}</p>
          <button
            type="button"
            :disabled="saving"
            class="h-9 px-5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 ml-auto"
            @click="savePermissions"
          >
            <Loader2Icon v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Kategori Cashbox                       -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'cashbox'">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
        <BoxesIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori Cashbox</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Kelola kategori kas terpisah (Retail, Subsidi Pupuk, dll).</p>
        <RouterLink
          to="/admin/cashbox-categories"
          class="inline-flex items-center gap-1.5 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Buka Kelola Kategori
        </RouterLink>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Audit Log                              -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'audit'">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Audit Log</h3>
          <button type="button" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400" @click="fetchAuditLogs">Refresh</button>
        </div>
        <div v-if="auditLoading" class="flex items-center justify-center py-12">
          <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        </div>
        <div v-else-if="auditLogs.length === 0" class="px-5 py-10 text-center">
          <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada aktivitas tercatat.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <tr>
                <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Waktu</th>
                <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">User</th>
                <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Aksi</th>
                <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Resource</th>
                <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
                <td class="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ log.userName }}</td>
                <td class="px-4 py-2">
                  <span :class="['px-1.5 py-0.5 text-[9px] font-bold uppercase rounded', actionBadge(log.action)]">{{ log.action }}</span>
                </td>
                <td class="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">{{ log.resource || '-' }}</td>
                <td class="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{{ log.details || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: System Settings                        -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'system'">
      <div class="space-y-4">
        <!-- Maintenance Mode -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nonaktifkan akses kasir ke webapp saat maintenance.</p>
            </div>
            <button
              type="button"
              :class="[
                'relative w-12 h-6 rounded-full transition-colors',
                systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600',
              ]"
              @click="systemSettings.maintenanceMode = !systemSettings.maintenanceMode"
            >
              <span
                :class="[
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5',
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Auto-Logout Timeout -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Auto-Logout Timeout</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Durasi idle sebelum admin otomatis logout (menit).</p>
          <input
            v-model.number="systemSettings.autoLogoutMinutes"
            type="number"
            min="5"
            max="480"
            class="h-9 w-24 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>

        <!-- PIN Lock Attempts -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Max PIN Attempts</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Berapa kali kasir boleh salah PIN sebelum akun terkunci.</p>
          <input
            v-model.number="systemSettings.maxPinAttempts"
            type="number"
            min="3"
            max="10"
            class="h-9 w-24 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>

        <!-- Save System Settings -->
        <div class="flex justify-end">
          <button
            type="button"
            class="h-9 px-5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
            @click="saveSystemSettings"
          >
            Simpan System Settings
          </button>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Danger Zone                            -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'danger'">
      <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5 space-y-4">
        <div class="flex items-start gap-3">
          <AlertTriangleIcon class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-sm font-bold text-red-800 dark:text-red-300">Danger Zone</h3>
            <p class="text-xs text-red-600 dark:text-red-400 mt-1">Aksi di bawah ini tidak bisa di-undo. Gunakan dengan sangat hati-hati.</p>
          </div>
        </div>

        <!-- Reset Data Cabang -->
        <div class="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100">Reset Data Cabang</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Hapus semua transaksi, stok, hutang di cabang terpilih. Produk tetap ada.</p>
          </div>
          <button
            type="button"
            class="h-8 px-3 text-[11px] font-semibold text-red-600 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
            @click="confirmResetBranch"
          >
            Reset...
          </button>
        </div>

        <!-- Seed Default Permissions -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100">Re-seed Permission Defaults</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Reset permission ADMIN ke default bawaan. Aman dipanggil berkali-kali.</p>
          </div>
          <button
            type="button"
            class="h-8 px-3 text-[11px] font-semibold text-blue-600 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30"
            @click="seedPermissions"
          >
            Seed
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Loader2 as Loader2Icon,
  Boxes as BoxesIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useToast } from '@/shared/composables/useToast';
import permissionsService, { type PermissionGroup } from '@/shared/services/permissions.service';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const shopStore = useShopStore();
const toast = useToast();

// ============================================
// Tabs
// ============================================
type TabKey = 'permissions' | 'cashbox' | 'audit' | 'system' | 'danger';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'permissions', label: 'Role & Permission' },
  { key: 'cashbox', label: 'Kategori Cashbox' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'system', label: 'System' },
  { key: 'danger', label: 'Danger Zone' },
];
const activeTab = ref<TabKey>('permissions');

// ============================================
// Role & Permission
// ============================================
const selectedRole = ref('ADMIN');
const permLoading = ref(false);
const permissionGroups = ref<PermissionGroup[]>([]);
const rolePermissions = ref<Record<string, boolean>>({});
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

// Fallback permission groups (mirror backend constants)
const FALLBACK_GROUPS: PermissionGroup[] = [
  { group: 'Transaksi', permissions: [
    { key: 'transactions.view', label: 'Lihat transaksi', defaultAdmin: true },
    { key: 'transactions.void', label: 'Void transaksi', defaultAdmin: false },
    { key: 'transactions.export', label: 'Export transaksi', defaultAdmin: false },
  ]},
  { group: 'Produk', permissions: [
    { key: 'products.view', label: 'Lihat produk', defaultAdmin: true },
    { key: 'products.create', label: 'Tambah produk', defaultAdmin: true },
    { key: 'products.update', label: 'Edit produk', defaultAdmin: true },
    { key: 'products.delete', label: 'Hapus produk', defaultAdmin: false },
  ]},
  { group: 'Hutang', permissions: [
    { key: 'debts.view', label: 'Lihat hutang', defaultAdmin: true },
    { key: 'debts.create', label: 'Buat hutang', defaultAdmin: true },
    { key: 'debts.pay', label: 'Bayar hutang', defaultAdmin: true },
    { key: 'debts.delete', label: 'Hapus hutang', defaultAdmin: false },
  ]},
  { group: 'BRILink', permissions: [
    { key: 'brilink.view', label: 'Lihat BRILink', defaultAdmin: true },
    { key: 'brilink.create', label: 'Buat transaksi BRILink', defaultAdmin: true },
    { key: 'brilink.void', label: 'Void transaksi BRILink', defaultAdmin: false },
    { key: 'brilink.fee', label: 'Atur fee BRILink', defaultAdmin: true },
  ]},
  { group: 'Laporan', permissions: [
    { key: 'reports.view', label: 'Lihat laporan', defaultAdmin: true },
    { key: 'reports.export', label: 'Export laporan (PDF/Excel)', defaultAdmin: false },
  ]},
  { group: 'Shift', permissions: [
    { key: 'shifts.view', label: 'Lihat shift', defaultAdmin: true },
    { key: 'shifts.finalize', label: 'Finalisasi shift', defaultAdmin: true },
  ]},
  { group: 'User & Akun', permissions: [
    { key: 'users.view', label: 'Lihat daftar user', defaultAdmin: true },
    { key: 'users.manage', label: 'Kelola user (tambah/edit/nonaktifkan)', defaultAdmin: false },
  ]},
  { group: 'Inventaris', permissions: [
    { key: 'inventory.opname', label: 'Stock Opname', defaultAdmin: true },
    { key: 'inventory.suppliers', label: 'Supplier & PO', defaultAdmin: true },
    { key: 'inventory.transfers', label: 'Transfer Stok', defaultAdmin: true },
  ]},
  { group: 'Pengaturan', permissions: [
    { key: 'settings.shop', label: 'Pengaturan toko (fee, struk, toggle)', defaultAdmin: true },
    { key: 'settings.system', label: 'System settings (Super Admin only)', defaultAdmin: false },
  ]},
  { group: 'Cabang', permissions: [
    { key: 'shops.view', label: 'Lihat daftar cabang', defaultAdmin: false },
    { key: 'shops.manage', label: 'Kelola cabang (tambah/edit/hapus)', defaultAdmin: false },
  ]},
];

function buildDefaults(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const group of FALLBACK_GROUPS) {
    for (const perm of group.permissions) {
      defaults[perm.key] = perm.defaultAdmin;
    }
  }
  return defaults;
}

async function fetchRolePermissions() {
  permLoading.value = true;
  saveSuccess.value = false;
  saveError.value = '';
  try {
    const [groupsRes, permRes] = await Promise.all([
      permissionsService.getPermissionGroups().catch(() => null),
      permissionsService.getRolePermissions(selectedRole.value).catch(() => null),
    ]);

    permissionGroups.value = groupsRes?.groups || FALLBACK_GROUPS;
    rolePermissions.value = permRes?.permissions
      ? { ...permRes.permissions }
      : buildDefaults();
  } catch {
    permissionGroups.value = FALLBACK_GROUPS;
    rolePermissions.value = buildDefaults();
  } finally {
    permLoading.value = false;
  }
}

function togglePermission(key: string) {
  // Spread to trigger Vue reactivity properly
  rolePermissions.value = {
    ...rolePermissions.value,
    [key]: !rolePermissions.value[key],
  };
  saveSuccess.value = false;
}

async function savePermissions() {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';
  try {
    const permissions = Object.entries(rolePermissions.value).map(([permission, enabled]) => ({
      permission,
      enabled,
    }));
    await permissionsService.updateRolePermissions(selectedRole.value, permissions);
    saveSuccess.value = true;
    toast.success('Permission berhasil disimpan.');
  } catch (err: any) {
    saveError.value = err?.response?.data?.message || 'Gagal menyimpan.';
  } finally {
    saving.value = false;
  }
}

async function seedPermissions() {
  try {
    await permissionsService.seedDefaults();
    toast.success('Default permissions di-seed ulang.');
    await fetchRolePermissions();
  } catch {
    toast.error('Gagal seed permissions.');
  }
}

// ============================================
// Audit Log
// ============================================
const auditLoading = ref(false);
const auditLogs = ref<Array<{
  id: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}>>([]);

async function fetchAuditLogs() {
  auditLoading.value = true;
  try {
    const { data } = await api.get('/auth/activity-logs', { params: { limit: 50 } });
    auditLogs.value = (data.data || data || []).map((log: any) => ({
      id: log.id,
      userName: log.user?.username || log.user?.email || log.userId || '-',
      action: log.action,
      resource: log.resource || '',
      details: log.details || '',
      createdAt: log.createdAt,
    }));
  } catch {
    auditLogs.value = [];
  } finally {
    auditLoading.value = false;
  }
}

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function actionBadge(action: string): string {
  if (action === 'LOGIN') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  if (action === 'VOID') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  if (action.includes('CREATE') || action.includes('ADD')) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
  if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
}

// ============================================
// System Settings
// ============================================
const systemSettings = reactive({
  maintenanceMode: false,
  autoLogoutMinutes: 60,
  maxPinAttempts: 5,
});

async function fetchSystemSettings() {
  try {
    const { data } = await api.get('/settings/system');
    if (data) {
      systemSettings.maintenanceMode = data.maintenanceMode ?? false;
      systemSettings.autoLogoutMinutes = data.autoLogoutMinutes ?? 60;
      systemSettings.maxPinAttempts = data.maxPinAttempts ?? 5;
    }
  } catch {
    // Use defaults
  }
}

async function saveSystemSettings() {
  try {
    await api.put('/settings/system', systemSettings);
    toast.success('System settings tersimpan.');
  } catch {
    toast.error('Gagal menyimpan system settings.');
  }
}

// ============================================
// Danger Zone
// ============================================
function confirmResetBranch() {
  const confirmed = window.confirm(
    `PERHATIAN: Ini akan menghapus SEMUA transaksi, stok, hutang, shift di cabang "${shopStore.currentShopName}". Produk tetap ada. Lanjutkan?`
  );
  if (confirmed) {
    toast.info('Fitur reset cabang akan diimplementasi di versi mendatang.');
  }
}

// ============================================
// Init
// ============================================
onMounted(() => {
  fetchRolePermissions();
  fetchAuditLogs();
  fetchSystemSettings();
});
</script>
