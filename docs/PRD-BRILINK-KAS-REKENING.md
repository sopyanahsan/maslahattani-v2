# PRD Admin Panel BRILink — Menu Kas & Rekening

**Status**: Draft
**Updated**: Juni 2026
**Owner**: Sopyan Ahsan
**Module**: Admin Panel > BRILink > Kas & Rekening

---

## 1. Konteks & Tujuan

### Background

Agen BRILink mengelola **2 jenis saldo** yang saling terkait:
1. **Rekening BRI** — Saldo digital di bank (bisa >1 rekening)
2. **Kas Tunai BRILink** — Uang fisik yang dipakai untuk layani nasabah (1 per toko)

Keduanya bergerak berlawanan setiap transaksi. Admin perlu monitor, setor/tarik manual, dan melakukan **reconciliation** (pencocokan saldo app vs saldo real).

### Goals

1. **Multi-Rekening** — Support banyak rekening BRI per toko, masing-masing dengan balance tracking
2. **1 Kas Tunai** — Satu kas tunai BRILink per toko, terpisah total dari kas retail
3. **Setor/Tarik Manual** — Admin bisa setor ke rekening atau tarik dari rekening (di luar transaksi nasabah)
4. **Reconciliation** — Fitur cocokkan saldo di app dengan saldo real (input manual dari cek mutasi BRI)
5. **Audit Trail** — Semua pergerakan saldo tercatat (mutasi) dengan siapa, kapan, kenapa

---

## 2. Arsitektur Keuangan BRILink

```
┌─────────────────────────────────────────────────────────────┐
│                     SHOP (Toko)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ KAS TUNAI BRILINK (BrilinkCashBox) — 1 PER TOKO      │  │
│  │                                                       │  │
│  │ Balance: Rp 5.200.000                                 │  │
│  │ Last Audit: 04/06/2026 21:00                          │  │
│  │                                                       │  │
│  │ Mutasi:                                               │  │
│  │ - TRX_IN (dari nasabah bayar transfer)                │  │
│  │ - TRX_OUT (kasih tunai tarik tunai)                   │  │
│  │ - SETOR (admin tambah modal tunai)                    │  │
│  │ - TARIK (admin ambil tunai untuk keperluan lain)      │  │
│  │ - ADJUSTMENT (koreksi reconciliation)                 │  │
│  │ - VOID_REVERSE (dari void transaksi)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ REKENING BRI (BrilinkAccount) — BISA > 1             │  │
│  │                                                       │  │
│  │ ┌─────────────────────────────────────────┐           │  │
│  │ │ [★] BRI Utama - 0012345678 - Rp 15.5jt │           │  │
│  │ └─────────────────────────────────────────┘           │  │
│  │ ┌─────────────────────────────────────────┐           │  │
│  │ │ BRI Cadangan - 0087654321 - Rp 3.2jt   │           │  │
│  │ └─────────────────────────────────────────┘           │  │
│  │                                                       │  │
│  │ Mutasi per rekening:                                  │  │
│  │ - SETOR (admin setor ke rekening)                     │  │
│  │ - TARIK (admin tarik dari rekening)                   │  │
│  │ - TRX_DEBIT (transaksi BRILink, saldo berkurang)     │  │
│  │ - TRX_CREDIT (tarik tunai, saldo bertambah)          │  │
│  │ - ADJUSTMENT (koreksi reconciliation)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Spesifikasi UI

### 3.1 Layout Halaman

```
┌──────────────────────────────────────────────────────────────────┐
│ [Header] Kas & Rekening BRILink                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──── SUMMARY CARDS ─────────────────────────────────────────┐   │
│ │                                                            │   │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │   │
│ │  │ 💵 KAS TUNAI │  │ 🏦 TOTAL REK │  │ 📊 NET POSITION │ │   │
│ │  │ Rp 5.200.000 │  │ Rp 18.700.000│  │ Rp 23.900.000   │ │   │
│ │  │ ⚠️ Low stock │  │ 2 rekening   │  │ Total aset BRI  │ │   │
│ │  └──────────────┘  └──────────────┘  └──────────────────┘ │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──── TAB: [Kas Tunai] [Rekening BRI] [Reconciliation] ─────┐   │
│ │                                                            │   │
│ │  (content berubah sesuai tab aktif)                        │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Summary Cards (Selalu Tampil)

