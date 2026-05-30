# PRD — Ngalir: Sistem POS Modern untuk UMKM

**Brand**: Ngalir
**Tagline**: *Satu tap, semua beres.*
**Filosofi**: Rezeki ngalir, transaksi ngalir, operasional lancar.

**Status**: Draft v1.0
**Tanggal**: 29 Mei 2026
**Owner**: Sopyan Ahsan

---

## 1. Executive Summary

Ngalir adalah aplikasi kasir POS berbasis web yang dirancang untuk UMKM Indonesia — toko retail, warung, kedai kopi, dan agen BRILink. Aplikasi ini menggabungkan kemudahan penggunaan dengan fitur profesional: multi-kas, manajemen hutang, shift settlement, dan integrasi BRILink dalam satu platform.

**Target market**: Toko retail + agen BRILink seluruh Indonesia.
**Model bisnis**: SaaS (subscription bulanan per toko).

---

## 2. Perubahan dari Versi Sebelumnya (Maslahat Tani v2)

| Aspek | Sebelumnya | Ngalir (Baru) |
|-------|-----------|---------------|
| Nama brand | Maslahat Tani | **Ngalir** |
| Login kasir | Email + Password | **Username + PIN (4-6 digit)** |
| Bottom nav | 4 tab (Dashboard, Kasir, BRILink, Profil) | **5 tab (Beranda, BRILink, Kasir*, Laporan, Pengaturan)** |
| POS layout desktop | 1 kolom + floating cart | **2 kolom permanen (Kiri: Produk, Kanan: Keranjang)** |
| Cart panel | Modal full-screen | **Side panel permanen (desktop) / Bottom sheet (mobile)** |
| Payment flow | Langsung di cart modal | **Popup terpisah setelah klik "Bayar"** |
| Simpan Bill | Tidak ada | **Multiple bill (save & recall)** |
| Metode bayar "Hutang" | Manual | **Otomatis dari POS (full/partial)** |

---


## 3. Arsitektur Aplikasi

### 3.1 Platform & Stack (tidak berubah)
- **Frontend**: Vue 3 + Vite + Pinia + Tailwind CSS + Lucide Icons
- **Backend**: NestJS + Prisma + PostgreSQL
- **Auth**: JWT (Access + Refresh token)
- **Offline**: IndexedDB + auto-sync
- **Deploy**: Docker (backend), Static hosting/CDN (frontend)

### 3.2 Dua Bundle Terpisah
1. **Webapp Kasir** (`app.ngalir.id`) — digunakan oleh kasir/operator
2. **Admin Panel** (`admin.ngalir.id`) — digunakan oleh pemilik toko

---

## 4. Login Kasir — Username + PIN

### 4.1 Flow Login (Webapp Kasir)

```
┌─────────────────────────────┐
│          [Logo Ngalir]       │
│     "Satu tap, semua beres"  │
│                              │
│  ┌─────────────────────────┐ │
│  │  👤 Username             │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │  🔒 PIN (4-6 digit)  👁  │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │     → Masuk              │ │
│  └─────────────────────────┘ │
│                              │
│  Lupa PIN? Hubungi pemilik   │
│  toko untuk reset.           │
└─────────────────────────────┘
```

### 4.2 Perubahan Backend Auth

**Endpoint baru**: `POST /api/auth/login-pin`
```json
// Request
{
  "username": "soya",
  "pin": "1234"
}

// Response (success)
{
  "success": true,
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "...",
    "username": "soya",
    "role": "KASIR",
    "shopId": "...",
    "mustChangePassword": false
  },
  "shop": { "id": "...", "name": "Toko ABC", ... }
}
```

### 4.3 Perubahan Database Schema

```prisma
model User {
  // ... existing fields ...
  pin           String?    // bcrypt hash of 4-6 digit PIN
  pinChangedAt  DateTime?  // track kapan PIN terakhir diubah
}
```

### 4.4 Admin Panel: Manajemen User Kasir

Di admin panel (`/admin/users`), admin bisa:
- **Buat akun kasir** → input: nama, username, PIN awal
- **Reset PIN kasir** → generate PIN baru, kasir diminta ganti saat login
- **Nonaktifkan akun** → suspend user

PIN disimpan sebagai bcrypt hash (sama seperti password).

---


## 5. Bottom Navigation (Webapp Kasir)

### 5.1 Struktur 5 Tab

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Beranda │ BRILink │  🛒*    │ Laporan │Pengaturan│
│  🏠     │  🏦     │ Kasir   │   📊    │   ⚙️    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
                       ↑
              (FAB/raised, warna ungu)
