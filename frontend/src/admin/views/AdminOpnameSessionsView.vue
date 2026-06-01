<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div></div>
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
               hover:bg-blue-700 transition-colors flex items-center gap-2"
        @click="handleCreate"
        :disabled="creating"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ creating ? 'Membuat...' : 'Mulai Opname' }}
      </button>
    </div>

    <!-- Filter -->
    <div class="flex gap-3">
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="IN_PROGRESS">Sedang Berjalan</option>
        <option value="COMPLETED">Selesai</option>
        <option value="CANCELLED">Dibatalkan</option>
      </select>
    </div>

    <!-- Sessions List -->
    <div v-if="loading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <div v-else-if="sessions.length === 0" class="text-center py-10 text-slate-400 text-sm">
      Belum ada sesi opname. Klik "Mulai Opname" untuk memulai.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer"
        @click="openDetail(session)"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900">{{ session.sessionNumber }}</span>
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', statusBadge(session.status)]">
                {{ statusLabel(session.status) }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Oleh {{ session.conductorName }} &middot; {{ formatDate(session.createdAt) }}
            </p>
          </div>
          <div class="text-right text-xs text-slate-600">
            <p>{{ session.totalProducts }} produk</p>
            <p v-if="session.status === 'COMPLETED'" class="mt-0.5">
              <span class="text-emerald-600">{{ session.totalMatched }} cocok</span> &middot;
              <span class="text-amber-600">{{ session.totalSurplus }} surplus</span> &middot;
              <span class="text-red-600">{{ session.totalDeficit }} kurang</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="flex justify-center gap-2 pt-3">
        <button
          v-for="p in meta.totalPages"
          :key="p"
          type="button"
          :class="[
            'h-8 w-8 rounded text-xs font-semibold transition-colors',
            currentPage === p
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          ]"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Detail Modal                                  -->
    <!-- ============================================ -->
    <teleport to="body">
      <div
        v-if="showDetail"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showDetail = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 class="text-base font-bold text-slate-900">{{ detail?.sessionNumber }}</h2>
              <p class="text-xs text-slate-500">
                {{ detail?.conductorName }} &middot; {{ detail ? formatDate(detail.createdAt) : '' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', detail ? statusBadge(detail.status) : '']">
                {{ detail ? statusLabel(detail.status) : '' }}
              </span>
              <button @click="showDetail = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div v-if="detailLoading" class="text-center py-10 text-slate-500 text-sm">Memuat detail...</div>
            <div v-else-if="detail">
              <!-- Summary Cards (for completed) -->
              <div v-if="detail.status === 'COMPLETED'" class="grid grid-cols-4 gap-3 mb-5">
                <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-emerald-700">{{ detail.totalMatched }}</p>
                  <p class="text-[10px] text-emerald-600 uppercase font-semibold">Cocok</p>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-amber-700">{{ detail.totalSurplus }}</p>
                  <p class="text-[10px] text-amber-600 uppercase font-semibold">Surplus</p>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-red-700">{{ detail.totalDeficit }}</p>
                  <p class="text-[10px] text-red-600 uppercase font-semibold">Kurang</p>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-red-600">{{ formatRupiah(calcLossValue()) }}</p>
                  <p class="text-[10px] text-slate-600 uppercase font-semibold">Kerugian</p>
                </div>
              </div>

              <!-- Items Table -->
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-200">
                    <th class="pb-2 pr-3">Produk</th>
                    <th class="pb-2 pr-3 text-right">Sistem</th>
                    <th class="pb-2 pr-3 text-right">Fisik</th>
                    <th class="pb-2 pr-3 text-right">Selisih</th>
                    <th class="pb-2">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in detail.items"
                    :key="item.id"
                    class="border-b border-slate-100 last:border-0"
                  >
                    <td class="py-2.5 pr-3">
                      <p class="text-xs font-medium text-slate-900">{{ item.productName }}</p>
                      <p class="text-[10px] text-slate-400">{{ item.productSku }}</p>
                    </td>
                    <td class="py-2.5 pr-3 text-right text-xs text-slate-700">{{ item.systemQty }}</td>
                    <td class="py-2.5 pr-3 text-right">
                      <template v-if="detail.status === 'IN_PROGRESS'">
                        <input
                          type="number"
                          :value="item.actualQty ?? ''"
                          min="0"
                          class="w-16 h-7 px-2 text-xs text-right border border-slate-300 rounded
                                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          @change="(e) => handleUpdateItem(item.id, parseInt((e.target as HTMLInputElement).value), item.systemQty, item.reason)"
                        />
                      </template>
                      <template v-else>
                        <span class="text-xs text-slate-700">{{ item.actualQty ?? '-' }}</span>
                      </template>
                    </td>
                    <td class="py-2.5 pr-3 text-right">
                      <span
                        v-if="item.variance !== null"
                        :class="[
                          'text-xs font-semibold',
                          item.variance === 0 ? 'text-slate-400' :
                          item.variance > 0 ? 'text-amber-600' : 'text-red-600'
                        ]"
                      >
                        {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
                      </span>
                      <span v-else class="text-xs text-slate-300">-</span>
                    </td>
                    <td class="py-2.5">
                      <template v-if="detail.status === 'IN_PROGRESS' && item.variance !== null && item.variance !== 0">
                        <select
                          :value="item.reason || ''"
                          class="h-7 px-1.5 text-[10px] border border-slate-300 rounded focus:border-blue-500 outline-none"
                          @change="(e) => handleUpdateReason(item.id, (e.target as HTMLSelectElement).value, item.actualQty!, item.systemQty)"
                        >
                          <option value="">— Pilih —</option>
                          <option value="HILANG">Hilang</option>
                          <option value="RUSAK">Rusak</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="SALAH_HITUNG">Salah Hitung</option>
                          <option value="LAINNYA">Lainnya</option>
                        </select>
                      </template>
                      <template v-else-if="item.reason">
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded', reasonBadge(item.reason)]">{{ reasonLabel(item.reason) }}</span>
                      </template>
                      <template v-else>
                        <span class="text-[10px] text-slate-300">—</span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer -->
          <div v-if="detail && detail.status === 'IN_PROGRESS'" class="px-6 py-4 border-t border-slate-200 flex justify-between">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-lg
                     hover:bg-red-50 transition-colors"
              @click="handleCancel"
              :disabled="completing"
            >
              Batalkan
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                class="h-9 px-4 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg
                       hover:bg-slate-50 transition-colors"
                @click="handleComplete(false)"
                :disabled="completing"
              >
                Selesai (Tanpa Adjustment)
              </button>
              <button
                type="button"
                class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
                       hover:bg-blue-700 transition-colors"
                @click="handleComplete(true)"
                :disabled="completing"
              >
                {{ completing ? 'Menyimpan...' : 'Selesai & Update Stok' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import opnameService, {
  type OpnameSessionDto,
  type OpnameSessionDetailDto,
  type OpnameListResponse,
  type OpnameStatus,
} from '@/shared/services/opname.service';

const authStore = useAuthStore();
const { ask } = useConfirm();
const toast = useToast();

// ============================================
// State
// ============================================
const sessions = ref<OpnameSessionDto[]>([]);
const meta = ref<OpnameListResponse['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const creating = ref(false);
const filterStatus = ref<string>('');
const currentPage = ref(1);

// Detail modal
const showDetail = ref(false);
const detail = ref<OpnameSessionDetailDto | null>(null);
const detailLoading = ref(false);
const completing = ref(false);

// ============================================
// Helpers
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status: OpnameStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    case 'DRAFT': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: OpnameStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'Berjalan';
    case 'COMPLETED': return 'Selesai';
    case 'CANCELLED': return 'Dibatalkan';
    case 'DRAFT': return 'Draft';
    default: return status;
  }
}

// ============================================
// Methods
// ============================================

async function fetchSessions() {
  loading.value = true;
  error.value = null;
  try {
    const shopId = getShopId();
    const response = await opnameService.listSessions({
      shopId,
      status: (filterStatus.value as OpnameStatus) || undefined,
      page: currentPage.value,
      limit: 20,
    });
    sessions.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat sesi opname.';
  } finally {
    loading.value = false;
  }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchSessions();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchSessions();
}

async function handleCreate() {
  const shopId = getShopId();
  if (!shopId) return;
  creating.value = true;
  try {
    await opnameService.createSession({ shopId });
    await fetchSessions();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal membuat sesi opname.');
  } finally {
    creating.value = false;
  }
}

async function openDetail(session: OpnameSessionDto) {
  showDetail.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await opnameService.getSession(session.id);
  } catch {
    detail.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function handleUpdateItem(itemId: string, actualQty: number, systemQty: number, reason?: string | null) {
  if (isNaN(actualQty) || actualQty < 0) return;
  try {
    const updated = await opnameService.updateItem(itemId, { actualQty, reason: reason || undefined });
    // Update local state
    if (detail.value) {
      const idx = detail.value.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        detail.value.items[idx].actualQty = updated.actualQty;
        detail.value.items[idx].variance = updated.variance;
      }
    }
  } catch {
    // silent
  }
}

async function handleUpdateReason(itemId: string, reason: string, actualQty: number, systemQty: number) {
  try {
    await opnameService.updateItem(itemId, { actualQty, reason: reason || undefined });
    if (detail.value) {
      const item = detail.value.items.find((i: any) => i.id === itemId);
      if (item) item.reason = reason || null;
    }
  } catch { /* silent */ }
}

function reasonLabel(reason: string): string {
  const map: Record<string, string> = { HILANG: 'Hilang', RUSAK: 'Rusak', EXPIRED: 'Expired', SALAH_HITUNG: 'Salah Hitung', LAINNYA: 'Lainnya' };
  return map[reason] || reason;
}

function reasonBadge(reason: string): string {
  const map: Record<string, string> = { HILANG: 'bg-red-100 text-red-700', RUSAK: 'bg-amber-100 text-amber-700', EXPIRED: 'bg-purple-100 text-purple-700', SALAH_HITUNG: 'bg-blue-100 text-blue-700', LAINNYA: 'bg-slate-100 text-slate-700' };
  return map[reason] || 'bg-slate-100 text-slate-700';
}

function calcLossValue(): number {
  if (!detail.value) return 0;
  return detail.value.items
    .filter((i: any) => i.variance !== null && i.variance < 0)
    .reduce((sum: number, i: any) => sum + (Math.abs(i.variance) * (i.productPrice || 0)), 0);
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

async function handleComplete(applyAdjustments: boolean) {
  if (!detail.value) return;

  const uncounted = detail.value.items.filter((i) => i.actualQty === null).length;
  if (uncounted > 0) {
    toast.warning(`Masih ada ${uncounted} produk yang belum dihitung.`);
    return;
  }

  const msg = applyAdjustments
    ? 'Selesaikan opname DAN update stok sesuai hasil hitung fisik?'
    : 'Selesaikan opname TANPA mengubah stok?';
  const confirmed = await ask({ title: 'Selesaikan Opname?', message: msg, confirmLabel: 'Selesaikan', variant: applyAdjustments ? 'danger' : 'primary' });
  if (!confirmed) return;

  completing.value = true;
  try {
    await opnameService.completeSession(detail.value.id, applyAdjustments);
    showDetail.value = false;
    await fetchSessions();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal menyelesaikan opname.');
  } finally {
    completing.value = false;
  }
}

async function handleCancel() {
  if (!detail.value) return;
  const confirmed = await ask({ title: 'Batalkan Opname?', message: 'Sesi opname ini akan dibatalkan. Data hitung yang sudah diinput tidak akan disimpan.', confirmLabel: 'Batalkan', variant: 'danger' });
  if (!confirmed) return;
  try {
    await opnameService.cancelSession(detail.value.id);
    showDetail.value = false;
    await fetchSessions();
  } catch (err: any) {
    alert(err.response?.data?.message ?? 'Gagal membatalkan opname.');
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchSessions();
});

useAutoRefresh(fetchSessions);
</script>
