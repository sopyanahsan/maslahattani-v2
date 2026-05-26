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
- Shift kasir aktif (count + nama kasir + start time)
- Indicator warning kalau shift sudah > 8 jam
- Total kasir hari ini (open/closed/finalized)

### 3.5 Insight Cards (Row 4) — 3 kolom

#### Top Produk Terjual (5 baris)
- Rank, nama produk, qty, omzet
- Klik baris → buka detail produk

#### Aktivitas Terkini (10 baris, scrollable)
- Mix dari: transaksi baru, void transaksi, restok stok, opname, transfer stok
- Format: ikon, deskripsi, waktu (X menit lalu)

#### Breakdown Payment Method
- Pie / horizontal bar: Cash, QRIS, Transfer, Hutang
- Persen + nominal absolut

### 3.6 Alert Section (Row 5) — full width grid 3 cols

| Alert | Trigger | Action button |
|-------|---------|---------------|
| 🔴 Hutang Jatuh Tempo | dueDate <= today AND status != PAID | "Lihat Hutang" → `/admin/debts` |
| 🟡 Stok Menipis | quantity <= threshold (default 5) | "Lihat Stok" → `/admin/products` |
| 🟠 Shift Lama Tidak Tutup | shift OPEN > 8 jam | "Cek Shift" → `/admin/shifts` |

Tampil hanya kalau ada data. Kalau semua aman, tampil status hijau "Semua aman ✓".

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
    { "id": "s1", "cashierName": "Budi", "startTime": "...", "durationMinutes": 240 }
  ],
  "shiftStats": { "open": 1, "closed": 2, "finalized": 5 }
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
Response:
```json
{
  "data": [
    { "type": "TRANSACTION", "description": "Transaksi #INV-001 - Rp 50.000", "timestamp": "..." },
    { "type": "STOCK_IN", "description": "Restok 50 kg pupuk NPK", "timestamp": "..." }
  ]
}
```

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
Response:
```json
{
  "overdueDebts": { "count": 3, "totalAmount": 750000 },
  "lowStock": { "count": 5, "products": ["Pupuk Urea", "Beras Premium", ...] },
  "longRunningShifts": { "count": 1, "shifts": [{ "id": "s1", "cashier": "Budi", "hours": 9 }] }
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
1. Create `DashboardModule` di `backend/src/dashboard/`
2. `DashboardController` dengan 7 endpoints di atas
3. `DashboardService` dengan reusable helpers (period filter, prev period calc)
4. Reuse existing analytics service patterns

### Phase B — Frontend (1 sprint)
1. Update `DashboardView.vue` dengan layout grid baru
2. Create `dashboard.service.ts`
3. Pinia store `dashboard-retail.store.ts`
4. Komponen reusable: `KpiCard.vue`, `MiniChart.vue`, `AlertCard.vue`
5. Apply dark mode classes

### Phase C — Polish & Testing
1. Empty states & loading skeletons
2. Error handling
3. Manual testing dengan data dummy
4. Performance check (query optimization)

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
