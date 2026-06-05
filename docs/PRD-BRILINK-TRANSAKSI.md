# PRD Admin Panel BRILink — Menu Transaksi BRILink

**Status**: Draft
**Updated**: Juni 2026
**Owner**: Sopyan Ahsan
**Module**: Admin Panel > BRILink > Transaksi

---

## 1. Konteks & Tujuan

### Background

Agen BRILink memproses rata-rata 20-50 transaksi/hari dengan 7 kategori layanan. Setiap transaksi memiliki **dual impact**: perubahan saldo rekening BRI agen DAN perubahan kas tunai BRILink. Kedua saldo ini harus tercatat otomatis, terpisah dari kas retail, dan bisa di-track secara real-time.

### Goals

1. **Pencatatan Akurat** — Setiap transaksi auto-update saldo rekening + kas tunai BRILink
2. **Kas Terpisah** — Kas tunai BRILink 100% terpisah dari kas retail (tidak nyambung)
3. **Offline-First** — Kasir bisa input transaksi walau sinyal jelek, auto-sync saat online
4. **Monitoring Admin** — Admin bisa lihat semua transaksi, grafik, profit, dan KPI target
5. **Audit Trail** — Void/gagal tercatat lengkap dengan alasan

---

## 2. Konsep Bisnis: Flow Dana Transaksi BRILink

### 2.1 Prinsip Dasar

Setiap transaksi BRILink punya **2 sisi yang selalu berlawanan**:

```
SALDO REKENING BRI ↔ KAS TUNAI BRILINK (zero-sum + fee profit)
```

### 2.2 Flow Direction per Kategori

| Kategori | Saldo Rekening | Kas Tunai | Rumus Kas Tunai |
|----------|---------------|-----------|-----------------|
| TRANSFER_BRI | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |
| TRANSFER_OTHER | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |
| TARIK_TUNAI | +amount (KREDIT) | -(amount - fee) | Agen kasih tunai, terima fee |
| TOPUP_PULSA | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |
| TOPUP_DATA | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |
| TOPUP_EWALLET | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |
| TOPUP_PLN | -amount (DEBIT) | +(amount + fee) | Nasabah bayar tunai |

### 2.3 Contoh Konkret

**Transfer BRI Rp 500.000 (fee Rp 5.000):**
```
Nasabah bayar tunai      : Rp 505.000
├── Saldo rekening agen  : -500.000 (debit, terpakai transfer)
├── Kas tunai BRILink    : +505.000 (terima dari nasabah)
└── Profit agen          : +5.000 (fee)
```

**Tarik Tunai Rp 1.000.000 (fee Rp 10.000):**
```
Nasabah minta tunai      : Rp 1.000.000
├── Saldo rekening agen  : +1.000.000 (kredit, masuk dari rek nasabah)
├── Kas tunai BRILink    : -990.000 (keluar 1jt, terima fee 10rb)
└── Profit agen          : +10.000 (fee)
```

### 2.4 Definisi Field `flowDirection`

```typescript
enum FlowDirection {
  DEBIT  = 'DEBIT',   // Saldo rekening berkurang (transfer, topup, bayar)
  CREDIT = 'CREDIT',  // Saldo rekening bertambah (tarik tunai)
}
```

Mapping otomatis:
- `TARIK_TUNAI` → `CREDIT`
- Semua kategori lain → `DEBIT`

---

## 3. Arsitektur Kas Terpisah

### 3.1 Prinsip Pemisahan

```
┌─────────────────────────────────────────────┐
│ SHOP                                        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ KAS RETAIL       │  │ KAS TUNAI BRILINK│ │
│  │ (CashBox retail) │  │ (BrilinkCashBox) │ │
│  │                  │  │                  │ │
│  │ Sumber:          │  │ Sumber:          │ │
│  │ - POS retail     │  │ - Trx BRILink    │ │
│  │ - Hutang bayar   │  │ - Setor/Tarik    │ │
│  │ - Modal masuk    │  │   manual         │ │
│  └─────────────────┘  └──────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ REKENING BRI AGEN (BrilinkAccount)      ││
│  │ - Bisa > 1 rekening                    ││
│  │ - Balance tracking + mutations          ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 3.2 Model Kas Tunai BRILink (Baru)

Kas tunai BRILink menggunakan **table terpisah** dari CashBox retail:

```prisma
model BrilinkCashBox {
  id              String    @id @default(cuid())
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId          String    @unique  // 1 kas tunai per shop
  balance         Int       @default(0)
  lastAudit       DateTime?
  lastAuditBalance Int?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  mutations       BrilinkCashMutation[]

  @@map("brilink_cash_boxes")
}

