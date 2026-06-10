/**
 * offlineQueue — Queue untuk menyimpan aksi (POST/PUT/DELETE) saat offline.
 * Akan di-sync otomatis saat koneksi kembali.
 *
 * Cara kerja:
 * 1. Saat offline + user melakukan aksi → simpan ke queue (localStorage)
 * 2. Saat online kembali → otomatis process queue satu per satu
 * 3. Jika request gagal (bukan network error) → buang dari queue (data conflict)
 * 4. UI menampilkan badge "X pending" saat ada item di queue
 */

import api from '@/shared/services/api';

const QUEUE_KEY = 'offline_queue';

export interface QueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  description: string; // Human-readable: "Tambah transaksi BRILink"
  createdAt: string;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

/**
 * Get all items in queue
 */
export function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get count of pending items
 */
export function getPendingCount(): number {
  return getQueue().filter(i => i.status === 'pending').length;
}

/**
 * Add an action to the offline queue
 */
export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'status'>): QueueItem {
  const queue = getQueue();
  const newItem: QueueItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  queue.push(newItem);
  saveQueue(queue);
  return newItem;
}

/**
 * Remove item from queue (after successful sync or manual dismiss)
 */
export function dequeue(id: string): void {
  const queue = getQueue().filter(i => i.id !== id);
  saveQueue(queue);
}

/**
 * Clear entire queue
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Process all pending items in queue (called when online)
 * Returns: { synced: number, failed: number }
 */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  const pending = queue.filter(i => i.status === 'pending');

  if (pending.length === 0) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      item.status = 'processing';
      saveQueue(queue);

      switch (item.method) {
        case 'POST':
          await api.post(item.url, item.data);
          break;
        case 'PUT':
          await api.put(item.url, item.data);
          break;
        case 'PATCH':
          await api.patch(item.url, item.data);
          break;
        case 'DELETE':
          await api.delete(item.url, { data: item.data });
          break;
      }

      // Success — remove from queue
      const idx = queue.findIndex(q => q.id === item.id);
      if (idx !== -1) queue.splice(idx, 1);
      synced++;
    } catch (err: any) {
      // Network error → keep in queue for retry
      if (!err.response) {
        item.status = 'pending';
      } else {
        // Server error (4xx/5xx) → mark failed, don't retry
        item.status = 'failed';
        item.error = err.response?.data?.message || err.message || 'Gagal sync';
        failed++;
      }
    }
  }

  saveQueue(queue);
  return { synced, failed };
}

// ============================================
// INTERNAL
// ============================================

function saveQueue(queue: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — nothing we can do
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
