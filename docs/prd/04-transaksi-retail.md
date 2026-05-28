# PRD — Redesign Halaman Transaksi Retail

**Status**: Ready to Implement
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/transaksi-retail`
**Depends on**: PRD 01 (Dashboard Retail) — pattern reuse

---

## 1. Overview

Redesign halaman `/admin/transactions` agar lebih powerful:
- Search by nomor transaksi
- Filter by payment method + kasir
- Dark mode support
- Better detail modal UX
- Void dengan konfirmasi yang lebih jelas

URL: `/admin/transactions`

---

## 2. Goals

1. Admin bisa cari transaksi berdasarkan nomor transaksi (search)
2. Filter: status, tanggal, metode pembayaran, kasir
3. Full dark mode support (konsisten dengan dashboard)
4. Detail modal: info lengkap + items + payment + void info
5. Void flow: OTP + reason, konfirmasi visual
6. Stats cards tetap ada (omzet, profit, transaksi, void)

---

## 3. Enhancements

### 3.1 Backend — QueryTransactionDto Enhancement
Tambah field:
- `search?: string` — cari by transactionNumber (LIKE/contains)
- `paymentMethod?: PaymentMethod` — filter by metode bayar

### 3.2 Backend — findAll Enhancement
- Support `search` filter: WHERE transactionNumber ILIKE '%search%'
- Support `paymentMethod` filter: JOIN payments WHERE method = X
- Return cashier info (user.username, user.email) in list response

### 3.3 Frontend — AdminTransactionsView.vue Redesign
- Dark mode classes (`dark:` prefix) di semua elemen
- Search input (debounced 300ms)
- Payment method dropdown filter
- Kasir dropdown filter (fetch list kasir dari shop)
- Improved stats cards with dark mode
- Better table with dark mode
- Detail modal with dark mode
- Void modal with dark mode + better UX

---

## 4. API Changes

### Enhanced `GET /api/transactions`
Query params tambahan:
- `search` — partial match on transactionNumber
- `paymentMethod` — CASH | QRIS | TRANSFER | HUTANG

Response tetap sama shape: `{ data: TransactionDto[], meta: {...} }`

### Existing endpoints (no changes needed):
- `GET /api/transactions/:id` — detail (sudah lengkap)
- `POST /api/transactions/:id/void` — void (sudah ada OTP + reason)
- `GET /api/transactions/stats` — stats (sudah ada)

---

## 5. Implementation Plan

### Backend (minimal changes)
1. Add `search` and `paymentMethod` fields to `QueryTransactionDto`
2. Update `findAll()` in service to handle new filters
3. No new endpoints needed — existing ones are sufficient

### Frontend (main work)
1. Redesign `AdminTransactionsView.vue` with full dark mode
2. Add search input with debounce
3. Add payment method filter dropdown
4. Add kasir filter dropdown (use existing users from shop)
5. Polish detail modal and void modal with dark mode
6. Consistent styling with dashboard pages

---

## 6. Out of Scope

- Export PDF/Excel (akan di feat/laporan-retail)
- Bulk void
- Transaction edit (transaksi immutable setelah dibuat)
- Receipt reprint dari admin panel

---

## 7. Confirmed Decisions

1. Search = ILIKE on transactionNumber only (not customer name — retail doesn't have customer)
2. Void tetap pakai OTP flow existing
3. Stats cards tetap 4 (omzet, profit, count, void count)
4. Dark mode wajib konsisten dengan dashboard retail/brilink
5. Pagination tetap 20 per page