```

*Kasir di tengah dengan tombol raised/floating (FAB style) — warna brand ungu/purple.

### 5.2 Mapping Route

| Tab | Route | Icon | Keterangan |
|-----|-------|------|------------|
| Beranda | `/dashboard` | Home | Dashboard overview |
| BRILink | `/brilink/menu` | Landmark | Menu 6 layanan BRILink |
| Kasir | `/retail/pos` | ShoppingCart (FAB) | POS halaman utama |
| Laporan | `/reports` | BarChart3 | Ringkasan laporan kasir |
| Pengaturan | `/settings` | Settings | Profil & pengaturan akun |

### 5.3 Halaman "Pengaturan" (Baru)

Isi halaman `/settings`:
- **Profil Akun**: Nama, alamat, no HP, foto profil
- **Shift**: Riwayat shift terakhir, shift sedang berjalan
- **Keamanan**: Ganti PIN (konfirmasi PIN lama → PIN baru)
- **Reset PIN**: Minta reset ke admin (kirim notifikasi ke admin panel)
- **Logout**

### 5.4 Halaman "Laporan" (Baru)

Isi halaman `/reports`:
- Ringkasan penjualan hari ini
- Grafik penjualan 7 hari terakhir
- Top 5 produk terlaris
- Breakdown per metode bayar

---

## 6. Kasir (POS) — Layout & Flow

### 6.1 Layout Desktop/Tablet (≥768px): 2 Kolom Permanen

```
┌────────────────────────────────────────────────────────────────────┐
│ 🛒 Kasir                                    [Open Bill]            │
├──────────────────────────────────┬─────────────────────────────────┤
│          KIRI (60%)               │         KANAN (40%)             │
│                                   │                                 │
│  ┌─ Search produk... ──────── 📷┐ │  🛒 Keranjang (3 item)         │
│  ┌─ Scan/ketik SKU... ─────────┐ │  ┌───────────────────────────┐ │
│                                   │  │ Ayam Bakar                │ │
│  [Semua] [Makanan] [Minuman]...  │  │ Rp 20.000 x 1             │ │
│                                   │  │ ✏ catatan  🏷 diskon      │ │
│  ┌─────┐ ┌─────┐ ┌─────┐        │  ├───────────────────────────┤ │
│  │prod1│ │prod2│ │prod3│        │  │ Mie Goreng                │ │
│  │     │ │     │ │     │        │  │ Rp 12.000 x 1             │ │
│  │Rp15k│ │Rp5k │ │Rp7k │        │  │ ✏ catatan  🏷 diskon      │ │
│  └─────┘ └─────┘ └─────┘        │  └───────────────────────────┘ │
│  ┌─────┐ ┌─────┐ ┌─────┐        │                                 │
│  │prod4│ │prod5│ │prod6│        │  👤 Nama pelanggan  # Meja     │
│  └─────┘ └─────┘ └─────┘        │  🏷 Tambah Diskon (total trx)  │
│                                   │                                 │
│                                   │  Subtotal        Rp 50.000     │
│                                   │  Diskon             - Rp 0     │
│                                   │  ─────────────────────────────  │
│                                   │  Total           Rp 50.000     │
│                                   │                                 │
│                                   │  [Simpan Bill]    [▶ Bayar]    │
└──────────────────────────────────┴─────────────────────────────────┘
```

### 6.2 Layout Mobile (<768px): 1 Kolom

```
┌─────────────────────────┐
│ 🛒 Kasir    [Open Bill] │
│                          │
│ ┌─ Search... ──────── 📷│
│ ┌─ Scan/SKU... ────────│
│ [Semua][Makanan][Minum..]│
│                          │
│ ┌──────┐ ┌──────┐      │
│ │ prod1│ │ prod2│      │
│ │Rp15k │ │Rp5k  │      │
│ └──────┘ └──────┘      │
│ ┌──────┐ ┌──────┐      │
│ │ prod3│ │ prod4│      │
│ └──────┘ └──────┘      │
│                          │
│    ┌───────────────────┐ │
│    │🛒 3 item • Rp50k  │ │  ← Floating cart bar (klik = open bottom sheet)
│    └───────────────────┘ │
└─────────────────────────┘
```

**Klik floating cart bar → Bottom Sheet (Keranjang)**:
- List item + qty + diskon per item
- Nama pelanggan, Meja
- Tambah Diskon total
- Subtotal, Total
- [Simpan Bill] [Bayar]

---


### 6.3 Panel Kanan (Keranjang) — Detail

**Isi panel keranjang:**
1. Header: "🛒 Keranjang (N item)"
2. List items (scrollable):
   - Nama produk
   - Harga × qty
   - Diskon per item (jika ada): "Diskon: 5% (-Rp 500)"
   - Harga setelah diskon
   - Tombol: ✏ Tambah catatan | 🏷 Ubah diskon
   - Qty control: [×] [−] qty [+]
3. Input: Nama pelanggan (opsional) | # Meja (opsional)
4. 🏷 Tambah Diskon (diskon total transaksi — bisa % atau nominal)
5. Summary:
   - Subtotal: Rp X
   - Diskon: - Rp Y
   - **Total: Rp Z** (bold, warna brand)
6. Buttons:
   - [Simpan Bill] — outline, icon floppy
   - [Bayar] — filled purple/brand, icon payment

**Yang TIDAK ada di panel keranjang:**
- ~~Metode bayar~~ (pindah ke popup bayar)
- ~~Kas tujuan~~ (pindah ke popup bayar)
- ~~Uang customer~~ (pindah ke popup bayar)
- ~~Kembalian~~ (pindah ke popup bayar)

### 6.4 Popup Pembayaran (Payment Modal)

Muncul saat klik tombol "Bayar". Style: modal/popup overlay.

```
┌─────────────────────────────────────────┐
│           Pembayaran              [✕]    │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │       Total Bayar                   │ │
│  │       Rp 50.000                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Kas Tujuan                              │
│  [Kas Retail ▼]                          │
│                                          │
│  Metode Pembayaran                       │
│  [Tunai] [Transfer] [QRIS] [Hutang]     │
│                                          │
│  Jumlah Bayar                            │
│  ┌──────────────────────────────┐       │
│  │  Rp 50.000                    │       │
│  └──────────────────────────────┘       │
│  [1K][2K][5K][10K][20K][50K][100K][Pas] │
│  [Reset]                                 │
│                                          │
│  👤 Nama pelanggan (prefilled)           │
│  📱 No HP (opsional)                    │
│  📝 Catatan tambahan (opsional)          │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Kembalian              Rp 0          │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │    ✓ Konfirmasi Transaksi           │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Catatan penting:**
- **Kas Tujuan**: dropdown dari CashBoxCategory aktif milik shop (Kas Retail, Kas BRILink, dll)
- **Metode Bayar**: Tunai, Transfer Bank, QRIS, **Hutang** (baru!)
- **Jika pilih "Hutang"**:
  - Jumlah bayar bisa partial (mis. bayar Rp 30.000 dari total Rp 50.000)
  - Sisa otomatis jadi hutang (Rp 20.000)
  - Nama pelanggan & No HP menjadi **wajib**
  - Muncul info: "Hutang: Rp 20.000 akan tercatat atas nama [Pelanggan]"
- **Nama pelanggan**: Prefilled dari input di keranjang (jika sudah diisi)
- **Tombol nominal (1K, 2K, dst)**: Kumulatif (klik 50K + 50K = 100K)
- **"Uang Pas"**: Set jumlah bayar = total

---


### 6.5 Popup Struk (Setelah Konfirmasi Bayar)

Setelah transaksi berhasil, langsung muncul popup struk:

```
┌─────────────────────────────────────────┐
│  ✅ Transaksi berhasil! TX178001669...  │
│                                          │
│         Struk Transaksi           [✕]   │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │           [Nama Toko]               │ │
│  │   ─────────────────────────────     │ │
│  │   No: TX1780016690851               │ │
│  │   29/05/2026 08:04      Tunai       │ │
│  │   Kasir: soya                       │ │
│  │   ─────────────────────────────     │ │
│  │   Ayam Bakar                        │ │
│  │   1 x Rp 20.000         Rp 20.000  │ │
│  │   Mie Goreng                        │ │
│  │   1 x Rp 12.000         Rp 12.000  │ │
│  │   ─────────────────────────────     │ │
│  │   Subtotal              Rp 32.000   │ │
│  │   TOTAL                 Rp 32.000   │ │
│  │   Bayar                 Rp 50.000   │ │
│  │   Kembali               Rp 18.000   │ │
│  │   ─────────────────────────────     │ │
│  │   Terima kasih atas kunjungan Anda! │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌──────────┬──────────┬──────────┐     │
│  │ ⬇ Unduh  │ ↗ Bagikan│ 🖨 Cetak │     │
│  └──────────┴──────────┴──────────┘     │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │            Selesai                   │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Aksi struk:**
- **Unduh**: Download sebagai JPG/PNG (html2canvas)
- **Bagikan**: Web Share API (WhatsApp, dll)
- **Cetak**: window.print() atau Bluetooth thermal printer (future)
- **Selesai**: Tutup popup, reset keranjang, kembali ke POS

---

## 7. Fitur Simpan Bill (Save & Recall)

### 7.1 Konsep

Kasir bisa "park" transaksi yang belum dibayar (misal: pelanggan mau ambil barang lagi, atau mau pindah meja). Bill disimpan dengan status PENDING dan bisa dibuka kembali.

### 7.2 Flow Simpan Bill

1. Kasir klik **"Simpan Bill"** di panel keranjang
2. Sistem generate nomor transaksi (TX...) dengan status PENDING
3. Keranjang di-reset → kasir bisa mulai transaksi baru
4. Toast: "Bill disimpan! TX178..."

### 7.3 Flow Open Bill

1. Kasir klik **"Open Bill"** (tombol di header POS, kanan atas)
2. Muncul popup/drawer: daftar bill tersimpan
   - Setiap bill: No TX, nama pelanggan (jika ada), jumlah item, total, waktu simpan
3. Kasir pilih bill → keranjang di-load ulang dari bill tersebut
4. Kasir lanjut belanja atau langsung bayar

### 7.4 Data Storage

```prisma
// Transaksi dengan status PENDING = bill tersimpan
// Tidak perlu model baru, cukup pakai Transaction.status = 'PENDING'
// Items sudah tersimpan di TransactionItem
```

**Aturan:**
- Bill tersimpan max 24 jam (auto-expire setelah shift tutup)
- Bill tersimpan hanya visible di shift aktif kasir yang sama
- Saat "Open Bill": cart items di-restore dari TransactionItem

---


## 8. Metode Bayar "Hutang" dari POS

### 8.1 Flow Hutang Full (Seluruh Total)

1. Di popup pembayaran, kasir pilih metode **"Hutang"**
2. Jumlah bayar otomatis = Rp 0
3. **Nama pelanggan** & **No HP** menjadi WAJIB
4. Info: "Seluruh transaksi Rp 50.000 akan dicatat sebagai hutang."
5. Konfirmasi → Transaction COMPLETED + Debt PENDING created
6. Struk menampilkan: "HUTANG: Rp 50.000"

### 8.2 Flow Hutang Partial (Bayar Sebagian)

1. Di popup pembayaran, kasir pilih metode **"Tunai"** atau **"QRIS"**
2. Jumlah bayar < Total (mis. bayar Rp 30.000, total Rp 50.000)
3. Sistem deteksi: "Kurang Rp 20.000"
4. Muncul opsi: **"Catat sisa sebagai hutang?"** [Ya] [Tidak]
5. Jika Ya:
   - **Nama pelanggan** & **No HP** menjadi WAJIB
   - Payment created: Rp 30.000 (Tunai)
   - Debt created: Rp 20.000 (PENDING)
6. Struk: "Bayar: Rp 30.000 | Hutang: Rp 20.000"

### 8.3 Backend: Auto-Create Debt

```typescript
// Di TransactionService.checkout():
if (paidAmount < totalPrice) {
  const debtAmount = totalPrice - paidAmount;
  await this.prisma.debt.create({
    data: {
      shopId,
      transactionId: transaction.id,
      customerName: dto.customerName, // wajib
      customerPhone: dto.customerPhone,
      totalAmount: debtAmount,
      paidAmount: 0,
      status: 'PENDING',
    }
  });
}
```

---

## 9. Dashboard (Beranda) — Tidak Berubah

Dashboard tetap seperti saat ini:
- Greeting + nama user
- Realtime clock
- Shift status (buka shift / durasi shift)
- Cards: Penjualan Retail, Transaksi BRILink
- Stats row: Total trx, Retail, BRILink
- Quick Actions (6 tombol)
- Transaksi Terakhir (5 item)

**Satu-satunya perubahan**: Bottom nav dari 4 tab → 5 tab (lihat Section 5).

---

## 10. Halaman Pengaturan (Baru: `/settings`)

### 10.1 Layout

```
┌─────────────────────────────────────┐
│  ⚙️ Pengaturan                      │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ 📷                              │ │
│  │ [Foto Profil]                   │ │
│  │ soya                            │ │
│  │ Kasir · Toko ABC                │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ── Profil ──                        │
│  Nama Lengkap        [Sopyan]        │
│  No HP               [08123...]      │
│  Alamat              [Jl. ...]       │
│                                      │
│  ── Shift ──                         │
│  Status              🟢 Aktif (3j 20m)│
│  Shift terakhir      28/05 (8j 15m) │
│                                      │
│  ── Keamanan ──                      │
│  [🔑 Ganti PIN]                     │
│  [🔄 Minta Reset PIN ke Admin]      │
│                                      │
│  ── Aplikasi ──                      │
│  Versi               1.0.0           │
│  [🚪 Logout]                        │
└─────────────────────────────────────┘
```

### 10.2 Ganti PIN Flow

1. Input PIN lama
2. Input PIN baru (4-6 digit)
3. Konfirmasi PIN baru
4. Submit → Backend verify PIN lama, update hash PIN baru

### 10.3 Minta Reset PIN

1. Kasir klik "Minta Reset PIN ke Admin"
2. Konfirmasi: "Admin akan menerima notifikasi untuk reset PIN Anda."
3. Backend: create notification/flag di admin panel
4. Admin reset PIN dari admin panel → kasir login dengan PIN baru

---


## 11. Halaman Laporan Kasir (Baru: `/reports`)

### 11.1 Layout

```
┌─────────────────────────────────────┐
│  📊 Laporan                         │
│                                      │
│  ── Hari Ini ──                      │
│  Penjualan    Rp 530.000 (12 trx)   │
│  Profit       Rp 145.000            │
│  Hutang baru  Rp 20.000 (1 trx)    │
│                                      │
│  ── Grafik 7 Hari ──                │
│  [=====Bar Chart Penjualan=====]    │
│                                      │
│  ── Produk Terlaris ──               │
│  1. Nasi Goreng Spesial  (15x)      │
│  2. Es Teh Manis         (12x)      │
│  3. Ayam Bakar           (10x)      │
│  4. Kopi Susu            (8x)       │
│  5. Air Mineral          (7x)       │
│                                      │
│  ── Breakdown Metode Bayar ──        │
│  Tunai      65%  ████████▒▒▒       │
│  QRIS       25%  ██████▒▒▒▒▒       │
│  Transfer   5%   ██▒▒▒▒▒▒▒▒▒       │
│  Hutang     5%   ██▒▒▒▒▒▒▒▒▒       │
└─────────────────────────────────────┘
```

---

## 12. Perubahan Teknis yang Diperlukan

### 12.1 Database Migration (Baru)

```sql
-- Add PIN field to users
ALTER TABLE users ADD COLUMN pin VARCHAR(255);
ALTER TABLE users ADD COLUMN pin_changed_at TIMESTAMP;

