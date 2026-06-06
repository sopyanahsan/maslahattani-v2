# PRD BRILink — Metode Kas (Produk & Layanan BRILink)

**Status**: Draft
**Updated**: Juni 2026
**Owner**: Sopyan Ahsan
**Module**: Admin Panel > BRILink > Kas & Rekening > Tab Metode Kas

---

## 1. Konteks & Tujuan

### Background

Agen BRILink melayani berbagai jenis transaksi: transfer, tarik tunai, pulsa, paket data, e-wallet, dan PLN. Setiap layanan punya **produk** dengan harga beli (dari BRI) dan harga jual (ke nasabah). Admin perlu bisa:
- Mengaktifkan/menonaktifkan kategori layanan per toko
- Mengelola daftar produk (pulsa, data) per operator
- Auto-detect operator dari prefix nomor HP
- Menyediakan daftar bank untuk transfer antar bank
- Mencatat harga sistem vs harga jual (profit)

### Goals

1. **Auto-detect Operator** — Kasir ketik nomor → otomatis tahu ini Telkomsel/XL/Indosat/dll
2. **Produk per Operator** — Daftar pulsa & paket data per operator dengan harga beli/jual
3. **Daftar Bank** — 140+ bank Indonesia untuk transfer antar bank
4. **E-Wallet Provider** — GoPay, OVO, Dana, ShopeePay, LinkAja
5. **Nominal PLN** — Preset token listrik (20rb-1jt)
6. **On/Off per Kategori** — Admin bisa nonaktifkan layanan yang nggak dilayani
7. **Pencatatan Profit** — Harga sistem vs harga jual = profit per transaksi

---

## 2. Arsitektur Data

### 2.1 Model Database

```
┌─────────────────────────────────────────────────────────┐
│ operator_prefixes                                       │
│ - prefix (0811, 0812, dst)                             │
│ - operator (TELKOMSEL, XL, INDOSAT, THREE, SMARTFREN)  │
│ - type (GSM)                                           │
├─────────────────────────────────────────────────────────┤
│ brilink_products                                        │
│ - shopId (per toko, bisa beda harga)                   │
│ - category (TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET,   │
│             TOPUP_PLN)                                  │
│ - operator (TELKOMSEL, XL, dll — null untuk PLN)       │
│ - provider (GOPAY, OVO, dll — null untuk pulsa/PLN)    │
│ - name ("Pulsa 10rb", "XL 3GB 30hr", "Token 50rb")    │
│ - nominal (10000, 50000, dll)                          │
│ - buyPrice (harga beli dari BRI/supplier)              │
│ - sellPrice (harga jual ke nasabah)                    │
│ - isActive (on/off)                                    │
│ - sortOrder                                            │
├─────────────────────────────────────────────────────────┤
│ bank_list                                               │
│ - code (014, 008, 009, dll — kode BI)                  │
│ - name (Bank Central Asia)                             │
│ - shortName (BCA)                                      │
│ - isActive                                             │
├─────────────────────────────────────────────────────────┤
│ ewallet_providers                                       │
│ - code (GOPAY, OVO, DANA, SHOPEEPAY, LINKAJA)          │
│ - name (GoPay, OVO, Dana, ShopeePay, LinkAja)          │
│ - icon (optional)                                      │
│ - isActive                                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Operator Prefix Mapping

| Prefix | Operator |
|--------|----------|
| 0811, 0812, 0813, 0821, 0822, 0823, 0851, 0852, 0853 | TELKOMSEL |
| 0814, 0815, 0816, 0855, 0856, 0857, 0858 | INDOSAT |
| 0817, 0818, 0819, 0859, 0877, 0878 | XL |
| 0831, 0832, 0833, 0834, 0838 | AXIS |
| 0895, 0896, 0897, 0898, 0899 | THREE |
| 0881, 0882, 0883, 0884, 0885, 0886, 0887, 0888, 0889 | SMARTFREN |

### 2.3 Bank List (Top 20 + sisanya)

| Code | Short | Name |
|------|-------|------|
| 002 | BRI | Bank Rakyat Indonesia |
| 008 | MANDIRI | Bank Mandiri |
| 009 | BNI | Bank Negara Indonesia |
| 014 | BCA | Bank Central Asia |
| 427 | BSI | Bank Syariah Indonesia |
| 022 | CIMB | CIMB Niaga |
| 013 | PERMATA | Bank Permata |
| 011 | DANAMON | Bank Danamon |
| 016 | MAYBANK | Maybank Indonesia |
| 028 | OCBC | OCBC NISP |
| 019 | PANIN | Panin Bank |
| 023 | UOB | UOB Indonesia |
| 426 | MEGA | Bank Mega |
| 200 | BTN | Bank Tabungan Negara |
| 213 | BTPN | BTPN |
| 547 | BTPN_SYARIAH | BTPN Syariah |
| 451 | BSM | Bank Syariah Mandiri |
| 503 | NTB_SYARIAH | Bank NTB Syariah |
| 110 | JABAR | BJB |
| 111 | DKI | Bank DKI |
| ... | ... | (140+ bank lainnya) |

### 2.4 E-Wallet Providers

| Code | Name | Prefix (opsional) |
|------|------|----------|
| GOPAY | GoPay | 0812-0813, 0821-0823 (Telkomsel) |
| OVO | OVO | any |
| DANA | Dana | any |
| SHOPEEPAY | ShopeePay | any |
| LINKAJA | LinkAja | any |

### 2.5 PLN Nominal Preset

| Nominal | Harga Beli (typical) | Harga Jual |
|---------|---------------------|-----------|
| 20.000 | 20.000 | 22.000 |
| 50.000 | 50.000 | 52.000 |
| 100.000 | 100.000 | 102.500 |
| 200.000 | 200.000 | 202.500 |
| 500.000 | 500.000 | 503.000 |
| 1.000.000 | 1.000.000 | 1.003.000 |

---

## 3. Flow di Webapp Kasir (Nanti)

### 3.1 Pulsa

```
1. Kasir pilih kategori "Pulsa"
2. Input nomor HP → auto-detect operator (XL)
3. Tampil list produk pulsa XL yang aktif:
   - Pulsa 5rb  (jual: Rp 6.500)
   - Pulsa 10rb (jual: Rp 11.500)
   - Pulsa 25rb (jual: Rp 26.500)
   - Pulsa 50rb (jual: Rp 51.000)
   - Pulsa 100rb (jual: Rp 101.000)