model BrilinkCashMutation {
  id              String    @id @default(cuid())
  cashBox         BrilinkCashBox @relation(fields: [cashBoxId], references: [id], onDelete: Cascade)
  cashBoxId       String
  type            String    // TRX_IN | TRX_OUT | SETOR | TARIK | ADJUSTMENT
  amount          Int
  balanceBefore   Int
  balanceAfter    Int
  reference       String?   // brilinkTransaction.id atau manual
  description     String
  notes           String?
  createdById     String?
  createdAt       DateTime  @default(now())

  @@index([cashBoxId])
  @@index([createdAt])
  @@map("brilink_cash_mutations")
}
```

### 3.3 Auto-Impact Saat Transaksi Dibuat

Ketika kasir input transaksi BRILink dengan status `SUCCESS`:

```
createBrilinkTransaction():
│
├── 1. Insert BrilinkTransaction
├── 2. Determine flowDirection (DEBIT/CREDIT)
├── 3. Update BrilinkAccount (rekening)
│      ├── DEBIT:  balance -= amount
│      └── CREDIT: balance += amount
│      └── Insert BrilinkMutation (TRX_DEBIT / TRX_CREDIT)
├── 4. Update BrilinkCashBox (kas tunai)
│      ├── DEBIT categories:  balance += (amount + fee)  [nasabah bayar tunai]
│      └── CREDIT (tarik tunai): balance -= (amount - fee) [agen kasih tunai]
│      └── Insert BrilinkCashMutation (TRX_IN / TRX_OUT)
└── 5. Done (dalam 1 DB transaction)
```

---

## 4. Spesifikasi UI: Admin Panel > BRILink > Transaksi

### 4.1 Layout Halaman

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Transaksi BRILink                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── KPI TARGET CARDS ─────────────────────────────────────┐│
│ │ [Transaksi]     [Volume]        [Fee/Profit]   [Target]   ││
│ │  45/50 hari ini  Rp 25.5jt      Rp 425rb       90% ████  ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──── GRAFIK ────────────────────────────────────────────────┐│
│ │ [Tab: Transaksi | Profit]   [Period: 7H | 1B | 3B | Custom]│
│ │                                                            ││
│ │  ▓▓▓                                                      ││
│ │  ▓▓▓  ▓▓                                                  ││
│ │  ▓▓▓  ▓▓▓  ▓▓                                            ││
│ │  ▓▓▓  ▓▓▓  ▓▓▓  ▓▓  ▓▓▓  ▓▓  ▓▓▓                       ││
│ │  Sen   Sel  Rab  Kam  Jum  Sab  Min                       ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──── FILTER BAR ────────────────────────────────────────────┐│
│ │ [Period ▼] [Kategori ▼] [Status ▼] [Kasir ▼] [🔍 Search] ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──── TABLE TRANSAKSI ───────────────────────────────────────┐│
│ │ Waktu  | Ref      | Kategori     | Customer | Nominal     ││
│ │        |          |              |          | Fee | Status ││
│ │────────|──────────|──────────────|──────────|─────────────││
│ │ 09:15  | BRL-..23 | Transfer BRI | Pak Adi  | 500rb      ││
│ │        |          |              |          | 5rb | ✅     ││
│ │ 09:30  | BRL-..24 | Tarik Tunai  | Bu Siti  | 1jt        ││
│ │        |          |              |          | 10rb| ✅     ││
│ │ 10:05  | BRL-..25 | Topup Pulsa  | Dedi     | 50rb       ││
│ │        |          |              |          | 2rb | ❌VOID ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ [Pagination: < 1 2 3 ... 10 >]  [Showing 1-20 of 198]       │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 KPI Target Cards

4 card di bagian atas dengan progress ke target:

| Card | Value | Target Source | Visual |
|------|-------|---------------|--------|
| **Total Transaksi** | Count hari ini | `shopSettings.brilinkKpiConfig.dailyTransactionTarget` | Progress bar + angka |
| **Volume** | Sum amount hari ini | `shopSettings.brilinkKpiConfig.dailyVolumeTarget` | Progress bar + Rp |
| **Fee/Profit** | Sum fee hari ini | `shopSettings.brilinkKpiConfig.dailyFeeTarget` | Progress bar + Rp |
| **Achievement** | Rata-rata % ketiga target | Computed | Percentage + emoji |

KPI target di-set admin di menu Pengaturan. Default:
```json
{
  "dailyTransactionTarget": 50,
  "dailyVolumeTarget": 50000000,
  "dailyFeeTarget": 500000
}
```

### 4.3 Grafik

**2 Tab:**

1. **Tab Transaksi** — Bar chart jumlah transaksi per hari/jam
   - Stacked by kategori (7 warna)
   - Hover: tooltip detail per kategori

2. **Tab Profit** — Line chart total fee per hari/jam
   - Single line (total profit)
   - Area fill di bawah line
   - Hover: tooltip Rp fee hari itu

**Period Selector:**
- `Hari Ini` — bucket per jam (00-23)
- `7 Hari` — bucket per hari
- `1 Bulan` — bucket per hari
- `3 Bulan` — bucket per minggu
- `Custom` — date range picker (max 6 bulan)

### 4.4 Filter Bar

| Filter | Type | Options |
|--------|------|---------|
| **Period** | Dropdown | Hari Ini, 7 Hari, 1 Bulan, 3 Bulan, Custom Range |
| **Kategori** | Multi-select | 7 kategori BRILink |
| **Status** | Multi-select | SUCCESS, FAILED, VOIDED, PENDING |
| **Kasir** | Dropdown | List kasir aktif di shop |
| **Search** | Text input | Cari by refNumber, customerName, destination |

Filter berlaku untuk **tabel DAN grafik** secara bersamaan.

### 4.5 Kolom Tabel

| # | Kolom | Deskripsi | Sortable |
|---|-------|-----------|----------|
| 1 | **Waktu** | createdAt format "DD/MM HH:mm" | ✅ |
| 2 | **Ref** | refNumber (truncated, full di hover) | ✅ |
| 3 | **Kategori** | Badge warna per kategori | ✅ |
| 4 | **Customer** | Nama + phone (jika ada) | ✅ |
| 5 | **Tujuan** | No rek/no HP tujuan | - |
| 6 | **Nominal** | Rp formatted | ✅ |
| 7 | **Fee** | Rp formatted | ✅ |
| 8 | **Total** | Nominal + Fee | ✅ |
| 9 | **Status** | Badge: hijau/merah/kuning/abu | ✅ |
| 10 | **Kasir** | Nama kasir | ✅ |
| 11 | **Rekening** | Label rekening (jika linked) | - |

**Row click** → Buka Drawer Detail

### 4.6 Drawer Detail Transaksi

Klik baris tabel → slide-in drawer dari kanan:

```
┌─────────────────────────────────────┐
│ [X] Detail Transaksi                │
├─────────────────────────────────────┤
│                                     │
│ REF: BRL-20260605-ABC123            │
│ Status: ✅ SUCCESS                  │
│                                     │
│ ─── INFORMASI TRANSAKSI ───         │
│ Kategori    : Transfer BRI          │
│ Customer    : Pak Adi               │
│ Phone       : 081234567890          │
│ Tujuan      : 1234567890            │
│ Nominal     : Rp 500.000           │
│ Fee Agen    : Rp 5.000             │
│ Total Bayar : Rp 505.000           │
│                                     │
│ ─── IMPACT KEUANGAN ───            │
│ Flow        : DEBIT                 │
│ Rekening    : BRI Utama (***4567)   │
│   Impact    : -Rp 500.000          │
│   Saldo Stlh: Rp 12.500.000       │
│ Kas Tunai   :                       │
│   Impact    : +Rp 505.000          │
│   Saldo Stlh: Rp 3.200.000        │
│                                     │
│ ─── META ───                        │
│ Kasir       : Ahmad                 │
│ Waktu Input : 05/06/2026 09:15      │
│ Sync Time   : 05/06/2026 09:15      │
│ Device      : Webapp (Chrome)       │
│                                     │
│ ─── VOID (jika ada) ───            │
│ Voided At   : 05/06/2026 09:20     │
│ Reason      : Gagal proses di EDC   │
│ Reversed    : ✅ Saldo dikembalikan │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [🗑️ Void Transaksi]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.7 Void dari Admin Panel

