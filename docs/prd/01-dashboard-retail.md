# PRD — Dashboard Retail

**Status**: Draft
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/dashboard-retail`

---

## 1. Overview

Dashboard Retail adalah halaman utama monitoring operasional toko untuk:

- **Super-Admin** → overview multi-cabang (bisa switch cabang via topbar)
- **Admin Cabang** → monitoring harian satu cabang

URL: `/admin/dashboard`

---

## 2. Goals

1. Memberi visual ringkasan operasional retail dalam satu layar
2. Default time range = **Hari Ini** (real-time / refresh per 30 detik)
3. Mendukung filter time range: Hari Ini / 7 Hari / 30 Hari
4. Quick action ke menu yang paling sering dipakai dari dashboard
5. Highlight masalah yang butuh perhatian (hutang jatuh tempo, stok menipis, shift terlalu lama)

---

## 3. Layout & Sections

### 3.1 Top Bar (sticky)
- Selector time range: `Hari Ini` (default) / `7 Hari` / `30 Hari` / `Custom`
- Tombol refresh manual + indicator "last updated X seconds ago"
- Auto-refresh toggle (default ON, interval 30 detik)

### 3.2 KPI Cards (Row 1) — 4 cards
| Card | Metric | Compare |
|------|--------|---------|
| Omzet | Total `transactions.totalPrice` (status COMPLETED) | vs hari kemarin (Δ%) |
| Transaksi | Count COMPLETED | vs hari kemarin (Δ%) |
| Profit | Sum (totalPrice - totalCost) | vs hari kemarin (Δ%) |
| AOV (Avg Order Value) | omzet / count | vs hari kemarin (Δ%) |

### 3.3 Quick Actions (Row 2) — 6 buttons inline
1. 📊 Dashboard Retail (jadi self-link / refresh)
2. 📊 Dashboard BRILink → `/admin/brilink`
3. 💵 Mutasi Retail → `/admin/kas-retail` (default tab Mutasi)
4. 🏦 Mutasi BRILink → `/admin/kas-rekening-brilink` (default tab Mutasi)
5. 🧾 Transaksi Retail → `/admin/transactions`
6. 🧾 Transaksi BRILink → `/admin/brilink/transaksi`

### 3.4 Main Grid (Row 3) — 2 kolom

#### Kolom Kiri (lg:col-span-2)
**Chart Penjualan** (jika range = Hari Ini → per jam, jika 7d/30d → per hari)
- Line chart: Omzet
- Secondary line: Profit
- CSS-based bar chart (no chart library dependency)

#### Kolom Kanan (lg:col-span-1)
**Status Operasional**
- **Shift kasir aktif**: count + nama kasir + start time
  - Indicator warning kalau shift sudah melewati threshold (default 8 jam, configurable di Pengaturan)
- **Last Online Kasir**: kasir terakhir login / aktivitas terakhir per kasir (top 3)
  - Format: "Budi — 5 menit lalu"
- **Last Transaction**: transaksi paling baru (retail / brilink)
  - Format: "INV-001 • Rp 50.000 • 2 menit lalu"
- Total kasir hari ini (open/closed/finalized)

### 3.5 Insight Cards (Row 4) — 3 kolom

#### Top Produk Terjual (5 baris)
- Rank, nama produk, qty, omzet
- Klik baris → buka detail produk

#### Aktivitas Terkini (10 baris, scrollable)
- Mix dari **Retail + BRILink** events:
  - 🧾 Transaksi retail baru
  - 🏦 Transaksi BRILink baru (transfer/tarik tunai/topup)
  - ❌ Void transaksi
  - 📦 Restok stok / Stock IN
  - ✅ Opname session selesai
  - ↔️ Transfer stok antar cabang
  - 💵 Mutasi kas (cash in/out)
- Format: ikon, deskripsi, waktu (X menit lalu), badge type (RETAIL/BRILINK)
- Kategori dibedakan dengan warna icon (biru = retail, ungu = brilink, hijau = stock, dll)

#### Breakdown Payment Method
- Pie / horizontal bar: Cash, QRIS, Transfer, Hutang
- Persen + nominal absolut

### 3.6 Alert Section (Row 5) — full width grid 3 cols

| Alert | Trigger | Default Threshold | Action button |
|-------|---------|-------------------|---------------|
| 🔴 Hutang Jatuh Tempo | dueDate <= today AND status != PAID | — | "Lihat Hutang" → `/admin/debts` |
| 🟡 Stok Menipis | quantity <= threshold | 5 unit | "Lihat Stok" → `/admin/products` |
| 🟠 Shift Lama Tidak Tutup | shift OPEN > N jam | 8 jam | "Cek Shift" → `/admin/shifts` |

Tampil hanya kalau ada data. Kalau semua aman, tampil status hijau "Semua aman ✓".

**Threshold configurable di** `/admin/settings` → tab **Notifikasi & Alert**:
- `lowStockThreshold` (int, default 5) — minimum unit stok sebelum dianggap menipis
- `shiftDurationWarningHours` (int, default 8) — jam kerja shift sebelum warning muncul
- `overdueDebtDaysBeforeNotice` (int, default 0) — H- berapa hari sebelum jatuh tempo mau di-warn (0 = exact dueDate)

Stored di tabel baru `ShopSettingAlerts` atau extend existing `ShopSetting.alertConfig` (JSON).

### 3.7 Comparison Section (Row 6) — 2 kolom

#### Hari Ini vs Kemarin
- Side-by-side comparison: omzet, profit, transaksi
- Growth indicator (▲ green / ▼ red)

#### Kasir Performance Hari Ini (leaderboard top 5)
- Rank, nama kasir, jumlah transaksi, total omzet
- Visualisasi bar relative (% dari top performer)

---

## 4. API Endpoints (Backend)

Semua endpoint return data filtered by `currentShopId` dari JWT.

### `GET /api/dashboard/retail/overview?period=today|week|month&shopId=xxx`
Response:
```json
{
  "kpi": {
    "revenue": { "value": 1500000, "previousValue": 1200000, "changePercent": 25 },
    "transactions": { "value": 45, "previousValue": 38, "changePercent": 18 },
    "profit": { "value": 450000, "previousValue": 360000, "changePercent": 25 },
    "aov": { "value": 33333, "previousValue": 31578, "changePercent": 5 }
  }
}
```

### `GET /api/dashboard/retail/sales-chart?period=today|week|month&shopId=xxx`
Response:
```json
{
  "labels": ["00:00", "01:00", ..., "23:00"],
  "revenue": [0, 0, 50000, ...],
  "profit": [0, 0, 15000, ...]
}
```

### `GET /api/dashboard/retail/operations?shopId=xxx`
Response:
```json
{
  "activeShifts": [
    {
      "id": "s1",
      "cashierName": "Budi",
      "startTime": "2026-05-26T08:00:00Z",
      "durationMinutes": 240,
      "isOverThreshold": false
    }
  ],
  "shiftStats": { "open": 1, "closed": 2, "finalized": 5 },
  "lastOnlineCashiers": [
    { "userId": "u1", "name": "Budi", "lastActiveAt": "2026-05-26T11:55:00Z" },
    { "userId": "u2", "name": "Siti", "lastActiveAt": "2026-05-26T10:30:00Z" }
  ],
  "lastTransaction": {
    "id": "t1",
    "type": "RETAIL",
    "transactionNumber": "INV-001",
    "amount": 50000,
    "createdAt": "2026-05-26T11:58:00Z"
  }
}
```

### `GET /api/dashboard/retail/top-products?period=today&limit=5&shopId=xxx`
Response:
```json
{
  "data": [
    { "productId": "p1", "name": "Pupuk NPK", "qty": 12, "revenue": 600000 }
  ]
}
```

### `GET /api/dashboard/retail/recent-activity?limit=10&shopId=xxx`

Mix events dari berbagai sumber, sorted by timestamp DESC.

Response:
```json
{
  "data": [
    {
      "type": "RETAIL_TRANSACTION",
      "category": "RETAIL",
      "icon": "receipt",
      "title": "Transaksi #INV-001",
      "description": "Rp 50.000 • Cash • Budi",
      "timestamp": "2026-05-26T11:58:00Z"
    },
    {
      "type": "BRILINK_TRANSACTION",
      "category": "BRILINK",
      "icon": "landmark",
      "title": "Transfer BRI",
      "description": "Rp 200.000 • fee Rp 6.500 • #BRL-001",
      "timestamp": "2026-05-26T11:55:00Z"
    },
    {
      "type": "STOCK_IN",
      "category": "INVENTORY",
      "icon": "package",
      "title": "Restok Masuk",
      "description": "50 kg Pupuk NPK • dari PO #PO-001",
      "timestamp": "2026-05-26T11:30:00Z"
    },
    {
      "type": "STOCK_TRANSFER",
      "category": "INVENTORY",
      "icon": "arrow-right-left",
      "title": "Transfer Stok Diterima",
      "description": "10 unit dari Cabang Cibodas",
      "timestamp": "2026-05-26T10:00:00Z"
    },
    {
      "type": "OPNAME_COMPLETED",
      "category": "INVENTORY",
      "icon": "check",
      "title": "Opname Selesai",
      "description": "OPN-001 • 3 surplus, 2 kurang",
      "timestamp": "2026-05-26T09:00:00Z"
    },
    {
      "type": "CASH_MUTATION",
      "category": "FINANCE",
      "icon": "wallet",
      "title": "Pengeluaran Kas",
      "description": "Rp 50.000 • Beli ATK • Operasional",
      "timestamp": "2026-05-26T08:30:00Z"
    },
    {
      "type": "TRANSACTION_VOIDED",
      "category": "RETAIL",
      "icon": "x-circle",
      "title": "Transaksi Dibatalkan",
      "description": "INV-099 • Rp 25.000 • by Admin",
      "timestamp": "2026-05-26T08:00:00Z"
    }
  ]
}
```

**Source events** yang di-merge:
- `transactions` (status COMPLETED + VOIDED)
- `brilink_transactions` (status SUCCESS)
- `stock_histories` (type IN, OUT, OPNAME)
- `stock_transfers` (status RECEIVED)
- `opname_sessions` (status COMPLETED)
- `cashbox_mutations` (jika ada — atau computed dari payments)

### `GET /api/dashboard/retail/payment-breakdown?period=today&shopId=xxx`
Response:
```json
{
  "cash": { "amount": 500000, "count": 15, "percent": 50 },
  "qris": { "amount": 300000, "count": 10, "percent": 30 },
  "transfer": { "amount": 100000, "count": 3, "percent": 10 },
  "hutang": { "amount": 100000, "count": 2, "percent": 10 }
}
```

### `GET /api/dashboard/retail/alerts?shopId=xxx`

Pakai threshold dari `ShopSetting.alertConfig` (atau default kalau belum di-set).

Response:
```json
{
  "config": {
    "lowStockThreshold": 5,
    "shiftDurationWarningHours": 8,
    "overdueDebtDaysBeforeNotice": 0
  },
  "overdueDebts": {
    "count": 3,
    "totalAmount": 750000,
    "topItems": [
      { "id": "d1", "customerName": "Pak Tani", "amount": 250000, "daysOverdue": 5 }
    ]
  },
  "lowStock": {
    "count": 5,
    "topItems": [
      { "productId": "p1", "name": "Pupuk Urea", "quantity": 3, "threshold": 5 }
    ]
  },
  "longRunningShifts": {
    "count": 1,
    "shifts": [
      { "id": "s1", "cashier": "Budi", "hours": 9, "thresholdHours": 8 }
    ]
  },
  "allClear": false
}
```

### `GET /api/settings/alerts?shopId=xxx`  &  `PATCH /api/settings/alerts`
Untuk konfigurasi threshold di halaman Pengaturan.

Body PATCH:
```json
{
  "lowStockThreshold": 10,
  "shiftDurationWarningHours": 12,
  "overdueDebtDaysBeforeNotice": 3
}
```

### `GET /api/dashboard/retail/cashier-leaderboard?period=today&limit=5&shopId=xxx`
Response:
```json
{
  "data": [
    { "userId": "u1", "name": "Budi", "transactionCount": 25, "revenue": 800000 }
  ]
}
```

---

## 5. Frontend State & Refresh

- Pakai Pinia store `useDashboardRetailStore` dengan masing-masing section state
- Auto-refresh: 30 detik untuk active section saja
- Loading skeleton per section (independent)
- Error per section (gagal 1 section tidak crash semua)

---

## 6. Edge Cases

- **No data**: tampilkan empty state per section dengan ikon + pesan ramah
- **Loading**: skeleton placeholder
- **Multi-cabang super-admin**: switch cabang di topbar otomatis trigger refetch
- **Time zone**: pakai server timezone (Asia/Jakarta), jangan client local
- **Permission**: super-admin & admin lihat semua data cabang sesuai konteks. Kasir tidak punya akses dashboard ini

---

## 7. Implementation Plan

### Phase A — Backend (1 sprint)
1. **Schema update**: Extend `ShopSetting` dengan field `alertConfig Json?`
   - Migration baru: `20260530000000_shop_setting_alert_config`
2. Create `DashboardModule` di `backend/src/dashboard/`
3. `DashboardController` dengan 8 endpoints di atas
4. `DashboardService` dengan reusable helpers:
   - `getPeriodRange(period: today|week|month)` → `{ start, end }`
   - `getPreviousPeriodRange(period)` → untuk perhitungan compare
   - `mergeRecentActivities()` → gabung dari berbagai source
5. Update `SettingsModule` dengan endpoint `/api/settings/alerts` (GET, PATCH)
6. Reuse existing analytics service patterns

### Phase B — Frontend (1 sprint)
1. Update `DashboardView.vue` dengan layout grid baru (atau buat baru `DashboardRetailView.vue`)
2. Create `dashboard.service.ts`
3. Pinia store `dashboard-retail.store.ts` dengan independent section state + auto-refresh
4. Komponen reusable di `frontend/src/admin/components/dashboard/`:
   - `KpiCard.vue` — card with metric + Δ%
   - `SalesChart.vue` — CSS-based bar chart
   - `OperationsPanel.vue` — shift + last online + last tx
   - `TopProductsTable.vue`
   - `RecentActivityFeed.vue` — mixed retail/brilink/inventory events
   - `PaymentBreakdown.vue` — horizontal bar
   - `AlertCard.vue` — single alert card
   - `CashierLeaderboard.vue`
5. Apply dark mode classes
6. Update `AdminSettingsView.vue` dengan tab "Notifikasi & Alert" untuk threshold config

### Phase C — Polish & Testing
1. Empty states & loading skeletons (per section)
2. Error handling (per section)
3. Manual testing dengan data dummy
4. Performance check (parallel fetch, query optimization, indexes)
5. Dark mode visual QA

---

## 8. Out of Scope (Phase ini)

- ❌ Real-time websocket update (pakai polling 30s dulu)
- ❌ Custom date range picker (cuma preset Today/7d/30d dulu)
- ❌ Export ke PDF / Excel (akan ada di section Laporan)
- ❌ Forecast / prediction (akan ada di section Analytics terpisah)
- ❌ Drilldown chart (klik chart bar tidak filter ke transaksi listing)

---

## 9. Open Questions

Belum ada, semua confirmed di diskusi:
- ✅ Target user: super-admin (multi-cabang) + admin cabang (single cabang)
- ✅ Default time range: Hari Ini
- ✅ Sections: semua included (KPI, chart, top products, activity, payment breakdown, alerts, comparison, leaderboard)
- ✅ Quick actions: 6 button (dashboard retail, dashboard brilink, mutasi retail, mutasi brilink, transaksi retail, transaksi brilink)
