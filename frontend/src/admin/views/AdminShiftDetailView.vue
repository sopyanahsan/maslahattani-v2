<template>
  <!-- Mobile fallback (block <lg) -->
  <div
    class="lg:hidden bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
  >
    <div
      class="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-100 border border-amber-200 mb-4"
    >
      <component :is="MonitorIcon" class="w-7 h-7 text-amber-700" />
    </div>
    <h2 class="text-base font-bold text-amber-900 mb-2">
      Layar terlalu kecil
    </h2>
    <p class="text-sm text-amber-800 leading-relaxed">
      Gunakan laptop / tablet (lebar minimal 1024px) untuk verifikasi shift.
      Layout ini perlu ruang horizontal untuk menampilkan ringkasan penjualan,
      input pecahan kas, dan rekonsiliasi sekaligus.
    </p>
    <button
      type="button"
      class="mt-4 inline-flex items-center gap-2 h-10 px-4 bg-white text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
      @click="onBack"
    >
      <component :is="ArrowLeftIcon" class="w-4 h-4" />
      Kembali
    </button>
  </div>

  <!-- Desktop & tablet (≥lg) -->
  <div class="hidden lg:block space-y-6">
    <!-- Top bar: back + status badge + meta -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex items-start gap-3 min-w-0">
        <button
          type="button"
          class="h-10 w-10 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0"
          aria-label="Kembali"
          @click="onBack"
        >
          <component :is="ArrowLeftIcon" class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-slate-950">
              Verifikasi Shift
            </h1>
            <span
              v-if="shift"
              :class="[
                'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                statusBadge.cls,
              ]"
            >
              {{ statusBadge.label }}
            </span>
          </div>
          <p v-if="shift" class="text-xs text-slate-500 mt-0.5 font-mono">
            #{{ shift.id.slice(0, 8) }} · {{ formatShortDate(shift.startTime) }}
          </p>
        </div>
      </div>

      <div v-if="shift" class="text-right shrink-0">
        <p class="text-xs text-slate-500">Total transaksi</p>
        <p class="text-base font-mono font-bold text-slate-900">
          {{ transactionsTotal }}
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="text-center">
        <component :is="LoaderIcon" class="w-6 h-6 text-slate-400 mx-auto animate-spin" />
        <p class="text-sm text-slate-500 mt-3">Memuat detail shift...</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
    >
      <component :is="AlertCircleIcon" class="w-8 h-8 text-red-600 mx-auto mb-2" />
      <p class="text-sm font-semibold text-red-900">{{ error }}</p>
      <button
        type="button"
        class="mt-3 h-9 px-4 bg-white border border-red-200 text-red-700 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors"
        @click="loadShift"
      >
        Muat ulang
      </button>
    </div>

    <!-- Main 3-column layout -->
    <div
      v-else-if="shift"
      class="grid grid-cols-12 gap-6 items-start"
    >
      <!-- ============================== -->
      <!-- LEFT: Sales Summary -->
      <!-- ============================== -->
      <section class="col-span-4 space-y-4">
        <SectionHeader
          :icon="ReceiptIcon"
          title="Ringkasan Penjualan"
          subtitle="Sumber: transaksi terkonfirmasi selama shift"
        />

        <!-- Shift meta card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div class="flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
            >
              <component :is="UserIcon" class="w-4 h-4 text-slate-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[11px] text-slate-500 uppercase tracking-wide">Kasir</p>
              <p class="text-sm font-semibold text-slate-900 truncate">
                {{ shift.user?.username || shift.user?.email || '—' }}
              </p>
              <p class="text-xs text-slate-500 truncate">
                {{ shift.shop?.name || '—' }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <p class="text-[11px] text-slate-500 uppercase tracking-wide">Mulai</p>
              <p class="text-sm font-mono text-slate-900">
                {{ formatTime(shift.startTime) }}
              </p>
              <p class="text-[11px] text-slate-400">
                {{ formatShortDate(shift.startTime) }}
              </p>
            </div>
            <div>
              <p class="text-[11px] text-slate-500 uppercase tracking-wide">Tutup</p>
              <p class="text-sm font-mono text-slate-900">
                {{ shift.endTime ? formatTime(shift.endTime) : '—' }}
              </p>
              <p class="text-[11px] text-slate-400">
                {{ shift.endTime ? durationLabel : 'Masih berjalan' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sales breakdown card -->
        <div
          class="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100"
        >
          <header class="px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-700">
              Per Metode Pembayaran
            </p>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Nilai harapan dihitung otomatis dari transaksi
            </p>
          </header>

          <!-- Tunai -->
          <div class="px-4 py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0"
              >
                <component :is="BanknoteIcon" class="w-4 h-4 text-emerald-700" />
              </div>
              <p class="text-sm font-semibold text-slate-900">Tunai</p>
            </div>
            <p class="text-sm font-mono font-bold text-slate-900 tabular-nums">
              {{ formatRupiah(shift.expectedCash) }}
            </p>
          </div>

          <!-- QRIS -->
          <div class="px-4 py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0"
              >
                <component :is="QrCodeIcon" class="w-4 h-4 text-blue-700" />
              </div>
              <p class="text-sm font-semibold text-slate-900">QRIS</p>
            </div>
            <p class="text-sm font-mono font-bold text-slate-900 tabular-nums">
              {{ formatRupiah(shift.expectedQRIS) }}
            </p>
          </div>

          <!-- Debit / Kredit (Phase 2 placeholder) -->
          <div
            class="px-4 py-3 flex items-center justify-between gap-3 bg-slate-50/40"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0"
              >
                <component :is="CreditCardIcon" class="w-4 h-4 text-slate-500" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-500">Debit / Kredit</p>
                <span
                  class="inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 mt-0.5"
                >
                  Phase 2
                </span>
              </div>
            </div>
            <p class="text-sm font-mono text-slate-400 tabular-nums">—</p>
          </div>

          <!-- Total -->
          <div
            class="px-4 py-3 flex items-center justify-between gap-3 bg-slate-50"
          >
            <p class="text-sm font-bold text-slate-900">Total Penjualan</p>
            <p class="text-base font-mono font-bold text-slate-950 tabular-nums">
              {{ formatRupiah(totalExpected) }}
            </p>
          </div>
        </div>

        <!-- Catatan kasir (kalau ada) -->
        <div
          v-if="shift.notes"
          class="bg-blue-50 border border-blue-200 rounded-2xl p-4"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <component :is="StickyNoteIcon" class="w-4 h-4 text-blue-700" />
            <p class="text-xs font-bold uppercase tracking-wide text-blue-900">
              Catatan Kasir
            </p>
          </div>
          <p class="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
            {{ shift.notes }}
          </p>
        </div>
      </section>

      <!-- ============================== -->
      <!-- MIDDLE: Cash Denomination Input -->
      <!-- ============================== -->
      <section class="col-span-4 space-y-4">
        <SectionHeader
          :icon="CalculatorIcon"
          title="Hitungan Uang Tunai"
          subtitle="Hitung uang fisik per pecahan untuk verifikasi"
        />

        <!-- Disabled state notice -->
        <div
          v-if="!canVerify"
          class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <component :is="LockIcon" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div class="min-w-0 text-xs text-slate-600 leading-relaxed">
            <p v-if="shift.status === 'OPEN'" class="font-semibold text-slate-700">
              Shift belum ditutup
            </p>
            <p v-else-if="shift.status === 'FINALIZED'" class="font-semibold text-slate-700">
              Shift sudah difinalisasi
            </p>
            <p class="mt-0.5">
              Verifikasi pecahan hanya bisa dilakukan saat status shift
              <span class="font-mono font-bold">CLOSED</span>.
              <span v-if="shift.status === 'OPEN'">
                Tunggu kasir menutup shift dulu.
              </span>
              <span v-else-if="shift.status === 'FINALIZED'">
                Shift sudah ter-lock dan tidak dapat diubah.
              </span>
            </p>
          </div>
        </div>

        <CashDenominationInput
          v-model:total="actualCashCount"
          :disabled="!canVerify"
          @update:breakdown="onBreakdownChange"
        />

        <!-- Hint kasir reported value -->
        <div
          v-if="shift.actualCash !== null && shift.actualCash !== undefined"
          class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 min-w-0">
            <component :is="UserCheckIcon" class="w-4 h-4 text-slate-600 shrink-0" />
            <p class="text-xs text-slate-600">
              Dilaporkan kasir saat tutup shift
            </p>
          </div>
          <p class="text-sm font-mono font-semibold text-slate-900 tabular-nums">
            {{ formatRupiah(shift.actualCash) }}
          </p>
        </div>
      </section>

      <!-- ============================== -->
      <!-- RIGHT: Reconciliation -->
      <!-- ============================== -->
      <section class="col-span-4 space-y-4">
        <SectionHeader
          :icon="ScaleIcon"
          title="Rekonsiliasi"
          subtitle="Bandingkan hitungan fisik dengan ekspektasi sistem"
        />

        <!-- Cash reconciliation card -->
        <div
          :class="[
            'border rounded-2xl p-5 space-y-4',
            cashReconciliation.bgCls,
          ]"
        >
          <!-- Status badge + label -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <component
                :is="cashReconciliation.icon"
                :class="['w-5 h-5', cashReconciliation.iconCls]"
              />
              <p :class="['text-sm font-bold', cashReconciliation.titleCls]">
                Kas Tunai
              </p>
            </div>
            <span
              :class="[
                'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                cashReconciliation.badgeCls,
              ]"
            >
              {{ cashReconciliation.label }}
            </span>
          </div>

          <!-- Numbers grid -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Ekspektasi
              </p>
              <p class="text-xs font-mono font-semibold text-slate-700 mt-1 tabular-nums">
                {{ formatRupiah(shift.expectedCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Aktual
              </p>
              <p class="text-xs font-mono font-bold text-slate-950 mt-1 tabular-nums">
                {{ formatRupiah(actualCashCount) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Selisih
              </p>
              <p
                :class="[
                  'text-xs font-mono font-bold mt-1 tabular-nums',
                  cashReconciliation.diffCls,
                ]"
              >
                {{ cashDifference > 0 ? '+' : ''
                }}{{ formatRupiah(cashDifference) }}
              </p>
            </div>
          </div>

          <!-- Significant variance warning -->
          <div
            v-if="hasSignificantCashVariance"
            class="bg-white/60 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2"
          >
            <component
              :is="AlertTriangleIcon"
              class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"
            />
            <p class="text-[11px] text-amber-900 leading-relaxed">
              Selisih melebihi Rp 10.000. Pastikan hitungan fisik benar
              sebelum finalisasi.
            </p>
          </div>
        </div>

        <!-- QRIS reconciliation card (compact) -->
        <div
          v-if="shift.expectedQRIS > 0 || (shift.actualQRIS ?? 0) > 0"
          :class="[
            'border rounded-2xl p-4',
            qrisReconciliation.bgCls,
          ]"
        >
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <component :is="QrCodeIcon" :class="['w-4 h-4', qrisReconciliation.iconCls]" />
              <p :class="['text-sm font-bold', qrisReconciliation.titleCls]">QRIS</p>
            </div>
            <span
              :class="[
                'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                qrisReconciliation.badgeCls,
              ]"
            >
              {{ qrisReconciliation.label }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Ekspektasi
              </p>
              <p class="text-xs font-mono font-semibold text-slate-700 mt-1 tabular-nums">
                {{ formatRupiah(shift.expectedQRIS) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Aktual
              </p>
              <p class="text-xs font-mono font-bold text-slate-950 mt-1 tabular-nums">
                {{ formatRupiah(shift.actualQRIS ?? 0) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                Selisih
              </p>
              <p :class="['text-xs font-mono font-bold mt-1 tabular-nums', qrisReconciliation.diffCls]">
                {{ qrisDifference > 0 ? '+' : '' }}{{ formatRupiah(qrisDifference) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Notes textarea -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4">
          <label
            for="finalize-notes"
            class="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-2"
          >
            Catatan Admin
            <span class="font-normal normal-case text-slate-400 ml-1">(opsional)</span>
          </label>
          <textarea
            id="finalize-notes"
            v-model="adminNotes"
            rows="4"
            :disabled="!canVerify"
            placeholder="Mis. Variance kecil, kembalian receh wajar. Verifikasi disetujui."
            class="w-full text-sm border border-slate-200 rounded-md p-2.5 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors resize-none"
          ></textarea>

          <!-- Append breakdown toggle -->
          <label
            v-if="canVerify && hasBreakdown"
            class="mt-3 flex items-start gap-2 cursor-pointer"
          >
            <input
              v-model="appendBreakdown"
              type="checkbox"
              class="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-200"
            />
            <span class="text-xs text-slate-600 leading-snug">
              Lampirkan rincian pecahan ke catatan saat finalisasi
            </span>
          </label>
        </div>

        <!-- Submit error -->
        <div
          v-if="submitError"
          class="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2"
        >
          <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p class="text-xs text-red-800">{{ submitError }}</p>
        </div>

        <!-- Already finalized banner -->
        <div
          v-if="shift.status === 'FINALIZED'"
          class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <component
            :is="CheckCircle2Icon"
            class="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
          />
          <div class="min-w-0 text-xs leading-relaxed">
            <p class="font-bold text-emerald-900">
              Shift sudah difinalisasi
            </p>
            <p class="text-emerald-800 mt-0.5">
              Oleh
              <span class="font-semibold">{{ shift.finalizedBy || '—' }}</span>
              <span v-if="shift.finalizedAt">
                · {{ formatDateTime(shift.finalizedAt) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Finalize button -->
        <button
          v-else
          type="button"
          :disabled="!canVerify || submitting"
          class="w-full h-12 px-6 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          @click="onFinalize"
        >
          <component
            v-if="submitting"
            :is="LoaderIcon"
            class="w-4 h-4 animate-spin"
          />
          <component v-else :is="LockIcon" class="w-4 h-4" />
          {{ submitting ? 'Memfinalisasi...' : 'Finalisasi Shift' }}
        </button>

        <p
          v-if="canVerify"
          class="text-[11px] text-slate-500 leading-relaxed text-center"
        >
          Setelah difinalisasi, shift tidak dapat diubah. Pastikan hitungan dan
          catatan sudah benar.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft as ArrowLeftIcon,
  Banknote as BanknoteIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  User as UserIcon,
  UserCheck as UserCheckIcon,
  StickyNote as StickyNoteIcon,
  Calculator as CalculatorIcon,
  Scale as ScaleIcon,
  Lock as LockIcon,
  Loader2 as LoaderIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircle2Icon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Equal as EqualIcon,
  Monitor as MonitorIcon,
} from 'lucide-vue-next';

import shiftService, {
  type ShiftDto,
  type ShiftDetailTransaction,
} from '@/shared/services/shift.service';
import SectionHeader from '@/admin/components/dashboard/SectionHeader.vue';
import CashDenominationInput from '@/admin/components/shift/CashDenominationInput.vue';

const route = useRoute();
const router = useRouter();

// ============================================
// State
// ============================================
const shift = ref<ShiftDto | null>(null);
const transactions = ref<ShiftDetailTransaction[]>([]);
const transactionsTotal = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);
const submitError = ref<string | null>(null);

// Form state
const actualCashCount = ref(0);
const breakdown = ref<Record<string, number>>({});
const adminNotes = ref('');
const appendBreakdown = ref(true);

// ============================================
// Computed
// ============================================
const shiftId = computed(() => String(route.params.id));

const canVerify = computed(
  () => shift.value?.status === 'CLOSED',
);

const totalExpected = computed(() => {
  if (!shift.value) return 0;
  return shift.value.expectedCash + shift.value.expectedQRIS;
});

const cashDifference = computed(() => {
  if (!shift.value) return 0;
  return actualCashCount.value - shift.value.expectedCash;
});

const hasSignificantCashVariance = computed(
  () => Math.abs(cashDifference.value) > 10_000 && actualCashCount.value > 0,
);

const qrisDifference = computed(() => {
  if (!shift.value) return 0;
  return (shift.value.actualQRIS ?? 0) - shift.value.expectedQRIS;
});

const hasBreakdown = computed(() =>
  Object.keys(breakdown.value).length > 0,
);

const durationLabel = computed(() => {
  if (!shift.value?.startTime || !shift.value?.endTime) return '';
  const start = new Date(shift.value.startTime).getTime();
  const end = new Date(shift.value.endTime).getTime();
  const minutes = Math.floor((end - start) / 60_000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}j ${mins}m`;
});

const statusBadge = computed(() => {
  if (!shift.value) return { label: '', cls: '' };
  switch (shift.value.status) {
    case 'OPEN':
      return {
        label: 'Aktif',
        cls: 'bg-blue-100 text-blue-700',
      };
    case 'CLOSED':
      return {
        label: 'Menunggu Verifikasi',
        cls: 'bg-amber-100 text-amber-700',
      };
    case 'FINALIZED':
      return {
        label: 'Difinalisasi',
        cls: 'bg-emerald-100 text-emerald-700',
      };
  }
});

interface ReconciliationView {
  label: string;
  bgCls: string;
  iconCls: string;
  titleCls: string;
  badgeCls: string;
  diffCls: string;
  icon: typeof TrendingUpIcon;
}

function buildReconciliationView(
  diff: number,
  hasInput: boolean,
): ReconciliationView {
  // Belum ada input → netral
  if (!hasInput) {
    return {
      label: 'Menunggu Input',
      bgCls: 'bg-slate-50 border-slate-200',
      iconCls: 'text-slate-500',
      titleCls: 'text-slate-700',
      badgeCls: 'bg-slate-200 text-slate-600',
      diffCls: 'text-slate-400',
      icon: EqualIcon,
    };
  }
  if (diff === 0) {
    return {
      label: 'Seimbang',
      bgCls: 'bg-emerald-50 border-emerald-200',
      iconCls: 'text-emerald-700',
      titleCls: 'text-emerald-900',
      badgeCls: 'bg-emerald-100 text-emerald-700',
      diffCls: 'text-emerald-700',
      icon: EqualIcon,
    };
  }
  if (diff > 0) {
    return {
      label: 'Surplus',
      bgCls: 'bg-blue-50 border-blue-200',
      iconCls: 'text-blue-700',
      titleCls: 'text-blue-900',
      badgeCls: 'bg-blue-100 text-blue-700',
      diffCls: 'text-blue-700',
      icon: TrendingUpIcon,
    };
  }
  return {
    label: 'Defisit',
    bgCls: 'bg-amber-50 border-amber-200',
    iconCls: 'text-amber-700',
    titleCls: 'text-amber-900',
    badgeCls: 'bg-amber-100 text-amber-700',
    diffCls: 'text-amber-700',
    icon: TrendingDownIcon,
  };
}

const cashReconciliation = computed(() =>
  buildReconciliationView(cashDifference.value, actualCashCount.value > 0),
);

const qrisReconciliation = computed(() => {
  if (!shift.value) {
    return buildReconciliationView(0, false);
  }
  // QRIS dianggap sudah ada input kalau actualQRIS sudah di-set kasir
  const hasInput =
    shift.value.actualQRIS !== null && shift.value.actualQRIS !== undefined;
  return buildReconciliationView(qrisDifference.value, hasInput);
});

// ============================================
// Lifecycle / actions
// ============================================
async function loadShift() {
  loading.value = true;
  error.value = null;
  try {
    const response = await shiftService.getDetail(shiftId.value);
    shift.value = response.shift;
    transactions.value = response.transactions.data;
    transactionsTotal.value = response.transactions.total;

    // Pre-fill admin notes kalau sudah ada (mis. shift sudah FINALIZED).
    // Sengaja TIDAK pre-fill actualCash dari shift.actualCash supaya admin
    // benar-benar menghitung ulang fisik (hint kasir tetap ditampilkan).
    if (shift.value.status === 'FINALIZED' && shift.value.actualCash) {
      // Kalau sudah finalized, tampilkan apa yang sudah disimpan tanpa
      // bisa diedit. Set actualCash dari shift.
      actualCashCount.value = shift.value.actualCash;
    }
  } catch (err: unknown) {
    error.value = extractErrorMessage(
      err,
      'Gagal memuat detail shift.',
    );
  } finally {
    loading.value = false;
  }
}

function onBreakdownChange(b: Record<string, number>) {
  breakdown.value = b;
}

async function onFinalize() {
  if (!shift.value || !canVerify.value) return;
  submitting.value = true;
  submitError.value = null;
  try {
    let notes = adminNotes.value.trim();

    if (appendBreakdown.value && hasBreakdown.value) {
      const breakdownStr = Object.entries(breakdown.value)
        .map(([label, count]) => `  - ${label}: ${count}`)
        .join('\n');
      const summary = [
        `Hitungan fisik admin: ${formatRupiah(actualCashCount.value)}`,
        `Ekspektasi sistem: ${formatRupiah(shift.value.expectedCash)}`,
        `Selisih: ${cashDifference.value > 0 ? '+' : ''}${formatRupiah(cashDifference.value)} (${cashReconciliation.value.label})`,
        '',
        'Rincian pecahan:',
        breakdownStr,
      ].join('\n');
      notes = notes ? `${notes}\n\n---\n${summary}` : summary;
    }

    const response = await shiftService.finalize(shiftId.value, {
      notes: notes || undefined,
    });
    shift.value = response.shift;
  } catch (err: unknown) {
    submitError.value = extractErrorMessage(
      err,
      'Gagal memfinalisasi shift.',
    );
  } finally {
    submitting.value = false;
  }
}

function onBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'admin-shifts' });
  }
}

// ============================================
// Helpers
// ============================================
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const msg = anyErr.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (typeof anyErr.message === 'string') return anyErr.message;
  }
  return fallback;
}

function formatRupiah(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

onMounted(loadShift);
</script>
