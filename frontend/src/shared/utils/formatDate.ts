/**
 * Format ISO datetime string to shop timezone display.
 * Uses timezone from settings store, falls back to Asia/Jakarta.
 *
 * IMPORTANT: Prisma stores UTC in TIMESTAMP WITHOUT TIMEZONE columns.
 * If the ISO string doesn't have 'Z' or '+', we append 'Z' to force UTC parse.
 */

/** Get current shop timezone from localStorage cache (avoid importing store in utility) */
function getShopTimezone(): string {
  // Read from localStorage (synced by settings store on fetch)
  return localStorage.getItem('shop_timezone') || 'Asia/Jakarta';
}

/** Set timezone to localStorage (called by settings store) */
export function setShopTimezone(tz: string) {
  localStorage.setItem('shop_timezone', tz);
}

function parseISO(iso: string): Date {
  return iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
}

export function formatDateTimeWIB(iso: string): string {
  return parseISO(iso).toLocaleString('id-ID', {
    timeZone: getShopTimezone(),
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTimeFullWIB(iso: string): string {
  return parseISO(iso).toLocaleString('id-ID', {
    timeZone: getShopTimezone(),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateWIB(iso: string): string {
  return parseISO(iso).toLocaleDateString('id-ID', {
    timeZone: getShopTimezone(),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeWIB(iso: string): string {
  return parseISO(iso).toLocaleTimeString('id-ID', {
    timeZone: getShopTimezone(),
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Timezone options for settings UI */
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB (Waktu Indonesia Barat)', offset: 'UTC+7' },
  { value: 'Asia/Makassar', label: 'WITA (Waktu Indonesia Tengah)', offset: 'UTC+8' },
  { value: 'Asia/Jayapura', label: 'WIT (Waktu Indonesia Timur)', offset: 'UTC+9' },
];
