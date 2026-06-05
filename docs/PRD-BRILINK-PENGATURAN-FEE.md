# PRD Admin Panel BRILink — Menu Pengaturan Fee

**Status**: Draft
**Updated**: Juni 2026
**Owner**: Sopyan Ahsan
**Module**: Admin Panel > BRILink > Pengaturan Fee

---

## 1. Konteks & Tujuan

### Background

Setiap transaksi BRILink dikenakan **fee agen** ke nasabah. Fee ini adalah sumber profit utama agen. Besaran fee berbeda-beda tergantung:
- **Kategori transaksi** (transfer BRI vs topup pulsa vs tarik tunai, dll)
- **Range nominal** (transfer 1-10jt fee beda dengan 10-50jt)
- **Tipe fee** (flat Rp atau persentase)

Admin perlu bisa mengatur fee rules ini dengan fleksibel, melihat preview bagaimana fee akan dihitung, dan mengaktifkan/menonaktifkan rules sesuai kebutuhan.

### Goals

1. **CRUD Fee Rules** — Admin bisa buat, edit, hapus aturan fee per kategori dan range nominal
2. **Tipe Fleksibel** — Support fee FLAT (Rp tetap) dan PERCENT (% dari nominal)
3. **Range-Based** — Fee bisa berbeda berdasarkan rentang nominal transaksi
4. **Preview Calculator** — Admin bisa simulasi berapa fee yang akan dikenakan untuk nominal tertentu
5. **Activate/Deactivate** — Fee rule bisa dinonaktifkan tanpa harus dihapus
6. **Visual Clear** — Tampilan terorganisir per kategori sehingga mudah di-scan

---

## 2. Konsep Bisnis Fee BRILink

### 2.1 Bagaimana Fee Bekerja

```
NASABAH mau Transfer Rp 2.000.000
│
├── System lookup fee rules:
│   WHERE category = TRANSFER_BRI
│   AND isActive = true
│   AND 2.000.000 >= minAmount
│   AND 2.000.000 <= maxAmount
│
├── Match: "Transfer BRI 1-5jt" → feeType FLAT, feeAmount 5000
│
├── Fee = Rp 5.000
│
└── Total bayar nasabah = Rp 2.005.000
```

### 2.2 Contoh Setup Fee untuk Agen Tipikal

| Kategori | Range | Tipe | Fee | Label |
|----------|-------|------|-----|-------|
| Transfer BRI | 1 - 5.000.000 | FLAT | Rp 5.000 | Transfer BRI s/d 5jt |
| Transfer BRI | 5.000.001 - 25.000.000 | FLAT | Rp 10.000 | Transfer BRI 5-25jt |
| Transfer BRI | 25.000.001 - 100.000.000 | FLAT | Rp 15.000 | Transfer BRI 25-100jt |
| Transfer Bank Lain | 1 - 10.000.000 | FLAT | Rp 10.000 | Transfer lain s/d 10jt |
| Transfer Bank Lain | 10.000.001 - 50.000.000 | FLAT | Rp 15.000 | Transfer lain 10-50jt |
| Tarik Tunai | 1 - 5.000.000 | FLAT | Rp 10.000 | Tarik tunai s/d 5jt |
| Tarik Tunai | 5.000.001 - 20.000.000 | FLAT | Rp 15.000 | Tarik tunai 5-20jt |
| Topup Pulsa | 1 - 100.000 | FLAT | Rp 2.000 | Pulsa kecil |
| Topup Pulsa | 100.001 - 500.000 | FLAT | Rp 3.000 | Pulsa besar |
| Topup Data | 1 - 200.000 | FLAT | Rp 2.000 | Paket data |
| Topup E-Wallet | 1 - 1.000.000 | FLAT | Rp 2.500 | E-wallet |
| Topup E-Wallet | 1.000.001 - 5.000.000 | PERCENT | 0.5% | E-wallet besar |
| PLN | 1 - 500.000 | FLAT | Rp 3.000 | Token PLN kecil |
| PLN | 500.001 - 5.000.000 | FLAT | Rp 5.000 | Token PLN besar |

### 2.3 Rules Matching Logic