**Flow:**
1. Admin klik "Void Transaksi" di drawer
2. Modal konfirmasi muncul:
   - Text area: "Alasan void" (required, min 5 karakter)
   - Checkbox: "Saya yakin ingin void transaksi ini"
   - Button: "Void" (destructive red)
3. Server process:
   - Set status = `VOIDED`, voidedAt, voidReason
   - Reverse saldo rekening (ADJUSTMENT mutation)
   - Reverse kas tunai (ADJUSTMENT mutation)
   - Log ke ActivityLog
4. UI update: badge berubah merah, drawer tampil info void

**Catatan:** Void hanya bisa untuk transaksi `SUCCESS`. Transaksi `FAILED` atau `PENDING` tidak perlu void (sudah gagal/belum jalan).

---

## 5. Offline & Sync Flow (Webapp Kasir)

### 5.1 Input Transaksi Saat Offline

```
┌─────────────────────────────────────────────────────┐
│ WEBAPP KASIR (offline)                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. Kasir input transaksi                            │
│    └── Simpan di IndexedDB                          │
│    └── Status: PENDING                              │
│    └── idempotencyKey: uuid generated               │
│    └── clientCreatedAt: waktu device                │
│                                                     │
│ 2. Kasir cek di mesin BRI → GAGAL                   │
│    └── Kasir klik "Gagal" di webapp                 │
│    └── Status lokal: FAILED                         │
│    └── Input reason: "Saldo rek tidak cukup"        │
│    └── Kas/saldo TIDAK berubah                      │
│                                                     │
│ 3. Kasir cek di mesin BRI → SUKSES                  │
│    └── Kasir klik "Berhasil" di webapp              │
│    └── Status lokal: SUCCESS                        │
│    └── Kas tunai & saldo lokal di-update            │
│                                                     │
│ 4. Sinyal pulih → AUTO SYNC                         │
│    └── Push semua pending records ke server         │
│    └── Server dedup via idempotencyKey              │
│    └── Server update saldo real                     │
│    └── Admin panel langsung lihat data baru         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 Void di Webapp (Offline)

```
Skenario: Kasir sudah input SUCCESS tapi ternyata gagal di mesin BRI
│
├── Kasir buka transaksi terakhir
├── Klik "Void/Batalkan"
├── Input reason
├── Lokal: status → VOIDED, saldo di-reverse
├── Saat online: push void ke server
└── Admin panel otomatis update
```

### 5.3 Idempotency & Conflict Resolution

- **idempotencyKey** (client UUID) mencegah duplikasi saat retry sync
- Server: jika key sudah ada → return existing record, skip insert
- **clientCreatedAt** menjadi waktu asli transaksi (bukan sync time)
- Conflict: last-write-wins, tapi void selalu menang atas success (VOIDED is final)

---

## 6. API Endpoints

### 6.1 Transaksi BRILink

```
GET  /api/brilink/transactions
     Query: shopId, category[], status[], cashierId, startDate, endDate, 
            search, page, limit, sortBy, sortOrder
     Response: { data: BrilinkTransaction[], meta: PaginationMeta }

