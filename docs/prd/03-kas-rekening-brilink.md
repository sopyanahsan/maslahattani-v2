# PRD — Kas & Rekening BRILink (Full Implementation)

**Status**: Ready to Implement
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/kas-rekening-brilink`
**Depends on**: PRD 02 (Dashboard BRILink) — schema BrilinkAccount + BrilinkMutation sudah ada

---

## 1. Overview

Halaman `/admin/kas-rekening-brilink` punya 3 tab:
- **Tab Rekening BRI** — CRUD rekening (sudah diimplementasi di PRD 02)
- **Tab Mutasi** — Riwayat semua mutasi saldo BRILink, filterable, paginated
- **Tab Metode Kas** — CRUD kategori metode kas BRILink (mapping ke BrilinkCategory enum)

URL: `/admin/kas-rekening-brilink`

---

## 2. Goals

1. Admin bisa melihat riwayat lengkap mutasi saldo per rekening / semua rekening
2. Filter mutasi by: tanggal (range), tipe mutasi, rekening tertentu
3. Admin bisa manage "metode kas" BRILink — mapping display name, icon, color untuk tiap BrilinkCategory
4. Pagination 20 items per page

---

## 3. Tab Mutasi — Detail

### 3.1 Filter Bar
- **Rekening**: dropdown semua rekening aktif + opsi "Semua Rekening"
- **Tipe Mutasi**: dropdown (Semua / SETOR / TARIK / TRX_DEBIT / TRX_CREDIT / ADJUSTMENT)
- **Tanggal Mulai**: date input
- **Tanggal Akhir**: date input
- **Total count** ditampilkan di kanan

### 3.2 Table Columns
| Column | Description |
|--------|-------------|
| Tanggal | createdAt formatted |
| Rekening | account.label |
| Tipe | badge (SETOR/TARIK/TRX_DEBIT/TRX_CREDIT/ADJUSTMENT) |
| Deskripsi | mutation.description |
| Jumlah | + / - amount, colored |
| Saldo Setelah | balanceAfter |
| Oleh | createdBy username/email |

### 3.3 Pagination
- 20 items per page
- Prev/Next buttons
- Total pages indicator

---

## 4. Tab Metode Kas — Detail

### 4.1 Concept
"Metode Kas BRILink" = display configuration per BrilinkCategory.
Setiap kategori (TRANSFER_BRI, TRANSFER_OTHER, dll) punya:
- `displayName`: nama tampilan (e.g. "Transfer BRI", "Top-Up Pulsa")
- `color`: Tailwind color class untuk badge
- `icon`: Lucide icon name
- `isActive`: enable/disable di UI kasir
- `sortOrder`: urutan tampil

### 4.2 Data Source
Karena BrilinkCategory adalah enum (7 fixed values), kita TIDAK perlu model baru.
Cukup simpan config di `ShopSetting` sebagai JSON field `brilinkCategoryConfig`.

Shape:
```json
{
  "TRANSFER_BRI": { "displayName": "Transfer BRI", "color": "blue", "icon": "landmark", "isActive": true, "sortOrder": 0 },
  "TRANSFER_OTHER": { "displayName": "Transfer Lain", "color": "indigo", "icon": "send", "isActive": true, "sortOrder": 1 },
  ...
}
```

### 4.3 UI
- List 7 kategori dengan toggle isActive + inline edit displayName
- Drag/sort untuk sortOrder (optional, bisa pakai up/down button)
- Save button per-row atau single "Simpan Semua"

---

## 5. API Endpoints

### Tab Mutasi
`GET /api/brilink-accounts/mutations?shopId=xxx&accountId=&type=&startDate=&endDate=&page=1&limit=20`

Response:
```json
{
  "data": [
    {
      "id": "...",
      "accountId": "...",
      "accountLabel": "BRI Default",
      "type": "SETOR",
      "amount": 500000,
      "balanceBefore": 1000000,
      "balanceAfter": 1500000,
      "reference": "REF-001",
      "description": "Setor saldo Rp 500.000",
      "notes": null,
      "createdBy": { "username": "admin", "email": "admin@example.com" },
      "createdAt": "2026-05-28T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

### Tab Metode Kas
- `GET /api/settings/brilink-categories?shopId=xxx` — get config
- `PATCH /api/settings/brilink-categories` — update config `{ shopId, config: {...} }`

---

## 6. Implementation Plan

### Backend
1. Add `GET /api/brilink-accounts/mutations` endpoint (all mutations across accounts, with filters)
2. Add `GET /api/settings/brilink-categories` endpoint
3. Add `PATCH /api/settings/brilink-categories` endpoint
4. Store in `ShopSetting.brilinkCategoryConfig` JSON field (no migration needed, reuse existing Json? field pattern like alertConfig)

### Frontend
1. Replace Tab Mutasi placeholder with full filter + table + pagination
2. Replace Tab Metode Kas placeholder with category config UI
3. Add service methods to `brilink-account.service.ts` and `settings.service.ts`

---

## 7. Out of Scope

- Export PDF/Excel mutasi (akan di feat/laporan)
- Rekonsiliasi otomatis dengan BRI API
- Custom date range preset (7d, 30d, custom)

---

## 8. Confirmed Decisions

1. Mutasi endpoint = cross-account (all accounts in shop), filterable by accountId
2. Metode Kas config stored in ShopSetting JSON (no new table)
3. 7 fixed categories from enum, admin only toggles active + edits display name
4. Pagination 20 per page
