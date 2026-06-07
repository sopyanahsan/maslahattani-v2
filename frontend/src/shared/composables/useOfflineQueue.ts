import { ref, onMounted, onUnmounted } from 'vue';
import {
  getQueue,
  getPendingCount,
  processQueue,
  enqueue,
  dequeue,
  clearQueue,
  type QueueItem,
} from '@/shared/utils/offlineQueue';

/**
 * useOfflineQueue — composable untuk manage pending offline actions.
 *
 * Features:
 * - Otomatis sync saat online kembali
 * - Badge count untuk UI (tampilkan "3 pending" di topbar)
 * - Manual retry & dismiss
 *
 * Cara pakai di component:
 * ```ts
 * const { pendingCount, addToQueue, syncNow } = useOfflineQueue();
 *
 * // Saat user submit form tapi offline:
 * addToQueue({
 *   method: 'POST',
 *   url: '/brilink/transactions',
 *   data: formData,
 *   description: 'Transaksi BRILink - Transfer BRI',
 * });
 * ```
 */
export function useOfflineQueue() {
  const pendingCount = ref(getPendingCount());
  const queue = ref<QueueItem[]>(getQueue());
  const syncing = ref(false);

  let onlineHandler: (() => void) | null = null;

  function refresh() {
    queue.value = getQueue();
    pendingCount.value = getPendingCount();
  }

  /**
   * Add action to offline queue
   */
  function addToQueue(item: {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: any;
    description: string;
  }): QueueItem {
    const newItem = enqueue(item);
    refresh();
    return newItem;
  }

  /**
   * Remove item from queue (dismiss failed item)
   */
  function removeFromQueue(id: string) {
    dequeue(id);
    refresh();
  }

  /**
   * Clear entire queue
   */
  function clearAll() {
    clearQueue();
    refresh();
  }

  /**
   * Manually trigger sync (or auto-triggered on online event)
   */
  async function syncNow(): Promise<{ synced: number; failed: number }> {
    if (syncing.value) return { synced: 0, failed: 0 };
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    syncing.value = true;
    try {
      const result = await processQueue();
      refresh();
      return result;
    } finally {
      syncing.value = false;
    }
  }

  // Auto-sync when coming back online
  onMounted(() => {
    onlineHandler = () => {
      // Small delay to let network stabilize
      setTimeout(() => {
        syncNow();
      }, 1500);
    };
    window.addEventListener('online', onlineHandler);

    // Initial sync attempt (in case there are items from previous session)
    if (navigator.onLine && getPendingCount() > 0) {
      setTimeout(() => syncNow(), 2000);
    }
  });

  onUnmounted(() => {
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler);
    }
  });

  return {
    /** Number of pending items */
    pendingCount,
    /** Full queue list */
    queue,
    /** Is currently syncing */
    syncing,
    /** Add action to queue (call when offline) */
    addToQueue,
    /** Remove item from queue */
    removeFromQueue,
    /** Clear all items */
    clearAll,
    /** Manually trigger sync */
    syncNow,
    /** Refresh state from localStorage */
    refresh,
  };
}
