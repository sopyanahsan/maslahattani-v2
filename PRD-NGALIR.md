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