-- Add column for bill metadata (optional, bisa pakai existing fields)
-- Transaction status PENDING = saved bill
-- Mungkin tambah field tableNumber di transaction
ALTER TABLE transactions ADD COLUMN table_number VARCHAR(50);
ALTER TABLE transactions ADD COLUMN customer_phone VARCHAR(50);
```

### 12.2 Backend Changes

| File/Module | Perubahan |
|-------------|-----------|
| `prisma/schema.prisma` | Add `pin`, `pinChangedAt` to User |
| `src/auth/auth.controller.ts` | Add `POST /api/auth/login-pin` endpoint |
| `src/auth/auth.service.ts` | Add `loginWithPin()` method |
| `src/auth/dto/login.dto.ts` | Add `LoginPinDto` class |
| `src/admin/admin.service.ts` | Add `resetPin()`, update `createKasir()` to include PIN |
| `src/transactions/` | Add `saveBill()`, `listSavedBills()`, `loadBill()` |
| `src/transactions/` | Update checkout to support hutang partial |

### 12.3 Frontend Changes

| File/Component | Perubahan |
|----------------|-----------|
| `webapp/views/LoginView.vue` | Redesign: Username + PIN, brand Ngalir |
| `webapp/layouts/KasirLayout.vue` | 5-tab bottom nav, brand update |
| `webapp/views/POSView.vue` | 2-col layout desktop, mobile bottom sheet |
| `webapp/components/cart/CartPanel.vue` | **Baru**: permanent side panel (desktop) |
| `webapp/components/cart/CartBottomSheet.vue` | **Baru**: bottom sheet (mobile) |
| `webapp/components/payment/PaymentModal.vue` | **Baru**: popup bayar |
| `webapp/components/payment/ReceiptModal.vue` | **Baru**: popup struk |
| `webapp/components/bill/OpenBillModal.vue` | **Baru**: daftar bill tersimpan |
| `webapp/views/ReportsView.vue` | **Baru**: halaman laporan kasir |
| `webapp/views/SettingsView.vue` | **Baru**: halaman pengaturan/profil |
| `shared/services/auth.service.ts` | Add `loginWithPin()` API call |
| `shared/stores/auth.store.ts` | Add PIN login flow |

### 12.4 Branding Changes

| Element | Lama | Baru |
|---------|------|------|
| App name | "Maslahat Tani" | **"Ngalir"** |
| Tagline | - | *"Satu tap, semua beres"* |
| Primary color | Blue-600 | **Purple-600** (#7c3aed) |
| Logo | Store icon biru | Logo Ngalir (TBD) |
| Document title | "... — Maslahat Tani" | "... — Ngalir" |
| Login branding | - | Logo + nama + tagline |

---


## 13. Prioritas Implementasi

### Phase 1: Core Rebrand & Auth (Sprint 1)
1. ✅ Rebrand semua "Maslahat Tani" → "Ngalir" (color, title, logo)
2. ✅ Backend: PIN field + login-pin endpoint
3. ✅ Frontend: Login page redesign (Username + PIN)
4. ✅ Admin panel: CRUD kasir dengan PIN
5. ✅ Bottom nav 5 tab (struktur)

### Phase 2: POS Redesign (Sprint 2)
6. POS 2-kolom desktop (CartPanel permanent)
7. POS mobile (floating bar + bottom sheet cart)
8. Payment Modal (popup bayar terpisah)
9. Receipt Modal (popup struk + unduh/bagikan)
10. Open Bill & Simpan Bill

### Phase 3: Hutang & Reports (Sprint 3)
11. Metode bayar "Hutang" (full & partial) 
12. Halaman Laporan (`/reports`)
13. Halaman Pengaturan (`/settings`) + Ganti PIN
14. Reset PIN flow (kasir → admin notification)

### Phase 4: Polish & Advanced (Sprint 4)
15. Barcode scanner (camera)
16. Product image (Cloudinary)
17. Receipt thermal print (Bluetooth)
18. Shift guard (block POS kalau belum buka shift)
19. Offline bill sync

---

## 14. Design System — Ngalir

### 14.1 Color Palette

```css
/* Primary (Purple) */
--ngalir-50:  #faf5ff;
--ngalir-100: #f3e8ff;
--ngalir-200: #e9d5ff;
--ngalir-300: #d8b4fe;
--ngalir-400: #c084fc;
--ngalir-500: #a855f7;
--ngalir-600: #9333ea;  /* PRIMARY */
--ngalir-700: #7c3aed;
--ngalir-800: #6b21a8;
--ngalir-900: #581c87;

/* Accent (Emerald — untuk sukses/BRILink) */
--accent: #10b981;

/* Neutral (Slate) */
--bg: #f8fafc;
--surface: #ffffff;
--border: #e2e8f0;
--text: #1e293b;
--muted: #64748b;
```

### 14.2 Typography
- Font: Inter (sans-serif)
- Headings: font-bold
- Body: font-normal, text-sm (14px)
- Small: text-xs (12px)

### 14.3 Border Radius
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Input: rounded-lg (8px)
- Modal: rounded-2xl (16px)
- Bottom sheet: rounded-t-2xl

### 14.4 Shadows
- Card: shadow-sm
- Modal: shadow-xl
- Floating bar: shadow-[0_8px_32px_rgba(0,0,0,0.12)]
- FAB button: shadow-lg

---

## 15. API Endpoints (Baru/Diubah)

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login-pin` | Login kasir dengan username + PIN |
| POST | `/api/auth/change-pin` | Ganti PIN (auth required) |
| POST | `/api/auth/request-pin-reset` | Minta reset PIN ke admin |

### Bills
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/transactions/save-bill` | Simpan bill (status PENDING) |
| GET | `/api/transactions/saved-bills` | List bill tersimpan (shift aktif) |
| POST | `/api/transactions/load-bill/:id` | Load bill ke cart (return items) |
| DELETE | `/api/transactions/discard-bill/:id` | Hapus bill tersimpan |

### Reports (Kasir)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/reports/cashier/today` | Ringkasan hari ini |
| GET | `/api/reports/cashier/weekly` | Data 7 hari terakhir |
| GET | `/api/reports/cashier/top-products` | Top 5 produk terlaris |
| GET | `/api/reports/cashier/payment-methods` | Breakdown metode bayar |

### Profile (Kasir)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/profile` | Get profil kasir |
| PATCH | `/api/profile` | Update profil (nama, HP, alamat, foto) |
| GET | `/api/profile/shift-history` | Riwayat shift |

---

## 16. Catatan Keamanan

1. **PIN Storage**: bcrypt hash (12 rounds), sama seperti password
2. **Brute-force protection**: Max 5 PIN attempts → lock 5 menit
3. **PIN complexity**: Minimal 4 digit, max 6 digit, hanya angka
4. **Session**: Tetap JWT (24h access + 30d refresh)
5. **PIN Reset**: Hanya bisa dilakukan oleh admin (bukan self-service OTP)

---

## 17. Kesimpulan

PRD ini mendefinisikan transformasi dari "Maslahat Tani v2" menjadi **Ngalir** — sebuah produk POS yang:
- **Lebih sederhana**: Login PIN, tanpa email/OTP untuk kasir
- **Lebih cepat**: 2-kolom permanen, flow bayar 2 langkah (cart → payment → struk)
- **Lebih fleksibel**: Multiple bill, hutang partial, multi-kas
- **Siap jual**: Branding sendiri, tagline, design system konsisten

*Rezeki ngalir, transaksi ngalir, operasional lancar.* 💧


---

## 18. Email Verification (Opsional, Sprint 3+)

### 18.1 Filosofi
Akun kasir di-create dengan **username + PIN saja**. Email **tidak wajib** karena:
- Banyak kasir UMKM tidak punya email pribadi
- Mempercepat onboarding (admin hanya perlu nama, username, PIN)
- Privasi kasir tidak terganggu

Email menjadi **opt-in** lewat halaman Profil kasir, dengan **OTP verification** untuk membuktikan kepemilikan email.

### 18.2 State Email per Kasir

| State | Indikator | Bisa Reset PIN via Email? |
|-------|-----------|---------------------------|
| Tidak ada email | "Belum ada email" | ❌ Harus ke admin |
| Email belum verifikasi | "⚠ Belum verifikasi" | ❌ Harus verifikasi dulu |
| Email terverifikasi | ✅ "Terverifikasi" | ✅ Bisa self-service |

### 18.3 Database Changes (Future Migration)

```prisma
model User {
  // existing...
  email             String?   @unique  // sudah nullable di Sprint 1
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
}
```

### 18.4 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/profile/request-email-change` | Body: `{ email }` → kirim OTP |
| POST | `/api/profile/verify-email-change` | Body: `{ email, otp }` → simpan + verified=true |
| POST | `/api/profile/remove-email` | Hapus email (kalau kasir mau cabut) |

### 18.5 Email Service Pilihan