POST /api/brilink/transactions
     Body: { 
       category, customerName, customerPhone?, destination, amount,
       accountId, idempotencyKey?, clientCreatedAt?
     }
     Response: { transaction, impact: { account, cashBox } }
     Note: Fee auto-calculated dari fee rules

GET  /api/brilink/transactions/:id
     Response: { transaction, impact: { accountMutation, cashMutation } }

POST /api/brilink/transactions/:id/void
     Body: { reason }
     Response: { transaction, reversals: { accountMutation, cashMutation } }

POST /api/brilink/transactions/sync
     Body: { transactions: OfflineTransaction[] }
     Response: { synced: Transaction[], conflicts: Conflict[] }
     Note: Batch sync dari webapp kasir
```

### 6.2 Grafik & Statistik

```
GET  /api/brilink/transactions/chart
     Query: shopId, period (today|7d|1m|3m|custom), startDate?, endDate?,
            type (transactions|profit), category[]
     Response: { labels: string[], datasets: Record<string, number[]> }

GET  /api/brilink/transactions/kpi
     Query: shopId
     Response: { 
       transactions: { current, target, percent },
       volume: { current, target, percent },
       fee: { current, target, percent },
       achievement: percent
     }
```

---

## 7. Data Model Updates

### 7.1 Perubahan pada BrilinkTransaction

```prisma
model BrilinkTransaction {
  // ... existing fields ...

  // NEW FIELDS
  flowDirection     String    // 'DEBIT' | 'CREDIT' (auto-derived from category)
  accountImpact     Int       @default(0) // signed: negative for debit, positive for credit
  cashImpact        Int       @default(0) // signed: impact on kas tunai

  // Offline support
  idempotencyKey    String?   @unique
  clientCreatedAt   DateTime?

  // Void support
  voidedAt          DateTime?
  voidedBy          String?
  voidReason        String?

  // Link ke kas tunai mutation
  cashMutationId    String?
}
```

### 7.2 Model Baru: BrilinkCashBox

```prisma
model BrilinkCashBox {
  id                String    @id @default(cuid())
  shop              Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId            String    @unique
  balance           Int       @default(0)
  lastAudit         DateTime?
  lastAuditBalance  Int?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  mutations         BrilinkCashMutation[]

  @@map("brilink_cash_boxes")
}

