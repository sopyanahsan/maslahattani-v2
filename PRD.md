# PRD Maslahat Tani v2 — Sistem POS + BRILink untuk Agen Retail

**Status**: Draft
**Updated**: May 2026
**Owner**: Sopyan Ahsan

---

## 1. Overview & Goals

### Konteks
Maslahat Tani v1 dibangun sebagai aplikasi customized untuk kebutuhan spesifik. Namun, untuk ekspansi market dan penjualan ke agen BRILink lain, aplikasi perlu:
- **Stabilisasi**: Fitur core tetap, tapi structure code lebih maintainable
- **Scalability**: Support multi-cabang, multi-user, offline sync
- **Professionalism**: UI/UX lebih clean, flow lebih jelas, dokumentasi lengkap
- **Market-Ready**: Siap dijual ke agen retail lain dengan minimal customization

### Goals Phase 1 (MVP)
1. ✅ Autentikasi (Gmail kasir, admin panel, password reset)
2. ✅ Transaksi Retail (POS dasar dengan offline support)
3. ✅ Hutang Pembeli (tracking cicilan & deadline)
4. ✅ Manajemen Stok (CRUD, riwayat, opname)
5. ✅ Kas & QRIS (payment tracking)
6. ✅ Shift Settlement (clerek harian)
7. ✅ Admin Pengaturan (bahasa, data toko, multi-cabang)
8. ✅ Offline + Auto-Sync (IndexedDB, WatermelonDB)
9. ✅ Laporan Dasar (retail omzet, profit)

### Goals Phase 2 (Ekspansi)
- BRILink Integration (transfer, fee, mutasi)
- Stok Opname Session Management
- Supplier Management & PO
- Multi-cabang Transfer (approval flow)
- Advanced Analytics & Forecasting
- Mobile APK (native features)

---

## 2. Target Users & Personas

### User Type 1: Agen BRILink + Retail Owner (Admin)
- **Background**: Pemilik toko retail + agen BRILink
- **Goals**: 
  - Kelola transaksi retail dan BRILink dari satu dashboard
  - Monitor profit, stok, hutang real-time
  - Kelola kasir dan staff
  - Buka cabang baru tanpa ganti aplikasi
- **Platform**: Web (admin panel), mobile opsional
- **Volume**: 1-5 transaksi/jam per cabang

### User Type 2: Kasir / Petugas Retail (Kasir)
- **Background**: Petugas toko yang handle POS, stok, pelanggan
- **Goals**:
  - Proses transaksi penjualan cepat
  - Lihat stok real-time
  - Akses dari perangkat apa saja
  - Bisa kerja offline (sinyal jelek)
- **Platform**: Web (webapp kasir), mobile (PWA/APK)
- **Volume**: 50-200 transaksi/hari

### User Type 3: BRILink Customer (Future)
- **Background**: Customer yang transfer lewat BRILink
- **Goals**: Kirim uang dengan fee murah
- **Platform**: Mobile (lite)
- **Phase**: 2+

---

## 3. Functional Requirements — Phase 1

### 3.1 AUTENTIKASI (Step 1 - Foundational)

#### Kasir Webapp
```
Flow Daftar:
1. Buka kasir.maslahat-tani.com
2. Klik "Daftar" → input email (Gmail)
3. System kirim OTP ke email
4. Input OTP → auto role = KASIR
5. Buat password
6. Redirect ke dashboard kasir

Flow Login:
1. Email + password
2. 2FA optional (enable di pengaturan admin)
3. Session token JWT (24 jam valid)
4. Refresh token (30 hari valid)

Password Reset:
1. Klik "Lupa Password"
2. Input email → OTP dikirim
3. Input OTP + password baru
4. Success redirect login
```

#### Admin Panel
```
Flow Login:
1. Buka admin.maslahat-tani.com
2. Username + password
3. 2FA dengan OTP (mandatory)
4. Session token JWT (8 jam)
5. Refresh token (7 hari)

Manajemen Kasir (Admin):
- List semua kasir
- Buat kasir baru (input email, auto-generate username dengan suggestion)
- Reset password kasir
- Disable/enable kasir
- Assign kasir ke cabang
- Set role: KASIR, CASHIER_SUPERVISOR (future)

Manajemen Admin:
- Hanya user dengan role SUPER_ADMIN bisa buat admin baru
- Username auto-suggestion jika duplicate
- Password auto-generated, diubah di login pertama
```

