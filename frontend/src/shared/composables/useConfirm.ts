import { ref } from 'vue';

const isOpen = ref(false);
const title = ref('');
const message = ref('');
const confirmLabel = ref('Lanjut');
const cancelLabel = ref('Batal');
const confirmVariant = ref<'danger' | 'primary'>('primary');
let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirm() {
  function ask(opts: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
  }): Promise<boolean> {
    title.value = opts.title || 'Konfirmasi';
    message.value = opts.message;
    confirmLabel.value = opts.confirmLabel || 'Lanjut';
    cancelLabel.value = opts.cancelLabel || 'Batal';
    confirmVariant.value = opts.variant || 'primary';
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  function handleConfirm() {
    isOpen.value = false;
    resolvePromise?.(true);
    resolvePromise = null;
  }

  function handleCancel() {
    isOpen.value = false;
    resolvePromise?.(false);
    resolvePromise = null;
  }

  return {
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    confirmVariant,
    ask,
    handleConfirm,
    handleCancel,
  };
}