model BrilinkCashMutation {
  id              String         @id @default(cuid())
  cashBox         BrilinkCashBox @relation(fields: [cashBoxId], references: [id], onDelete: Cascade)
  cashBoxId       String
  type            String         // TRX_IN | TRX_OUT | SETOR | TARIK | ADJUSTMENT | VOID_REVERSE
  amount          Int
  balanceBefore   Int
  balanceAfter    Int
  reference       String?        // brilinkTransaction.id
  description     String
  notes           String?
  createdById     String?
  createdAt       DateTime       @default(now())

  @@index([cashBoxId])
  @@index([createdAt])
  @@map("brilink_cash_mutations")
}
```

### 7.3 KPI Config (ShopSetting extension)

```prisma
// Di ShopSetting, field baru (JSONB):
brilinkKpiConfig  Json?
// Shape:
// {
//   dailyTransactionTarget: 50,
//   dailyVolumeTarget: 50000000,   // Rp 50jt
//   dailyFeeTarget: 500000,        // Rp 500rb
// }
```

---

## 8. Business Logic Rules

### 8.1 Auto Fee Calculation

```
1. Saat createTransaction, lookup BrilinkFee rules:
   WHERE shopId = x AND category = x AND isActive = true
   AND amount >= minAmount AND amount <= maxAmount

2. Jika match:
   - feeType FLAT → fee = feeAmount
   - feeType PERCENT → fee = round(amount * feePercent / 100)

3. Jika tidak match → fee = 0 (warn di UI: "Kategori belum ada fee rule")

4. total = amount + fee
```

### 8.2 Impact Calculation

```typescript
function calculateImpact(category: BrilinkCategory, amount: number, fee: number) {
  if (category === 'TARIK_TUNAI') {
    return {
      flowDirection: 'CREDIT',
      accountImpact: +amount,           // saldo rek bertambah
      cashImpact: -(amount - fee),      // kas tunai berkurang (net)
    };
  } else {
    return {
      flowDirection: 'DEBIT',
      accountImpact: -amount,           // saldo rek berkurang
      cashImpact: +(amount + fee),      // kas tunai bertambah
    };
  }
}
```

### 8.3 Void Reversal

```typescript
function calculateVoidReversal(transaction: BrilinkTransaction) {
  return {
    accountReversal: -transaction.accountImpact,  // kebalikan
    cashReversal: -transaction.cashImpact,        // kebalikan
  };
}
```

### 8.4 Validation Rules

- `amount` harus > 0
- `customerName` required, min 2 karakter
- `destination` required (no rek, no HP, no meter PLN)
- `accountId` required (kasir harus pilih rekening mana)
- Jika DEBIT: cek saldo rekening >= amount (prevent overdraft)
  - Jika tidak cukup → warning tapi tetap bisa proceed (karena agen bisa minus di BRI)
  - Config `allowOverdraft` di shopSettings (default: true, karena realita lapangan)
- Jika TARIK_TUNAI: cek kas tunai >= (amount - fee)
  - Warning jika kas tunai tidak cukup

---

## 9. Status Flow

```
                    ┌──────────┐
                    │ PENDING  │ (offline, belum konfirmasi)
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       ┌──────────┐         ┌──────────┐
       │ SUCCESS  │         │  FAILED  │ (gagal di mesin BRI)
       └────┬─────┘         └──────────┘
            │                     (terminal, no impact)
            │
            ▼
     ┌──────────┐
     │  VOIDED  │ (admin/kasir void + reason)
     └──────────┘
       (saldo reversed)