4. Kasir pilih nominal → total otomatis
5. Konfirmasi → catat transaksi + fee
```

### 3.2 Paket Data

```
1. Kasir pilih "Paket Data"
2. Input nomor → auto-detect (Telkomsel)
3. Tampil list paket data Telkomsel:
   - 1GB 30hr (jual: Rp 15.000)
   - 3GB 30hr (jual: Rp 30.000)
   - 6GB 30hr (jual: Rp 50.000)
   - Unlimited 30hr (jual: Rp 75.000)
4. Pilih → konfirmasi → catat
```

### 3.3 Transfer Bank Lain

```
1. Kasir pilih "Transfer Bank Lain"
2. Pilih bank tujuan: [search/dropdown 140+ bank]
3. Input no rekening
4. Input nama penerima (manual, dari EDC)
5. Input nominal
6. Fee otomatis dari fee rules
7. Konfirmasi → catat
```

### 3.4 E-Wallet

```
1. Kasir pilih "E-Wallet"
2. Pilih platform: GoPay / OVO / Dana / dll
3. Input nomor HP
4. Input nominal top-up
5. Fee otomatis
6. Konfirmasi → catat
```

### 3.5 PLN

```
1. Kasir pilih "Token PLN"
2. Input no meter / ID pelanggan
3. Pilih nominal token dari preset
4. Harga + fee otomatis
5. Konfirmasi → catat
```

---

## 4. Admin Panel — Tab "Metode Kas"

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Kas & Rekening BRILink                                       │
│ [Rekening BRI] [Mutasi] [Reconciliation] [Metode Kas]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── SUB-TAB ───────────────────────────────────────────┐   │
│ │ [Kategori] [Produk Pulsa/Data] [Daftar Bank] [E-Wallet]│   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ (content per sub-tab di bawah)                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Sub-tab: Kategori (On/Off per layanan)

```
┌────────────────────────────────────────────────────────┐
│ Kategori Layanan BRILink              [Simpan Semua]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ # │ Kategori        │ Nama Tampilan  │ Aktif │ Urutan  │
│───│─────────────────│────────────────│───────│─────────│
│ 1 │ TRANSFER_BRI    │ Transfer BRI   │ [✓]   │ [↑][↓] │
│ 2 │ TRANSFER_OTHER  │ Transfer Lain  │ [✓]   │ [↑][↓] │
│ 3 │ TARIK_TUNAI     │ Tarik Tunai    │ [✓]   │ [↑][↓] │
│ 4 │ TOPUP_PULSA     │ Pulsa          │ [✓]   │ [↑][↓] │
│ 5 │ TOPUP_DATA      │ Paket Data     │ [ ]   │ [↑][↓] │
│ 6 │ TOPUP_EWALLET   │ E-Wallet       │ [✓]   │ [↑][↓] │
│ 7 │ TOPUP_PLN       │ Token PLN      │ [✓]   │ [↑][↓] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.3 Sub-tab: Produk Pulsa & Data

