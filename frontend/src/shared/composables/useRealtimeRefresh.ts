import { inject, watch, type Ref } from 'vue';

/**
 * useRealtimeRefresh — composable untuk auto-refresh data halaman
 * ketika ada real-time event dari WebSocket.
 *
 * Cara kerja:
 * - AdminLayout.vue provide `realtimeSignal` (ref<number>)
 * - Setiap kali backend emit event, signal naik
 * - Composable ini watch signal dan panggil fetchFn
 * - Data TIDAK hilang saat offline karena halaman tidak di-unmount
 *
 * Contoh:
 * ```ts
 * useRealtimeRefresh(() => {
 *   fetchTransactions();
 *   fetchStats();
 * });
 * ```
 */
export function useRealtimeRefresh(fetchFn: () => void | Promise<void>) {
  const realtimeSignal = inject<Ref<number>>('realtimeSignal');

  if (realtimeSignal) {
    watch(realtimeSignal, () => {
      // Only fetch if online
      if (navigator.onLine) {
        fetchFn();
      }
    });
  }
}
