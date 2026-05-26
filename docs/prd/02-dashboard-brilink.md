# PRD — Dashboard BRILink

**Status**: Draft (for review)
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/dashboard-retail` (akan dipisah ke branch baru saat implement)
**Depends on**: PRD 01 (Dashboard Retail) — pakai pattern yang sama

---

## 1. Overview

Dashboard BRILink adalah halaman monitoring khusus layanan BRILink (transfer, tarik tunai, top-up, PLN). Targetnya:

- **Owner BRILink** — monitoring profit fee, transaksi sukses/gagal, saldo rekening
- **Admin Cabang** — monitoring transaksi harian + saldo rekening untuk operasional

URL: `/admin/brilink` (existing route, akan di-redesign)

> ⚠️ Existing `AdminBrilinkView.vue` punya 3 tabs (Mutasi, Statistik, Fee). Akan dipecah:
> - **Mutasi tab** → standalone page `/admin/kas-rekening-brilink` (sudah ada placeholder)
> - **Statistik tab** → conten utama dashboard ini
> - **Fee tab** → standalone page `/admin/brilink/fee` (sudah ada placeholder)

---

## 2. Goals

1. Visual ringkasan operasional BRILink dalam satu layar
2. Default time range = **Hari Ini** (real-time / refresh 30 detik)
3. Filter: Hari Ini / 7 Hari / 30 Hari
4. Quick action ke fitur BRILink yang paling sering diakses
5. Highlight masalah: saldo rekening rendah, transaksi gagal banyak, fee rule mismatch

---

## 3. Layout & Sections

### 3.1 Top Bar (sticky)
Sama seperti Dashboard Retail — period selector, refresh, auto-refresh toggle.

### 3.2 KPI Cards (Row 1) — 4 cards

| Card | Metric | Compare |
|------|--------|---------|
| Total Transaksi | Count `brilink_transactions` (status SUCCESS) | vs kemarin Δ% |
| Volume Transaksi | Sum `amount` | vs kemarin Δ% |
| Fee Earnings | Sum `fee` | vs kemarin Δ% |
| Avg Fee/Trx | Sum fee / count | vs kemarin Δ% |

### 3.3 Quick Actions (Row 2) — 6 buttons

1. 🧾 **Buat Transaksi BRILink** → buka link ke webapp kasir POS BRILink
2. 🏦 **Mutasi & Rekening** → `/admin/kas-rekening-brilink`
3. ⚙️ **Pengaturan Fee** → `/admin/brilink/fee`
4. 📊 **Dashboard Retail** → `/admin/dashboard`
5. 🧾 **List Transaksi BRILink** → `/admin/brilink/transaksi`
6. 💵 **Mutasi Retail** → `/admin/kas-retail`

### 3.4 Main Grid (Row 3) — 2 kolom

#### Kolom Kiri (lg:col-span-2)
**Chart Transaksi BRILink per Kategori**
- Stacked bar / multi-line: TRANSFER_BRI, TRANSFER_OTHER, TARIK_TUNAI, TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET, TOPUP_PLN
- Hari Ini → per jam (24 buckets)
- 7d / 30d → per hari
- CSS-based visualization

#### Kolom Kanan (lg:col-span-1)
**Saldo Rekening BRI** (placeholder — belum ada model `BrilinkAccount`)
- List rekening + saldo current
- Indicator warning kalau saldo < threshold (configurable)
- "Setor / Tarik" action button per rekening

> 🚧 Catatan: model `BrilinkAccount` belum ada. PRD ini propose schema baru.
> Kalau belum siap, fallback dummy "Belum ada rekening — set up dulu di Pengaturan".

### 3.5 Insight Cards (Row 4) — 3 kolom

#### Breakdown per Kategori (donut/horizontal bar)
- TRANSFER_BRI, TRANSFER_OTHER, TARIK_TUNAI, TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET, TOPUP_PLN
- Per kategori: count, volume, fee earnings, %

#### Recent BRILink Transactions (10 rows scrollable)
- Mirip Recent Activity tapi khusus BRILink
- Format: kategori badge, customer name, destination, amount, fee, status
- Status icon: ✅ SUCCESS / ❌ FAILED / ⏳ PENDING

#### Top Customers (5 rows)
- Customer dengan transaksi terbanyak (by count atau volume)
- Format: nama, no HP, jumlah transaksi, total volume
- Group by `customerName + customerPhone`

### 3.6 Alert Section (Row 5) — full width grid 3 cols

| Alert | Trigger | Default Threshold | Action |
|-------|---------|-------------------|--------|
| 🔴 Saldo Rekening Rendah | balance < threshold | Rp 1jt per rekening | "Setor Saldo" |
| 🟡 Transaksi Gagal Banyak | count(FAILED today) >= 5 | 5 trx | "Lihat Failed" |
| 🟠 Fee Rule Tidak Aktif | active fee rules per category < 1 | — | "Cek Fee" → `/admin/brilink/fee` |

Threshold dari `ShopSetting.alertConfig`:
- `brilinkLowBalanceThreshold` (rupiah, default 1_000_000)
- `brilinkFailedTransactionThreshold` (count per hari, default 5)

### 3.7 Comparison Section (Row 6) — 2 kolom

#### Hari Ini vs Kemarin
- Side-by-side: total trx, volume, fee earnings
- Growth indicator (▲/▼)

#### Performance per Kasir BRILink
- Top 5 kasir by transaksi BRILink count + fee dihasilkan
- Bar visualization

---

## 4. API Endpoints

Semua endpoint JWT protected, filtered by `currentShopId`.

### `GET /api/dashboard/brilink/overview?period=today|week|month&shopId=xxx`
```json
{
  "kpi": {
    "transactions": { "value": 45, "previousValue": 38, "changePercent": 18 },
    "volume": { "value": 15000000, "previousValue": 12000000, "changePercent": 25 },
    "feeEarnings": { "value": 450000, "previousValue": 360000, "changePercent": 25 },
    "avgFee": { "value": 10000, "previousValue": 9474, "changePercent": 5 }
  }
}
```

### `GET /api/dashboard/brilink/transactions-chart?period=today&shopId=xxx`
Stacked per kategori:
```json
{
  "labels": ["00:00", "01:00", ..., "23:00"],
  "datasets": {
    "TRANSFER_BRI": [0, 0, 50000, ...],
    "TRANSFER_OTHER": [0, 0, 100000, ...],
    "TARIK_TUNAI": [0, 0, 200000, ...],
    "TOPUP_PULSA": [...],
    "TOPUP_DATA": [...],
    "TOPUP_EWALLET": [...],
    "TOPUP_PLN": [...]
  }
}
```

### `GET /api/dashboard/brilink/category-breakdown?period=today&shopId=xxx`
```json
{
  "data": [
    {
      "category": "TRANSFER_BRI",
      "count": 15,
      "volume": 5000000,
      "feeEarnings": 75000,
      "volumePercent": 33.3,
      "feePercent": 16.7
    }
  ]
}
```

### `GET /api/dashboard/brilink/recent-transactions?limit=10&shopId=xxx`
```json
{
  "data": [
    {
      "id": "t1",
      "refNumber": "BRL-001",
      "category": "TRANSFER_BRI",
      "customerName": "Pak Tani",
      "customerPhone": "0812xxxx",
      "destination": "1234567890",
      "amount": 100000,
      "fee": 6500,
      "total": 106500,
      "status": "SUCCESS",
      "cashierName": "Budi",
      "createdAt": "..."
    }
  ]
}
```

### `GET /api/dashboard/brilink/top-customers?period=today&limit=5&shopId=xxx`
Group by `customerName + customerPhone`:
```json
{
  "data": [
    {
      "customerName": "Pak Tani",
      "customerPhone": "0812xxxx",
      "transactionCount": 5,
      "totalVolume": 1500000,
      "lastTransactionAt": "..."
    }
  ]
}
```

### `GET /api/dashboard/brilink/accounts?shopId=xxx`
**(Butuh schema baru `BrilinkAccount`)**
```json
{
  "data": [
    {
      "id": "acc1",
      "label": "BRI Default",
      "accountNumber": "1234567890",
      "balance": 5000000,
      "isDefault": true,
      "isLowBalance": false,
      "lastMutationAt": "..."
    }
  ]
}
```

### `GET /api/dashboard/brilink/alerts?shopId=xxx`
```json
{
  "config": {
    "brilinkLowBalanceThreshold": 1000000,
    "brilinkFailedTransactionThreshold": 5
  },
  "lowBalanceAccounts": {
    "count": 1,
    "accounts": [{ "id": "acc1", "label": "BRI Default", "balance": 500000 }]
  },
  "failedTransactionsToday": {
    "count": 3,
    "topCategories": [{ "category": "TARIK_TUNAI", "count": 2 }]
  },
  "categoriesWithoutFee": {
    "count": 2,
    "categories": ["TOPUP_PLN", "TOPUP_DATA"]
  },
  "allClear": false
}
```

### `GET /api/dashboard/brilink/cashier-performance?period=today&limit=5&shopId=xxx`
```json
{
  "data": [
    {
      "userId": "u1",
      "name": "Budi",
      "transactionCount": 25,
      "totalFee": 250000,
      "totalVolume": 5000000
    }
  ]
}
```

---

## 5. Schema Changes (NEW)

### Model `BrilinkAccount` (baru)
Tracking rekening BRI agen — default 1 + custom multi-rekening.

```prisma
model BrilinkAccount {
  id              String    @id @default(cuid())
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId          String
  label           String          // "BRI Default", "BRI Cabang Cibodas"
  accountNumber   String          // "1234567890"
  accountHolder   String?
  balance         Int       @default(0)  // saldo current (rupiah)
  isDefault       Boolean   @default(false)
  isActive        Boolean   @default(true)
  notes           String?

  mutations       BrilinkMutation[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([shopId, accountNumber])
  @@index([shopId])
  @@map("brilink_accounts")
}

model BrilinkMutation {
  id              String          @id @default(cuid())
  account         BrilinkAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId       String
  type            BrilinkMutationType
  amount          Int
  balanceBefore   Int
  balanceAfter    Int
  reference       String?
  description     String
  notes           String?
  createdById     String?

  createdAt       DateTime        @default(now())

  @@index([accountId])
  @@index([createdAt])
  @@map("brilink_mutations")
}

enum BrilinkMutationType {
  SETOR        // setor saldo agen
  TARIK        // tarik saldo agen
  TRX_DEBIT    // saldo berkurang karena transaksi customer
  TRX_CREDIT   // saldo bertambah karena transaksi
  ADJUSTMENT   // koreksi manual
}
```

Extend `BrilinkTransaction` dengan `accountId String?` (optional, link ke rekening yang dipakai).

### Update `ShopSetting.alertConfig`
Tambah field BRILink:
```json
{
  "lowStockThreshold": 5,
  "shiftDurationWarningHours": 8,
  "overdueDebtDaysBeforeNotice": 0,
  "brilinkLowBalanceThreshold": 1000000,
  "brilinkFailedTransactionThreshold": 5
}
```

### Migration
`backend/prisma/migrations/20260601000000_brilink_accounts_mutations/migration.sql`

---

## 6. Implementation Plan

### Phase A — Schema & Migration
1. Create `BrilinkAccount` + `BrilinkMutation` models
2. Add `accountId` optional di `BrilinkTransaction`
3. Migration SQL
4. Auto-create default `BrilinkAccount` per shop pas first transaction

### Phase B — Backend
1. Create `DashboardBrilinkModule` (atau extend `DashboardModule` existing dengan namespace `brilink/`)
2. 8 endpoints
3. Update `getAlertConfig` defaults dengan BRILink fields
4. Endpoints CRUD untuk `BrilinkAccount` + mutation log

### Phase C — Frontend
1. Replace `AdminBrilinkView.vue` dengan layout dashboard baru
2. Reusable components di `frontend/src/admin/components/dashboard-brilink/`:
   - `BrilinkCategoryChart.vue` — stacked bar
   - `BrilinkAccountsPanel.vue` — saldo per rekening
   - `BrilinkCategoryBreakdown.vue`
   - `BrilinkRecentTransactions.vue`
   - `TopCustomersTable.vue`
   - `BrilinkCashierPerformance.vue`
   - Reuse `KpiCard`, `AlertCard`, `QuickActions` dari Dashboard Retail
3. Pinia store `dashboard-brilink.store.ts`
4. Update `AdminSettingsView.vue` "Notifikasi & Alert" tab dengan 2 input baru

### Phase D — Polish
- Empty states (terutama jika belum ada rekening / transaksi)
- Loading skeleton
- Dark mode QA
- Mobile responsive

---

## 7. Out of Scope (Phase ini)

- ❌ Real-time websocket
- ❌ Custom date range
- ❌ Forecast BRILink
- ❌ Export PDF/Excel
- ❌ BRI API integration (auto-sync saldo dari BRI) — manual entry dulu
- ❌ Detail breakdown TOPUP per provider (Telkomsel/Indosat/dll)

---

## 8. Open Questions (perlu konfirmasi)

1. **Schema `BrilinkAccount`** — gas atau pakai dummy/placeholder dulu?
   - Opsi A: Gas, schema baru sekalian
   - Opsi B: Skip dulu, fallback dummy. Kerjain di section "Kas & Rekening BRILink" terpisah nanti.

2. **Quick Action #1 "Buat Transaksi BRILink"** — kemana arahnya?
   - Opsi A: Link ke webapp kasir (cross-domain)
   - Opsi B: Buka modal di admin panel langsung
   - Opsi C: Redirect ke `/admin/brilink/transaksi` (list page)

3. **Top Customers** — group by phone, atau by name+phone?
   - Opsi A: Group by phone (skip yang null)
   - Opsi B: Group by name+phone

4. **Alert Threshold Saldo Rendah** — single threshold global atau per rekening?
   - Opsi A: Single threshold global (Rp 1jt) — simple
   - Opsi B: Per rekening custom — fleksibel

5. **Period filter** untuk Top Customers + Cashier Performance — pakai yang sama dengan KPI (Today/7d/30d), atau fixed Today aja?

---

## Notes

PRD ini follow pattern Dashboard Retail (PRD 01) untuk consistency:
- Same component patterns (KpiCard, Alert — reuse existing)
- Same auto-refresh strategy (30s polling, per-section state)
- Same dark mode approach
- Same period helpers (reuse `getPeriodRange`, `getPreviousPeriodRange`)