| Card | Value | Keterangan |
|------|-------|------------|
| **Kas Tunai** | `brilinkCashBox.balance` | Badge warning jika < threshold |
| **Total Rekening** | Sum semua `brilinkAccount.balance` | Jumlah rekening aktif |
| **Net Position** | Kas Tunai + Total Rekening | Total aset BRILink keseluruhan |

---

## 4. Tab 1: Kas Tunai

### 4.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ KAS TUNAI BRILINK                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Saldo Saat Ini: Rp 5.200.000                               │
│  Threshold Alert: Rp 2.000.000                              │
│  Last Audit: 04/06/2026 21:00 (Rp 5.150.000 → adj +50.000) │
│                                                              │
│  ┌────────────────────────────────────────────┐              │
│  │ [+ Tambah Modal]  [- Ambil Tunai]  [⚙️ Setting] │        │
│  └────────────────────────────────────────────┘              │
│                                                              │
│ ─── MUTASI KAS TUNAI ───                                    │
│                                                              │
│ ┌──── FILTER ────────────────────────────────────────────┐   │
│ │ [Period ▼] [Tipe ▼] [🔍 Search]                       │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ │ Waktu      │ Tipe      │ Deskripsi         │ Jumlah     │ │
│ │────────────│───────────│───────────────────│────────────│ │
│ │ 09:15      │ TRX_IN    │ Transfer BRI -    │ +505.000   │ │
│ │            │ 🟢        │ Pak Adi           │            │ │
│ │ 09:30      │ TRX_OUT   │ Tarik Tunai -     │ -990.000   │ │
│ │            │ 🔴        │ Bu Siti           │            │ │
│ │ 10:00      │ SETOR     │ Tambah modal pagi │ +2.000.000 │ │
│ │            │ 🔵        │ oleh: Admin       │            │ │
│ │ 10:05      │ VOID_REV  │ Void BRL-..25     │ -52.000    │ │
│ │            │ ⚫        │ Topup gagal       │            │ │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [Pagination: < 1 2 3 >]                                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Action: Tambah Modal (Setor Kas Tunai)

Admin menambahkan uang fisik ke kas tunai BRILink (misal: ambil dari ATM, dari kas retail, dll).

**Modal Form:**
```
┌─────────────────────────────────┐
│ Tambah Modal Kas Tunai BRILink  │
├─────────────────────────────────┤
│                                 │
│ Jumlah*: [Rp ________]         │
│ Catatan: [________________]    │
│                                 │
│ Saldo sekarang: Rp 5.200.000   │
│ Setelah setor:  Rp 7.200.000   │
│                                 │
│ [Batal]  [Tambah Modal]        │
└─────────────────────────────────┘
```

**Logic:**
- Insert `BrilinkCashMutation` type `SETOR`
- Update `BrilinkCashBox.balance += amount`

### 4.3 Action: Ambil Tunai (Tarik Kas)

Admin mengambil uang tunai dari kas BRILink (misal: untuk belanja, setoran bank, dll).

**Modal Form:**
```
┌─────────────────────────────────┐
│ Ambil Tunai dari Kas BRILink    │
├─────────────────────────────────┤
│                                 │
│ Jumlah*: [Rp ________]         │
│ Catatan*: [________________]   │
│                                 │
│ Saldo sekarang: Rp 5.200.000   │
│ Setelah ambil:  Rp 3.200.000   │
│                                 │
│ ⚠️ Warning jika saldo < threshold│
│                                 │
│ [Batal]  [Ambil Tunai]         │
└─────────────────────────────────┘
```

**Logic:**
- Validasi: balance >= amount (wajib, kas tunai tidak boleh minus)
- Insert `BrilinkCashMutation` type `TARIK`
- Update `BrilinkCashBox.balance -= amount`

### 4.4 Setting Kas Tunai

**Modal:**
```
┌─────────────────────────────────┐
│ Pengaturan Kas Tunai BRILink    │
├─────────────────────────────────┤
│                                 │
│ Alert Threshold*:               │
│ [Rp 2.000.000]                 │
│ (Notifikasi jika saldo di bawah │
│  threshold ini)                 │
│                                 │
│ Catatan:                        │
│ [________________]             │
│                                 │
│ [Batal]  [Simpan]              │
└─────────────────────────────────┘
```

---

## 5. Tab 2: Rekening BRI

