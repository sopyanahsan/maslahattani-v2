import { ref, readonly } from 'vue';
import posService from './pos.service';
import {
  getPendingTransactions,
  updatePendingTransaction,
  removePendingTransaction,
  getPendingCount,
  type PendingTransaction,
} from './offline-store';

// ============================================
// Sync state (reactive, shared across app)
// ============================================

const isSyncing = ref(false);
const pendingCount = ref(0);
const lastSyncAt = ref<string | null>(null);
const lastSyncError = ref<string | null>(null);

/** Max retries before marking as 'failed' */
const MAX_RETRIES = 5;
/** Interval between auto-sync attempts (ms) */
const SYNC_INTERVAL = 10_000; // 10 seconds per PRD

let syncInterval: ReturnType<typeof setInterval> | null = null;

// ============================================
// Core sync logic
// ============================================

/**
 * Process all pending transactions in the offline queue (FIFO order).
 * Each transaction is sent to the server with its idempotencyKey,
 * so even if the same request is sent twice, the server won't create duplicates.
 *
 * Strategy:
 * - On success: remove from queue
 * - On 4xx (client error): mark as 'failed' (won't auto-retry)
 * - On network/5xx error: increment retryCount, keep as 'pending'
 * - If retryCount >= MAX_RETRIES: mark as 'failed'
 */
async function processQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncing.value) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  isSyncing.value = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingTransactions();
    if (pending.length === 0) {
      isSyncing.value = false;
      return { synced: 0, failed: 0 };
    }

    for (const record of pending) {
      try {
        // Mark as syncing
        await updatePendingTransaction(record.id, { status: 'syncing' });

        // Attempt to create transaction on server
        await posService.createTransaction(record.payload);

        // Success — remove from queue
        await removePendingTransaction(record.id);
        synced++;
      } catch (err: any) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message ?? err?.message ?? 'Unknown error';

        if (status && status >= 400 && status < 500 && status !== 409) {
          // Client error (bad request, forbidden, etc.) — won't succeed on retry
          await updatePendingTransaction(record.id, {
            status: 'failed',
            lastError: message,
            retryCount: record.retryCount + 1,
          });
          failed++;
        } else if (status === 409) {
          // Conflict — transaction already exists (idempotent success)
          await removePendingTransaction(record.id);
          synced++;
        } else {
          // Network error or 5xx — retry later
          const newRetryCount = record.retryCount + 1;
          if (newRetryCount >= MAX_RETRIES) {
            await updatePendingTransaction(record.id, {
              status: 'failed',
              lastError: `Max retries exceeded: ${message}`,
              retryCount: newRetryCount,
            });
            failed++;
          } else {
            await updatePendingTransaction(record.id, {
              status: 'pending',
              lastError: message,
              retryCount: newRetryCount,
            });
          }
        }
      }
    }

    lastSyncAt.value = new Date().toISOString();
    lastSyncError.value = null;
  } catch (err: any) {
    lastSyncError.value = err?.message ?? 'Sync error';
  } finally {
    isSyncing.value = false;
    await refreshPendingCount();
  }

  return { synced, failed };
}

/**
 * Refresh the reactive pending count from IndexedDB.
 */
async function refreshPendingCount(): Promise<void> {
  pendingCount.value = await getPendingCount();
}

// ============================================
// Auto-sync lifecycle
// ============================================

/**
 * Start the auto-sync interval.
 * Also listens to 'online' event to trigger immediate sync.
 */
function startAutoSync(): void {
  if (syncInterval) return; // Already running

  // Sync immediately on startup if online
  if (navigator.onLine) {
    processQueue();
  }

  // Periodic sync
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      processQueue();
    }
  }, SYNC_INTERVAL);

  // Sync when coming back online
  window.addEventListener('online', handleOnline);

  // Refresh count on visibility change (user switches back to tab)
  document.addEventListener('visibilitychange', handleVisibility);
}

/**
 * Stop the auto-sync interval and remove listeners.
 */
function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  window.removeEventListener('online', handleOnline);
  document.removeEventListener('visibilitychange', handleVisibility);
}

function handleOnline() {
  // Small delay to let network stabilize
  setTimeout(() => processQueue(), 1000);
}

function handleVisibility() {
  if (document.visibilityState === 'visible') {
    refreshPendingCount();
  }
}

// ============================================
// Exported composable
// ============================================

export function useSyncService() {
  return {
    // Reactive state (read-only)
    isSyncing: readonly(isSyncing),
    pendingCount: readonly(pendingCount),
    lastSyncAt: readonly(lastSyncAt),
    lastSyncError: readonly(lastSyncError),

    // Actions
    processQueue,
    refreshPendingCount,
    startAutoSync,
    stopAutoSync,
  };
}
