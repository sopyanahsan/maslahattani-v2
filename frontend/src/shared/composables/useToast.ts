import { ref } from 'vue';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const toasts = ref<ToastItem[]>([]);
let nextId = 0;

export function useToast() {
  function show(message: string, type: ToastItem['type'] = 'info', duration = 4000) {
    const id = nextId++;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
  }

  function success(message: string) { show(message, 'success'); }
  function error(message: string) { show(message, 'error', 5000); }
  function warning(message: string) { show(message, 'warning'); }
  function info(message: string) { show(message, 'info'); }

  return { toasts, show, success, error, warning, info };
}