### 5.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ REKENING BRI AGEN                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────┐               │
│ │ [+ Tambah Rekening]                        │               │
│ └────────────────────────────────────────────┘               │
│                                                              │
│ ┌──── CARD: BRI Utama ★ ─────────────────────────────────┐   │
│ │                                                        │   │
│ │ No. Rek: 0012-3456-78 (a.n. SOPYAN AHSAN)             │   │
│ │ Saldo App: Rp 15.500.000                              │   │
│ │ Threshold: Rp 5.000.000                               │   │
│ │ Status: 🟢 Aktif | ★ Default                          │   │
│ │                                                        │   │
│ │ [Setor] [Tarik] [Mutasi] [Edit] [⚙️]                 │   │
│ │                                                        │   │
│ │ Last 5 Mutasi:                                         │   │
│ │ • 09:15 TRX_DEBIT -500.000 (Transfer Pak Adi)         │   │
│ │ • 09:30 TRX_CREDIT +1.000.000 (Tarik Bu Siti)         │   │
│ │ • 08:00 SETOR +5.000.000 (Setor pagi)                 │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── CARD: BRI Cadangan ────────────────────────────────┐   │
│ │                                                        │   │
│ │ No. Rek: 0087-6543-21 (a.n. SOPYAN AHSAN)             │   │
│ │ Saldo App: Rp 3.200.000                               │   │
│ │ Threshold: Rp 1.000.000                               │   │
│ │ Status: 🟢 Aktif                                       │   │
│ │ ⚠️ Saldo di bawah threshold!                           │   │
│ │                                                        │   │
│ │ [Setor] [Tarik] [Mutasi] [Edit] [⚙️]                 │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Tambah Rekening

**Modal Form:**
```
┌────────────────────────────────────┐
│ Tambah Rekening BRI                │
├────────────────────────────────────┤
│                                    │
│ Label*:          [BRI Utama     ]  │
│ No. Rekening*:   [0012345678    ]  │
│ Atas Nama:       [SOPYAN AHSAN  ]  │
│ Saldo Awal*:     [Rp 15.000.000]  │
│ Alert Threshold: [Rp 5.000.000 ]  │
│ Set Default:     [✓]              │
│ Catatan:         [_____________]  │
│                                    │
│ [Batal]  [Simpan]                 │
└────────────────────────────────────┘
```

**Rules:**
- No. Rekening unique per shop
- Jika "Set Default" → unset rekening lain yang default
- Saldo awal menjadi balance awal + insert mutation awal type ADJUSTMENT (initial)

### 5.3 Setor ke Rekening

Admin melakukan setor saldo ke rekening BRI (misal: transfer dari rekening lain, setor tunai di bank).

**Modal Form:**
```
┌─────────────────────────────────────┐
│ Setor Saldo ke BRI Utama            │
├─────────────────────────────────────┤
│                                     │
│ Jumlah*:     [Rp ________]         │
│ Referensi:   [No. bukti / keterangan]│
│ Catatan:     [________________]    │
│                                     │
│ Saldo sekarang: Rp 15.500.000      │
│ Setelah setor:  Rp 20.500.000      │
│                                     │
│ [Batal]  [Setor]                   │
└─────────────────────────────────────┘
```

**Logic:**
- Insert `BrilinkMutation` type `SETOR`
- Update `BrilinkAccount.balance += amount`

### 5.4 Tarik dari Rekening

Admin menarik saldo dari rekening BRI (misal: tarik tunai ATM, transfer keluar untuk keperluan).

**Modal Form:**
```
┌─────────────────────────────────────┐
│ Tarik Saldo dari BRI Utama          │
├─────────────────────────────────────┤
│                                     │
│ Jumlah*:     [Rp ________]         │
│ Referensi:   [No. bukti / keterangan]│
│ Catatan:     [________________]    │
│                                     │
│ Saldo sekarang: Rp 15.500.000      │
│ Setelah tarik:  Rp 10.500.000      │
│                                     │
│ ⚠️ Warning jika saldo < threshold   │
│                                     │
│ [Batal]  [Tarik]                   │
└─────────────────────────────────────┘
```

**Logic:**
- Warning jika resulting balance < threshold (tapi tetap boleh proceed)
- Insert `BrilinkMutation` type `TARIK`
- Update `BrilinkAccount.balance -= amount`

### 5.5 Halaman Mutasi Rekening (Klik "Mutasi")

Drawer/halaman detail mutasi per rekening:

```
┌─────────────────────────────────────────────────────────┐
│ Mutasi Rekening: BRI Utama (0012345678)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Saldo Saat Ini: Rp 15.500.000                           │
│                                                         │
│ ┌── FILTER ──────────────────────────────────────────┐  │
│ │ [Period ▼]  [Tipe ▼]  [🔍 Search]                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ │ Waktu  │ Tipe       │ Deskripsi      │ Jumlah      │ │
│ │        │            │                │ Saldo Stlh  │ │
│ │────────│────────────│────────────────│─────────────│ │
│ │ 09:15  │ TRX_DEBIT  │ Transfer BRI   │ -500.000   │ │
│ │        │ 🔴         │ → Pak Adi      │ 15.500.000 │ │
│ │ 09:30  │ TRX_CREDIT │ Tarik Tunai    │ +1.000.000 │ │
│ │        │ 🟢         │ ← Bu Siti      │ 16.000.000 │ │
│ │ 08:00  │ SETOR      │ Setor pagi     │ +5.000.000 │ │
│ │        │ 🔵         │ oleh: Admin    │ 15.000.000 │ │
│ │ 07:30  │ ADJUSTMENT │ Reconciliation │ +150.000   │ │
│ │        │ ⚫         │ selisih audit  │ 10.000.000 │ │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ [Export CSV]  [< 1 2 3 >]                              │
└─────────────────────────────────────────────────────────┘
```

### 5.6 Edit Rekening

**Fields yang bisa diubah:**
- Label
- Atas Nama
- Alert Threshold
- Set Default (on/off)
- Catatan
- Status Aktif (on/off → soft delete)

**Tidak bisa diubah:** No. Rekening (immutable setelah dibuat)

### 5.7 Nonaktifkan Rekening

- Soft delete: set `isActive = false`
- Rekening yang nonaktif tidak muncul di dropdown saat input transaksi
- Masih bisa dilihat di tab rekening dengan filter "Tampilkan nonaktif"
- Tidak bisa dinonaktifkan jika masih ada saldo > 0 (harus tarik dulu)

---

## 6. Tab 3: Reconciliation (Pencocokan Saldo)

### 6.1 Konsep

Reconciliation = proses mencocokkan **saldo di app** dengan **saldo real** (cek mutasi bank/hitung fisik). Jika ada selisih, admin input koreksi (adjustment).

### 6.2 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ RECONCILIATION                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── REKONSILIASI REKENING ─────────────────────────────┐   │
│ │                                                        │   │
│ │ Pilih Rekening: [BRI Utama ▼]                          │   │
│ │                                                        │   │
│ │ Saldo di App:     Rp 15.500.000                        │   │
│ │ Saldo Real*:      [Rp ___________]                     │   │
│ │ Selisih:          Rp 0  (auto-calculate)               │   │
│ │                                                        │   │
│ │ Catatan:          [Cek m-banking jam 21:00]            │   │
│ │                                                        │   │
│ │ [Simpan Reconciliation]                                │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── REKONSILIASI KAS TUNAI ────────────────────────────┐   │
│ │                                                        │   │
│ │ Saldo di App:     Rp 5.200.000                         │   │
│ │ Saldo Real*:      [Rp ___________]                     │   │
│ │ Selisih:          Rp 0  (auto-calculate)               │   │
│ │                                                        │   │
│ │ Catatan:          [Hitung fisik malam]                 │   │
│ │                                                        │   │
│ │ [Simpan Reconciliation]                                │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ─── RIWAYAT RECONCILIATION ───                              │
│                                                              │
│ │ Tanggal    │ Target       │ Saldo App  │ Saldo Real │ Adj │ │
│ │────────────│──────────────│────────────│────────────│─────│ │
│ │ 04/06 21:00│ BRI Utama    │ 15.350.000 │ 15.500.000│+150k│ │
│ │ 04/06 21:05│ Kas Tunai    │ 5.150.000  │ 5.200.000 │+50k │ │
│ │ 03/06 21:00│ BRI Utama    │ 12.000.000 │ 12.000.000│ 0   │ │
│ │ 03/06 21:00│ Kas Tunai    │ 4.800.000  │ 4.800.000 │ 0   │ │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Logic Reconciliation

**Saat admin submit reconciliation:**

```typescript
function reconcile(target: 'account' | 'cashbox', targetId: string, realBalance: number) {
  const currentBalance = target === 'account' 
    ? brilinkAccount.balance 
    : brilinkCashBox.balance;
  
  const adjustment = realBalance - currentBalance;
  
  if (adjustment === 0) {
    // Saldo cocok, catat audit saja (no mutation)
    return { status: 'MATCHED', adjustment: 0 };
  }
  
  // Ada selisih → buat ADJUSTMENT mutation
  if (target === 'account') {
    // Insert BrilinkMutation type ADJUSTMENT
    // Update BrilinkAccount.balance = realBalance
  } else {
    // Insert BrilinkCashMutation type ADJUSTMENT
    // Update BrilinkCashBox.balance = realBalance
  }
  
  // Update lastAudit timestamp & lastAuditBalance
  return { status: 'ADJUSTED', adjustment };
}
```