```
┌────────────────────────────────────────────────────────┐
│ Produk Pulsa & Paket Data             [+ Tambah]       │
│                                                        │
│ Filter: [Operator ▼] [Tipe ▼: Pulsa/Data]             │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ▼ TELKOMSEL (12 produk)                                │
│ │ Nama          │ Nominal │ Harga Beli │ Harga Jual │  │
│ │───────────────│─────────│────────────│────────────│  │
│ │ Pulsa 5rb     │ 5.000   │ 5.200      │ 6.500     │  │
│ │ Pulsa 10rb    │ 10.000  │ 10.200     │ 11.500    │  │
│ │ Data 1GB 30hr │ —       │ 12.000     │ 15.000    │  │
│ │ Data 3GB 30hr │ —       │ 25.000     │ 30.000    │  │
│                                                        │
│ ▶ XL (8 produk)                                        │
│ ▶ INDOSAT (10 produk)                                  │
│ ▶ THREE (6 produk)                                     │
│ ▶ AXIS (5 produk)                                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.4 Sub-tab: Daftar Bank

```
┌────────────────────────────────────────────────────────┐
│ Daftar Bank Transfer          [🔍 Cari bank...]        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ │ Kode │ Nama Bank              │ Singkatan │ Aktif │  │
│ │──────│────────────────────────│───────────│───────│  │
│ │ 002  │ Bank Rakyat Indonesia  │ BRI       │ [✓]   │  │
│ │ 014  │ Bank Central Asia      │ BCA       │ [✓]   │  │
│ │ 008  │ Bank Mandiri           │ MANDIRI   │ [✓]   │  │
│ │ 009  │ Bank Negara Indonesia  │ BNI       │ [✓]   │  │
│ │ 427  │ Bank Syariah Indonesia │ BSI       │ [✓]   │  │
│ │ ...  │ ...                    │ ...       │ [✓]   │  │
│                                                        │
│ Total: 142 bank (140 aktif, 2 nonaktif)                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.5 Sub-tab: E-Wallet & PLN

```
┌────────────────────────────────────────────────────────┐
│ E-Wallet Providers                                     │
├────────────────────────────────────────────────────────┤
│ │ Provider   │ Nama       │ Aktif │                    │
│ │────────────│────────────│───────│                    │
│ │ GOPAY      │ GoPay      │ [✓]   │                    │
│ │ OVO        │ OVO        │ [✓]   │                    │
│ │ DANA       │ Dana       │ [✓]   │                    │
│ │ SHOPEEPAY  │ ShopeePay  │ [✓]   │                    │
│ │ LINKAJA    │ LinkAja    │ [ ]   │                    │
├────────────────────────────────────────────────────────┤
│ Nominal PLN Preset                    [+ Tambah]       │
├────────────────────────────────────────────────────────┤
│ │ Nominal   │ Harga Beli │ Harga Jual │ Aktif │       │
│ │───────────│────────────│────────────│───────│       │
│ │ 20.000    │ 20.000     │ 22.000     │ [✓]   │       │
│ │ 50.000    │ 50.000     │ 52.000     │ [✓]   │       │
│ │ 100.000   │ 100.000    │ 102.500    │ [✓]   │       │
│ │ 200.000   │ 200.000    │ 202.500    │ [✓]   │       │
│ │ 500.000   │ 500.000    │ 503.000    │ [✓]   │       │
│ │ 1.000.000 │ 1.000.000  │ 1.003.000  │ [✓]   │       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoints

### 5.1 Operator Prefix (Read-only, seeded)

```
GET  /api/brilink/operators/detect?phone=08781234567
     Response: { operator: "XL", prefix: "0878" }

GET  /api/brilink/operators
     Response: [{ prefix: "0811", operator: "TELKOMSEL" }, ...]
```

### 5.2 Produk BRILink (CRUD per shop)

```
GET  /api/brilink/products
     Query: shopId, category?, operator?, provider?, isActive?
     Response: { data: BrilinkProduct[], meta }