```typescript
function findMatchingFee(shopId: string, category: BrilinkCategory, amount: number): BrilinkFee | null {
  // 1. Cari semua fee rules aktif untuk kategori ini
  const rules = await prisma.brilinkFee.findMany({
    where: { shopId, category, isActive: true },
    orderBy: { minAmount: 'asc' },
  });

  // 2. Cari rule yang cocok range-nya
  const match = rules.find(r => amount >= r.minAmount && amount <= r.maxAmount);

  return match || null;
  // Jika null → fee = 0 (tidak ada rule cocok)
}

function calculateFee(rule: BrilinkFee, amount: number): number {
  if (rule.feeType === 'FLAT') {
    return rule.feeAmount;
  } else {
    // PERCENT
    return Math.round((amount * rule.feePercent) / 100);
  }
}
```

---

## 3. Spesifikasi UI

### 3.1 Layout Halaman

```
┌──────────────────────────────────────────────────────────────────┐
│ [Header] Pengaturan Fee BRILink                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──── INFO BAR ──────────────────────────────────────────────┐   │
│ │ Total Rules: 14 aktif, 2 nonaktif                          │   │
│ │ Kategori tanpa fee: TOPUP_DATA ⚠️                          │   │
│ │                                                            │   │
│ │ [+ Tambah Fee Rule]  [📱 Preview Calculator]              │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──── ACCORDION PER KATEGORI ────────────────────────────────┐   │
│ │                                                            │   │
│ │ ▼ 🔵 TRANSFER BRI (3 rules)                              │   │
│ │ ┌──────────────────────────────────────────────────────┐   │   │
│ │ │ Label         │ Range           │ Tipe   │ Fee      │   │   │
│ │ │───────────────│─────────────────│────────│──────────│   │   │
│ │ │ s/d 5jt       │ 1 - 5.000.000   │ FLAT   │ Rp 5.000│   │   │
│ │ │ 5-25jt        │ 5jt - 25jt      │ FLAT   │ Rp 10rb │   │   │
│ │ │ 25-100jt      │ 25jt - 100jt    │ FLAT   │ Rp 15rb │   │   │
│ │ │                                  [Edit] [🗑️]        │   │   │
│ │ └──────────────────────────────────────────────────────┘   │   │
│ │                                                            │   │
│ │ ▼ 🟣 TRANSFER BANK LAIN (2 rules)                        │   │
│ │ ┌──────────────────────────────────────────────────────┐   │   │
│ │ │ ...                                                  │   │   │
│ │ └──────────────────────────────────────────────────────┘   │   │
│ │                                                            │   │
│ │ ▶ 🟢 TARIK TUNAI (2 rules)                               │   │
│ │ ▶ 🟠 TOPUP PULSA (2 rules)                               │   │
│ │ ▶ 🟡 TOPUP DATA (0 rules) ⚠️                             │   │
│ │ ▶ 🩷 TOPUP E-WALLET (2 rules)                            │   │
│ │ ▶ 🟡 TOPUP PLN (2 rules)                                 │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Info Bar

| Element | Deskripsi |
|---------|-----------|
| **Total Rules** | "X aktif, Y nonaktif" — quick count |
| **Warning** | List kategori yang belum punya fee rule aktif |
| **Button Tambah** | Buka modal create fee rule |
| **Preview Calculator** | Buka modal simulasi fee |

### 3.3 Accordion per Kategori

- 7 accordion section (1 per kategori BRILink)
- Masing-masing menampilkan tabel fee rules untuk kategori tsb
- Badge count rules di header accordion
- Warning icon jika kategori belum punya rule aktif
- Expand/collapse semua via keyboard shortcut

**Per Row dalam Accordion:**

| Kolom | Deskripsi |
|-------|-----------|
| **Label** | Nama deskriptif rule |
| **Range** | minAmount - maxAmount (formatted) |
| **Tipe** | Badge: FLAT (biru) / PERCENT (ungu) |
| **Fee** | "Rp X.XXX" atau "X.X%" |
| **Status** | Toggle switch aktif/nonaktif |
| **Actions** | Edit, Delete |

### 3.4 Form Tambah/Edit Fee Rule

**Modal Form:**

```
┌──────────────────────────────────────────┐
│ Tambah Fee Rule                          │
├──────────────────────────────────────────┤
│                                          │
│ Kategori*:    [Transfer BRI         ▼]  │
│                                          │
│ Label*:       [Transfer BRI s/d 5jt   ]  │
│                                          │
│ ─── RANGE NOMINAL ───                    │
│ Minimal*:     [Rp 1              ]      │
│ Maksimal*:    [Rp 5.000.000      ]      │
│                                          │
│ ─── TIPE FEE ───                         │
│ Tipe*:        (●) Flat  ( ) Persen       │
│                                          │
│ [Jika FLAT:]                             │
│ Fee Amount*:  [Rp 5.000          ]      │
│                                          │
│ [Jika PERCENT:]                          │
│ Fee Percent*: [0.5] %                    │
│ Min Fee:      [Rp 2.000] (optional)     │
│ Max Fee:      [Rp 50.000] (optional)    │
│                                          │
│ ─── PREVIEW ───                          │
│ Nominal Rp 500.000 → Fee Rp 5.000      │
│ Nominal Rp 2.000.000 → Fee Rp 5.000    │
│ Nominal Rp 4.999.000 → Fee Rp 5.000    │
│                                          │
│ Status:       [✓] Aktif                  │
│                                          │
│ [Batal]  [Simpan]                        │
└──────────────────────────────────────────┘
```

**Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `category` | Select | ✅ | 1 dari 7 enum |
| `label` | String | ✅ | Min 3 chars, max 100 |
| `minAmount` | Integer | ✅ | >= 0 |
| `maxAmount` | Integer | ✅ | > minAmount |
| `feeType` | Radio | ✅ | FLAT atau PERCENT |
| `feeAmount` | Integer | ✅ (if FLAT) | >= 0 |
| `feePercent` | Float | ✅ (if PERCENT) | > 0, max 100 |
| `isActive` | Toggle | - | Default true |

**Validasi Khusus:**
- **Overlap check**: Tidak boleh ada 2 rule aktif dengan range yang overlap pada kategori yang sama
  - Contoh invalid: Rule A (1-5jt) + Rule B (3-10jt) pada TRANSFER_BRI → overlap di 3-5jt
  - System tampilkan error: "Range overlap dengan rule [label]"
- **Gap warning** (non-blocking): Jika ada "lubang" di range, tampilkan warning
  - Contoh: Rule (1-5jt) + Rule (10-25jt) → gap di 5jt-10jt
  - Warning: "Nominal 5.000.001 - 9.999.999 belum ada fee rule"

### 3.5 Preview Calculator

**Modal:**

```
┌──────────────────────────────────────────┐
│ 📱 Preview Calculator Fee                │
├──────────────────────────────────────────┤
│                                          │
│ Kategori:  [Transfer BRI         ▼]    │
│ Nominal:   [Rp 2.500.000          ]    │
│                                          │
│ ─── HASIL ───                            │
│                                          │
│ Rule Match: "Transfer BRI s/d 5jt"      │
│ Tipe:       FLAT                         │
│ Fee:        Rp 5.000                    │
│ Total:      Rp 2.505.000               │
│                                          │
│ ─── SEMUA RULES KATEGORI INI ───        │
│                                          │
│ │ Range       │ Fee     │ Match? │       │
│ │─────────────│─────────│────────│       │
│ │ 1 - 5jt     │ Rp 5rb  │ ✅     │       │
│ │ 5jt - 25jt  │ Rp 10rb │        │       │
│ │ 25jt - 100jt│ Rp 15rb │        │       │
│                                          │
│ [Tutup]                                  │
└──────────────────────────────────────────┘
```

**Fitur:**
- Real-time calculation saat nominal diketik
- Highlight rule yang match
- Jika tidak ada rule match → tampil "⚠️ Tidak ada fee rule untuk nominal ini. Fee = Rp 0"
- Bisa ganti kategori dan nominal tanpa close modal

### 3.6 Bulk Actions

Di header setiap accordion section:

```
▼ 🔵 TRANSFER BRI (3 rules)  [+ Tambah] [Nonaktifkan Semua] [Aktifkan Semua]
```

- **Tambah**: Pre-fill kategori di form
- **Nonaktifkan Semua**: Set semua rules di kategori ini → isActive = false
- **Aktifkan Semua**: Set semua rules di kategori ini → isActive = true

### 3.7 Import/Export Rules

**Bottom section:**

```
┌──── IMPORT / EXPORT ─────────────────────────────┐
│                                                  │
│ [📥 Export Rules (JSON)]  [📤 Import Rules]     │
│                                                  │
│ Export: Download JSON semua fee rules toko ini   │
│ Import: Upload JSON untuk replace atau merge     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Use case:** Admin punya 2 cabang, mau clone fee rules dari cabang A ke cabang B.

