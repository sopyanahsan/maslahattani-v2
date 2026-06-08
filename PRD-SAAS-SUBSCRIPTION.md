# PRD: SaaS Multi-Tenant + Subscription System

## Overview
Transformasi Ngalir POS dari single-deploy menjadi platform SaaS multi-tenant berlangganan.
Semua tenant di-host di 1 VPS (shared infrastructure), data ter-isolasi per tenant.

---

## 1. Arsitektur Hosting (1 VPS)

```
VPS (Ubuntu/Debian)
├── Nginx (reverse proxy + SSL)
│   ├── app.ngalir.id → Frontend admin
│   ├── kasir.ngalir.id → Webapp kasir
│   ├── api.ngalir.id → Backend NestJS
│   └── owner.ngalir.id → Dashboard SaaS Owner (kamu)
├── PostgreSQL (1 database, multi-tenant via tenant_id)
├── Redis (session, cache, rate-limit)
├── Node.js (NestJS backend, single instance)
├── PM2 (process manager, auto-restart)
└── Let's Encrypt (SSL gratis)
```

### Kenapa 1 DB multi-tenant (bukan DB per tenant)?
- Hemat RAM & storage di VPS
- Lebih gampang maintain (1x migration = semua tenant update)
- Query cross-tenant untuk analytics owner dashboard
- Scale nanti: bisa pisah ke DB terpisah kalau udah ribuan tenant

---

## 2. Paket & Harga

| Plan | Harga/bln | Harga/thn | Lifetime | Limit |
|------|-----------|-----------|----------|-------|
| **Trial** | Gratis | - | - | 14 hari, 1 cabang, 2 user, 50 produk |
| **Basic** | Rp 99.000 | Rp 999.000 | Rp 1.499.000 | 1 cabang, 3 kasir, 500 produk, Retail only |
| **Pro** | Rp 199.000 | Rp 1.999.000 | Rp 2.999.000 | 3 cabang, 10 kasir, unlimited produk, + BRILink |
| **Enterprise** | Rp 499.000 | Rp 4.999.000 | Rp 7.499.000 | Unlimited, semua fitur, priority support |

### Lifetime Plan:
- Bayar 1x = langganan selamanya (endDate = null, tidak pernah expire)
- Harga ~15x bulanan (break-even 15 bulan)
- Tetap dapat update fitur & maintenance
- Cocok untuk toko yang sudah yakin mau pakai jangka panjang

---

## 3. Enforcement Logic

### Di setiap API request:
```
1. Extract tenantId dari user JWT
2. Cek subscription status:
   - ACTIVE / TRIAL → lanjut
   - EXPIRED (masih grace) → lanjut + warning
   - SUSPENDED / CANCELLED → block 403
3. Cek plan limits:
   - Tambah cabang? Cek maxBranches
   - Tambah kasir? Cek maxUsers
   - Tambah produk? Cek maxProducts
4. Cek fitur per plan:
   - BRILink → hanya PRO & ENTERPRISE
   - Export PDF/Excel → hanya PRO+
   - Multi-cabang → hanya PRO+
```

### Grace Period:
```
endDate lewat → EXPIRED (7 hari grace)
graceEndsAt lewat → SUSPENDED (akses diblokir, data aman)
```

---

## 4. Dashboard SaaS Owner (owner.ngalir.id)

### Menu:
1. **Dashboard** — Total tenant, MRR, revenue chart
2. **Tenants** — List/filter semua toko, detail, edit plan
3. **Subscriptions** — Due dates, siapa mau expire
4. **Payments** — Verifikasi manual, riwayat
5. **Plans** — CRUD paket (ubah harga/limit)
6. **Notifications** — Kirim reminder bayar
7. **System** — VPS health, DB size, maintenance mode

---

## 5. Flow Registrasi

```
Landing page → "Coba Gratis 14 Hari"
  → Isi: Nama Toko, Nama Pemilik, No WA, Password
  → Sistem buat: Tenant + Subscription(TRIAL) + User + Shop
  → Redirect ke admin panel
  → H-3 reminder → H+0 expire → H+7 suspend
```

---

## 6. Flow Pembayaran (Phase 1: Manual)

```
Tenant → Halaman Billing → Pilih Plan + Cycle
  → Dapat instruksi transfer (BRI/BCA + kode unik)
  → Transfer → Kirim bukti WA/upload
  → Owner verify di dashboard → Langganan aktif
```

---

## 7. Pertanyaan untuk Diskusi

1. **Domain**: Sudah punya? Mau pakai apa? (ngalir.id?)
2. **Landing page**: Perlu atau langsung form register?
3. **Bank transfer**: Bank apa? (BRI saja / BRI+BCA?)
4. **WA Notification**: Manual atau API (Fonnte)?
5. **Lifetime harga**: 15x bulanan OK? Atau adjust?
6. **Trial period**: 14 hari cukup?
7. **VPS provider**: Pakai apa? Specs?
