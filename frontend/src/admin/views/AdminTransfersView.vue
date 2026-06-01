<template>
  <div class="space-y-5">
    <!-- Header -->
    <div></div>

    <!-- Filters & Actions -->
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div class="flex gap-2 items-center">
        <select
          v-model="filterStatus"
          class="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          @change="fetchTransfers"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_TRANSIT">Dalam Pengiriman</option>
          <option value="RECEIVED">Diterima</option>
          <option value="REJECTED">Ditolak</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <select
          v-model="filterDirection"
          class="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          @change="fetchTransfers"
        >
          <option value="all">Semua Arah</option>
          <option value="out">Keluar</option>
          <option value="in">Masuk</option>
        </select>
      </div>
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        @click="showCreateModal = true"
      >+ Buat Transfer</button>
    </div>

    <!-- Transfer List -->
    <div v-if="loading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
    <div v-else-if="transfers.length === 0" class="text-center py-10 text-slate-400 text-sm">Belum ada transfer stok.</div>
    <div v-else class="space-y-2">
      <div
        v-for="t in transfers"
        :key="t.id"
        class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer"
        @click="openDetail(t)"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900">{{ t.transferNumber }}</span>
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', statusBadge(t.status)]">
                {{ statusLabel(t.status) }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ t.fromShopName }} &rarr; {{ t.toShopName }} &middot; {{ t.itemCount }} item
            </p>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Diminta oleh {{ t.requestedByName }} &middot; {{ formatDate(t.requestedAt) }}
            </p>
          </div>
          <div class="text-right">
            <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Create Transfer Modal                        -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreateModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
          <h2 class="text-base font-bold text-slate-900 mb-4">Buat Transfer Stok</h2>
          <form @submit.prevent="handleCreateTransfer" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-bold text-slate-600 uppercase">Dari Cabang *</label>
                <select v-model="createForm.fromShopId" required class="mt-1 w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none">
                  <option value="">Pilih cabang asal</option>
                  <option v-for="shop in shops" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-[11px] font-bold text-slate-600 uppercase">Ke Cabang *</label>
                <select v-model="createForm.toShopId" required class="mt-1 w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none">
                  <option value="">Pilih cabang tujuan</option>
                  <option v-for="shop in shops.filter(s => s.id !== createForm.fromShopId)" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-600 uppercase">Item Transfer</label>
              <div v-for="(item, idx) in createForm.items" :key="idx" class="flex gap-2 mt-2">
                <select v-model="item.productId" required class="flex-1 h-8 px-2 text-xs border border-slate-300 rounded-lg outline-none">
                  <option value="">Pilih produk</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
                <input v-model.number="item.quantity" type="number" min="1" placeholder="Qty" required class="w-20 h-8 px-2 text-xs border border-slate-300 rounded-lg outline-none" />
                <button type="button" @click="createForm.items.splice(idx, 1)" class="text-red-500 text-xs hover:text-red-700" :disabled="createForm.items.length <= 1">x</button>
              </div>
              <button type="button" @click="createForm.items.push({ productId: '', quantity: 1 })" class="mt-2 text-xs text-blue-600 hover:underline">+ Tambah item</button>
            </div>
            <textarea v-model="createForm.notes" placeholder="Catatan (opsional)" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none resize-none"></textarea>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showCreateModal = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
              <button type="submit" :disabled="creating" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                {{ creating ? 'Membuat...' : 'Buat Transfer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Transfer Detail Modal                        -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDetailModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 class="text-base font-bold text-slate-900">{{ detail?.transferNumber }}</h2>
              <p class="text-xs text-slate-500">{{ detail?.fromShop.name }} &rarr; {{ detail?.toShop.name }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="detail" :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', statusBadge(detail.status)]">
                {{ statusLabel(detail.status) }}
              </span>
              <button @click="showDetailModal = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div v-if="detailLoading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
            <div v-else-if="detail">
              <!-- Transfer Info -->
              <div class="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <p class="text-slate-500">Diminta oleh</p>
                  <p class="font-medium text-slate-900">{{ detail.requestedBy.name }}</p>
                  <p class="text-slate-400">{{ formatDateTime(detail.requestedAt) }}</p>
                </div>
                <div v-if="detail.approvedBy">
                  <p class="text-slate-500">{{ detail.status === 'REJECTED' ? 'Ditolak oleh' : 'Disetujui oleh' }}</p>
                  <p class="font-medium text-slate-900">{{ detail.approvedBy.name }}</p>
                  <p class="text-slate-400">{{ detail.approvedAt ? formatDateTime(detail.approvedAt) : '-' }}</p>
                </div>
                <div v-if="detail.shippedAt">
                  <p class="text-slate-500">Dikirim</p>
                  <p class="text-slate-400">{{ formatDateTime(detail.shippedAt) }}</p>
                </div>
                <div v-if="detail.receivedAt">
                  <p class="text-slate-500">Diterima</p>
                  <p class="text-slate-400">{{ formatDateTime(detail.receivedAt) }}</p>
                </div>
              </div>

              <div v-if="detail.notes" class="mb-3 p-3 bg-slate-50 rounded-lg">
                <p class="text-[11px] text-slate-500 uppercase font-bold">Catatan</p>
                <p class="text-xs text-slate-700 mt-1">{{ detail.notes }}</p>
              </div>

              <div v-if="detail.approvalNotes" class="mb-3 p-3 bg-red-50 rounded-lg">
                <p class="text-[11px] text-red-500 uppercase font-bold">Catatan Penolakan</p>
                <p class="text-xs text-red-700 mt-1">{{ detail.approvalNotes }}</p>
              </div>

              <!-- Items Table -->
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-200">
                    <th class="pb-2 pr-3">Produk</th>
                    <th class="pb-2 pr-3 text-right">Qty Diminta</th>
                    <th class="pb-2 text-right">Qty Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in detail.items" :key="item.id" class="border-b border-slate-100 last:border-0">
                    <td class="py-2 pr-3">
                      <p class="text-xs font-medium text-slate-900">{{ item.productName }}</p>
                      <p class="text-[10px] text-slate-400">{{ item.productSku }}</p>
                    </td>
                    <td class="py-2 pr-3 text-right text-xs">{{ item.quantity }}</td>
                    <td class="py-2 text-right text-xs">
                      <span :class="item.receivedQty > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'">
                        {{ item.receivedQty }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="detail && !['RECEIVED', 'REJECTED', 'CANCELLED'].includes(detail.status)" class="px-6 py-4 border-t border-slate-200 flex justify-between">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              @click="handleCancel"
            >Batalkan</button>
            <div class="flex gap-2">
              <!-- Pending: approve or reject -->
              <template v-if="detail.status === 'PENDING'">
                <button
                  type="button"
                  class="h-9 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  @click="handleReject"
                >Tolak</button>
                <button
                  type="button"
                  class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                  @click="handleApprove"
                >Approve</button>
              </template>
              <!-- Approved: mark shipped -->
              <template v-if="detail.status === 'APPROVED'">
                <button
                  type="button"
                  class="h-9 px-4 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600"
                  @click="handleShip"
                >Tandai Dikirim</button>
              </template>
              <!-- In Transit: receive -->
              <template v-if="detail.status === 'IN_TRANSIT'">
                <button
                  type="button"
                  class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                  @click="handleReceive"
                >Terima Barang + Update Stok</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Reject Modal                                  -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" @click.self="showRejectModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h2 class="text-base font-bold text-slate-900 mb-3">Tolak Transfer</h2>
          <textarea v-model="rejectNotes" placeholder="Alasan penolakan (opsional)" rows="3" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none resize-none"></textarea>
          <div class="flex justify-end gap-2 pt-3">
            <button type="button" @click="showRejectModal = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
            <button type="button" @click="confirmReject" class="h-9 px-4 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Tolak Transfer</button>
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
import transferService, {
  type TransferDto,
  type TransferDetailDto,
  type TransferStatus,
} from '@/shared/services/transfer.service';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const { ask } = useConfirm();
const toast = useToast();

// ============================================
// State
// ============================================
const transfers = ref<TransferDto[]>([]);
const loading = ref(false);
const filterStatus = ref('');
const filterDirection = ref<'in' | 'out' | 'all'>('all');

// Create modal
const showCreateModal = ref(false);
const creating = ref(false);
const shops = ref<{ id: string; name: string }[]>([]);
const products = ref<{ id: string; name: string; sku: string }[]>([]);
const createForm = reactive({
  fromShopId: '',
  toShopId: '',
  notes: '',
  items: [{ productId: '', quantity: 1 }] as { productId: string; quantity: number }[],
});

// Detail modal
const showDetailModal = ref(false);
const detail = ref<TransferDetailDto | null>(null);
const detailLoading = ref(false);

// Reject modal
const showRejectModal = ref(false);
const rejectNotes = ref('');

// ============================================
// Helpers
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status: TransferStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'APPROVED': return 'bg-blue-100 text-blue-700';
    case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-700';
    case 'RECEIVED': return 'bg-emerald-100 text-emerald-700';
    case 'REJECTED': return 'bg-red-100 text-red-600';
    case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function statusLabel(status: TransferStatus): string {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'APPROVED': return 'Approved';
    case 'IN_TRANSIT': return 'Dalam Pengiriman';
    case 'RECEIVED': return 'Diterima';
    case 'REJECTED': return 'Ditolak';
    case 'CANCELLED': return 'Dibatalkan';
    default: return status;
  }
}

// ============================================
// Methods
// ============================================

async function fetchTransfers() {
  loading.value = true;
  try {
    const res = await transferService.listTransfers({
      shopId: getShopId(),
      status: (filterStatus.value as TransferStatus) || undefined,
      direction: filterDirection.value,
    });
    transfers.value = res.data;
  } catch {
    transfers.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchShops() {
  try {
    const { data } = await api.get('/shops');
    shops.value = (data.data || data).map((s: any) => ({ id: s.id, name: s.name }));
  } catch {
    shops.value = [];
  }
}

async function fetchProducts() {
  try {
    const shopId = getShopId();
    const { data } = await api.get('/products', { params: { shopId } });
    products.value = (data.data || data).map((p: any) => ({ id: p.id, name: p.name, sku: p.sku }));
  } catch {
    products.value = [];
  }
}

async function openDetail(t: TransferDto) {
  showDetailModal.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await transferService.getTransfer(t.id);
  } catch {
    detail.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function handleCreateTransfer() {
  if (!createForm.fromShopId || !createForm.toShopId || createForm.items.length === 0) return;
  creating.value = true;
  try {
    await transferService.createTransfer({
      fromShopId: createForm.fromShopId,
      toShopId: createForm.toShopId,
      notes: createForm.notes || undefined,
      items: createForm.items.filter((i) => i.productId),
    });
    showCreateModal.value = false;
    createForm.fromShopId = '';
    createForm.toShopId = '';
    createForm.notes = '';
    createForm.items = [{ productId: '', quantity: 1 }];
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal membuat transfer.');
  } finally {
    creating.value = false;
  }
}

async function handleApprove() {
  if (!detail.value) return;
  const confirmed = await ask({ title: 'Approve Transfer?', message: 'Transfer ini akan disetujui dan lanjut ke pengiriman.', confirmLabel: 'Approve' });
  if (!confirmed) return;
  try {
    await transferService.approveTransfer(detail.value.id);
    showDetailModal.value = false;
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal approve.');
  }
}

function handleReject() {
  rejectNotes.value = '';
  showRejectModal.value = true;
}

async function confirmReject() {
  if (!detail.value) return;
  try {
    await transferService.rejectTransfer(detail.value.id, rejectNotes.value || undefined);
    showRejectModal.value = false;
    showDetailModal.value = false;
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal menolak.');
  }
}

async function handleShip() {
  if (!detail.value) return;
  const confirmed = await ask({ title: 'Kirim Transfer?', message: 'Tandai transfer ini sudah dikirim?', confirmLabel: 'Kirim' });
  if (!confirmed) return;
  try {
    await transferService.shipTransfer(detail.value.id);
    showDetailModal.value = false;
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal.');
  }
}

async function handleReceive() {
  if (!detail.value) return;
  const confirmed = await ask({ title: 'Terima Barang?', message: 'Terima barang dan update stok kedua cabang?', confirmLabel: 'Terima', variant: 'danger' });
  if (!confirmed) return;
  try {
    await transferService.receiveTransfer(detail.value.id);
    showDetailModal.value = false;
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal menerima.');
  }
}

async function handleCancel() {
  if (!detail.value) return;
  const confirmed = await ask({ title: 'Batalkan Transfer?', message: 'Batalkan transfer ini?', confirmLabel: 'Batalkan', variant: 'danger' });
  if (!confirmed) return;
  try {
    await transferService.cancelTransfer(detail.value.id);
    showDetailModal.value = false;
    await fetchTransfers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal membatalkan.');
  }
}

// ============================================
// Init
// ============================================
onMounted(() => {
  fetchTransfers();
  fetchShops();
  fetchProducts();
});

useAutoRefresh(fetchTransfers);
</script>