**Import Options:**
- **Replace All**: Hapus semua existing, ganti dengan import
- **Merge**: Tambahkan rules baru, skip yang sudah ada (match by category + range)

---

## 4. Template Fee (Quick Start)

### 4.1 Untuk Toko Baru

Saat toko pertama kali setup BRILink, tampilkan wizard:

```
┌──────────────────────────────────────────┐
│ 🎯 Setup Fee BRILink                     │
├──────────────────────────────────────────┤
│                                          │
│ Pilih template fee sebagai starting point:│
│                                          │
│ ┌─────────────────────────────────────┐  │
│ │ 📋 Template Standar BRILink         │  │
│ │ Fee umum agen BRILink rata-rata     │  │
│ │ Transfer: Rp 5-15rb, Tarik: 10-15rb │  │
│ │ [Gunakan Template Ini]              │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ ┌─────────────────────────────────────┐  │
│ │ 📋 Template Premium                 │  │
│ │ Fee lebih tinggi untuk profit max   │  │
│ │ Transfer: Rp 7-20rb, Tarik: 15-25rb │  │
│ │ [Gunakan Template Ini]              │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ ┌─────────────────────────────────────┐  │
│ │ 📋 Template Ekonomis               │  │
│ │ Fee rendah untuk volume tinggi      │  │
│ │ Transfer: Rp 3-10rb, Tarik: 5-10rb  │  │
│ │ [Gunakan Template Ini]              │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ [Skip — Setup Manual]                    │
└──────────────────────────────────────────┘
```

