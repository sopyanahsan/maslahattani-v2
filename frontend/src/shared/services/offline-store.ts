import { openDB, type IDBPDatabase } from 'idb';
import type { CreateTransactionPayload } from './pos.service';

// ============================================
// IndexedDB schema for offline POS queue
// ============================================

const DB_NAME = 'maslahat-tani-offline';
const DB_VERSION = 1;

export interface PendingTransaction {
  id: string; // idempotencyKey (UUID)
  payload: CreateTransactionPayload;
  createdAt: string; // ISO timestamp when queued
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}

let dbInstance: IDBPDatabase | null = null;

/**
 * Get or create the IndexedDB instance.
 * Uses `idb` library for a promise-based wrapper.
 */
export async function getOfflineDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        const store = db.createObjectStore('pendingTransactions', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// ============================================
// CRUD operations for pending transactions
// ============================================

/**
 * Add a transaction to the offline queue.
 * Uses the idempotencyKey as the record ID to prevent duplicates.
 */
export async function addPendingTransaction(
  payload: CreateTransactionPayload,
): Promise<PendingTransaction> {
  const db = await getOfflineDB();

  const record: PendingTransaction = {
    id: payload.idempotencyKey!,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  await db.put('pendingTransactions', record);
  return record;
}

/**
 * Get all pending transactions (not yet synced).
 * Ordered by createdAt (oldest first = FIFO).
 */
export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await getOfflineDB();
  const all = await db.getAllFromIndex('pendingTransactions', 'by-status', 'pending');
  return (all as PendingTransaction[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Get count of pending transactions.
 */
export async function getPendingCount(): Promise<number> {
  const db = await getOfflineDB();
  return db.countFromIndex('pendingTransactions', 'by-status', 'pending');
}

/**
 * Update a pending transaction's status/error.
 */
export async function updatePendingTransaction(
  id: string,
  updates: Partial<Pick<PendingTransaction, 'status' | 'retryCount' | 'lastError'>>,
): Promise<void> {
  const db = await getOfflineDB();
  const existing = await db.get('pendingTransactions', id) as PendingTransaction | undefined;
  if (!existing) return;

  await db.put('pendingTransactions', { ...existing, ...updates });
}

/**
 * Remove a successfully synced transaction from the queue.
 */
export async function removePendingTransaction(id: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pendingTransactions', id);
}

/**
 * Get all transactions (any status) for debugging.
 */
export async function getAllOfflineTransactions(): Promise<PendingTransaction[]> {
  const db = await getOfflineDB();
  return db.getAll('pendingTransactions') as Promise<PendingTransaction[]>;
}

/**
 * Clear all pending transactions (e.g., after logout).
 */
export async function clearAllPending(): Promise<void> {
  const db = await getOfflineDB();
  await db.clear('pendingTransactions');
}