**Rules:**
- Reconciliation bisa dilakukan kapan saja (daily recommended)
- Selisih positif = ada uang lebih (mungkin lupa catat sesuatu)
- Selisih negatif = ada kekurangan (mungkin ada transaksi belum tercatat)
- Semua reconciliation tercatat di riwayat untuk audit

### 6.4 Riwayat Reconciliation

Table riwayat dengan kolom:
- Tanggal/Waktu
- Target (rekening mana / kas tunai)
- Saldo App (sebelum adjustment)
- Saldo Real (yang diinput admin)
- Adjustment (+/- berapa)
- Dilakukan oleh (admin name)
- Catatan

---

## 7. API Endpoints

### 7.1 Kas Tunai BRILink

```
GET  /api/brilink/cashbox
     Query: shopId
     Response: { cashBox: BrilinkCashBox, recentMutations: Mutation[] }

POST /api/brilink/cashbox/setor
     Body: { shopId, amount, notes? }
     Response: { cashBox, mutation }

POST /api/brilink/cashbox/tarik
     Body: { shopId, amount, notes? }
     Response: { cashBox, mutation }
     Validation: balance >= amount

PATCH /api/brilink/cashbox/settings
     Body: { shopId, lowBalanceThreshold?, notes? }
     Response: { cashBox }

GET  /api/brilink/cashbox/mutations
     Query: shopId, type?, startDate?, endDate?, page, limit
     Response: { data: Mutation[], meta: PaginationMeta }
```

### 7.2 Rekening BRI (Existing, dengan update)

```
GET    /api/brilink-accounts
       Query: shopId, includeInactive?
       Response: BrilinkAccount[]

GET    /api/brilink-accounts/:id
       Response: { account, recentMutations: Mutation[] }

POST   /api/brilink-accounts
       Body: { shopId, label, accountNumber, accountHolder?, balance?, 
               lowBalanceThreshold?, isDefault?, notes? }
       Response: BrilinkAccount

PATCH  /api/brilink-accounts/:id
       Body: { label?, accountHolder?, lowBalanceThreshold?, isDefault?, 
               isActive?, notes? }
       Response: BrilinkAccount

DELETE /api/brilink-accounts/:id
       (soft delete: set isActive=false)
       Validation: balance must be 0

POST   /api/brilink-accounts/:id/setor
       Body: { amount, reference?, notes? }
       Response: { account, mutation }

POST   /api/brilink-accounts/:id/tarik
       Body: { amount, reference?, notes? }
       Response: { account, mutation }

GET    /api/brilink-accounts/:id/mutations
       (existing - sudah ada)
```

### 7.3 Reconciliation

```
POST /api/brilink/reconciliation
     Body: { 
       target: 'account' | 'cashbox',
       targetId: string,  // accountId atau cashBoxId
       realBalance: number,
       notes?: string
     }
     Response: { 
       status: 'MATCHED' | 'ADJUSTED',
       adjustment: number,
       mutation?: Mutation
     }

GET  /api/brilink/reconciliation/history
     Query: shopId, startDate?, endDate?, page, limit
     Response: { data: ReconciliationRecord[], meta }
```

---

## 8. Data Model

### 8.1 BrilinkCashBox (Baru — dari PRD Transaksi)

```prisma
model BrilinkCashBox {
  id                String    @id @default(cuid())
  shop              Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId            String    @unique  // 1 per shop
  balance           Int       @default(0)
  lowBalanceThreshold Int     @default(2000000)
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
  amount          Int            // always positive (direction dari type)
  balanceBefore   Int
  balanceAfter    Int
  reference       String?        // transactionId, reconciliationId, dll
  description     String
  notes           String?
  createdById     String?
  createdAt       DateTime       @default(now())

  @@index([cashBoxId])
  @@index([createdAt])
  @@map("brilink_cash_mutations")
}
```

### 8.2 Model Reconciliation Record (Baru)