### 4.2 Template Data (Standar)

```json
{
  "name": "Standar BRILink",
  "rules": [
    { "category": "TRANSFER_BRI", "label": "Transfer BRI s/d 5jt", "minAmount": 1, "maxAmount": 5000000, "feeType": "FLAT", "feeAmount": 5000 },
    { "category": "TRANSFER_BRI", "label": "Transfer BRI 5-25jt", "minAmount": 5000001, "maxAmount": 25000000, "feeType": "FLAT", "feeAmount": 10000 },
    { "category": "TRANSFER_BRI", "label": "Transfer BRI 25-100jt", "minAmount": 25000001, "maxAmount": 100000000, "feeType": "FLAT", "feeAmount": 15000 },
    { "category": "TRANSFER_OTHER", "label": "Transfer lain s/d 10jt", "minAmount": 1, "maxAmount": 10000000, "feeType": "FLAT", "feeAmount": 10000 },
    { "category": "TRANSFER_OTHER", "label": "Transfer lain 10-50jt", "minAmount": 10000001, "maxAmount": 50000000, "feeType": "FLAT", "feeAmount": 15000 },
    { "category": "TARIK_TUNAI", "label": "Tarik tunai s/d 5jt", "minAmount": 1, "maxAmount": 5000000, "feeType": "FLAT", "feeAmount": 10000 },
    { "category": "TARIK_TUNAI", "label": "Tarik tunai 5-20jt", "minAmount": 5000001, "maxAmount": 20000000, "feeType": "FLAT", "feeAmount": 15000 },
    { "category": "TOPUP_PULSA", "label": "Pulsa s/d 100rb", "minAmount": 1, "maxAmount": 100000, "feeType": "FLAT", "feeAmount": 2000 },
    { "category": "TOPUP_PULSA", "label": "Pulsa 100rb+", "minAmount": 100001, "maxAmount": 1000000, "feeType": "FLAT", "feeAmount": 3000 },
    { "category": "TOPUP_DATA", "label": "Paket data", "minAmount": 1, "maxAmount": 500000, "feeType": "FLAT", "feeAmount": 2000 },
    { "category": "TOPUP_EWALLET", "label": "E-wallet s/d 1jt", "minAmount": 1, "maxAmount": 1000000, "feeType": "FLAT", "feeAmount": 2500 },
    { "category": "TOPUP_EWALLET", "label": "E-wallet 1-5jt", "minAmount": 1000001, "maxAmount": 5000000, "feeType": "FLAT", "feeAmount": 5000 },
    { "category": "TOPUP_PLN", "label": "PLN s/d 500rb", "minAmount": 1, "maxAmount": 500000, "feeType": "FLAT", "feeAmount": 3000 },
    { "category": "TOPUP_PLN", "label": "PLN 500rb+", "minAmount": 500001, "maxAmount": 5000000, "feeType": "FLAT", "feeAmount": 5000 }
  ]
}
```

---

## 5. API Endpoints

### 5.1 Fee Rules CRUD

