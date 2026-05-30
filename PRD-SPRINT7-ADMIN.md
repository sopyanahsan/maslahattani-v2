# PRD Sprint 7 — Admin Panel Complete

## Tujuan
Menyelesaikan seluruh fitur admin panel yang masih belum terimplementasi atau masih dalam status "Coming Soon", ditambah polish UX. Sprint ini fokus 100% ke admin panel.

---

## Opsi A — Quick Wins (Perbaiki yang Sudah Ada)

### A1. Cash-Out Approval UI (Admin)

**Status:** Backend endpoint `PATCH /cash-flows/:id/verify` dan `PATCH /cash-flows/:id/reject` sudah ada. Frontend belum ada UI untuk approve/reject.

**Deliverables:**
1. Tab/section baru "Menunggu Persetujuan" di `AdminPaymentsView.vue` (atau halaman terpisah)
2. Tampilkan daftar cash-out yang `status = PENDING` dengan info: tanggal, kasir, kategori, jumlah, catatan
3. Tombol "Setujui" (hijau) → `PATCH /cash-flows/:id/verify`
4. Tombol "Tolak" (merah) → `PATCH /cash-flows/:id/reject` + input alasan penolakan
5. Badge "Pending" count di sidebar / breadcrumb supaya admin tahu ada yang menunggu
6. Setelah approve/reject → item berpindah dari daftar pending, update saldo kas
7. Responsive: stack vertikal di mobile

**API yang dipakai:**
- `GET /api/cash-flows?status=PENDING&shopId=...` (sudah ada)
- `PATCH /api/cash-flows/:id/verify` (sudah ada)
- `PATCH /api/cash-flows/:id/reject` (sudah ada, body: `{ reason: string }`)

---

### A2. Hapus / Redirect Routes "Coming Soon" BRILink

**Status:** 5 routes BRILink admin masih mengarah ke `ComingSoonView`:
- `/admin/brilink/transfer`
- `/admin/brilink/cash`
- `/admin/brilink/topup`
- `/admin/brilink/mutations`
- `/admin/brilink/fees`

Padahal:
- `BrilinkTransaksiView.vue` → sudah menampilkan SEMUA transaksi BRILink (transfer, tarik tunai, top-up)
- `BrilinkFeeView.vue` → sudah CRUD fee per kategori
- `KasRekeningBrilinkView.vue` → sudah punya tab mutasi

**Deliverables:**
1. Redirect `/admin/brilink/transfer`, `/admin/brilink/cash`, `/admin/brilink/topup` → ke `/admin/brilink/transaksi` (dengan filter category otomatis kalau diperlukan)
2. Redirect `/admin/brilink/fees` → ke `/admin/brilink/fee` (sudah ada)
3. Redirect `/admin/brilink/mutations` → ke `/admin/kas-rekening-brilink` (sudah punya tab mutasi)
4. Update menu sidebar admin: hapus item "Coming Soon" BRILink, gunakan link langsung ke halaman yang sudah jadi
5. Opsional: tambah tab kategori di `BrilinkTransaksiView` untuk filter per layanan (Transfer BRI, Tarik Tunai, dll)

---

### A3. Data Connection Audit

**Status:** Halaman-halaman berikut sudah fetch data real:
- AdminReportsView ✅ (reportsService)
- AdminBrilinkView ✅ (dashboardBrilinkService)
- AdminAnalyticsView ✅ (analyticsService)
- AdminOpnameSessionsView ✅ (opnameService)
- AdminSuppliersView ✅ (supplierService)
- AdminTransfersView ✅ (transferService)

**Sisa yang perlu di-audit/fix:**
1. Pastikan `AdminBrilinkView` (Dashboard BRILink) menampilkan saldo rekening BRI REAL dari `brilinkAccountService` (sekarang mungkin dummy)
2. Pastikan chart laba BRILink menggunakan `fee` dari transaksi aktual
3. Verify alert "transaksi gagal hari ini" membaca threshold dari `ShopSetting.alertConfig`
4. AdminReportsView: pastikan breakdown metode pembayaran (CASH/QRIS/HUTANG) benar, dan laba kotor = sum(price - cost)

---

## Opsi B — New Features

### B1. Admin Cash-Out Approval Dedicated Page (Jika A1 Tidak Cukup)

Kalau volume pengeluaran tinggi, bikin halaman terpisah `/admin/cash-out-approval` dengan:
- Tabel pengeluaran pending (sortable by amount/date)
- Bulk approve/reject (checkbox multi-select)
- Filter by kasir / kategori pengeluaran / rentang tanggal
- Riwayat approve/reject (siapa yang approve, kapan)

---

### B2. Supplier & PO — Complete Flow

**Status:** `AdminSuppliersView` sudah ada CRUD supplier + list PO. Yang belum:

**Deliverables:**
1. **Create PO flow:** Pilih supplier → tambah item (produk + qty + harga beli) → simpan sebagai DRAFT/ORDERED
2. **Receive goods (Terima Barang):** Admin tandai PO sebagai RECEIVED → **otomatis update stok** produk terkait (increment stock.quantity)
3. **Partial receive:** Bisa terima sebagian item dulu → status PARTIALLY_RECEIVED → terima sisa kemudian
4. **PO history:** Filter by status (DRAFT/ORDERED/RECEIVED/CANCELLED), supplier, tanggal
5. **Cost tracking:** Harga beli di PO bisa update `product.cost` (HPP) kalau admin setuju

**Backend endpoints yang perlu dibuat/dilengkapi:**
- `POST /api/suppliers/purchase-orders` (sudah ada?)
- `PATCH /api/suppliers/purchase-orders/:id/receive` → update stok
- `PATCH /api/suppliers/purchase-orders/:id/cancel`

---

### B3. Transfer Stok — Approval Flow

**Status:** `AdminTransfersView` sudah list transfer + create. Yang belum jelas:

**Deliverables:**
1. **Status flow:** PENDING → APPROVED/REJECTED → IN_TRANSIT → RECEIVED
2. **Admin toko pengirim** buat transfer request
3. **Admin toko penerima** approve/reject (atau super-admin langsung approve)
4. Saat RECEIVED: stok berkurang di cabang pengirim, bertambah di penerima
5. Notifikasi / badge di sidebar saat ada transfer menunggu approval
6. Cancel transfer (sebelum APPROVED)

---

### B4. Opname — Full Flow

**Status:** `AdminOpnameSessionsView` sudah list sesi + backend endpoint. Yang perlu:

**Deliverables:**
1. **Buka sesi opname:** Lock stok untuk produk tertentu / semua produk
2. **Input stok fisik:** Form per produk — stok sistem vs stok fisik → auto-hitung selisih
3. **Finalisasi opname:** Admin konfirmasi → stok di DB di-adjust ke stok fisik
4. **Riwayat adjustment:** Log setiap adjustment per produk (who, when, old→new)
5. **Cetak lembar opname** (opsional): printable list produk + kolom isian stok fisik

---

## Opsi C — Polish

### C1. Sidebar Badge Notifications

**Deliverables:**
1. Badge merah di menu "Pembayaran" → jumlah cash-out PENDING
2. Badge di "Hutang" → jumlah hutang jatuh tempo / lewat tempo
3. Badge di "Transfer" → jumlah transfer menunggu approval
4. Badge di "Shift" → jumlah shift yang belum di-finalisasi
5. Fetch badge counts sekali saat layout mount (API: gabung di satu endpoint `/api/admin/badge-counts`)

---

### C2. Export Laporan (PDF/Excel)

**Deliverables:**
1. Tombol "Export PDF" dan "Export Excel" di `AdminReportsView`
2. Server-side generation (endpoint baru) atau client-side (xlsx.js + jspdf)
3. Format: laporan penjualan harian/bulanan + laba kotor + breakdown metode bayar
4. Filename otomatis: `Laporan_Penjualan_{tanggal}.pdf`

---

### C3. Responsive Admin Panel (Mobile-Friendly)

**Status:** Admin panel kemungkinan sudah semi-responsive (Tailwind classes). Yang perlu:

**Deliverables:**
1. Sidebar → collapsible drawer di mobile (hamburger menu)
2. Tabel data → horizontal scroll atau card-view di mobile
3. Modal form → full-screen bottom sheet di mobile
4. Touch-friendly action buttons (min 44px tap area)
5. Test di 375px (iPhone SE) dan 768px (iPad)

---

## Prioritas & Urutan Eksekusi

| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | A1. Cash-Out Approval UI | Medium | High — unblocks flow |
| 2 | A2. Cleanup Coming Soon routes | Low | Medium — clean UX |
| 3 | C1. Sidebar badge notifications | Medium | High — admin awareness |
| 4 | B2. Supplier PO receive flow | Medium-High | High — inventory mgmt |
| 5 | B4. Opname full flow | Medium | Medium — stock accuracy |
| 6 | C2. Export laporan | Medium | Medium — reporting |
| 7 | A3. Data connection audit | Low | Medium — data accuracy |
| 8 | B3. Transfer stok approval | Medium | Low (rarely multi-branch) |
| 9 | C3. Responsive admin | High | Medium — mobile admin |

---

## Acceptance Criteria (Global)

- Backend builds clean (`nest build`)
- Frontend type-check: no NEW errors introduced (existing pre-existing errors acceptable)
- All API endpoints reachable from admin panel (correct prefix, auth guards)
- Admin panel usable end-to-end tanpa "Coming Soon" pages di flow utama
- Toggle Pengaturan Sistem dihormati di halaman yang relevan (mis. hide BRILink menu items saat toggle OFF)

---

## Non-Goals (Out of Scope Sprint 7)

- Webapp kasir changes (sudah complete Sprint 6)
- New database migrations (kecuali kalau B2/B3/B4 butuh)
- Multi-language support
- Offline sync
- Push notifications (future)
