import { onMounted, onUnmounted, ref } from 'vue';

/**
 * useAutoRefresh — composable untuk auto-refresh data di semua halaman admin.
 *
 * Cara pakai:
 *   useAutoRefresh(fetchMyData); // default 30 detik
 *   useAutoRefresh(fetchMyData, 15000); // 15 detik
 *
 * Features:
 * - Auto-refresh setiap interval (silent, tanpa loading/flicker)
 * - Pause saat tab hidden (hemat resource)
 * - Resume + immediate fetch saat tab visible lagi
 * - Cleanup otomatis saat component unmount
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void> | void,
  intervalMs: number = 30_000,
) {
  let timer: ReturnType<typeof setInterval> | null = null;
  const isRefreshing = ref(false);

  function start() {
    stop();
    timer = setInterval(async () => {
      if (document.hidden) return;
      isRefreshing.value = true;
      try {
        await fetchFn();
      } catch {
        // Silent — don't break the interval on error
      } finally {
        isRefreshing.value = false;
      }
    }, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') {
      fetchFn();
      start();
    } else {
      stop();
    }
  }

  onMounted(() => {
    start();
    document.addEventListener('visibilitychange', handleVisibility);
  });

  onUnmounted(() => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibility);
  });

  return { isRefreshing, startRefresh: start, stopRefresh: stop };
}