```
GET  /api/brilink/fees
     Query: shopId, category?, isActive?
     Response: { 
       data: BrilinkFee[], 
       summary: { total, active, inactive, categoriesWithoutFee: string[] }
     }

POST /api/brilink/fees
     Body: { shopId, category, label, minAmount, maxAmount, feeType, feeAmount?, feePercent? }
     Response: BrilinkFee
     Validation: overlap check

PATCH /api/brilink/fees/:id
     Body: { label?, minAmount?, maxAmount?, feeType?, feeAmount?, feePercent?, isActive? }
     Response: BrilinkFee
     Validation: overlap check (exclude self)

DELETE /api/brilink/fees/:id
     Response: { success: true }

PATCH /api/brilink/fees/bulk-status
     Body: { shopId, category, isActive: boolean }
     Response: { updated: number }
     Note: Activate/deactivate all rules in a category
```

### 5.2 Preview & Calculate

```
POST /api/brilink/fees/calculate
     Body: { shopId, category, amount }
     Response: { 
       matched: boolean,
       rule: BrilinkFee | null,
       fee: number,
       total: number
     }

GET  /api/brilink/fees/coverage
     Query: shopId
     Response: {
       categories: {
         [category]: {
           rules: BrilinkFee[],
           gaps: { from: number, to: number }[],
           isComplete: boolean
         }
       }
     }
     Note: Analisis gap coverage per kategori
```

### 5.3 Import/Export

```
GET  /api/brilink/fees/export
     Query: shopId
     Response: { templateName, rules: BrilinkFee[] }
     Content-Type: application/json (download)

POST /api/brilink/fees/import
     Body: { shopId, mode: 'replace' | 'merge', rules: ImportRule[] }
     Response: { imported: number, skipped: number, errors: string[] }

POST /api/brilink/fees/apply-template
     Body: { shopId, templateId: 'standard' | 'premium' | 'economy' }
     Response: { created: number }
```

---

## 6. Data Model

### 6.1 Existing Model (Tidak Berubah)

```prisma
model BrilinkFee {
  id              String          @id @default(cuid())
  shop            Shop            @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId          String
  category        BrilinkCategory
  label           String          // "Transfer BRI 1-50jt", etc
  minAmount       Int             @default(0)
  maxAmount       Int             @default(999999999)
  feeType         BrilinkFeeType  @default(FLAT)
  feeAmount       Int             @default(0)    // flat fee (rupiah)
  feePercent      Float           @default(0)    // percent fee (e.g. 0.5 = 0.5%)
  isActive        Boolean         @default(true)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([shopId, category, isActive])
  @@map("brilink_fees")
}
```

**Catatan:** Model existing sudah cukup. Tidak perlu tambahan field untuk PRD ini.

### 6.2 Template Storage

Templates disimpan sebagai **JSON statis** di backend (bukan di database). Alasan:
- Tidak berubah per user
- Bisa di-version control
- Simple maintenance

```
backend/src/brilink/templates/
├── standard.json
├── premium.json
└── economy.json
```

---

## 7. Business Rules

### 7.1 Overlap Prevention

```typescript
async function validateNoOverlap(
  shopId: string, 
  category: BrilinkCategory, 
  minAmount: number, 
  maxAmount: number, 
  excludeId?: string
): Promise<{ valid: boolean; conflictRule?: BrilinkFee }> {
  
  const existingRules = await prisma.brilinkFee.findMany({
    where: {
      shopId,
      category,
      isActive: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  for (const rule of existingRules) {
    // Overlap jika: newMin <= existingMax AND newMax >= existingMin
    if (minAmount <= rule.maxAmount && maxAmount >= rule.minAmount) {
      return { valid: false, conflictRule: rule };
    }
  }

  return { valid: true };
}
```

### 7.2 Gap Detection

```typescript
function detectGaps(rules: BrilinkFee[]): { from: number; to: number }[] {
  const sorted = rules.filter(r => r.isActive).sort((a, b) => a.minAmount - b.minAmount);
  const gaps: { from: number; to: number }[] = [];

  // Check gap dari 0 ke first rule
  if (sorted.length > 0 && sorted[0].minAmount > 1) {
    gaps.push({ from: 1, to: sorted[0].minAmount - 1 });
  }

  // Check gaps between rules
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentMax = sorted[i].maxAmount;
    const nextMin = sorted[i + 1].minAmount;
    if (nextMin > currentMax + 1) {
      gaps.push({ from: currentMax + 1, to: nextMin - 1 });
    }
  }

  return gaps;
}
```

### 7.3 Fee Calculation Priority