| Service | Free Tier | Setup | Catatan |
|---------|-----------|-------|---------|
| **Gmail SMTP (App Password)** | ~500/hari | Mudah | ⭐ Cocok untuk start |
| **Resend** | 3,000/bulan | API key only | ⭐ Best DX, modern |
| **Brevo** | 300/hari | Mudah | Alternatif |
| **AWS SES** | $0.10/1000 | Komplex | Untuk skala besar |

**Roadmap**:
- Sprint 3: Implementasi pakai **Gmail SMTP** (gak perlu signup baru, manfaatkan akun pemilik)
- Sprint 5+: Migrasi ke **Resend** kalau sudah scale

### 18.6 UI Profil Kasir (Email Section)

```
┌────────────────────────────────────────┐
│ 📧 Email                                │
│ ─────────────────────────────────────  │
│ Belum ada email                         │
│ [+ Tambah Email]                        │
└────────────────────────────────────────┘

ATAU jika sudah ada (unverified):
┌────────────────────────────────────────┐
│ 📧 Email                                │
│ kasir@gmail.com    [⚠ Belum verifikasi]│
│ [✓ Verifikasi Sekarang]  [✏ Ubah]      │
└────────────────────────────────────────┘

ATAU verified:
┌────────────────────────────────────────┐
│ 📧 Email                                │
│ kasir@gmail.com    ✅ Terverifikasi    │
│ [✏ Ubah Email]                         │
└────────────────────────────────────────┘
```

### 18.7 Use Cases yang Di-enable

1. **Lupa PIN? Reset via Email** (kasir self-service, syarat: emailVerified=true)
2. **Notifikasi shift report** (rekap harian dikirim ke email)
3. **Audit & trust signal** (centang verifikasi di profil)
4. **Future**: 2FA opsional untuk kasir (PIN + OTP email)



---

## 19. QRIS Payment — Foto QR di Admin, Tampil Saat Bayar (Sprint 3+)

### 19.1 Konsep

Toko bisa upload **foto QRIS** (gambar QR Code dari bank/e-wallet) di admin panel. Saat kasir pilih metode bayar "QRIS" di POS, gambar QR otomatis muncul di popup pembayaran supaya pelanggan bisa scan langsung dari layar.

### 19.2 Flow Admin Panel — Upload QRIS

1. Admin buka **Pengaturan > Metode Pembayaran**
2. Section "QRIS":
   - [Upload Gambar QR] → pilih file JPG/PNG
   - Preview gambar yang sudah diupload
   - Label: "QRIS Utama" (bisa custom)
   - Bisa upload multiple QR (misal: QRIS BRI, QRIS Dana, QRIS ShopeePay)
3. Simpan → gambar disimpan di Cloudinary / local storage

### 19.3 Flow Kasir — Bayar dengan QRIS

1. Di Payment Modal, kasir pilih metode **"QRIS"**
2. Muncul section baru di bawah metode bayar:
   ```
   ┌─────────────────────────────────┐
   │ Tampilkan QR ke pelanggan:      │
   │                                  │
   │      ┌───────────────┐          │
   │      │               │          │
   │      │   [QR CODE]   │          │
   │      │   (gambar)    │          │
   │      │               │          │
   │      └───────────────┘          │
   │      QRIS BRI - Toko ABC       │
   │                                  │
   │ Jika ada >1 QR: [QRIS BRI ▼]   │
   └─────────────────────────────────┘
   ```
3. Kasir arahkan layar ke pelanggan → pelanggan scan dari HP
4. Setelah pelanggan bayar, kasir klik "Konfirmasi Transaksi"
5. (Future: auto-detect payment via webhook)

### 19.4 Database Changes

```prisma
model QrisImage {
  id          String    @id @default(cuid())
  shop        Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId      String
  label       String    // "QRIS BRI", "QRIS Dana", dll
  imageUrl    String    // URL gambar (Cloudinary atau local)
  isDefault   Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([shopId, isActive])
  @@map("qris_images")
}
```

### 19.5 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/shops/:id/qris` | List QRIS images untuk shop |
| POST | `/api/shops/:id/qris` | Upload QRIS image (multipart) |
| PATCH | `/api/shops/:id/qris/:qrisId` | Update label/default/active |
| DELETE | `/api/shops/:id/qris/:qrisId` | Hapus QRIS image |

### 19.6 Admin Panel UI

```
┌─────────────────────────────────────────┐
│ Pengaturan > Metode Pembayaran          │
│                                          │
│ ── QRIS ──                              │
│                                          │
│ ┌─────────────┐  ┌─────────────┐       │
│ │  [QR image] │  │  [QR image] │       │
│ │  QRIS BRI   │  │  QRIS Dana  │       │
│ │  ✅ Default │  │             │       │
│ │  [Edit][Del]│  │  [Edit][Del]│       │
│ └─────────────┘  └─────────────┘       │
│                                          │
│ [+ Tambah QRIS]                         │
│                                          │
│ ── Catatan ──                           │
│ Upload gambar QR dari aplikasi bank.    │
│ Gambar akan ditampilkan ke pelanggan    │
│ saat kasir pilih metode QRIS.           │
└─────────────────────────────────────────┘
```

### 19.7 Storage Options

| Service | Free Tier | Ukuran Max | Recommended |
|---------|-----------|-----------|-------------|
| **Cloudinary** | 25GB + 25K transforms/bulan | 10MB/file | ⭐ Best for images |
| **Local (server storage)** | Unlimited | Disk-bound | Dev only |
| **Supabase Storage** | 1GB free | 50MB/file | Alternative |

**Roadmap**: Pakai **Cloudinary** — sudah plan untuk product images juga, jadi 1 service untuk semua image upload.

### 19.8 Keamanan

- Hanya admin yang bisa upload/delete QRIS
- Kasir hanya bisa GET (view) QRIS images
- Image di-validate: hanya JPG/PNG, max 2MB
- Tidak ada auto-confirm pembayaran (kasir manual konfirmasi setelah pelanggan bilang sudah bayar)
- Future: webhook integration dengan payment gateway untuk auto-detect



---

## 20. Metode Bayar "Hutang" — Detail Flow (Sprint 3)

### 20.1 Opsi Hutang di Payment Modal

Saat kasir pilih metode **"Hutang"** di popup Pembayaran:

#### A. Hutang Full (Seluruh Total)

```
┌─────────────────────────────────────┐
│ Pembayaran                    [✕]   │
│                                      │
│ Total Bayar: Rp 50.000             │
│                                      │
│ Metode: [Tunai] [QRIS] [●Hutang]   │
│                                      │
│ ⚠ Seluruh transaksi Rp 50.000 akan │
│   dicatat sebagai hutang.            │
│                                      │
│ 👤 Nama pelanggan *  [___________]  │
│ 📱 No HP *           [___________]  │
│ 📅 Jatuh tempo       [dd/mm/yyyy]  │
│ 📝 Catatan           [___________]  │
│                                      │
│ [✓ Konfirmasi — Catat Hutang]       │
└─────────────────────────────────────┘
```

**Behavior:**
- Jumlah bayar otomatis = Rp 0
- **Nama pelanggan & No HP menjadi WAJIB** (validasi frontend)
- Jatuh tempo opsional (default: 30 hari dari sekarang)
- Setelah konfirmasi:
  - Transaction status = COMPLETED
  - Payment amount = 0
  - Debt record created: totalAmount = grandTotal, status = PENDING