POST /api/brilink/products
     Body: { shopId, category, operator?, provider?, name, nominal?,
             buyPrice, sellPrice, isActive?, sortOrder? }

PATCH /api/brilink/products/:id
     Body: { name?, buyPrice?, sellPrice?, isActive?, sortOrder? }

DELETE /api/brilink/products/:id

POST /api/brilink/products/seed
     Body: { shopId, template: "standard" }
     Note: Seed produk default per operator (admin pertama setup)
```

### 5.3 Daftar Bank (Global, seeded)

```
GET  /api/brilink/banks
     Query: search?, isActive?
     Response: BankItem[]

PATCH /api/brilink/banks/:id/toggle
     Body: { isActive: boolean }
```

### 5.4 E-Wallet Providers (Global, seeded)

```
GET  /api/brilink/ewallet-providers
     Response: EwalletProvider[]

PATCH /api/brilink/ewallet-providers/:id/toggle
     Body: { isActive: boolean }
```

---

## 6. Prisma Schema

```prisma
model OperatorPrefix {
  id        String  @id @default(cuid())
  prefix    String  @unique  // "0811", "0878", etc
  operator  String  // TELKOMSEL, XL, INDOSAT, THREE, AXIS, SMARTFREN
  type      String  @default("GSM")

  @@index([prefix])
  @@map("operator_prefixes")
}

model BrilinkProduct {
  id        String   @id @default(cuid())
  shop      Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId    String
  category  String   // TOPUP_PULSA, TOPUP_DATA, TOPUP_EWALLET, TOPUP_PLN
  operator  String?  // TELKOMSEL, XL, etc (null for PLN/EWALLET)
  provider  String?  // GOPAY, OVO, etc (null for pulsa/PLN)
  name      String   // "Pulsa 10rb", "XL 3GB 30hr", "Token 50rb"
  nominal   Int?     // 10000, 50000 (null for paket data custom)
  buyPrice  Int      // harga beli dari BRI/supplier
  sellPrice Int      // harga jual ke nasabah
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([shopId, category, operator])
  @@index([shopId, category, provider])
  @@map("brilink_products")
}

model BankList {
  id        String  @id @default(cuid())
  code      String  @unique  // kode BI: "014", "008"
  name      String  // "Bank Central Asia"
  shortName String  // "BCA"
  isActive  Boolean @default(true)

  @@index([isActive])
  @@map("bank_list")
}

model EwalletProvider {
  id        String  @id @default(cuid())
  code      String  @unique  // "GOPAY", "OVO"
  name      String  // "GoPay"
  icon      String? // optional icon/emoji
  isActive  Boolean @default(true)

  @@map("ewallet_providers")
}
```

---

## 7. Seed Data

### 7.1 Operator Prefix (57 entries)

Semua prefix Indonesia yang valid. Di-seed saat pertama kali deploy.

### 7.2 Bank List (140+ entries)

Seluruh bank yang terdaftar di BI. Di-seed sekali.

### 7.3 E-Wallet (5 entries)

GoPay, OVO, Dana, ShopeePay, LinkAja.

### 7.4 Default Products (per shop, template "standard")

Admin bisa seed produk default saat setup toko. Nanti bisa diedit harga beli/jual sesuai kesepakatan dengan BRI.

---

## 8. Business Rules

1. **Prefix detection** berjalan di frontend (instant, tanpa hit API) — mapping di-cache saat app load
2. **Produk per shop** — setiap toko bisa punya harga beli/jual berbeda
3. **Profit** = sellPrice - buyPrice (ditampilkan di admin)
4. **Fee rules tetap berlaku** — fee dari Pengaturan Fee BRILink ditambahkan di atas sellPrice
5. **Bank list global** — sama untuk semua toko, tapi bisa di-toggle on/off
6. **E-wallet global** — sama untuk semua toko

---

## 9. Acceptance Criteria

- [ ] Auto-detect operator dari prefix nomor HP (< 50ms, lokal)
- [ ] Admin bisa CRUD produk pulsa/data per operator per toko
- [ ] Admin bisa toggle on/off bank dari daftar
- [ ] Admin bisa toggle on/off e-wallet provider
- [ ] Admin bisa CRUD nominal PLN
- [ ] Seed data: 57 prefix, 140+ bank, 5 e-wallet
- [ ] Template produk bisa di-apply saat setup toko baru
- [ ] Webapp kasir hanya tampilkan kategori/produk yang aktif