1. Cari rules aktif yang match category + range
2. Jika >1 match (seharusnya tidak terjadi karena overlap prevention) → ambil yang paling spesifik (range terkecil)
3. Jika 0 match → fee = 0, return warning ke client
4. Calculate fee berdasarkan type (FLAT/PERCENT)

### 7.4 Delete Protection

- Saat delete fee rule, **tidak** mempengaruhi transaksi yang sudah tercatat (fee sudah di-copy ke transaksi saat dibuat)
- Soft consideration: tampilkan warning "X transaksi hari ini menggunakan rule ini" sebelum delete

---

## 8. UX Details

### 8.1 Inline Edit

Di tabel per kategori, admin bisa klik langsung pada:
- **Fee Amount/Percent** → inline edit angka
- **Status Toggle** → switch on/off langsung

Perubahan auto-save setelah 500ms debounce (atau on blur).

### 8.2 Drag & Drop Reorder

Rules dalam satu kategori bisa di-drag untuk reorder display (urutan tampil di UI kasir). Disimpan sebagai field `sortOrder` (future enhancement, tidak blocking MVP).

### 8.3 Mobile Responsive

- Accordion tetap accordion di mobile
- Tabel jadi card-based di viewport kecil
- Modal form full-screen di mobile
- Preview calculator sebagai bottom sheet

### 8.4 Color Coding

Fee rules menggunakan warna yang sama dengan badge kategori:

| Kategori | Warna Accent |
|----------|-------------|
| TRANSFER_BRI | Blue-500 |
| TRANSFER_OTHER | Indigo-500 |
| TARIK_TUNAI | Green-500 |
| TOPUP_PULSA | Orange-500 |
| TOPUP_DATA | Purple-500 |
| TOPUP_EWALLET | Pink-500 |
| TOPUP_PLN | Yellow-500 |

---

## 9. Notifikasi & Alerts

### 9.1 Warning di Dashboard BRILink

Jika ada kategori tanpa fee rule aktif → tampil di alert dashboard:
```
⚠️ Kategori TOPUP_DATA belum ada fee rule aktif. Transaksi topup data akan dikenakan fee Rp 0.
```

### 9.2 Warning di Webapp Kasir

Saat kasir input transaksi dan fee = 0 karena tidak ada rule:
```
ℹ️ Tidak ada aturan fee untuk kategori ini. Fee = Rp 0. Lanjutkan?
```

---

## 10. Acceptance Criteria

### Functional
- [ ] Admin bisa lihat semua fee rules terorganisir per kategori (accordion)
- [ ] Admin bisa tambah fee rule baru dengan validasi overlap
- [ ] Admin bisa edit fee rule (label, range, tipe, amount)
- [ ] Admin bisa delete fee rule
- [ ] Admin bisa activate/deactivate fee rule via toggle
- [ ] Admin bisa bulk activate/deactivate per kategori
- [ ] Preview calculator menghitung fee realtime
- [ ] Warning tampil untuk kategori tanpa fee rule
- [ ] Gap detection tampil sebagai info/warning
- [ ] Overlap check mencegah rule konflik
- [ ] Import/Export JSON berfungsi
- [ ] Template fee bisa di-apply untuk quick start
- [ ] Fee calculation benar saat transaksi dibuat (FLAT & PERCENT)

### Non-Functional
- [ ] List rules load < 300ms
- [ ] Fee calculation < 50ms (dipakai saat input transaksi)
- [ ] Support 50+ rules per shop tanpa degradasi
- [ ] Form validation responsive (< 100ms feedback)

---

## 11. Dependencies

- **Existing**: Model BrilinkFee sudah ada (lengkap)
- **Existing**: API CRUD fee sudah ada di `/brilink/fees`
- **Enhancement**: Tambah overlap validation, gap detection, templates, preview calculator
- **Integration**: Fee auto-applied saat createTransaction (sudah ada, perlu refinement)

---

## 12. Migration from Existing

Service existing (`BrilinkService.createFee/updateFee/deleteFee/listFees`) sudah mencakup CRUD dasar. Enhancement yang perlu:

1. Tambah overlap validation di create & update
2. Tambah endpoint `/fees/calculate` untuk preview
3. Tambah endpoint `/fees/coverage` untuk gap analysis
4. Tambah endpoint `/fees/bulk-status` untuk bulk activate/deactivate
5. Tambah endpoint `/fees/export` dan `/fees/import`
6. Tambah endpoint `/fees/apply-template`
7. Tambah template JSON files
