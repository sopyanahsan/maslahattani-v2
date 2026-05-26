<template>
  <div class="space-y-4">
    <!-- Back button -->
    <RouterLink
      :to="{ name: 'admin-shifts' }"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
    >
      <component :is="ArrowLeftIcon" class="w-4 h-4" />
      Kembali ke daftar shift
    </RouterLink>

    <!-- Loading -->
    <div v-if="loading" class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
      <component :is="Loader2Icon" class="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
      <p class="text-xs text-slate-500">Memuat detail shift…</p>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="bg-white border border-slate-200 rounded-2xl p-6">
      <div class="flex items-start gap-2 bg-red-50 border-l-4 border-red-500 rounded-md p-3">
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p class="text-sm text-red-800">{{ loadError }}</p>
      </div>
    </div>

    <template v-else-if="shift">
      <!-- Header card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0"
            >
              {{ initials(shift.user?.username || shift.user?.email || '?') }}
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-950">
                {{ shift.user?.username || shift.user?.email }}
              </h2>
              <p class="text-[11px] text-slate-500 font-mono">
                #{{ shift.id.slice(-6).toUpperCase() }}
              </p>
            </div>
          </div>
          <ShiftStatusBadge :status="shift.status" />
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p class="text-[11px] text-slate-500">Cabang</p>
            <p class="font-semibold text-slate-900 mt-0.5 truncate">
              {{ shift.shop?.name || '—' }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-slate-500">Mulai</p>
            <p class="font-semibold text-slate-900 mt-0.5">
              {{ formatDateTime(shift.startTime) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-slate-500">Selesai</p>
            <p class="font-semibold text-slate-900 mt-0.5">
              {{ shift.endTime ? formatDateTime(shift.endTime) : '— masih aktif' }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-slate-500">Durasi</p>
            <p class="font-semibold text-slate-900 mt-0.5 font-mono">
              {{ duration }}
            </p>
          </div>
        </div>

        <!-- Notes -->
        <div
          v-if="shift.notes"
          class="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-4"
        >
          <p class="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
            Catatan
          </p>
          <p class="text-xs text-slate-700 whitespace-pre-line">{{ shift.notes }}</p>
        </div>

        <!-- Finalized info -->
        <div
          v-if="shift.status === 'FINALIZED' && shift.finalizedAt"
          class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex items-start gap-2"
        >
          <component :is="CheckCircleIcon" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div class="text-xs">
            <p class="font-semibold text-blue-900">
              Sudah difinalisasi
            </p>
            <p class="text-blue-700 mt-0.5">
              Oleh <strong>{{ shift.finalizedBy }}</strong> pada
              {{ formatDateTime(shift.finalizedAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Per-category breakdown -->
      <section>
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
          Saldo per Kategori
        </h3>
        <div class="space-y-3">
          <div
            v-for="cb in shift.cashBoxes"
            :key="cb.id"
            class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <!-- Category header -->
            <div class="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <span
                :class="[
                  'inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                  colorBg(cb.category.color),
                ]"
              >
                <span :class="['text-xs font-bold', colorText(cb.category.color)]">
                  {{ initials(cb.category.name) }}
                </span>
              </span>
              <p class="text-sm font-semibold text-slate-900">
                {{ cb.category.name }}
              </p>
              <span
                v-if="cb.category.isDefault"
                class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
              >
                Default
              </span>
            </div>

            <!-- Cash row -->
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-slate-700">Uang Tunai</p>
                <span
                  v-if="shift.status !== 'OPEN'"
                  :class="[
                    'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                    (cb.varianceCash ?? 0) === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : (cb.varianceCash ?? 0) > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{
                    (cb.varianceCash ?? 0) === 0
                      ? 'Cocok'
                      : (cb.varianceCash ?? 0) > 0
                        ? 'Lebih'
                        : 'Kurang'
                  }}
                </span>
              </div>
              <div class="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p class="text-[10px] text-slate-500">Saldo Awal</p>
                  <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                    {{ formatRupiah(cb.startingCash) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">Ekspektasi</p>
                  <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                    {{ formatRupiah(cb.startingCash + cb.expectedCash) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">Aktual</p>
                  <p class="text-[11px] font-mono font-semibold text-slate-900 mt-0.5">
                    {{ cb.actualCash != null ? formatRupiah(cb.actualCash) : '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">Selisih</p>
                  <p
                    :class="[
                      'text-[11px] font-mono font-bold mt-0.5',
                      (cb.varianceCash ?? 0) === 0
                        ? 'text-emerald-700'
                        : (cb.varianceCash ?? 0) > 0
                          ? 'text-blue-700'
                          : 'text-red-700',
                    ]"
                  >
                    {{ cb.varianceCash != null ? formatVariance(cb.varianceCash) : '—' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- QRIS row -->
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-slate-700">QRIS</p>
                <span
                  v-if="shift.status !== 'OPEN'"
                  :class="[
                    'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                    (cb.varianceQRIS ?? 0) === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : (cb.varianceQRIS ?? 0) > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{
                    (cb.varianceQRIS ?? 0) === 0
                      ? 'Cocok'
                      : (cb.varianceQRIS ?? 0) > 0
                        ? 'Lebih'
                        : 'Kurang'
                  }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="text-[10px] text-slate-500">Ekspektasi</p>
                  <p class="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                    {{ formatRupiah(cb.expectedQRIS) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">Aktual</p>
                  <p class="text-[11px] font-mono font-semibold text-slate-900 mt-0.5">
                    {{ cb.actualQRIS != null ? formatRupiah(cb.actualQRIS) : '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-500">Selisih</p>
                  <p
                    :class="[
                      'text-[11px] font-mono font-bold mt-0.5',
                      (cb.varianceQRIS ?? 0) === 0
                        ? 'text-emerald-700'
                        : (cb.varianceQRIS ?? 0) > 0
                          ? 'text-blue-700'
                          : 'text-red-700',
                    ]"
                  >
                    {{ cb.varianceQRIS != null ? formatVariance(cb.varianceQRIS) : '—' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Transactions -->
      <section v-if="transactions.length > 0">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
          Transaksi dalam Shift ({{ transactions.length }})
        </h3>
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="hidden md:block">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    No. Transaksi
                  </th>
                  <th class="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Waktu
                  </th>
                  <th class="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Item
                  </th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Total
                  </th>
                  <th class="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Pembayaran
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="trx in transactions" :key="trx.id">
                  <td class="px-4 py-2">
                    <code class="text-[11px] font-mono text-slate-700">
                      {{ trx.transactionNumber }}
                    </code>
                  </td>
                  <td class="px-4 py-2 text-xs text-slate-600">
                    {{ formatTime(trx.createdAt) }}
                  </td>
                  <td class="px-4 py-2 text-center text-xs font-mono text-slate-600">
                    {{ trx.items.length }}
                  </td>
                  <td class="px-4 py-2 text-right text-sm font-mono font-semibold text-slate-900">
                    {{ formatRupiah(trx.totalPrice) }}
                  </td>
                  <td class="px-4 py-2">
                    <span
                      v-for="(p, idx) in trx.payments"
                      :key="p.id"
                      class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1"
                    >
                      {{ p.method }}
                      <span class="text-slate-500 normal-case font-mono">
                        {{ formatRupiah(p.amount) }}
                      </span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile -->
          <div class="md:hidden divide-y divide-slate-100">
            <div v-for="trx in transactions" :key="trx.id" class="p-3">
              <div class="flex items-start justify-between gap-2 mb-1">
                <code class="text-[11px] font-mono text-slate-700">
                  {{ trx.transactionNumber }}
                </code>
                <p class="text-sm font-mono font-semibold text-slate-900">
                  {{ formatRupiah(trx.totalPrice) }}
                </p>
              </div>
              <p class="text-[11px] text-slate-500">
                {{ formatTime(trx.createdAt) }} · {{ trx.items.length }} item
              </p>
              <div class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-for="p in trx.payments"
                  :key="p.id"
                  class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                >
                  {{ p.method }} {{ formatRupiah(p.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty transactions -->
      <div
        v-else
        class="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center"
      >
        <component :is="ReceiptIcon" class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-xs text-slate-500">Belum ada transaksi dalam shift ini.</p>
      </div>

      <!-- Finalize action (CLOSED only) -->
      <section
        v-if="shift.status === 'CLOSED'"
        class="bg-amber-50 border border-amber-200 rounded-2xl p-4"
      >
        <div class="flex items-start gap-3">
          <component :is="AlertTriangleIcon" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <h3 class="text-sm font-bold text-amber-900">Shift Menunggu Finalisasi</h3>
            <p class="text-xs text-amber-800 mt-1 leading-relaxed">
              Review variance per kategori di atas. Setelah difinalisasi, shift
              tidak bisa diubah lagi dan saldo masuk ke laporan resmi.
            </p>
            <div class="mt-3">
              <textarea
                v-model="finalizeNotes"
                rows="2"
                placeholder="Catatan finalisasi (opsional, mis. 'Variance wajar dari kembalian receh')"
                :disabled="finalizing"
                class="input-field resize-none text-xs"
              ></textarea>
            </div>
            <div
              v-if="finalizeError"
              class="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2"
            >
              {{ finalizeError }}
            </div>
            <div class="flex items-center gap-2 mt-3">
              <button
                type="button"
                :disabled="finalizing"
                class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                @click="handleFinalize"
              >
                <component v-if="finalizing" :is="Loader2Icon" class="w-3.5 h-3.5 animate-spin" />
                <component v-else :is="CheckCircleIcon" class="w-3.5 h-3.5" />
                {{ finalizing ? 'Memfinalisasi…' : 'Finalisasi Shift' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircleIcon,
  ArrowLeft as ArrowLeftIcon,
  Receipt as ReceiptIcon,
} from 'lucide-vue-next';
import shiftService, {
  type ShiftDto,
  type ShiftDetailTransaction,
} from '@/shared/services/shift.service';
import ShiftStatusBadge from '@/admin/components/shift/ShiftStatusBadge.vue';

const route = useRoute();
const router = useRouter();

const shiftId = computed(() => route.params.id as string);

const shift = ref<ShiftDto | null>(null);
const transactions = ref<ShiftDetailTransaction[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);

const finalizing = ref(false);
const finalizeError = ref<string | null>(null);
const finalizeNotes = ref('');

const duration = computed(() => {
  if (!shift.value?.startTime) return '—';
  const start = new Date(shift.value.startTime).getTime();
  const end = shift.value.endTime
    ? new Date(shift.value.endTime).getTime()
    : Date.now();
  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}j ${mins}m`;
});

async function loadDetail() {
  loading.value = true;
  loadError.value = null;
  try {
    const response = await shiftService.getDetail(shiftId.value);
    shift.value = response.shift;
    transactions.value = response.transactions.data;
  } catch (err: any) {
    loadError.value =
      err?.response?.data?.message ?? err?.message ?? 'Gagal memuat shift.';
  } finally {
    loading.value = false;
  }
}

async function handleFinalize() {
  if (!shift.value) return;
  finalizing.value = true;
  finalizeError.value = null;
  try {
    await shiftService.finalize(shift.value.id, {
      notes: finalizeNotes.value.trim() || undefined,
    });
    // Refresh detail biar status update jadi FINALIZED
    finalizeNotes.value = '';
    await loadDetail();
  } catch (err: any) {
    finalizeError.value =
      err?.response?.data?.message ??
      err?.message ??
      'Gagal memfinalisasi shift.';
  } finally {
    finalizing.value = false;
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
}

function formatVariance(value: number): string {
  if (value === 0) return formatRupiah(0);
  return `${value > 0 ? '+' : '-'}${formatRupiah(value)}`;
}

function initials(text: string): string {
  const parts = text.split(/[@\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2);
}

function colorBg(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'bg-amber-100 border border-amber-200';
    case 'emerald':
    case 'green':
      return 'bg-emerald-100 border border-emerald-200';
    case 'red':
      return 'bg-red-100 border border-red-200';
    case 'purple':
      return 'bg-purple-100 border border-purple-200';
    case 'pink':
      return 'bg-pink-100 border border-pink-200';
    case 'indigo':
      return 'bg-indigo-100 border border-indigo-200';
    case 'orange':
      return 'bg-orange-100 border border-orange-200';
    case 'blue':
    default:
      return 'bg-blue-100 border border-blue-200';
  }
}

function colorText(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'text-amber-700';
    case 'emerald':
    case 'green':
      return 'text-emerald-700';
    case 'red':
      return 'text-red-700';
    case 'purple':
      return 'text-purple-700';
    case 'pink':
      return 'text-pink-700';
    case 'indigo':
      return 'text-indigo-700';
    case 'orange':
      return 'text-orange-700';
    case 'blue':
    default:
      return 'text-blue-700';
  }
}

onMounted(loadDetail);
</script>
