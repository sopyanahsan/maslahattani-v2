# PRD — Dashboard BRILink

**Status**: ✅ Confirmed — Ready to Implement
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/dashboard-brilink` (akan dibuat saat implement)
**Depends on**: PRD 01 (Dashboard Retail) — pakai pattern yang sama

---

## 1. Overview

Dashboard BRILink adalah halaman **monitoring & reporting** layanan BRILink (transfer, tarik tunai, top-up, PLN). Targetnya:

- **Owner BRILink** — monitoring profit fee, transaksi sukses/gagal, saldo rekening
- **Admin Cabang** — monitoring transaksi harian + saldo rekening untuk operasional

URL: `/admin/brilink`

> ⚠️ **Important: Admin BRILink = REPORTING ONLY**
> Tidak ada tombol "Buat Transaksi" di admin panel. Semua transaksi BRILink terjadi di **webapp kasir**. Admin panel hanya menampilkan data monitoring & laporan.

> Existing `AdminBrilinkView.vue` punya 3 tabs (Mutasi, Statistik, Fee). Akan dipecah:
> - **Mutasi tab** → standalone page `/admin/kas-rekening-brilink` (sudah ada placeholder)
> - **Statistik tab** → conten utama dashboard ini
> - **Fee tab** → standalone page `/admin/brilink/fee` (sudah ada placeholder)

---

## 2. Goals

1. Visual ringkasan operasional BRILink dalam satu layar
2. Default time range = **Hari Ini** (real-time / refresh 30 detik)
3. Filter periode: Hari Ini / 7 Hari / 30 Hari
4. Quick action ke fitur BRILink yang paling sering diakses (reporting only)
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

### 3.3 Quick Actions (Row 2) — 5 buttons (reporting only)

1. 🏦 **Mutasi & Rekening BRILink** → `/admin/kas-rekening-brilink`
2. 🧾 **List Transaksi BRILink** → `/admin/brilink/transaksi`
3. ⚙️ **Pengaturan Fee** → `/admin/brilink/fee`
4. 📊 **Dashboard Retail** → `/admin/dashboard`
5. 💵 **Mutasi Retail** → `/admin/kas-retail`

> ❌ **Tidak ada** tombol "Buat Transaksi BRILink" di admin. Transaksi BRILink dibuat dari **webapp kasir**.

### 3.4 Main Grid (Row 3) — 2 kolom

#### Kolom Kiri (lg:col-span-2)
**Chart Transaksi BRILink per Kategori**
- Stacked bar / multi-line: TRANSFER_BRI, TRANSFER_OTHER, TARIK_TUNAI, TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET, TOPUP_PLN
- Hari Ini → per jam (24 buckets)
- 7d / 30d → per hari
- CSS-based visualization

#### Kolom Kanan (lg:col-span-1)
**Saldo Rekening BRI**
- List rekening + saldo current
- Indicator warning kalau saldo < `account.lowBalanceThreshold` (per rekening, custom)
- "Buka Mutasi" link per rekening → `/admin/kas-rekening-brilink?accountId=xxx`

### 3.5 Insight Cards (Row 4) — 3 kolom

#### Breakdown per Kategori (donut/horizontal bar)
- TRANSFER_BRI, TRANSFER_OTHER, TARIK_TUNAI, TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET, TOPUP_PLN
- Per kategori: count, volume, fee earnings, %

#### Recent BRILink Transactions (10 rows scrollable)
- Mirip Recent Activity tapi khusus BRILink
- Format: kategori badge, customer name, destination, amount, fee, status
- Status icon: ✅ SUCCESS / ❌ FAILED / ⏳ PENDING

#### Top Customers (5 rows) — **fixed Today**
- Group by `customerName + customerPhone` (case-insensitive normalize)
- Format: nama, no HP, jumlah transaksi, total volume, last transaction
- Period: **selalu Today** (custom date range nanti di Laporan)

### 3.6 Alert Section (Row 5) — full width grid 3 cols

| Alert | Trigger | Action |
|-------|---------|--------|
| 🔴 Saldo Rekening Rendah | `account.balance < account.lowBalanceThreshold` (per-rekening) | "Setor Saldo" → `/admin/kas-rekening-brilink?accountId=xxx` |
| 🟡 Transaksi Gagal Banyak | `count(FAILED today) >= threshold` | "Lihat Failed" → `/admin/brilink/transaksi?status=FAILED` |
| 🟠 Fee Rule Tidak Aktif | active fee rules per category < 1 | "Cek Fee" → `/admin/brilink/fee` |

**Threshold di `ShopSetting.alertConfig`**:
- ❌ ~~`brilinkLowBalanceThreshold`~~ (REMOVED — per rekening sekarang)
- ✅ `brilinkFailedTransactionThreshold` (count per hari, default 5)

### 3.7 Comparison Section (Row 6) — 2 kolom

#### Hari Ini vs Kemarin
- Side-by-side: total trx, volume, fee earnings
- Growth indicator (▲/▼)

#### Performance per Kasir BRILink — **fixed Today**
- Top 5 kasir by transaksi BRILink count + fee dihasilkan
- Bar visualization
- Period: **selalu Today** (custom date range nanti di Laporan)

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
Stacked per kategori (24 buckets for today, 7/30 for week/month).

### `GET /api/dashboard/brilink/category-breakdown?period=today&shopId=xxx`
Per kategori: count, volume, feeEarnings, volumePercent, feePercent.

### `GET /api/dashboard/brilink/recent-transactions?limit=10&shopId=xxx`
List transaksi BRILink terbaru.

### `GET /api/dashboard/brilink/top-customers?limit=5&shopId=xxx`
> Period **fixed Today** — tidak ada query param `period`.
> Group by `LOWER(customerName) + customerPhone`.

### `GET /api/dashboard/brilink/accounts?shopId=xxx`
List rekening BRI dengan balance, threshold, isLowBalance flag.

### `GET /api/dashboard/brilink/alerts?shopId=xxx`
Alert untuk lowBalance per account, failedTransactions today, categoriesWithoutFee.

### `GET /api/dashboard/brilink/cashier-performance?limit=5&shopId=xxx`
> Period **fixed Today**.

### CRUD `BrilinkAccount`
- `GET /api/brilink-accounts?shopId=xxx`
- `POST /api/brilink-accounts`
- `PATCH /api/brilink-accounts/:id`
- `DELETE /api/brilink-accounts/:id` (soft delete)
- `POST /api/brilink-accounts/:id/setor` — `{ amount, reference?, notes? }`
- `POST /api/brilink-accounts/:id/tarik` — `{ amount, reference?, notes? }`
- `GET /api/brilink-accounts/:id/mutations?page=1&limit=20`

---

## 5. Schema Changes (NEW)

### Model `BrilinkAccount` (baru)

```prisma
model BrilinkAccount {
  id                    String    @id @default(cuid())
  shop                  Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId                String

  label                 String          // "BRI Default", "BRI Cabang Cibodas"
  accountNumber         String          // "1234567890"
  accountHolder         String?
  balance               Int       @default(0)
  /** Threshold per rekening — kalau balance < ini, masuk alert "saldo rendah". */
  lowBalanceThreshold   Int       @default(1000000)
  isDefault             Boolean   @default(false)
  isActive              Boolean   @default(true)
  notes                 String?

  mutations             BrilinkMutation[]
  transactions          BrilinkTransaction[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([shopId, accountNumber])
  @@index([shopId])
  @@map("brilink_accounts")
}

enum BrilinkMutationType {
  SETOR        // setor saldo agen
  TARIK        // tarik saldo agen
  TRX_DEBIT    // saldo berkurang karena transaksi customer
  TRX_CREDIT   // saldo bertambah karena transaksi
  ADJUSTMENT   // koreksi manual
}

model BrilinkMutation {
  id              String          @id @default(cuid())
  account         BrilinkAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId       String
  type            BrilinkMutationType
  amount          Int
  balanceBefore   Int
  balanceAfter    Int
  reference       String?         // ref transaksi atau no setoran
  description     String
  notes           String?
  createdById     String?
  createdBy       User?           @relation("BrilinkMutationCreator", fields: [createdById], references: [id])

  createdAt       DateTime        @default(now())

  @@index([accountId])
  @@index([createdAt])
  @@map("brilink_mutations")
}
```

### Update `BrilinkTransaction`
Tambah `accountId` optional, link ke rekening yang dipakai.

### Update `User` & `Shop` relations
- `User.brilinkMutations BrilinkMutation[] @relation("BrilinkMutationCreator")`
- `Shop.brilinkAccounts BrilinkAccount[]`

### Update `ShopSetting.alertConfig` JSON
Tambah field BRILink (single, bukan per-account threshold):
```json
{
  "lowStockThreshold": 5,
  "shiftDurationWarningHours": 8,
  "overdueDebtDaysBeforeNotice": 0,
  "brilinkFailedTransactionThreshold": 5
}
```

> Note: low balance threshold disimpan **per `BrilinkAccount.lowBalanceThreshold`**, bukan di alertConfig global.

### Migration
`backend/prisma/migrations/20260601000000_brilink_accounts_mutations/migration.sql`

---

## 6. Implementation Plan

### Phase A — Schema & Migration
1. Tambah `BrilinkAccount` + `BrilinkMutation` models
2. Tambah `accountId` optional di `BrilinkTransaction`
3. Update relations di `User` & `Shop`
4. Migration SQL
5. Auto-seed default `BrilinkAccount` per shop saat first BRILink transaction (atau saat shop create)

### Phase B — Backend BRILink Accounts Module
1. Create `BrilinkAccountsModule` di `backend/src/brilink-accounts/`
2. CRUD endpoints + setor/tarik + mutations log
3. Saat transaksi BRILink dibuat di webapp, kalau ada `accountId`, deduct/credit saldo + log mutation otomatis

### Phase C — Backend Dashboard BRILink
1. Create `DashboardBrilinkModule` (atau extend `DashboardModule` existing)
2. 8 endpoints dashboard
3. Update `getAlertConfig` defaults dengan `brilinkFailedTransactionThreshold`

### Phase D — Frontend
1. Replace `AdminBrilinkView.vue` dengan layout dashboard baru
2. Reusable components di `frontend/src/admin/components/dashboard-brilink/`:
   - `BrilinkCategoryChart.vue` — stacked bar per kategori
   - `BrilinkAccountsPanel.vue` — saldo per rekening + low balance indicator
   - `BrilinkCategoryBreakdown.vue` — donut/horizontal
   - `BrilinkRecentTransactions.vue`
   - `BrilinkTopCustomers.vue`
   - `BrilinkCashierPerformance.vue`
   - Reuse `KpiCard`, `AlertCard`, `QuickActions` dari Dashboard Retail
3. Pinia store `dashboard-brilink.store.ts` (mirror pattern `dashboard-retail.store.ts`)
4. Update `KasRekeningBrilinkView.vue` (existing placeholder) dengan tab Mutasi + Rekening + Metode Kas — implementasi minimal CRUD rekening + setor/tarik
5. Update `AdminSettingsView.vue` "Notifikasi & Alert" tab dengan input baru `brilinkFailedTransactionThreshold`

### Phase E — Polish
- Empty states (terutama jika belum ada rekening / transaksi)
- Loading skeleton
- Dark mode QA
- Mobile responsive

---

## 7. Out of Scope (Phase ini)

- ❌ Real-time websocket
- ❌ Custom date range untuk Top Customers / Cashier Performance (akan di Laporan section)
- ❌ Forecast BRILink
- ❌ Export PDF/Excel
- ❌ BRI API integration (auto-sync saldo dari BRI) — manual entry dulu
- ❌ Detail breakdown TOPUP per provider (Telkomsel/Indosat/dll)
- ❌ Tombol "Buat Transaksi BRILink" di admin (admin = reporting only)

---

## 8. Confirmed Decisions

1. ✅ Schema `BrilinkAccount` + `BrilinkMutation` — **GO** (Opsi A)
2. ✅ Admin BRILink = **REPORTING ONLY**, tidak ada tombol create transaksi (transaksi di webapp)
3. ✅ Top Customers grouped by `name + phone` (Opsi B)
4. ✅ Low balance threshold **per rekening** (Opsi B), removed dari global config
5. ✅ Period filter:
   - KPI / Chart / Comparison / Breakdown → ikut period selector (Today/7d/30d)
   - Top Customers + Cashier Performance → **fixed Today**
   - Custom date range akan tersedia di section Laporan nanti

---

## Notes

PRD ini follow pattern Dashboard Retail (PRD 01) untuk consistency:
- Same component patterns (KpiCard, AlertCard, QuickActions — reuse existing)
- Same auto-refresh strategy (30s polling, per-section state)
- Same dark mode approach
- Same period helpers (reuse `getPeriodRange`, `getPreviousPeriodRange`)