#### B. Hutang Partial (Bayar Sebagian, Sisa Hutang)

```
┌─────────────────────────────────────┐
│ Pembayaran                    [✕]   │
│                                      │
│ Total Bayar: Rp 50.000             │
│                                      │
│ Metode: [●Tunai] [QRIS] [Hutang]   │
│                                      │
│ Jumlah Bayar: [  30.000  ]          │
│ [1K][2K][5K]...[Uang Pas]          │
│                                      │
│ ⚠ Kurang Rp 20.000                 │
│ ┌─────────────────────────────────┐ │
│ │ ☐ Catat sisa sebagai hutang?    │ │
│ │   Hutang: Rp 20.000             │ │
│ │   👤 Nama *  [___________]      │ │
│ │   📱 No HP * [___________]      │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [✓ Konfirmasi Transaksi]            │
└─────────────────────────────────────┘
```

**Behavior:**
- Kasir bayar Tunai/QRIS tapi jumlahnya < total
- Sistem detect "kurang" dan tawarkan checkbox "Catat sisa sebagai hutang?"
- Jika dicentang: Nama & No HP wajib
- Setelah konfirmasi:
  - Payment created: amount = 30.000 (Tunai)
  - Debt created: totalAmount = 20.000, status = PENDING
  - Transaction status = COMPLETED

### 20.2 Backend Logic

```typescript
// POST /api/transactions/checkout
// Jika paymentMethod === 'HUTANG':
//   - Payment amount = 0
//   - Create Debt full amount
// Jika amountPaid < grandTotal && createDebtForRemainder === true:
//   - Payment amount = amountPaid
//   - Create Debt for (grandTotal - amountPaid)
// Else jika amountPaid < grandTotal && createDebtForRemainder === false:
//   - Reject: "Jumlah bayar kurang"
```

### 20.3 Struk untuk Transaksi Hutang

```
─────────────────────────────
Ayam Bakar   1 x Rp 20.000
Mie Goreng   1 x Rp 12.000
─────────────────────────────
Subtotal            Rp 32.000
TOTAL               Rp 32.000
─────────────────────────────
Bayar (Tunai)       Rp 20.000
HUTANG              Rp 12.000
  → Atas nama: Pak Ahmad
  → Jatuh tempo: 28/06/2026
─────────────────────────────
```

---

## 21. Metode Bayar "QRIS" — Flow Lengkap (Sprint 3)

### 21.1 Prasyarat

Admin harus sudah upload minimal 1 gambar QRIS di admin panel (lihat Section 19).

### 21.2 Flow di Payment Modal

```
┌─────────────────────────────────────┐
│ Pembayaran                    [✕]   │
│                                      │
│ Total Bayar: Rp 50.000             │
│                                      │
│ Metode: [Tunai] [●QRIS] [Hutang]   │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │  Tunjukkan QR ke pelanggan:     │ │
│ │                                  │ │
│ │       ┌──────────────┐          │ │
│ │       │              │          │ │
│ │       │   [QR CODE]  │          │ │
│ │       │   (gambar)   │          │ │
│ │       │              │          │ │
│ │       └──────────────┘          │ │
│ │       QRIS BRI — Toko ABC      │ │
│ │                                  │ │
│ │  (Jika >1 QR) [Pilih QR ▼]     │ │
│ └─────────────────────────────────┘ │
│                                      │
│ 👤 Nama pelanggan (opsional)        │
│ 📱 No HP (opsional)                │
│ 📝 Catatan (opsional)              │
│                                      │
│ [✓ Konfirmasi — Pelanggan Sudah    │
│    Membayar]                         │
└─────────────────────────────────────┘
```

**Behavior:**
- Saat QRIS dipilih:
  - Jumlah Bayar & nominal buttons di-hide (tidak relevan)
  - Kembalian di-hide (tidak ada kembalian di QRIS)
  - Gambar QR muncul (fetch dari API `/api/shops/:id/qris`)
  - Tombol konfirmasi berubah text: "Pelanggan Sudah Membayar"
- Jika belum ada QR diupload: tampil pesan "Belum ada QRIS. Admin perlu upload di Pengaturan."
- Setelah konfirmasi:
  - Payment method = QRIS, amount = grandTotal
  - Transaction status = COMPLETED

### 21.3 Catatan Penting

- **Tidak ada auto-verification** (belum ada integrasi payment gateway)
- Kasir manual konfirmasi setelah pelanggan bilang sudah transfer/scan
- Future enhancement: webhook dari payment provider untuk auto-confirm
- Gambar QR diambil dari `QrisImage` model (admin upload via Cloudinary)

---

## 22. Sprint 1 Completion Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Rebrand "Maslahat Tani" → "Ngalir" | ✅ |
| 2 | Primary color → blue-600 (per UI Showcase) | ✅ |
| 3 | Login kasir: Username + PIN | ✅ |
| 4 | mustChangePin flow (akun baru wajib ganti PIN) | ✅ |
| 5 | Admin Multi-User: create kasir with PIN | ✅ |
| 6 | Admin Multi-User: reset PIN | ✅ |
| 7 | Email nullable (opsional, bukan wajib) | ✅ |
| 8 | Bottom nav 5 tab (Beranda, BRILink, Kasir FAB, Laporan, Pengaturan) | ✅ |
| 9 | Halaman /settings (profil, ganti PIN, shift, logout) | ✅ |
| 10 | Halaman /reports (placeholder) | ✅ |
| 11 | POS 2-kolom desktop/tablet | ✅ |
| 12 | POS mobile: floating cart bar + bottom sheet | ✅ |
| 13 | POS grid 4-col mobile, 5-col desktop | ✅ |
| 14 | POS grid/list toggle visible on mobile | ✅ |
| 15 | Payment Modal popup (Tunai, QRIS, Hutang) | ✅ |
| 16 | Kas Tujuan dropdown (conditional) | ✅ |
| 17 | Barcode/SKU scan modal + auto-add + toast | ✅ |
| 18 | Inline diskon per item (CSS, bukan prompt) | ✅ |
| 19 | Inline catatan per item | ✅ |
| 20 | Diskon total transaksi (functional) | ✅ |
| 21 | Simpan Bill (localStorage) | ✅ |
| 22 | Nama + No HP equal width + opsional | ✅ |
| 23 | Layout max-w-6xl centered (not full-bleed) | ✅ |
| 24 | PRD: Email verification roadmap (Section 18) | ✅ |
| 25 | PRD: QRIS image upload flow (Section 19) | ✅ |
| 26 | PRD: Hutang full/partial flow (Section 20) | ✅ |
| 27 | PRD: QRIS payment display flow (Section 21) | ✅ |

**Sprint 1 = DONE** 🎉

Selanjutnya Sprint 2:
- Open Bill recall (load dari localStorage/backend)
- Receipt Modal (popup struk: unduh JPG, bagikan, cetak)
- Shift guard (block POS jika belum buka shift)
- Backend: save bill endpoint (Transaction status=PENDING)



---

## 23. Sistem Shift — Model Hybrid (Reset + Mengalir)

### 23.1 Filosofi

Ngalir menyediakan **2 mode shift** yang bisa di-toggle dari admin panel:

