# PRD: SaaS Multi-Tenant + Subscription System — POSIFY

## Overview
Transformasi **Posify** (sebelumnya Ngalir) dari single-deploy menjadi platform SaaS multi-tenant berlangganan.
Semua tenant di-host di 1 VPS RumahZone (shared infrastructure), data ter-isolasi per tenant.

**Brand:** Posify — Sistem POS & BRILink Modern untuk UMKM Indonesia

---

## 1. Arsitektur Hosting (1 VPS RumahZone)

```
VPS RumahZone
├── Nginx (reverse proxy + SSL)
│   ├── posify.id → Landing page
│   ├── app.posify.id → Frontend admin panel
│   ├── kasir.posify.id → Webapp kasir (POS)
│   ├── api.posify.id → Backend NestJS
│   └── owner.posify.id → Dashboard SaaS Owner
├── PostgreSQL (1 database, multi-tenant via tenant_id)
├── Redis (session, cache, rate-limit)
├── Node.js (NestJS backend, single instance)
├── PM2 (process manager, auto-restart)
└── Let's Encrypt (SSL gratis)
```

---

## 2. Paket & Harga

| Plan | Harga/bln | Harga/thn | Lifetime |
|------|-----------|-----------|----------|
| **Trial** | Gratis | - | - |
| **Basic** | Rp 49.000 | Rp 499.000 | Rp 400.000 |
| **Pro** | Rp 99.000 | Rp 999.000 | Rp 700.000 |
| **Enterprise** | Rp 199.000 | Rp 1.999.000 | Rp 1.200.000 |

### Limit per Plan:

| Fitur | Trial | Basic | Pro | Enterprise |
|-------|-------|-------|-----|------------|
| Durasi | 14 hari | - | - | - |
| Cabang | 1 | 1 | 3 | Unlimited |
| Kasir | 2 | 3 | 10 | Unlimited |
| Produk | 50 | 500 | Unlimited | Unlimited |
| BRILink | ❌ | ❌ | ✅ | ✅ |
| Export PDF/Excel | ❌ | ❌ | ✅ | ✅ |
| Stock Opname | ❌ | ✅ | ✅ | ✅ |
| Supplier & PO | ❌ | ❌ | ✅ | ✅ |
| Transfer Stok | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |

### Lifetime:
- Bayar 1x = selamanya (endDate = null)
- Tetap dapat update fitur & maintenance
- Harga jauh lebih murah dari tahunan (incentive early adopter)

---

## 3. Metode Pembayaran (Phase 1: Manual)

| Metode | Detail |
|--------|--------|
| **SeaBank** | Transfer ke rekening Posify |
| **BCA** | Transfer ke rekening Posify |
| **E-Wallet** | DANA / OVO / GoPay via QRIS statis |

### Flow:
```
Billing → Pilih Plan → Dapat instruksi transfer + kode unik
  → Bayar → Kirim bukti WA → Owner verify → Aktif
```

---

## 4. Landing Page (posify.id)

1. **Hero** — "Kelola Toko Lebih Cerdas dengan Posify" + CTA register
2. **Fitur** — 6 cards (POS, BRILink, Multi-Cabang, Laporan, Opname, Multi-User)
3. **Screenshot** — Preview UI
4. **Pricing** — Toggle bulanan/tahunan/lifetime
5. **FAQ**
6. **CTA Footer** — Register / WA

---

## 5. Owner Dashboard (owner.posify.id)

1. **Dashboard** — Total tenant, MRR, revenue chart
2. **Tenants** — CRUD semua toko
3. **Subscriptions** — Status, due dates
4. **Payments** — Verify manual, riwayat
5. **Plans** — CRUD paket harga
6. **WA Reminder** — Queue reminder, mark sent
7. **System** — VPS health, maintenance mode

---

## 6. Database Schema

```prisma
model Tenant {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  ownerName     String
  ownerPhone    String
  ownerEmail    String    @unique
  subscription  Subscription?
  shops         Shop[]
  users         User[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Subscription {
  id            String    @id @default(cuid())
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  tenantId      String    @unique
  plan          PlanType  // TRIAL, BASIC, PRO, ENTERPRISE
  cycle         CycleType // MONTHLY, YEARLY, LIFETIME
  status        SubStatus // TRIAL, ACTIVE, EXPIRED, SUSPENDED, LIFETIME
  startDate     DateTime
  endDate       DateTime? // null = lifetime
  graceEndsAt   DateTime?
  maxBranches   Int       @default(1)
  maxUsers      Int       @default(2)
  maxProducts   Int       @default(50)
  brilinkEnabled    Boolean @default(false)
  exportEnabled     Boolean @default(false)
  opnameEnabled     Boolean @default(false)
  supplierEnabled   Boolean @default(false)
  transferEnabled   Boolean @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Payment {
  id            String    @id @default(cuid())
  tenantId      String
  amount        Int
  method        String    // SEABANK, BCA, QRIS
  cycle         CycleType
  plan          PlanType
  status        PaymentStatus // PENDING, VERIFIED, REJECTED
  proofUrl      String?
  verifiedAt    DateTime?
  verifiedBy    String?
  notes         String?
  createdAt     DateTime  @default(now())
}

enum PlanType { TRIAL, BASIC, PRO, ENTERPRISE }
enum CycleType { MONTHLY, YEARLY, LIFETIME }
enum SubStatus { TRIAL, ACTIVE, EXPIRED, SUSPENDED, CANCELLED, LIFETIME }
enum PaymentStatus { PENDING, VERIFIED, REJECTED }
```

---

## 7. Implementation Phases

### Phase 1 (MVP Launch) — 2 minggu
- [ ] Rebrand Ngalir → Posify (title, logo placeholder, colors)
- [ ] Database: Tenant + Subscription + Payment
- [ ] Backend: Subscription guard middleware
- [ ] Backend: Plan limit enforcement
- [ ] Frontend: Billing page + expired page
- [ ] Landing page (posify.id)
- [ ] Owner Dashboard (owner.posify.id) — CRUD tenant + verify payment
- [ ] Registration flow (create tenant + trial)
- [ ] Deploy ke VPS RumahZone

### Phase 2 (Growth) — Bulan ke-2
- [ ] WA API (auto-reminder)
- [ ] Payment gateway (auto-verify)
- [ ] Onboarding wizard
- [ ] Referral system

### Phase 3 (Scale) — Bulan ke-3+
- [ ] Custom subdomain per tenant
- [ ] Mobile app
- [ ] Marketplace addon

---

## 8. Rebrand: Ngalir → Posify

| Item | Dari | Ke |
|------|------|-----|
| Nama | Ngalir / Maslahat Tani | **Posify** |
| Domain | maslahattani.my.id | **posify.id** |
| Title | "Ngalir Admin" | "Posify" |
| Tagline | - | "Sistem POS Modern untuk UMKM" |
| Email | - | hello@posify.id |
| WA | - | +62xxx (WA Business) |

---

## Keputusan Final:

- ✅ Brand: **Posify**
- ✅ VPS: RumahZone (1 server shared)
- ✅ Bank: SeaBank + BCA + E-Wallet (QRIS)
- ✅ Trial: 14 hari gratis
- ✅ Lifetime: Basic 400rb, Pro 700rb, Enterprise 1.2jt
- ✅ Landing page: posify.id (fitur + pricing + register)
- ✅ WA: manual dulu
- ✅ Owner Dashboard: owner.posify.id