#### Database Schema (Auth)
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String?   @unique
  passwordHash    String
  role            Role      @default(KASIR)  // ADMIN, KASIR, CASHIER_SUPERVISOR
  status          Status    @default(ACTIVE)  // ACTIVE, INACTIVE, SUSPENDED
  shop            Shop?     @relation(fields: [shopId], references: [id])
  shopId          String?
  
  lastLogin       DateTime?
  lastPasswordReset DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  sessions        Session[]
  activityLogs    ActivityLog[]
}

model Session {
  id              String    @id @default(cuid())
  user            User      @relation(fields: [userId], references: [id])
  userId          String
  token           String    @unique
  refreshToken    String    @unique
  expiresAt       DateTime
  refreshExpiresAt DateTime
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime  @default(now())
}

enum Role {
  SUPER_ADMIN
  ADMIN
  KASIR
  CASHIER_SUPERVISOR
}

enum Status {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

#### API Endpoints (Auth)
```
POST /api/auth/register-kasir
  Body: { email, password }
  Response: { success, message, redirectUrl }

POST /api/auth/verify-otp
  Body: { email, otp }
  Response: { success, token }

POST /api/auth/login
  Body: { email/username, password, otp? }
  Response: { token, refreshToken, user }

POST /api/auth/refresh-token
  Body: { refreshToken }
  Response: { token, refreshToken }

POST /api/auth/logout
  Response: { success }

POST /api/auth/forgot-password
  Body: { email }
  Response: { success, message }

POST /api/auth/reset-password
  Body: { email, otp, newPassword }
  Response: { success }

POST /api/auth/me
  Response: { user }

[ADMIN ONLY]
POST /api/admin/kasir
  Body: { email, shopId }
  Response: { kasir, suggestedUsername }

GET /api/admin/kasir
  Response: { kasir[] }

PUT /api/admin/kasir/:id
  Body: { status, shopId }
  Response: { kasir }

POST /api/admin/kasir/:id/reset-password
  Response: { tempPassword }
```

---

## 4. Non-Functional Requirements

### 4.1 Offline & Sync
- **Offline Storage**: IndexedDB (web), WatermelonDB (mobile)
- **Sync Strategy**: 
  - Auto-sync every 10 detik jika online
  - Queue action saat offline
  - Conflict resolution: last-write-wins
  - Local data tetap akurat sampai sync selesai
- **Data Priority**: Transaksi > Stok > Hutang > Metadata

### 4.2 Performance
- **Target**: 
  - Page load < 3s (cached)
  - API response < 500ms
  - Transaksi proses < 1s
- **Caching**: 
  - Client: Browser cache + IndexedDB
  - Server: Redis untuk product, stok
  - Database: Query optimization, indexing

### 4.3 Security
- **Auth**: JWT + Refresh token rotation
- **HTTPS**: Mandatory, TLS 1.3+
- **CORS**: Restricted ke domain known
- **Rate Limiting**: 100 req/min per user
- **Data**: Encrypt sensitive (password, payment info)
- **Audit**: Log semua action admin + transaction

### 4.4 Internationalization
- **Default**: Bahasa Indonesia
- **Settable**: Admin bisa pilih di pengaturan (future: English, Sundanese, Javanese)
- **Date Format**: DD/MM/YYYY, time 24-jam
- **Currency**: Rp (IDR)

### 4.5 Browser & Device Compatibility
- **Web Admin**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Webapp Kasir**: Chrome, Firefox, Safari, Edge, Samsung Internet
- **Mobile**: Capacitor APK (Android 10+), iOS (14+)
- **Responsive**: Desktop, tablet, mobile

### 4.6 Data Retention & Backup
- **Backup**: Daily automated backup (PostgreSQL dump)
- **Retention**: 
  - Active data: 2 tahun (production)
  - Archive data: 5 tahun (cold storage)
  - Logs: 6 bulan
- **Recovery**: RTO 1 jam, RPO 15 menit

---

## 5. Tech Stack & Arsitektur

### Backend
```
Runtime: Node.js 20 LTS
Framework: NestJS (TypeScript)
Database: PostgreSQL 14+
ORM: Prisma
API: REST (GraphQL phase 2)
Authentication: JWT + Passport
Queue: Bull/Redis (background jobs)
Cache: Redis
Logging: Winston
Validation: Class-validator, Joi
Testing: Jest, Supertest
```

### Frontend (Admin Panel)
```
Framework: Nuxt 3 (Vue 3 + Vite)
UI Library: Tailwind CSS
Components: Headless (Radix Vue)
State: Pinia
Offline: IndexedDB
Sync: TanStack Query + custom sync logic
Form: VeeValidate
HTTP Client: Axios
Testing: Vitest, Vue Test Utils
```

### Frontend (Webapp Kasir)
```
Same stack as admin panel
Additional: Service Worker (PWA)
Storage: IndexedDB
```

### Mobile (Capacitor)
```
Framework: Capacitor (wraps Nuxt web)
Platform: Android, iOS
Native Features: 
  - Camera (barcode scanning)
  - Printer (thermal struk)
  - Notifications
  - Background Sync
```

### DevOps & Deployment
```
VCS: GitHub
CI/CD: GitHub Actions
Container: Docker, Docker Compose
Orchestration: Docker Compose (single VPS, phase 2: Kubernetes)
Hosting: VPS (DigitalOcean, Linode, atau custom)
CDN: Cloudflare
Monitoring: Sentry (errors), Datadog (performance)
```

### Folder Structure
```
maslahattani-v2/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── shops/
│   │   ├── transactions/
│   │   ├── products/
│   │   ├── stock/
│   │   ├── debts/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── common/ (guards, filters, interceptors)
│   │   ├── config/
│   │   └── main.ts
│   ├── prisma/
│   ├── test/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
├── frontend/
│   ├── nuxt.config.ts
│   ├── src/
│   │   ├── pages/ (admin layout)
│   │   ├── app/ (kasir layout - webapp)
│   │   ├── components/
│   │   ├── stores/
│   │   ├── composables/
│   │   ├── services/ (API calls, sync)
│   │   ├── types/
│   │   ├── utils/
│   │   └── layouts/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── mobile/
│   ├── capacitor.config.ts
│   ├── android/
│   └── ios/
├── .github/workflows/
├── docker-compose.yml (root)
├── PRD.md
└── README.md
```

---

## 6. Data Model (High-level)

### Core Entities
```
User (id, email, username, passwordHash, role, shopId)
Shop (id, name, address, phone, ownerId, parentShopId)
Product (id, name, sku, price, cost, shopId, supplierId)
Stock (id, productId, quantity, warehouse, shopId)
Transaction (id, transactionNumber, userId, totalPrice, totalCost, status, shopId, timestamp)
TransactionItem (id, transactionId, productId, quantity, price, discount)
Debt (id, customerId, productId, quantity, dueDate, paidAmount, totalAmount, shopId)
Payment (id, transactionId, method, amount, status, timestamp)
CashBox (id, shopId, balance, lastAudit, timestamp)
Shift (id, userId, shopId, startTime, endTime, totalCash, totalQRIS, variance, status)
```

---

## 7. API Surface (High-level) — Phase 1

```
AUTH
POST /api/auth/register-kasir
POST /api/auth/verify-otp
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password

SHOP (Admin Only)
GET /api/shops
POST /api/shops
PUT /api/shops/:id
GET /api/shops/:id/select (set current shop context)

USERS (Admin Only)
GET /api/users
POST /api/users (create kasir)
PUT /api/users/:id
DELETE /api/users/:id

TRANSACTIONS
GET /api/transactions (list)
POST /api/transactions (create - kasir)
GET /api/transactions/:id
POST /api/transactions/:id/void (admin with OTP)
GET /api/transactions/stats (dashboard)

PRODUCTS
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

STOCK
GET /api/stock
POST /api/stock/in
POST /api/stock/opname
GET /api/stock/history

DEBTS
GET /api/debts
POST /api/debts
PUT /api/debts/:id/payment
GET /api/debts/by-customer/:customerId

PAYMENTS
GET /api/payments
POST /api/payments

SHIFTS
POST /api/shifts/open
POST /api/shifts/close
GET /api/shifts/:id
POST /api/shifts/:id/finalize

SETTINGS (Admin Only)
GET /api/settings
PUT /api/settings/language
PUT /api/settings/shop-data
PUT /api/settings/receipt-config
```

---

## 8. User Stories — Phase 1

### Authentication
```
US-1: Kasir dapat register via Gmail
  As a kasir
  I want to register dengan email Gmail saya
  So that I dapat langsung mulai transaksi tanpa menunggu admin

US-2: Admin dapat login ke panel admin
  As an admin
  I want to login dengan username + password + OTP
  So that hanya admin resmi yang akses admin panel

US-3: User dapat reset password jika lupa
  As a user
  I want to reset password via OTP email
  So that saya dapat akses kembali jika lupa password

US-4: Admin dapat buat kasir baru
  As an admin
  I want to buat kasir baru dengan suggest username
  So that saya dapat kelola staff kasir dengan mudah
```

### Transaction (POS)
```
US-5: Kasir dapat proses transaksi retail
  As a kasir
  I want to scan produk, input qty, pilih metode bayar
  So that saya dapat proses penjualan dengan cepat

US-6: Transaksi bisa offline
  As a kasir
  I want to transaksi tetap bisa diproses saat offline
  So that penjualan ga terputus karena sinyal jelek

US-7: Admin dapat void transaksi dengan OTP
  As an admin
  I want to batalkan transaksi tertentu dengan konfirmasi OTP
  So that pembatalan aman dan teraudit
```

### Stock Management
```
US-8: Admin dapat manage stok produk
  As an admin
  I want to CRUD stok, input modal, track history
  So that saya dapat kelola inventaris dengan detail

US-9: Kasir dapat lihat stok real-time
  As a kasir
  I want to lihat stok produk di POS
  So that saya tau stok sebelum proses transaksi
```

### Shift Settlement
```
US-10: Admin dapat buka shift kasir
  As an admin
  I want to open shift kasir di pagi
  So that transaksi kasir terlogger dengan shift yang jelas

US-11: Admin dapat tutup shift dengan clerek
  As an admin
  I want to input nominal uang fisik hari itu, hitung selisih
  So that saya dapat audit kas harian dengan detail
```

---

## 9. Implementation Roadmap

### Phase 1: MVP Stabilisasi (8-10 minggu)
- **Week 1-2**: Setup infrastructure (repo, CI/CD, database, Docker)
- **Week 2-3**: Authentication module (kasir register, admin login, JWT)
- **Week 4-5**: Transaction module (POS, offline support)
- **Week 6**: Stock management (CRUD, riwayat)
- **Week 7**: Payments & Cash box
- **Week 8**: Shift settlement & basic reports
- **Week 9**: Admin settings (bahasa, multi-cabang)
- **Week 10**: Testing, bug fix, deploy staging

### Phase 2: Ekspansi (12+ minggu)
- BRILink module (API integration, fee calculation)
- Advanced stock (opname, transfer, supplier)
- Mobile APK features (barcode scanner, thermal printer)
- Advanced analytics & forecasting
- GraphQL API

---

## 10. Success Criteria (Phase 1)

### Functional
- ✅ Authentication working (kasir register, admin login, password reset)
- ✅ POS dapat process minimal 100 transaksi/hari per kasir
- ✅ Offline mode bisa sync otomatis
- ✅ Admin dapat multi-shop management
- ✅ Shift settlement calculation akurat
- ✅ Semua fitur teruji manual dan automated

### Non-Functional
- ✅ Load time < 3 detik (cached)
- ✅ 99.5% uptime production
- ✅ Zero critical security issues (OWASP top 10)
- ✅ Backup automated, recovery tested

### User Satisfaction
- ✅ Admin + kasir dapat trained dalam 30 menit
- ✅ Zero breaking changes untuk kasir yang upgrade dari v1
- ✅ Support response < 4 jam

---

## 11. Out of Scope (Phase 1)

- ❌ BRILink integration (Phase 2)
- ❌ Advanced analytics (Phase 2)
- ❌ Mobile native features (Phase 2)
- ❌ Multi-language (hanya Bahasa Indonesia Phase 1)
- ❌ Supplier PO system (Phase 2)
- ❌ Customer mobile app (Phase 2+)

---

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data loss dari offline sync | HIGH | Test sync conflict resolution, automated backup |
| Performance degrade dengan multi-cabang | MEDIUM | Database indexing, caching strategy, load testing |
| Kasir tidak adopt offline mode | MEDIUM | Training, clear UI indicators, fallback to manual |
| Security breach (OTP abuse) | HIGH | Rate limiting, log audit, 2FA mandatory |
| VPS downtime migration | HIGH | Blue-green deployment, automated failover |

---

**Next Steps:**
1. Review & approve PRD
2. Setup backend infrastructure
3. Start authentication implementation
