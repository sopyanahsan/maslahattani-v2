<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Status filter -->
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Status
          </label>
          <select
            v-model="filters.status"
            class="input-field text-sm h-9"
            @change="loadShifts"
          >
            <option value="">Semua</option>
            <option value="OPEN">Aktif</option>
            <option value="CLOSED">Ditutup</option>
            <option value="FINALIZED">Difinalisasi</option>
          </select>
        </div>

        <!-- Start date -->
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Dari Tanggal
          </label>
          <input
            v-model="filters.startDate"
            type="date"
            class="input-field text-sm h-9"
            @change="loadShifts"
          />
        </div>

        <!-- End date -->
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Sampai Tanggal
          </label>
          <input
            v-model="filters.endDate"
            type="date"
            class="input-field text-sm h-9"
            @change="loadShifts"
          />
        </div>

        <!-- Reset -->
        <div class="flex items-end">
          <button
            type="button"
            class="h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            @click="resetFilters"
          >
            <component :is="RotateCcwIcon" class="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      </div>

      <!-- Shop scope info (super-admin only) -->
      <p
        v-if="isSuperAdmin && currentShopName"
        class="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5"
      >
        <component :is="Building2Icon" class="w-3 h-3" />
        Menampilkan shift untuk cabang
        <strong class="text-slate-700 dark:text-slate-300">{{ currentShopName }}</strong>
        — ganti dari header untuk lihat cabang lain.
      </p>
    </div>

    <!-- Stats summary -->
    <div v-if="!loading && shifts.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Total Shift</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
          {{ shifts.length }}
        </p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Menunggu Review</p>
        <p class="text-lg font-bold text-amber-600 font-mono mt-0.5">
          {{ closedCount }}
        </p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Sedang Aktif</p>
        <p class="text-lg font-bold text-emerald-600 font-mono mt-0.5">
          {{ openCount }}
        </p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Total Selisih</p>
        <p
          :class="[
            'text-lg font-bold font-mono mt-0.5',
            totalVariance === 0
              ? 'text-emerald-600'
              : totalVariance > 0
                ? 'text-blue-600'
                : 'text-red-600',
          ]"
        >
          {{ totalVariance > 0 ? '+' : '' }}{{ formatRupiah(totalVariance) }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
      <component :is="Loader2Icon" class="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
      <p class="text-xs text-slate-500 dark:text-slate-400">Memuat shifts…</p>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div class="flex items-start gap-2 bg-red-50 border-l-4 border-red-500 rounded-md p-3">
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-semibold text-red-800">Gagal memuat data</p>
          <p class="text-xs text-red-700 mt-0.5">{{ loadError }}</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
        @click="loadShifts"
      >
        Coba lagi
      </button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="shifts.length === 0"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center"
    >
      <component :is="ClockIcon" class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Belum ada shift</p>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        {{
          hasActiveFilters
            ? 'Tidak ada shift yang cocok dengan filter. Coba reset filter atau ubah rentang tanggal.'
            : 'Belum ada shift yang dibuka di cabang ini.'
        }}
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <!-- Desktop table -->
      <table class="hidden md:table w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tanggal
            </th>
            <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Kasir
            </th>
            <th
              v-if="isSuperAdmin"
              class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600"
            >
              Cabang
            </th>
            <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Selisih
            </th>
            <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Status
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr
            v-for="shift in shifts"
            :key="shift.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            @click="openDetail(shift.id)"
          >
            <td class="px-4 py-3">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {{ formatDate(shift.startTime) }}
              </p>
              <p class="text-[11px] text-slate-500 font-mono">
                {{ formatTime(shift.startTime) }}
                {{ shift.endTime ? `– ${formatTime(shift.endTime)}` : '– aktif' }}
              </p>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0"
                >
                  {{ initials(shift.user?.username || shift.user?.email || '?') }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {{ shift.user?.username || shift.user?.email || '—' }}
                  </p>
                  <p
                    v-if="shift.user?.username && shift.user?.email"
                    class="text-[11px] text-slate-500 truncate"
                  >
                    {{ shift.user.email }}
                  </p>
                </div>
              </div>
            </td>
            <td v-if="isSuperAdmin" class="px-4 py-3">
              <p class="text-xs text-slate-700 truncate">
                {{ shift.shop?.name || '—' }}
              </p>
            </td>
            <td class="px-4 py-3 text-right">
              <p
                :class="[
                  'text-sm font-mono font-bold',
                  shiftVariance(shift) === 0
                    ? 'text-emerald-700'
                    : shiftVariance(shift) > 0
                      ? 'text-blue-700'
                      : 'text-red-700',
                ]"
              >
                {{ shift.status === 'OPEN' ? '—' : formatVariance(shiftVariance(shift)) }}
              </p>
            </td>
            <td class="px-4 py-3 text-center">
              <ShiftStatusBadge :status="shift.status" />
              <p v-if="shift.status === 'FINALIZED' && shift.finalizedBy" class="text-[9px] text-slate-400 mt-0.5">
                oleh {{ shift.finalizedBy }}
              </p>
              <p v-if="shift.status === 'FINALIZED' && shift.finalizedAt" class="text-[9px] text-slate-400">
                {{ formatDateTime(shift.finalizedAt) }}
              </p>
            </td>
            <td class="px-4 py-3 text-right">
              <component :is="ChevronRightIcon" class="w-4 h-4 text-slate-400" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile cards -->
      <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        <button
          v-for="shift in shifts"
          :key="shift.id"
          type="button"
          class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          @click="openDetail(shift.id)"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {{ shift.user?.username || shift.user?.email }}
              </p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                {{ formatDate(shift.startTime) }} · {{ formatTime(shift.startTime) }}
              </p>
              <p v-if="isSuperAdmin && shift.shop?.name" class="text-[11px] text-slate-600 mt-0.5">
                {{ shift.shop.name }}
              </p>
            </div>
            <ShiftStatusBadge :status="shift.status" />
          </div>
          <div v-if="shift.status !== 'OPEN'" class="flex items-center justify-between text-[11px]">
            <span class="text-slate-500 dark:text-slate-400">Selisih</span>
            <span
              :class="[
                'font-mono font-bold',
                shiftVariance(shift) === 0
                  ? 'text-emerald-700'
                  : shiftVariance(shift) > 0
                    ? 'text-blue-700'
                    : 'text-red-700',
              ]"
            >
              {{ formatVariance(shiftVariance(shift)) }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Clock as ClockIcon,
  ChevronRight as ChevronRightIcon,
  RotateCcw as RotateCcwIcon,
  Building2 as Building2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import shiftService, {
  type ShiftDto,
  type ShiftStatus,
  type QueryShiftParams,
} from '@/shared/services/shift.service';
import ShiftStatusBadge from '@/admin/components/shift/ShiftStatusBadge.vue';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();

const isSuperAdmin = computed(() => authStore.isSuperAdmin);
const currentShopName = computed(() => shopStore.currentShopName);
const currentShopId = computed(() => shopStore.currentShopId);

const shifts = ref<ShiftDto[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);

const filters = reactive<{
  status: ShiftStatus | '';
  startDate: string;
  endDate: string;
}>({
  status: '',
  startDate: '',
  endDate: '',
});

const hasActiveFilters = computed(
  () => !!filters.status || !!filters.startDate || !!filters.endDate,
);

const closedCount = computed(
  () => shifts.value.filter((s) => s.status === 'CLOSED').length,
);
const openCount = computed(
  () => shifts.value.filter((s) => s.status === 'OPEN').length,
);

const totalVariance = computed(() =>
  shifts.value.reduce((sum, s) => sum + shiftVariance(s), 0),
);

function shiftVariance(shift: ShiftDto): number {
  return shift.cashBoxes.reduce(
    (sum, cb) => sum + (cb.varianceCash ?? 0) + (cb.varianceQRIS ?? 0),
    0,
  );
}

async function loadShifts() {
  loading.value = true;
  loadError.value = null;
  try {
    const params: QueryShiftParams = {};
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    const response = await shiftService.list(params);
    shifts.value = response.data;
  } catch (err: any) {
    loadError.value =
      err?.response?.data?.message ?? err?.message ?? 'Gagal memuat shifts.';
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.status = '';
  filters.startDate = '';
  filters.endDate = '';
  loadShifts();
}

function openDetail(shiftId: string) {
  router.push({ name: 'admin-shift-detail', params: { id: shiftId } });
}

// Re-load saat ganti cabang (header switcher) — currentShopId trigger.
watch(currentShopId, () => {
  loadShifts();
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
}

function formatVariance(value: number): string {
  if (value === 0) return 'Cocok';
  const formatted = `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

function initials(text: string): string {
  const parts = text.split(/[@\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2);
}

onMounted(loadShifts);
</script>
