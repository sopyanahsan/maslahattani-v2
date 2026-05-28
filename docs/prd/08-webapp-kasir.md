# PRD — Webapp Kasir (POS & BRILink)

**Status**: Ready to Implement
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/webapp-kasir`
**URL**: `maslahattani.my.id` (production) / `localhost:5173/webapp/` (dev)

---

## 1. Overview

Webapp Kasir adalah aplikasi web mobile-first untuk kasir/operator toko. Diakses via browser di tablet/HP. Fitur utama:

- **POS Retail** — scan/cari produk, checkout, offline-capable
- **BRILink** — transfer, tarik tunai, top-up (sudah ada view, belum di-route)
- **Shift** — buka/tutup shift dengan audit kas per kategori
- **Riwayat** — lihat transaksi hari ini

---

## 2. Current State (Sudah Diimplementasi)

| Fitur | Status | Notes |
|-------|--------|-------|
| Login kasir | ✅ Done | Animasi confetti + morph |
| Dashboard | ✅ Done | Greeting, stats, shift CTA |
| POS Retail | ✅ Done | Search, cart, checkout, offline queue |
| Shift (Open/Close) | ✅ Done | Per-category, variance calculation |
| Riwayat Transaksi | ✅ Done | Expandable detail |
| BRILink Transaction | ✅ View exists | NOT ROUTED — perlu wire ke router |
| Offline Sync | ✅ Done | IndexedDB + auto-sync 10s |

---

## 3. Yang Perlu Diperbaiki / Ditambahkan

### 3.1 Bug Fixes (Priority 1)

| Bug | Detail | Fix |
|-----|--------|-----|
| Login redirect salah | Redirect ke `/kasir/dashboard` tapi route actual `/dashboard` | Fix path di LoginView |
| BRILink view not routed | `BrilinkTransactionView.vue` exist tapi placeholder di router | Wire ke route |
| POS tidak cek shift | Kasir bisa checkout tanpa buka shift | Block POS kalau shift belum dibuka |
| Omzet dashboard "—" | Tidak ada data source | Fetch dari today's transactions |

### 3.2 Phase 1 Enhancements (Priority 2)

| Enhancement | Detail |
|-------------|--------|
| Shift guard di POS | Modal "Buka Shift dulu" sebelum checkout |
| HUTANG flow di POS | Metode HUTANG → input nama + HP → auto-create Debt linked ke transaksi |
| Bottom nav: 5 items | Beranda, POS, BRILink, Shift, Riwayat |
| Receipt print (basic) | `window.print()` popup |
| Dashboard omzet | Sum totalPrice dari transaksi hari ini |

### 3.3 BRILink Phase 2 (Priority 3)

| Feature | Route | View |
|---------|-------|------|
| Transfer (BRI + antar bank) | `/brilink/transaction` | BrilinkTransactionView (sudah ada!) |
| Tarik Tunai | Same route | Category pre-selected |
| Top-Up (pulsa/data/ewallet/PLN) | Same route | Category pre-selected |

> **Note**: `BrilinkTransactionView.vue` sudah fully built — support 7 kategori, fee calculation, receipt modal. Cukup wire ke routes.

### 3.4 Future (Phase 3)

| Feature | Detail |
|---------|--------|
| Barcode scanner | Camera-based via `html5-qrcode` |
| Thermal printer | Bluetooth Web Serial |
| Forgot password | Self-service reset |
| PWA | Manifest + offline fallback |
| Push notifications | Firebase Cloud Messaging |

---

## 4. Implementation Plan

### Sprint 1: Bug Fixes + BRILink Routing
1. Fix login redirect path
2. Wire BRILink route ke BrilinkTransactionView
3. Fix dashboard omzet
4. Update bottom nav (5 items)

### Sprint 2: POS Improvements
1. Shift guard: block checkout kalau shift belum dibuka
2. HUTANG payment flow: input customer → create Debt linked to transaction
3. Basic receipt (`window.print()`)

### Sprint 3: Polish
1. Loading skeletons
2. Error boundaries
3. PWA manifest

---

## 5. Tech Notes

### Offline Strategy
- POS transactions queued to IndexedDB with idempotency key
- Auto-sync every 10s when online
- Status indicator di header (green/red dot)
- Pending count badge

### Multi-Entry Build (Vite)
- `frontend/index.html` → Admin Panel (`localhost:5173/`)
- `frontend/webapp/index.html` → Webapp Kasir (`localhost:5173/webapp/`)

### Auth Flow
- Login: email + password → token (no OTP for kasir)
- Guard: KASIR or CASHIER_SUPERVISOR role only

---

## 6. Confirmed Decisions

1. BRILink = 1 route, view handle category selector
2. POS wajib cek shift → block kalau belum buka
3. HUTANG flow → input nama/HP → auto-create Debt
4. Bottom nav: 5 items (Beranda | POS | BRILink | Shift | Riwayat)
5. Receipt: `window.print()` (thermal printer Phase 3)
6. No dark mode untuk webapp (selalu light)
7. Login redirect ke `/dashboard` (bukan `/kasir/dashboard`)

---

## 7. Routes Final

```
/login                → LoginView (guest only)
/dashboard            → DashboardView
/retail/pos           → POSView
/retail/history       → TransactionHistoryView
/retail/shift         → ShiftView
/brilink/transaction  → BrilinkTransactionView (ALL 7 categories)
```