```prisma
model BrilinkReconciliation {
  id              String    @id @default(cuid())
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId          String
  target          String    // 'ACCOUNT' | 'CASHBOX'
  targetId        String    // accountId atau cashBoxId
  targetLabel     String    // "BRI Utama" atau "Kas Tunai"
  balanceApp      Int       // saldo di app sebelum adj
  balanceReal     Int       // saldo real yang diinput
  adjustment      Int       // selisih (real - app)
  status          String    // 'MATCHED' | 'ADJUSTED'
  notes           String?
  createdById     String
  createdAt       DateTime  @default(now())

  @@index([shopId])
  @@index([createdAt])
  @@map("brilink_reconciliations")
}
```

---

## 9. Business Rules

### 9.1 Kas Tunai

- 1 kas tunai per shop (auto-created saat pertama kali akses menu BRILink)
- Balance tidak boleh negatif (hard block pada tarik manual)
- Transaksi BRILink otomatis update kas tunai (jika SUCCESS)
- Void transaksi otomatis reverse kas tunai

### 9.2 Rekening

- Bisa multiple per shop, 1 harus default
- Balance boleh negatif (overdraft di BRI itu nyata buat agen)
- Rekening default dipakai sebagai pre-selected di form transaksi kasir
- Nonaktifkan hanya bisa jika balance = 0

### 9.3 Reconciliation

- Bisa dilakukan berkali-kali (sehari bisa >1)
- Jika selisih = 0 → catat sebagai MATCHED (tetap record untuk audit)
- Jika selisih != 0 → buat ADJUSTMENT mutation, update balance
- Recommended: reconciliation minimal 1x/hari (malam/tutup toko)
- Admin panel bisa tampilkan reminder jika >24 jam belum reconcile

### 9.4 Auto-Create CashBox

- Saat shop pertama kali akses module BRILink:
  - Auto-create BrilinkCashBox dengan balance 0
  - Admin diminta input saldo awal (modal kas tunai pertama)

---

## 10. Warna Badge Tipe Mutasi

### Kas Tunai
| Tipe | Warna | Arah | Keterangan |
|------|-------|------|------------|
| TRX_IN | Green | + | Dari transaksi (nasabah bayar tunai) |
| TRX_OUT | Red | - | Dari transaksi (kasih tunai ke nasabah) |
| SETOR | Blue | + | Admin tambah modal |
| TARIK | Orange | - | Admin ambil tunai |
| ADJUSTMENT | Gray | +/- | Dari reconciliation |
| VOID_REVERSE | Dark Gray | +/- | Dari void transaksi |

### Rekening
| Tipe | Warna | Arah | Keterangan |
|------|-------|------|------------|
| TRX_DEBIT | Red | - | Dari transaksi (transfer/topup) |
| TRX_CREDIT | Green | + | Dari transaksi (tarik tunai) |
| SETOR | Blue | + | Admin setor ke rekening |
| TARIK | Orange | - | Admin tarik dari rekening |
| ADJUSTMENT | Gray | +/- | Dari reconciliation |

---

## 11. Acceptance Criteria

### Functional
- [ ] Admin bisa lihat saldo kas tunai BRILink real-time
- [ ] Admin bisa tambah modal / ambil tunai dari kas BRILink
- [ ] Admin bisa lihat semua mutasi kas tunai dengan filter
- [ ] Admin bisa lihat semua rekening BRI (active/inactive)
- [ ] Admin bisa tambah/edit/nonaktifkan rekening
- [ ] Admin bisa setor/tarik manual per rekening
- [ ] Admin bisa lihat mutasi per rekening
- [ ] Admin bisa reconcile rekening (saldo app vs real)
- [ ] Admin bisa reconcile kas tunai (saldo app vs fisik)
- [ ] Reconciliation menghasilkan ADJUSTMENT jika selisih
- [ ] Riwayat reconciliation tercatat lengkap
- [ ] Summary cards (kas + total rek + net position) akurat
- [ ] Kas tunai BRILink 100% terpisah dari kas retail
- [ ] Auto-create cashbox saat pertama akses

### Non-Functional
- [ ] Load halaman < 500ms
- [ ] Setor/tarik response < 300ms
- [ ] Reconciliation response < 500ms
- [ ] Support 5+ rekening per shop tanpa degradasi

---

## 12. Dependencies

- **From PRD Transaksi**: BrilinkCashBox + BrilinkCashMutation models
- **Existing**: BrilinkAccount + BrilinkMutation (sudah ada)
- **New**: BrilinkReconciliation model (perlu migration)
- **Integration**: Transaksi BRILink auto-update kedua saldo