| Mode | Target User | Deskripsi |
|------|-------------|-----------|
| **Mode A: Shift Reset** | Toko besar, multi-kasir ketat | Setiap shift input modal awal, tutup = hitung selisih, saldo per-shift |
| **Mode B: Saldo Mengalir** | Toko kecil, 1-2 kasir | Saldo terus jalan, shift = penanda siapa jaga + jam kerja |

Admin pilih mode di **Pengaturan > Sistem Shift**. Default = Mode B (cocok UMKM).

### 23.2 Mode B: Saldo Mengalir (Default)

#### Buka Shift:
1. Kasir login → klik "Buka Shift"
2. Sistem tampilkan **saldo terakhir** dari DB (tidak input manual)
3. Kasir **koreksi** jika ada selisih (misal: "Saldo sistem Rp 2.5jt, aktual Rp 2.4jt" → input koreksi -100rb dengan catatan)
4. Shift dibuka → catat: userId, startTime, saldoAwal (from last shift or correction)

#### Selama Shift:
- Transaksi retail → + saldo kas retail
- Fee BRILink → + saldo kas BRILink
- Cash In → + saldo (kategori: setor modal, terima titipan, dll)
- Cash Out → - saldo (kategori: keperluan rumah, beli stok, listrik, dll)
- Semua tercatat real-time

#### Tutup Shift:
1. Kasir klik "Tutup Shift" (bisa kapan saja, fleksibel)
2. **Wajib** input hitung uang fisik (per denominasi opsional)
3. Sistem compare: expected vs actual
4. Variance dicatat (lebih/kurang)
5. Ringkasan: total trx, omzet, profit, cash in/out, saldo akhir

#### Saldo Formula:
```
Saldo Akhir Shift = Saldo Awal
                    + Total Penjualan Tunai
                    + Total Fee BRILink (tunai)
                    + Total Cash In
                    - Total Cash Out
```

### 23.3 Mode A: Shift Reset (Opsi untuk Dijual)

#### Buka Shift:
1. Kasir login → klik "Buka Shift"
2. Input **modal awal** manual (berapa uang di laci kas)
3. Shift dibuka

#### Tutup Shift:
1. Hitung uang fisik (wajib)
2. Expected = Modal Awal + Penjualan Tunai - Kembalian
3. Variance = Actual - Expected

#### Perbedaan dengan Mode B:
- Saldo tidak "dibawa" antar shift
- Setiap shift independent
- Cocok untuk shift bergantian dengan serah terima formal

### 23.4 Multi-Kasir

**Setting di admin**: 
- **Strict (default)**: 1 shift = 1 kasir. Gantian = kasir A tutup, kasir B buka.
- **Relaxed**: 1 shift bisa di-share ke multiple kasir (field `sharedWith`). Semua transaksi tercatat siapa yang buat, tapi shift-nya 1.

### 23.5 Cash In / Cash Out

#### Kategori (configurable di admin panel):
**Cash In:**
- Setor Modal
- Terima Titipan
- Pendapatan Lain
- Koreksi (+)

**Cash Out:**
- Keperluan Rumah/Pribadi
- Beli Stok/Restock
- Listrik/Air/Internet
- Gaji Karyawan
- Sewa Tempat
- Transportasi
- Lainnya
- Koreksi (-)

#### Flow Cash Out + Approval:
```
1. Kasir klik "Cash Out" → pilih kategori → input nominal → catatan → Submit
2. Uang LANGSUNG bisa diambil (tidak perlu tunggu approval)
3. Status: "Belum Diverifikasi" ⚠
4. Admin panel: lihat list pengeluaran, klik "Verifikasi" ✅ atau "Tolak" ❌
5. Jika ditolak: muncul notif ke kasir, tapi uang sudah keluar (perlu setor kembali)
```

**Kenapa tidak blocking?** Karena di lapangan kasir butuh cepat (bayar tukang galon, dll). Admin verify belakangan buat audit trail.

### 23.6 UI Shift di Webapp Kasir

#### Halaman Shift (`/retail/shift`):

**Belum ada shift aktif:**
```
┌─────────────────────────────────────────┐
│ 🕐 Shift                                │
│                                          │
│ Saldo Terakhir (dari shift sebelumnya): │
│ Kas Retail:    Rp 2.350.000             │
│ Kas BRILink:   Rp 5.200.000             │
│                                          │
│ ⚠ Koreksi saldo (jika ada selisih):    │
│ Kas Retail: [______] (opsional)         │
│ Catatan:    [______________________]    │
│                                          │
│ [▶ Buka Shift]                          │
└─────────────────────────────────────────┘
```

**Shift aktif:**
```
┌─────────────────────────────────────────┐
│ 🟢 Shift Aktif — 3j 20m                │
│ Kasir: sopyanahsan                       │
│ Mulai: 08:30                            │
│                                          │
│ Saldo Real-time:                         │
│ Kas Retail:    Rp 2.700.000             │
│ Kas BRILink:   Rp 5.245.000             │
│                                          │
│ Hari Ini:                                │
│ + Penjualan      Rp 350.000             │
│ + Fee BRILink    Rp 45.000              │
│ + Cash In        Rp 0                   │
│ - Cash Out       Rp 100.000             │
│                                          │
│ [💰 Cash In]  [💸 Cash Out]             │
│                                          │
│ [■ Tutup Shift]                         │
└─────────────────────────────────────────┘
```

**Tutup shift:**
```
┌─────────────────────────────────────────┐
│ Tutup Shift                              │
│                                          │
│ Hitung uang fisik di laci kas:          │
│ Kas Retail:  [_________] Rp             │
│ Kas BRILink: [_________] Rp             │
│                                          │
│ (Opsional) Breakdown denominasi:        │
│ 100rb: [_] 50rb: [_] 20rb: [_]         │
│ 10rb: [_] 5rb: [_] 2rb: [_] 1rb: [_]  │
│                                          │
│ Expected: Rp 2.700.000                  │
│ Actual:   Rp 2.680.000                  │
│ Selisih:  -Rp 20.000 ⚠                │
│                                          │
│ Catatan: [_________________________]    │
│                                          │
│ [✓ Konfirmasi Tutup Shift]              │
└─────────────────────────────────────────┘
```

---

## 24. Menu BRILink — Dashboard & Transaksi

### 24.1 Halaman BRILink Menu (`/brilink/menu`)

```
┌─────────────────────────────────────────┐
│ 🏦 BRILink                              │
│                                          │
│ Saldo Rekening BRI:                      │
│ ┌─────────────────────────────────────┐ │
│ │ BRI ****1234          Rp 5.200.000  │ │
│ │ Saldo terakhir update: 08:30 hari ini│ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Layanan:                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Transfer│ │Transfer│ │ Tarik  │       │
│ │  BRI   │ │Antar Bk│ │ Tunai  │       │
│ └────────┘ └────────┘ └────────┘       │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Top Up  │ │Top Up  │ │ Token  │       │
│ │ Pulsa  │ │E-Wallet│ │  PLN   │       │
│ └────────┘ └────────┘ └────────┘       │
│                                          │
│ Transaksi Terakhir (3):                  │
│ TRF BRI Rp 500rb → 08123... 09:30      │
│ Tarik   Rp 1jt   → Pak Ahmad   09:15   │
│ Pulsa   Rp 50rb  → 08567...    08:45   │
└─────────────────────────────────────────┘
```

### 24.2 Flow Transaksi BRILink:

