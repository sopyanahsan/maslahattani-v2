# PRD — Redesign Hutang Pelanggan

**Status**: Ready to Implement
**Updated**: May 2026
**Owner**: Sopyan Ahsan
**Branch**: `feat/hutang-redesign`
**Depends on**: Existing Debt module (CRUD + payment already working)

---

## 1. Overview

Redesign halaman `/admin/hutang` agar:
- Full dark mode support
- Detail modal dengan riwayat cicilan lengkap
- Due date calendar indicator (visual dot per hari yang ada jatuh tempo)
- Better filter: sortBy (terbaru, jatuh tempo terdekat, sisa terbesar)
- Progress bar per hutang (berapa % sudah dibayar)

---

## 2. Enhancements

### Backend
- Add `sortBy` query param: `newest` | `due_date` | `remaining_desc`
- Add `dueDateFrom`/`dueDateTo` filter for calendar view

### Frontend
- Full dark mode (`dark:` prefix)
- Payment history inside detail modal
- Progress bar (paid vs total)
- Calendar view: simple month grid showing dates with due debts
- Sort dropdown

---

## 3. Confirmed Decisions

1. Calendar = simple CSS grid (no external lib), shows dots on dates with due debts
2. Sort options: Terbaru, Jatuh Tempo Terdekat, Sisa Terbesar
3. Detail modal shows full payment history (cicilan list)
4. Dark mode wajib
