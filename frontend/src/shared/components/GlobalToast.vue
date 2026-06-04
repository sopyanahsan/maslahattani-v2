<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80 max-w-[calc(100vw-2rem)]">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium relative overflow-hidden',
            toast.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800' :
            toast.type === 'error'   ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800' :
            toast.type === 'warning' ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800' :
                                       'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          ]"
        >
          <!-- Left accent bar -->
          <div :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error'   ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          ]" />

          <!-- Icon -->
          <div :class="['shrink-0 w-5 h-5 mt-0.5',
            toast.type === 'success' ? 'text-emerald-500' :
            toast.type === 'error'   ? 'text-red-500' :
            toast.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
          ]">
            <CheckCircleIcon v-if="toast.type === 'success'" class="w-5 h-5" />
            <XCircleIcon     v-else-if="toast.type === 'error'" class="w-5 h-5" />
            <AlertTriangleIcon v-else-if="toast.type === 'warning'" class="w-5 h-5" />
            <InfoIcon        v-else class="w-5 h-5" />
          </div>

          <!-- Message -->
          <p class="flex-1 text-slate-800 dark:text-slate-100 text-xs leading-relaxed">{{ toast.message }}</p>

          <!-- Close -->
          <button
            type="button"
            class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            @click="dismiss(toast.id)"
          >
            <XIcon class="w-3.5 h-3.5" />
          </button>

          <!-- Progress bar -->
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800">
            <div
              :class="['h-full transition-none',
                toast.type === 'success' ? 'bg-emerald-400' :
                toast.type === 'error'   ? 'bg-red-400' :
                toast.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
              ]"
              :style="{ width: toast.progress + '%', transition: `width ${toast.duration}ms linear` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, AlertTriangle as AlertTriangleIcon, Info as InfoIcon, X as XIcon } from 'lucide-vue-next';
import { useToast } from '@/shared/composables/useToast';
const { toasts, dismiss } = useToast();
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { transform: translateX(110%); opacity: 0; }
.toast-leave-to   { transform: translateX(110%); opacity: 0; }
</style>
