<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="handleCancel"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ title }}</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ message }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              @click="handleCancel"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              :class="['h-9 px-4 text-xs font-semibold text-white rounded-lg transition-colors',
                confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700']"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from '@/shared/composables/useConfirm';
const { isOpen, title, message, confirmLabel, cancelLabel, confirmVariant, handleConfirm, handleCancel } = useConfirm();
</script>

<style scoped>
.confirm-fade-enter-active { transition: all 0.2s ease; }
.confirm-fade-leave-active { transition: all 0.15s ease; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; }
</style>