```

**Rules:**
- `PENDING` → bisa jadi `SUCCESS` atau `FAILED`
- `SUCCESS` → bisa jadi `VOIDED`
- `FAILED` → terminal (tidak ada impact keuangan)
- `VOIDED` → terminal (impact sudah di-reverse)
- Hanya `SUCCESS` yang mengubah saldo rekening & kas tunai
- `VOIDED` me-reverse semua impact dari `SUCCESS`

---

## 10. Warna & Badge Kategori

| Kategori | Warna | Icon |
|----------|-------|------|
| TRANSFER_BRI | Blue | `send` |
| TRANSFER_OTHER | Indigo | `arrow-right-left` |
| TARIK_TUNAI | Green | `banknote` |
| TOPUP_PULSA | Orange | `smartphone` |
| TOPUP_DATA | Purple | `wifi` |
| TOPUP_EWALLET | Pink | `wallet` |
| TOPUP_PLN | Yellow | `zap` |

| Status | Warna | Icon |
|--------|-------|------|
| SUCCESS | Green | `check-circle` |
| FAILED | Red | `x-circle` |
| PENDING | Yellow | `clock` |
| VOIDED | Gray | `slash` |

---

## 11. Export & Print

- **Export CSV** — Semua data sesuai filter aktif
- **Export PDF** — Laporan summary + detail (max 500 baris)
- **Print Struk** — Dari drawer detail, button "Print Struk" (thermal printer format)

---

## 12. Acceptance Criteria

### Functional
- [ ] Admin bisa lihat semua transaksi BRILink dengan filter & sort
- [ ] Grafik transaksi & profit tampil sesuai period
- [ ] KPI target cards tampil progress hari ini vs target
- [ ] Klik baris → drawer detail dengan info lengkap + impact keuangan
- [ ] Admin bisa void transaksi SUCCESS dengan reason
- [ ] Void me-reverse saldo rekening dan kas tunai
- [ ] Kasir bisa input transaksi offline → auto-sync
- [ ] Kasir bisa void transaksi offline → sync ke admin
- [ ] Idempotency key mencegah duplikasi saat retry
- [ ] Kas tunai BRILink 100% terpisah dari kas retail
- [ ] Fee auto-calculated berdasarkan fee rules aktif

### Non-Functional
- [ ] List transaksi load < 500ms (paginated)
- [ ] Grafik render < 1s
- [ ] Offline queue sync < 5s saat online kembali
- [ ] Support 10.000+ transaksi per bulan tanpa degradasi

---

## 13. Dependencies

- **Existing**: BrilinkAccount, BrilinkMutation, BrilinkFee (sudah ada)
- **Baru**: BrilinkCashBox, BrilinkCashMutation (perlu migration)
- **Update**: BrilinkTransaction (tambah field baru)
- **Config**: ShopSetting.brilinkKpiConfig (perlu migration JSONB)

---

## 14. Open Questions

1. ~~Kas tunai terpisah atau pakai CashBox existing?~~ → **TERPISAH** (confirmed)
2. Apakah perlu notifikasi push saat transaksi void dari webapp? → TBD
3. Maximum offline queue size sebelum force-sync warning? → suggest 50 transaksi
4. Apakah perlu approval flow untuk void di atas nominal tertentu? → TBD

---

## Next: PRD Menu "Kas & Rekening BRILink" dan "Pengaturan Fee"

Dokumen ini fokus pada **menu Transaksi BRILink** saja. Menu Kas & Rekening dan Pengaturan Fee akan di-PRD terpisah.
