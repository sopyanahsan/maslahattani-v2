import { ref, nextTick } from 'vue';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  progress: number;
}

const toasts = ref<ToastItem[]>([]);
let nextId = 0;

export function useToast() {
  function show(message: string, type: ToastItem['type'] = 'info', duration = 4000) {
    const id = nextId++;
    toasts.value.push({ id, message, type, duration, progress: 100 });

    // Kick off progress bar animation after DOM paint
    nextTick(() => {
      const item = toasts.value.find(t => t.id === id);
      if (item) item.progress = 0;
    });

    setTimeout(() => dismiss(id), duration);
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function success(message: string, duration?: number) { show(message, 'success', duration); }
  function error(message: string, duration?: number)   { show(message, 'error', duration ?? 5000); }
  function warning(message: string, duration?: number) { show(message, 'warning', duration); }
  function info(message: string, duration?: number)    { show(message, 'info', duration); }

  return { toasts, show, dismiss, success, error, warning, info };
}
