import { ref, watch, onMounted } from 'vue';

/**
 * Theme management composable.
 *
 * Strategy:
 * - 3 modes: 'light' | 'dark' | 'system'
 * - Persisted in localStorage as `theme` key
 * - Default: 'system' (auto-detect OS preference via prefers-color-scheme)
 * - Applies `dark` class on <html> element for Tailwind dark: variant
 * - Sidebar tetap selalu dark (consistent brand) — handled di komponen sidebar
 */

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

// Singleton state — semua komponen yang pakai useTheme() share state yang sama.
const mode = ref<ThemeMode>('system');
const resolved = ref<'light' | 'dark'>('light'); // hasil akhir setelah resolve 'system'
let initialized = false;

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(m: ThemeMode) {
  const actual = m === 'system' ? getSystemPreference() : m;
  resolved.value = actual;
  if (typeof document !== 'undefined') {
    if (actual === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

function initialize() {
  if (initialized) return;
  initialized = true;

  mode.value = getStoredMode();
  applyTheme(mode.value);

  // Watch user preference changes (mode toggle)
  watch(mode, (newMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme(newMode);
  });

  // Watch OS preference change kalau mode = 'system'
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (mode.value === 'system') applyTheme('system');
    });
  }
}

export function useTheme() {
  onMounted(initialize);

  function setMode(m: ThemeMode) {
    mode.value = m;
  }

  function toggle() {
    // Toggle siklus: light → dark → system → light
    if (mode.value === 'light') setMode('dark');
    else if (mode.value === 'dark') setMode('system');
    else setMode('light');
  }

  function toggleSimple() {
    // Toggle binary: light ↔ dark (skip system)
    if (resolved.value === 'dark') setMode('light');
    else setMode('dark');
  }

  return {
    mode,
    resolved,
    setMode,
    toggle,
    toggleSimple,
  };
}

// Initialize segera saat module di-import (sebelum Vue mount), supaya
// dark class sudah aktif sebelum first render → no flash of wrong theme.
if (typeof window !== 'undefined') {
  const stored = getStoredMode();
  applyTheme(stored);
  mode.value = stored;
}
