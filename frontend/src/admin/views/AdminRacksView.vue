<template>
  <div class="space-y-5">
    <!-- Header + Actions -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white shadow-lg flex-1 mr-3">
        <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white dark:bg-[#1e2020]/10" />
        <h1 class="relative text-lg font-bold">Label Rak &amp; Zona</h1>
        <p class="relative text-xs text-violet-100 mt-0.5">Kelola zona, rak, dan cetak label QR untuk navigasi toko.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <select v-model="filterZoneId" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="fetchRacks">
          <option value="">Semua Zona</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }} ({{ z.rackCount }})</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="h-9 px-3 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5" @click="openZoneModal()">+ Zona</button>
        <button type="button" class="h-9 px-3 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5" @click="openRackModal()">+ Rak</button>
        <button type="button" :disabled="selectedRackIds.length === 0" class="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5" @click="handlePrintLabels">
          Cetak {{ selectedRackIds.length }} Label
        </button>
      </div>
    </div>

    <!-- Racks Table -->
    <div v-if="loading" class="text-center py-10 text-slate-400 dark:text-[#869392] text-sm">Memuat rak...</div>
    <div v-else-if="racks.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <p class="text-sm font-semibold text-slate-700 dark:text-[#bcc9c7]">Belum ada rak</p>
      <p class="text-xs text-slate-400 dark:text-[#869392] mt-1">Buat zona dulu, lalu tambahkan rak di dalamnya.</p>
    </div>
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-3 py-2.5 text-center w-10">
                <input type="checkbox" :checked="allSelected" class="w-4 h-4 text-blue-600 border-slate-200 dark:border-[#3d4948] rounded" @change="toggleAll" />
              </th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Kode</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Nama</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Zona</th>
              <th class="px-3 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Produk</th>
              <th class="px-3 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="r in racks" :key="r.id" class="hover:bg-slate-50 dark:bg-[#1a1c1c] cursor-pointer" @click="openRackDetail(r)">
              <td class="px-3 py-2.5 text-center" @click.stop>
                <input type="checkbox" :checked="selectedRackIds.includes(r.id)" class="w-4 h-4 text-blue-600 border-slate-200 dark:border-[#3d4948] rounded" @change="toggleSelect(r.id)" />
              </td>
              <td class="px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-[#e3e2e2] font-mono">{{ r.code }}</td>
              <td class="px-3 py-2.5 text-sm text-slate-700 dark:text-[#bcc9c7]">{{ r.name || '—' }}</td>
              <td class="px-3 py-2.5"><span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{{ r.zoneName }}</span></td>
              <td class="px-3 py-2.5 text-right text-sm text-slate-600 dark:text-[#bcc9c7]">{{ r.productCount }}</td>
              <td class="px-3 py-2.5 text-center" @click.stop>
                <button class="text-xs text-blue-600 hover:underline mr-2" @click="openRackModal(r)">Edit</button>
                <button class="text-xs text-red-600 hover:underline" @click="handleDeleteRack(r)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Zones List (collapsible) -->
    <details class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
      <summary class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2] cursor-pointer select-none">Kelola Zona ({{ zones.length }})</summary>
      <div class="mt-3 space-y-2">
        <div v-for="z in zones" :key="z.id" class="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-[#1a1c1c] rounded-lg">
          <div>
            <span class="text-sm font-semibold text-slate-800 dark:text-[#bcc9c7]">{{ z.name }}</span>
            <span class="text-[11px] text-slate-400 dark:text-[#869392] ml-2">{{ z.rackCount }} rak</span>
            <span v-if="z.description" class="text-[11px] text-slate-400 dark:text-[#869392] ml-2">— {{ z.description }}</span>
          </div>
          <div class="flex gap-2">
            <button class="text-xs text-blue-600 hover:underline" @click="openZoneModal(z)">Edit</button>
            <button class="text-xs text-red-600 hover:underline" @click="handleDeleteZone(z)">Hapus</button>
          </div>
        </div>
        <div v-if="zones.length === 0" class="text-center py-3 text-xs text-slate-400 dark:text-[#869392]">Belum ada zona. Klik "+ Zona" untuk membuat.</div>
      </div>
    </details>

    <!-- Zone Modal -->
    <teleport to="body">
      <div v-if="showZoneModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showZoneModal = false">
        <div class="bg-white dark:bg-[#1e2020] rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-[#3d4948]">
            <h2 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">{{ editingZone ? 'Edit Zona' : 'Tambah Zona' }}</h2>
          </div>
          <div class="px-6 py-5 space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Nama Zona</label>
              <input v-model="zoneForm.name" type="text" placeholder="cth. Minuman Dingin" class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Deskripsi (opsional)</label>
              <input v-model="zoneForm.description" type="text" placeholder="cth. Rak kulkas depan kasir" class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-200 dark:border-[#3d4948] flex justify-end gap-2">
            <button class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] border border-slate-200 rounded-lg hover:bg-slate-50" @click="showZoneModal = false">Batal</button>
            <button class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60" :disabled="savingZone" @click="submitZone">
              {{ savingZone ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Rack Modal -->
    <teleport to="body">
      <div v-if="showRackModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showRackModal = false">
        <div class="bg-white dark:bg-[#1e2020] rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-[#3d4948]">
            <h2 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">{{ editingRack ? 'Edit Rak' : 'Tambah Rak' }}</h2>
          </div>
          <div class="px-6 py-5 space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Zona</label>
              <select v-model="rackForm.zoneId" class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none">
                <option value="">— Pilih Zona —</option>
                <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Kode Rak</label>
              <input v-model="rackForm.code" type="text" placeholder="cth. A1, B-03" class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Nama (opsional)</label>
              <input v-model="rackForm.name" type="text" placeholder="cth. Rak Atas Kiri" class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-200 dark:border-[#3d4948] flex justify-end gap-2">
            <button class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] border border-slate-200 rounded-lg hover:bg-slate-50" @click="showRackModal = false">Batal</button>
            <button class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60" :disabled="savingRack" @click="submitRack">
              {{ savingRack ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Rack Detail Modal (products in rack + add/remove) -->
    <teleport to="body">
      <div v-if="showRackDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showRackDetail = false">
        <div class="bg-white dark:bg-[#1e2020] rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#3d4948]">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Rak {{ detailRack?.code }}</h2>
              <p class="text-xs text-slate-500 dark:text-[#869392]">{{ detailRack?.zoneName }}{{ detailRack?.name ? ' — ' + detailRack.name : '' }}</p>
            </div>
            <button @click="showRackDetail = false" class="text-slate-400 hover:text-slate-600 dark:text-[#bcc9c7]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <!-- Search & Add -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">+ Tambah Produk ke Rak</label>
              <input
                v-model="searchUnassigned"
                type="text"
                placeholder="Cari produk (nama / SKU)..."
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none"
                @input="debouncedSearchUnassigned"
              />
              <!-- Search Results -->
              <div v-if="searchUnassigned.trim() && unassignedProducts.length > 0" class="mt-2 border border-slate-200 dark:border-[#3d4948] rounded-lg max-h-40 overflow-y-auto">
                <div
                  v-for="p in unassignedProducts"
                  :key="p.stockId"
                  class="flex items-center justify-between px-3 py-2 hover:bg-blue-50:bg-blue-950/30 cursor-pointer border-b border-slate-200 dark:border-[#3d4948] last:border-0"
                  @click="handleAssignProduct(p.stockId)"
                >
                  <div>
                    <p class="text-xs font-medium text-slate-800 dark:text-[#bcc9c7]">{{ p.productName }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ p.productSku }} &middot; Stok: {{ p.quantity }}</p>
                  </div>
                  <span class="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">+ Tambah</span>
                </div>
              </div>
              <p v-else-if="searchUnassigned.trim() && !searchingUnassigned && unassignedProducts.length === 0" class="text-[11px] text-slate-400 dark:text-[#869392] mt-1">
                Tidak ditemukan produk tanpa rak yang cocok.
              </p>
              <p v-if="searchingUnassigned" class="text-[11px] text-slate-400 dark:text-[#869392] mt-1">Mencari...</p>
            </div>

            <!-- Current Products in Rack -->
            <div>
              <h3 class="text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-2">Produk di Rak Ini ({{ rackProducts.length }})</h3>
              <div v-if="loadingRackProducts" class="text-center py-4 text-xs text-slate-400 dark:text-[#869392]">Memuat...</div>
              <div v-else-if="rackProducts.length === 0" class="text-center py-6 bg-slate-50 dark:bg-[#1a1c1c] rounded-lg">
                <p class="text-xs text-slate-400 dark:text-[#869392]">Belum ada produk di rak ini.</p>
                <p class="text-[11px] text-slate-400 dark:text-[#869392] mt-1">Gunakan pencarian di atas untuk menambahkan.</p>
              </div>
              <div v-else class="space-y-1">
                <div
                  v-for="p in rackProducts"
                  :key="p.stockId"
                  class="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-[#1a1c1c] rounded-lg"
                >
                  <div>
                    <p class="text-xs font-medium text-slate-800 dark:text-[#bcc9c7]">{{ p.productName }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ p.productSku }} &middot; Stok: {{ p.quantity }}</p>
                  </div>
                  <button
                    class="text-[10px] font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded hover:bg-red-100 transition-colors"
                    @click="handleRemoveProduct(p.stockId)"
                  >
                    Lepas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Print Area: Label No.103 layout (32×64mm, 3 col × 4 row = 12/A4) -->
    <div id="print-rack-labels" class="rack-print-container">
      <div class="rack-labels-grid">
        <div v-for="r in selectedRacks" :key="'lbl-'+r.id" class="rack-label-item">
          <p class="rack-label-zone">{{ r.zoneName }}</p>
          <p class="rack-label-code">{{ r.code }}</p>
          <canvas :id="'qr-'+r.id" class="rack-qr-canvas"></canvas>
          <p v-if="r.name" class="rack-label-name">{{ r.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue';
import QRCode from 'qrcode';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import rackService, { type RackZoneDto, type RackDto, type RackProductDto } from '@/shared/services/rack.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const { ask } = useConfirm();
const toast = useToast();

// ============================================
// State
// ============================================
const zones = ref<RackZoneDto[]>([]);
const racks = ref<RackDto[]>([]);
const loading = ref(false);
const filterZoneId = ref('');
const selectedRackIds = ref<string[]>([]);

// Zone modal
const showZoneModal = ref(false);
const editingZone = ref<RackZoneDto | null>(null);
const zoneForm = reactive({ name: '', description: '' });
const savingZone = ref(false);

// Rack modal
const showRackModal = ref(false);
const editingRack = ref<RackDto | null>(null);
const rackForm = reactive({ zoneId: '', code: '', name: '' });
const savingRack = ref(false);

// Rack detail modal
const showRackDetail = ref(false);
const detailRack = ref<RackDto | null>(null);
const rackProducts = ref<RackProductDto[]>([]);
const loadingRackProducts = ref(false);
const unassignedProducts = ref<RackProductDto[]>([]);
const searchUnassigned = ref('');
const searchingUnassigned = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Computed
// ============================================
const allSelected = computed(() => racks.value.length > 0 && selectedRackIds.value.length === racks.value.length);
const selectedRacks = computed(() => racks.value.filter((r) => selectedRackIds.value.includes(r.id)));

function getShopId(): string | undefined {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? undefined;
}

// ============================================
// Fetch
// ============================================
async function fetchZones() {
  const shopId = getShopId();
  if (!shopId) return;
  try { zones.value = await rackService.listZones(shopId); }
  catch { zones.value = []; }
}

async function fetchRacks() {
  const shopId = getShopId();
  if (!shopId) return;
  loading.value = true;
  try { racks.value = await rackService.listRacks(shopId, filterZoneId.value || undefined); }
  catch { racks.value = []; }
  finally { loading.value = false; }
}

// ============================================
// Selection
// ============================================
function toggleSelect(id: string) {
  const idx = selectedRackIds.value.indexOf(id);
  if (idx >= 0) selectedRackIds.value.splice(idx, 1);
  else selectedRackIds.value.push(id);
}
function toggleAll() {
  if (allSelected.value) selectedRackIds.value = [];
  else selectedRackIds.value = racks.value.map((r) => r.id);
}

// ============================================
// Zone CRUD
// ============================================
function openZoneModal(zone?: RackZoneDto) {
  editingZone.value = zone || null;
  zoneForm.name = zone?.name || '';
  zoneForm.description = zone?.description || '';
  showZoneModal.value = true;
}

async function submitZone() {
  const shopId = getShopId();
  if (!shopId || !zoneForm.name.trim()) { toast.warning('Nama zona wajib diisi.'); return; }
  savingZone.value = true;
  try {
    if (editingZone.value) {
      await rackService.updateZone(editingZone.value.id, { name: zoneForm.name.trim(), description: zoneForm.description.trim() || undefined });
      toast.success('Zona berhasil diperbarui.');
    } else {
      await rackService.createZone({ shopId, name: zoneForm.name.trim(), description: zoneForm.description.trim() || undefined });
      toast.success('Zona berhasil ditambahkan.');
    }
    showZoneModal.value = false;
    await fetchZones();
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal menyimpan zona.'); }
  finally { savingZone.value = false; }
}

async function handleDeleteZone(zone: RackZoneDto) {
  const ok = await ask({ title: 'Hapus Zona?', message: `Zona "${zone.name}" dan semua rak di dalamnya akan dihapus.`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!ok) return;
  try {
    await rackService.deleteZone(zone.id);
    toast.success(`Zona "${zone.name}" berhasil dihapus.`);
    await Promise.all([fetchZones(), fetchRacks()]);
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal menghapus zona.'); }
}

// ============================================
// Rack CRUD
// ============================================
function openRackModal(rack?: RackDto) {
  editingRack.value = rack || null;
  rackForm.zoneId = rack?.zoneId || (zones.value.length === 1 ? zones.value[0].id : '');
  rackForm.code = rack?.code || '';
  rackForm.name = rack?.name || '';
  showRackModal.value = true;
}

async function submitRack() {
  const shopId = getShopId();
  if (!shopId || !rackForm.zoneId || !rackForm.code.trim()) { toast.warning('Zona dan kode rak wajib diisi.'); return; }
  savingRack.value = true;
  try {
    if (editingRack.value) {
      await rackService.updateRack(editingRack.value.id, { zoneId: rackForm.zoneId, code: rackForm.code.trim(), name: rackForm.name.trim() || undefined });
      toast.success('Rak berhasil diperbarui.');
    } else {
      await rackService.createRack({ shopId, zoneId: rackForm.zoneId, code: rackForm.code.trim(), name: rackForm.name.trim() || undefined });
      toast.success('Rak berhasil ditambahkan.');
    }
    showRackModal.value = false;
    await Promise.all([fetchZones(), fetchRacks()]);
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal menyimpan rak.'); }
  finally { savingRack.value = false; }
}

async function handleDeleteRack(rack: RackDto) {
  const ok = await ask({ title: 'Hapus Rak?', message: `Rak "${rack.code}" akan dihapus.`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!ok) return;
  try {
    await rackService.deleteRack(rack.id);
    toast.success(`Rak "${rack.code}" berhasil dihapus.`);
    await Promise.all([fetchZones(), fetchRacks()]);
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal menghapus rak.'); }
}

// ============================================
// Rack Detail (products in rack)
// ============================================
async function openRackDetail(rack: RackDto) {
  detailRack.value = rack;
  showRackDetail.value = true;
  searchUnassigned.value = '';
  unassignedProducts.value = [];
  await fetchRackProducts(rack.id);
}

async function fetchRackProducts(rackId: string) {
  loadingRackProducts.value = true;
  try {
    const res = await rackService.getProductsByRack(rackId);
    rackProducts.value = res.products;
  } catch { rackProducts.value = []; }
  finally { loadingRackProducts.value = false; }
}

function debouncedSearchUnassigned() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => doSearchUnassigned(), 300);
}

async function doSearchUnassigned() {
  const shopId = getShopId();
  const q = searchUnassigned.value.trim();
  if (!shopId || !q) { unassignedProducts.value = []; return; }
  searchingUnassigned.value = true;
  try {
    unassignedProducts.value = await rackService.getUnassignedProducts(shopId, q);
  } catch { unassignedProducts.value = []; }
  finally { searchingUnassigned.value = false; }
}

async function handleAssignProduct(stockId: string) {
  if (!detailRack.value) return;
  try {
    await rackService.assignProductToRack(stockId, detailRack.value.id);
    toast.success('Produk berhasil ditambahkan ke rak.');
    // Refresh both lists
    await fetchRackProducts(detailRack.value.id);
    await doSearchUnassigned();
    await fetchRacks(); // update productCount in table
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal menambahkan produk.'); }
}

async function handleRemoveProduct(stockId: string) {
  if (!detailRack.value) return;
  try {
    await rackService.assignProductToRack(stockId, null);
    toast.success('Produk dilepas dari rak.');
    await fetchRackProducts(detailRack.value.id);
    await fetchRacks();
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal melepas produk.'); }
}

// ============================================
// Print QR Labels — Layout No.103 (32×64mm)
// ============================================
async function handlePrintLabels() {
  if (selectedRackIds.value.length === 0) return;
  await nextTick();

  for (const r of selectedRacks.value) {
    const canvas = document.getElementById('qr-' + r.id) as HTMLCanvasElement | null;
    if (canvas) {
      try {
        await QRCode.toCanvas(canvas, `RACK:${r.code}`, {
          width: 64,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
      } catch { /* skip */ }
    }
  }

  await nextTick();
  window.print();
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => { fetchZones(); fetchRacks(); });
</script>

<style>
/* Screen: hide print area */
.rack-print-container {
  position: fixed;
  left: -9999px;
  top: 0;
  visibility: hidden;
}

/* =============================================
   Print: Label No.103 — 32×64mm
   A4 (210×297mm) minus margin (~6mm each side)
   Usable: ~198×285mm
   Grid: 3 col (64mm) × 4 row (32mm) = 12 labels/page
   Column gap: ~3mm, Row gap: ~2mm
   ============================================= */
@media print {
  body * { visibility: hidden !important; }
  #print-rack-labels, #print-rack-labels * { visibility: visible !important; }
  #print-rack-labels {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    visibility: visible !important;
    margin: 0 !important;
    padding: 4mm 5mm !important;
    box-sizing: border-box;
  }

  .rack-labels-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 64mm);
    grid-auto-rows: 32mm;
    gap: 2mm 3mm;
    justify-content: center;
  }

  .rack-label-item {
    width: 64mm;
    height: 32mm;
    border: 0.3px dashed #bbb;
    border-radius: 1.5mm;
    padding: 2mm 3mm;
    text-align: center;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
  }

  .rack-label-zone {
    font-size: 7pt;
    font-weight: 700;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 0.5mm;
    line-height: 1.2;
  }

  .rack-label-code {
    font-size: 22pt;
    font-weight: 900;
    color: #000;
    letter-spacing: 1.5px;
    font-family: 'Courier New', monospace;
    line-height: 1;
    margin-bottom: 1mm;
  }

  .rack-qr-canvas {
    width: 16mm !important;
    height: 16mm !important;
  }

  .rack-label-name {
    font-size: 6.5pt;
    color: #666;
    margin-top: 0.5mm;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}
</style>


<style scoped>
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.space-y-5 > * {
  animation: fadeSlideUp 0.4s ease-out both;
}
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 160ms; }

/* gradient header shimmer */
@keyframes headerShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
div[class*="bg-gradient-to-r"][class*="from-violet"] {
  background-size: 200% 200%;
  animation: headerShimmer 6s ease infinite;
}

/* table row hover glow */
table tbody tr {
  transition: all 0.15s ease;
}
table tbody tr:hover {
  box-shadow: inset 3px 0 0 #7C3AED;
}

/* modal entrance */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
div[class*="rounded-lg"][class*="shadow-xl"] {
  animation: scaleIn 0.25s ease-out;
}

/* checkbox select pulse */
input[type="checkbox"]:checked {
  animation: checkPop 0.2s ease-out;
}
@keyframes checkPop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
</style>