```
1. Kasir pilih layanan (misal: Transfer BRI)
2. Input: tujuan, nominal, nama penerima
3. Sistem auto-hitung fee berdasarkan BrilinkFee config
4. Tampil: Nominal + Fee = Total bayar pelanggan
5. Konfirmasi → catat transaksi + kurangi saldo rekening BRI
6. Cetak struk BRILink
```

### 24.3 Saldo Rekening BRI (BrilinkAccount)

- Admin input saldo manual di awal
- Setiap transaksi BRILink: saldo berkurang (transfer keluar, tarik tunai) atau bertambah (setor)
- Mutasi tercatat di `BrilinkMutation`
- Alert jika saldo di bawah threshold

---

## 25. Halaman Pengaturan — Lengkap

### 25.1 Struktur Menu Pengaturan (`/settings`)

```
┌─────────────────────────────────────────┐
│ ⚙️ Pengaturan                           │
│                                          │
│ ── Profil ──                             │
│ [Foto] Nama: Sopyan                      │
│        No HP: 08123456789                │
│        Alamat: Jl. ...                   │
│        [Simpan Profil]                   │
│                                          │
│ ── Email & Verifikasi ──                 │
│ Belum ada email                          │
│ [+ Tambah Email]                         │
│                                          │
│ ── Shift ──                              │
│ Status: 🟢 Aktif (3j 20m)              │
│ [Kelola Shift]                           │
│ Riwayat shift terakhir (3 items)         │
│                                          │
│ ── Keamanan ──                           │
│ [🔑 Ganti PIN]                          │
│ [🔄 Minta Reset PIN ke Admin]           │
│                                          │
│ ── Printer ──                            │
│ Status: Belum terhubung                  │
│ [🖨 Hubungkan Printer Bluetooth]         │
│ Printer terakhir: RPP02N                 │
│                                          │
│ ── Aplikasi ──                           │
│ Versi: 1.0.0                            │
│ [🚪 Logout]                             │
└─────────────────────────────────────────┘
```

### 25.2 Section Printer (Baru)

Kasir bisa pair printer Bluetooth dari halaman Pengaturan (bukan hanya saat cetak struk):
- Pair sekali → nama printer tersimpan di localStorage
- Saat cetak struk: auto-reconnect ke printer yang sudah di-pair
- Jika printer berubah: bisa "Ganti Printer" dari pengaturan

### 25.3 Section Sistem Shift (Admin Panel)

Di admin panel, ada setting:
```
Pengaturan > Sistem Shift
├── Mode Shift: [Saldo Mengalir ▼] / [Shift Reset]
├── Multi-Kasir: [Strict (1 kasir/shift) ▼] / [Relaxed (shared)]
├── Koreksi Saldo: [✓ Wajib saat buka shift]
├── Hitung Fisik: [✓ Wajib saat tutup shift]
└── Kategori Cash In/Out: [Kelola →]
```

### 25.4 Kategori Cash In/Out (Admin Panel CRUD)

Admin bisa custom kategori pengeluaran/pemasukan:

```
Pengaturan > Kategori Kas
┌────────────────────────────────────────┐
│ Cash In:                                │
│ • Setor Modal          [Edit] [Hapus]  │
│ • Terima Titipan       [Edit] [Hapus]  │
│ • [+ Tambah]                           │
│                                         │
│ Cash Out:                               │
│ • Keperluan Rumah      [Edit] [Hapus]  │
│ • Beli Stok            [Edit] [Hapus]  │
│ • Listrik/Air          [Edit] [Hapus]  │
│ • Gaji Karyawan        [Edit] [Hapus]  │
│ • [+ Tambah]                           │
└────────────────────────────────────────┘
```

---

## 26. Database Changes untuk Shift + Cash Flow

### 26.1 Tambahan Model

```prisma
model CashFlowCategory {
  id          String    @id @default(cuid())
  shop        Shop      @relation(fields: [shopId], references: [id])
  shopId      String
  name        String    // "Keperluan Rumah", "Beli Stok", dll
  type        String    // "CASH_IN" | "CASH_OUT"
  icon        String?
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)

  cashFlows   CashFlow[]

  @@unique([shopId, name, type])
  @@map("cash_flow_categories")
}

model CashFlow {
  id          String    @id @default(cuid())
  shop        Shop      @relation(fields: [shopId], references: [id])
  shopId      String
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  shift       Shift?    @relation(fields: [shiftId], references: [id])
  shiftId     String?
  category    CashFlowCategory @relation(fields: [categoryId], references: [id])
  categoryId  String
  
  type        String    // "CASH_IN" | "CASH_OUT"
  amount      Int
  notes       String?
  
  // Approval
  status      String    @default("PENDING") // PENDING, VERIFIED, REJECTED
  verifiedBy  String?   // admin userId
  verifiedAt  DateTime?
  rejectReason String?
  
  createdAt   DateTime  @default(now())

  @@index([shopId, createdAt])
  @@index([shiftId])
  @@map("cash_flows")
}
```

### 26.2 Tambahan Field di ShopSetting:

```prisma
model ShopSetting {
  // existing...
  shiftMode         String  @default("FLOWING") // "FLOWING" | "RESET"
  shiftMultiKasir   String  @default("STRICT")  // "STRICT" | "RELAXED"
  shiftCorrectionRequired Boolean @default(true)
  shiftPhysicalCountRequired Boolean @default(true)
}
```

---

## 27. API Endpoints Baru (Shift + Cash Flow)

### Shift
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/shifts/current` | Get shift aktif + saldo real-time |
| POST | `/api/shifts/open` | Buka shift (dengan koreksi opsional) |
| POST | `/api/shifts/:id/close` | Tutup shift (input actual cash) |
| GET | `/api/shifts/last-balance` | Saldo terakhir (untuk tampil saat buka shift) |

### Cash Flow
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/cash-flows` | Catat Cash In/Out |
| GET | `/api/cash-flows` | List cash flow (filter: shift, date, type) |
| GET | `/api/cash-flows/categories` | List kategori cash flow |
| POST | `/api/cash-flows/categories` | Buat kategori baru (admin) |
| PATCH | `/api/cash-flows/:id/verify` | Admin verifikasi pengeluaran |
| PATCH | `/api/cash-flows/:id/reject` | Admin tolak pengeluaran |

### Admin Settings
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/shops/:id/settings` | Get semua settings toko |
| PATCH | `/api/shops/:id/settings` | Update settings (shift mode, dll) |

---

## 28. Prioritas Implementasi Berikutnya

### Sprint 5: Shift + Cash Flow
1. DB Migration (CashFlowCategory, CashFlow, ShopSetting fields)
2. Backend: Cash Flow CRUD + categories
3. Backend: Shift open/close with saldo mengalir
4. Frontend: Halaman Shift redesign (buka/tutup/cash in/out)
5. Frontend: Dashboard saldo real-time
6. Admin: Kategori Cash In/Out CRUD
7. Admin: Verifikasi pengeluaran

### Sprint 6: BRILink Complete
8. Frontend: BRILink menu + form transaksi
9. Backend: BRILink transaction flow (auto fee calc)
10. Frontend: Saldo rekening BRI display
11. Frontend: Cetak struk BRILink

### Sprint 7: Polish for Sale
12. Admin: Setting mode shift (A/B toggle)
13. Admin: Multi-kasir setting
14. Pengaturan kasir: section Printer
15. Landing page / marketing site
16. Documentation untuk buyer
