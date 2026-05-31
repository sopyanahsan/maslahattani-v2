<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
  >
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
        Aktivitas Terkini
      </h3>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">
        Retail, inventori, finance
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="activities.length === 0"
      class="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500"
    >
      <component :is="ActivityIcon" class="w-10 h-10 mb-2 opacity-60" />
      <p class="text-sm font-semibold">Belum ada aktivitas</p>
      <p class="text-[11px] mt-0.5">
        Setiap event retail/BRILink akan muncul di sini.
      </p>
    </div>

    <!-- Feed -->
    <ul
      v-else
      class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px]"
    >
      <li
        v-for="(a, idx) in activities"
        :key="`${a.type}-${a.timestamp}-${idx}`"
        class="px-4 py-2.5 flex items-start gap-3"
      >
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            categoryStyle(a.category).bg,
          ]"
        >
          <component
            :is="resolveIcon(a.icon)"
            :class="['w-4 h-4', categoryStyle(a.category).color]"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ a.title }}
            </p>
            <span
              :class="[
                'inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                categoryStyle(a.category).badge,
              ]"
            >
              {{ categoryLabel(a.category) }}
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
            {{ a.description }}
          </p>
        </div>
        <span
          class="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-1"
        >
          {{ relativeTime(a.timestamp) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  Activity as ActivityIcon,
  Receipt as ReceiptIcon,
  Landmark as LandmarkIcon,
  Package as PackageIcon,
  PackageMinus as PackageMinusIcon,
  ArrowRightLeft as ArrowRightLeftIcon,
  Check as CheckIcon,
  Wallet as WalletIcon,
  XCircle as XCircleIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Edit as EditIcon,
  Bell as BellIcon,
  type LucideIcon,
} from 'lucide-vue-next';
import type { RecentActivity } from '@/shared/services/dashboard.service';

defineProps<{
  activities: RecentActivity[];
  loading?: boolean;
}>();

const ICON_MAP: Record<string, LucideIcon> = {
  receipt: ReceiptIcon,
  landmark: LandmarkIcon,
  package: PackageIcon,
  'package-minus': PackageMinusIcon,
  'arrow-right-left': ArrowRightLeftIcon,
  check: CheckIcon,
  wallet: WalletIcon,
  'x-circle': XCircleIcon,
  'clipboard-check': ClipboardCheckIcon,
  edit: EditIcon,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BellIcon;
}

function categoryStyle(cat: RecentActivity['category']) {
  switch (cat) {
    case 'RETAIL':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        color: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      };
    case 'BRILINK':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        color: 'text-purple-600 dark:text-purple-400',
        badge:
          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      };
    case 'INVENTORY':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        color: 'text-emerald-600 dark:text-emerald-400',
        badge:
          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      };
    case 'FINANCE':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        color: 'text-amber-600 dark:text-amber-400',
        badge:
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      };
    case 'RETAIL_VOIDED':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        color: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        color: 'text-slate-600 dark:text-slate-400',
        badge:
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
  }
}

function categoryLabel(cat: RecentActivity['category']): string {
  switch (cat) {
    case 'RETAIL':
      return 'Retail';
    case 'BRILINK':
      return 'BRILink';
    case 'INVENTORY':
      return 'Stok';
    case 'FINANCE':
      return 'Kas';
    case 'RETAIL_VOIDED':
      return 'Void';
    default:
      return 'Lainnya';
  }
}

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return 'Baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}j`;
  return `${Math.floor(diff / 86_400_000)}h`;
}
</script>
