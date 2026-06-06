<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Pengaturan Fee BRILink</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Atur fee per kategori &amp; nominal, serta daftar produk/layanan BRILink.
      </p>
    </div>

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
    <!-- TAB: Fee Rules (per kategori & range)        -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'fee-rules'">
      <!-- Actions -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Aturan fee berdasarkan kategori dan range nominal transaksi.
        </p>
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openFeeModal(null)"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          Tambah Fee Rule
        </button>
      </div>

      <!-- Loading -->
      <div v-if="feesLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="fees.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
        <PercentIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada fee rule</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tambah aturan fee untuk menghitung biaya layanan otomatis.</p>
      </div>

      <!-- Fee table grouped by category -->
      <div v-else class="space-y-4">
        <div
          v-for="(group, category) in feesByCategory"
          :key="category"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span :class="['w-3 h-3 rounded-sm', categoryColor(category)]" />
              <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{{ categoryLabel(category) }}</h3>
              <span class="text-[10px] text-slate-400">({{ group.length }} rules)</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <th class="px-4 py-2 text-left">Label</th>
                  <th class="px-4 py-2 text-right">Min</th>
                  <th class="px-4 py-2 text-right">Max</th>
                  <th class="px-4 py-2 text-center">Tipe</th>
                  <th class="px-4 py-2 text-right">Fee</th>
                  <th class="px-4 py-2 text-center">Aktif</th>
                  <th class="px-4 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="fee in group" :key="fee.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100">{{ fee.label }}</td>
                  <td class="px-4 py-2.5 text-xs font-mono text-right text-slate-600 dark:text-slate-400">{{ formatRupiah(fee.minAmount) }}</td>
                  <td class="px-4 py-2.5 text-xs font-mono text-right text-slate-600 dark:text-slate-400">{{ formatRupiah(fee.maxAmount) }}</td>
                  <td class="px-4 py-2.5 text-center">
                    <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded', fee.feeType === 'FLAT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300']">
                      {{ fee.feeType }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-xs font-mono text-right font-semibold text-slate-900 dark:text-slate-100">
                    {{ fee.feeType === 'FLAT' ? formatRupiah(fee.feeAmount) : fee.feePercent + '%' }}
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span :class="['w-2 h-2 rounded-full inline-block', fee.isActive ? 'bg-emerald-500' : 'bg-slate-300']" />
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <button class="text-[10px] text-blue-600 hover:underline mr-2" @click="openFeeModal(fee)">Edit</button>
                    <button class="text-[10px] text-red-600 hover:underline" @click="handleDeleteFee(fee)">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Produk & Layanan (MetodeKasPanel)       -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'produk'">
      <MetodeKasPanel />
    </template>

    <!-- ============================================ -->
    <!-- MODAL: Create/Edit Fee Rule                  -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showFeeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showFeeModal = false" />
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleSaveFee">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ editingFee ? 'Edit Fee Rule' : 'Tambah Fee Rule' }}
          </h3>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
            <select v-model="feeForm.category" required class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md">
              <option value="TRANSFER_BRI">Transfer BRI</option>
              <option value="TRANSFER_OTHER">Transfer Bank Lain</option>
              <option value="TARIK_TUNAI">Tarik Tunai</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Label *</label>
            <input v-model="feeForm.label" type="text" required placeholder="Transfer BRI s/d 5jt" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Nominal *</label>
              <input v-model.number="feeForm.minAmount" type="number" min="0" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Nominal *</label>
              <input v-model.number="feeForm.maxAmount" type="number" min="0" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Fee *</label>
              <select v-model="feeForm.feeType" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md">
                <option value="FLAT">Flat (Rp)</option>
                <option value="PERCENT">Persen (%)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {{ feeForm.feeType === 'FLAT' ? 'Fee (Rp) *' : 'Fee (%) *' }}
              </label>
              <input
                v-if="feeForm.feeType === 'FLAT'"
                v-model.number="feeForm.feeAmount"
                type="number"
                min="0"
                required
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md"
              />
              <input
                v-else
                v-model.number="feeForm.feePercent"
                type="number"
                min="0"
                step="0.1"
                required
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md"
              />
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="feeForm.isActive" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded" />
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Aktif</span>
          </label>

          <div v-if="feeError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ feeError }}</div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showFeeModal = false">Batal</button>
            <button type="submit" :disabled="savingFee" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {{ savingFee ? '...' : editingFee ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import {
  Loader2 as Loader2Icon,
  Plus as PlusIcon,
  Percent as PercentIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import brilinkService, {
  type BrilinkFeeDto,
  type BrilinkCategory,
  BRILINK_CATEGORY_LABELS,
} from '@/shared/services/brilink.service';
import MetodeKasPanel from '@/admin/components/brilink/MetodeKasPanel.vue';

const authStore = useAuthStore();

type TabKey = 'fee-rules' | 'produk';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'fee-rules', label: 'Fee per Kategori' },
  { key: 'produk', label: 'Produk & Layanan' },
];
const activeTab = ref<TabKey>('fee-rules');

// ============================================
// Fee Rules State
// ============================================
const fees = ref<BrilinkFeeDto[]>([]);
const feesLoading = ref(false);

const showFeeModal = ref(false);
const editingFee = ref<BrilinkFeeDto | null>(null);
const savingFee = ref(false);
const feeError = ref<string | null>(null);
const feeForm = reactive({
  category: 'TRANSFER_BRI' as string,
  label: '',
  minAmount: 0,
  maxAmount: 5000000,
  feeType: 'FLAT' as 'FLAT' | 'PERCENT',
  feeAmount: 5000,
  feePercent: 0.5,
  isActive: true,
});

// ============================================
// Computed
// ============================================
const feesByCategory = computed(() => {
  const grouped: Record<string, BrilinkFeeDto[]> = {};
  for (const fee of fees.value) {
    if (!grouped[fee.category]) grouped[fee.category] = [];
    grouped[fee.category].push(fee);
  }
  return grouped;
});

// ============================================
// Helpers
// ============================================
function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function categoryLabel(cat: string): string {
  return BRILINK_CATEGORY_LABELS[cat as BrilinkCategory] || cat;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'bg-blue-500', TRANSFER_OTHER: 'bg-indigo-500', TARIK_TUNAI: 'bg-amber-500',
    TOPUP_PULSA: 'bg-pink-500', TOPUP_DATA: 'bg-purple-500', TOPUP_EWALLET: 'bg-cyan-500', TOPUP_PLN: 'bg-yellow-500',
  };
  return map[cat] || 'bg-slate-400';
}

// ============================================
// Fetch
// ============================================
async function fetchFees() {
  const shopId = getShopId();
  if (!shopId) return;
  feesLoading.value = true;
  try {
    fees.value = await brilinkService.listFees(shopId);
  } catch { fees.value = []; }
  finally { feesLoading.value = false; }
}

// ============================================
// Fee CRUD
// ============================================
function openFeeModal(fee: BrilinkFeeDto | null) {
  editingFee.value = fee;
  feeError.value = null;
  if (fee) {
    feeForm.category = fee.category;
    feeForm.label = fee.label;
    feeForm.minAmount = fee.minAmount;
    feeForm.maxAmount = fee.maxAmount;
    feeForm.feeType = fee.feeType;
    feeForm.feeAmount = fee.feeAmount;
    feeForm.feePercent = fee.feePercent;
    feeForm.isActive = fee.isActive;
  } else {
    feeForm.category = 'TRANSFER_BRI';
    feeForm.label = '';
    feeForm.minAmount = 0;
    feeForm.maxAmount = 5000000;
    feeForm.feeType = 'FLAT';
    feeForm.feeAmount = 5000;
    feeForm.feePercent = 0.5;
    feeForm.isActive = true;
  }
  showFeeModal.value = true;
}

async function handleSaveFee() {
  const shopId = getShopId();
  if (!shopId) return;
  savingFee.value = true;
  feeError.value = null;
  try {
    const payload = {
      category: feeForm.category as BrilinkCategory,
      label: feeForm.label,
      minAmount: feeForm.minAmount,
      maxAmount: feeForm.maxAmount,
      feeType: feeForm.feeType,
      feeAmount: feeForm.feeType === 'FLAT' ? feeForm.feeAmount : 0,
      feePercent: feeForm.feeType === 'PERCENT' ? feeForm.feePercent : 0,
      isActive: feeForm.isActive,
    };

    if (editingFee.value) {
      await brilinkService.updateFee(editingFee.value.id, payload);
    } else {
      await brilinkService.createFee({ shopId, ...payload });
    }
    showFeeModal.value = false;
    await fetchFees();
  } catch (err: any) {
    feeError.value = err?.response?.data?.message || 'Gagal menyimpan.';
  } finally { savingFee.value = false; }
}

async function handleDeleteFee(fee: BrilinkFeeDto) {
  if (!confirm(`Hapus fee rule "${fee.label}"?`)) return;
  try {
    await brilinkService.deleteFee(fee.id);
    await fetchFees();
  } catch { /* silent */ }
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchFees);
</script>
