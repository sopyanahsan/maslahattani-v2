# PRD Admin Panel BRILink — Menu Laporan BRILink

**Status**: Draft
**Updated**: Juni 2026
**Owner**: Sopyan Ahsan
**Module**: Admin Panel > BRILink > Laporan BRILink

---

## 1. Konteks & Tujuan

### Background

Admin/owner agen BRILink perlu laporan periodik yang merangkum performa bisnis BRILink. Berbeda dengan **Dashboard** (real-time snapshot) dan **Transaksi** (list detail per transaksi), menu **Laporan** berfokus pada:
- Rangkuman periodik (harian/mingguan/bulanan)
- Perbandingan antar periode
- Analisis profit per kategori & per kasir
- Rekonsiliasi ringkasan (saldo awal → mutasi → saldo akhir)
- Export untuk pembukuan/pajak

### Goals

1. **Laporan Periodik** — Summary harian, mingguan, bulanan yang bisa di-drill down
2. **Profit Analysis** — Breakdown profit per kategori, per kasir, tren naik/turun
3. **Rekonsiliasi Summary** — Ringkasan pergerakan saldo rekening & kas tunai per periode
4. **Export Lengkap** — PDF & Excel/CSV untuk pembukuan, laporan ke atasan, atau keperluan pajak
5. **Perbandingan Periode** — Bandingkan performa minggu ini vs minggu lalu, bulan ini vs bulan lalu

---

## 2. Jenis Laporan

### 2.1 Daftar Laporan

| # | Laporan | Deskripsi | Granularity |
|---|---------|-----------|-------------|
| 1 | **Ringkasan Transaksi** | Total trx, volume, fee per periode | Harian / Mingguan / Bulanan |
| 2 | **Profit per Kategori** | Breakdown fee income per 7 kategori | Per periode |
| 3 | **Performa Kasir** | Ranking kasir berdasarkan trx count & fee | Per periode |
| 4 | **Mutasi Rekening** | Rangkuman pergerakan saldo rekening | Per periode |
| 5 | **Mutasi Kas Tunai** | Rangkuman pergerakan kas tunai BRILink | Per periode |
| 6 | **Rekonsiliasi Periode** | Saldo awal → pergerakan → saldo akhir | Per periode |
| 7 | **Laporan Void/Gagal** | Transaksi bermasalah, alasan, kerugian | Per periode |

---

## 3. Spesifikasi UI

### 3.1 Layout Halaman

```
┌──────────────────────────────────────────────────────────────────┐
│ [Header] Laporan BRILink                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──── PERIOD SELECTOR ───────────────────────────────────────┐   │
│ │                                                            │   │
│ │ Periode: (●) Harian  ( ) Mingguan  ( ) Bulanan            │   │
│ │                                                            │   │
│ │ [Harian]  Tanggal: [05/06/2026]  [◀ Prev] [Next ▶]       │   │
│ │ [Mingguan] Minggu: [02-08 Jun 2026]                        │   │
│ │ [Bulanan]  Bulan: [Juni 2026 ▼]                            │   │
│ │                                                            │   │
│ │ Bandingkan dengan: [✓] Periode sebelumnya                  │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──── TAB LAPORAN ───────────────────────────────────────────┐   │
│ │ [Ringkasan] [Kategori] [Kasir] [Keuangan] [Void]          │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──── CONTENT (sesuai tab) ──────────────────────────────────┐   │
│ │                                                            │   │
│ │  ... (detail per tab di bawah) ...                         │   │
│ │                                                            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──── EXPORT BAR ────────────────────────────────────────────┐   │
│ │ [📄 Export PDF]  [📊 Export Excel]  [🖨️ Print]            │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Period Selector

| Mode | Input | Range |
|------|-------|-------|
| **Harian** | Date picker (single day) | 1 hari (00:00 - 23:59 WIB) |
| **Mingguan** | Week picker (Mon-Sun) | 7 hari |
| **Bulanan** | Month picker | 1 bulan penuh |

**Navigasi:**
- Tombol Prev/Next untuk geser periode
- "Bandingkan" checkbox → tampilkan kolom perbandingan vs periode sebelumnya
- Default: Hari ini (harian), minggu ini (mingguan), bulan ini (bulanan)

---

## 4. Tab 1: Ringkasan Transaksi

### 4.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ RINGKASAN TRANSAKSI — 05 Juni 2026                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── KPI SUMMARY ──────────────────────────────────────┐    │
│ │                                                        │    │
│ │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────┐ │    │
│ │  │Total Trx   │ │Volume      │ │Total Fee   │ │Avg  │ │    │
│ │  │ 47         │ │Rp 28.5jt   │ │Rp 485.000  │ │Fee  │ │    │
│ │  │ ▲12% vs    │ │▲8% vs      │ │▲15% vs     │ │10.3k│ │    │
│ │  │ kemarin    │ │kemarin     │ │kemarin     │ │     │ │    │
│ │  └────────────┘ └────────────┘ └────────────┘ └─────┘ │    │
│ │                                                        │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──── BREAKDOWN STATUS ──────────────────────────────────┐    │
│ │                                                        │    │
│ │  SUCCESS: 44 (93.6%)  ████████████████████░░           │    │
│ │  FAILED:  2 (4.3%)    █░░░░░░░░░░░░░░░░░░░░           │    │
│ │  VOIDED:  1 (2.1%)    ░░░░░░░░░░░░░░░░░░░░░           │    │
│ │                                                        │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──── TREN (grafik mini) ────────────────────────────────┐    │
│ │                                                        │    │
│ │  Trx per jam (hari ini):                               │    │
│ │  ▃▅▇█▇▅▃▂▁▃▅▇▅▃▂▁▁▁▁▁▁▁▁                             │    │
│ │  06 07 08 09 10 11 12 13 14 15 16 17 18               │    │
│ │                                                        │    │
│ │  [Jika mingguan/bulanan: tren per hari]                │    │
│ │                                                        │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌──── TABEL RINGKASAN PER JAM/HARI ─────────────────────┐    │
│ │                                                        │    │
│ │ │ Waktu  │ Jumlah │ Volume     │ Fee      │ Avg Fee  │ │    │
│ │ │────────│────────│────────────│──────────│──────────│ │    │
│ │ │ 06:00  │ 2      │ Rp 1.5jt   │ Rp 12rb  │ Rp 6rb  │ │    │
│ │ │ 07:00  │ 5      │ Rp 4.2jt   │ Rp 35rb  │ Rp 7rb  │ │    │
│ │ │ 08:00  │ 8      │ Rp 6.8jt   │ Rp 72rb  │ Rp 9rb  │ │    │
│ │ │ 09:00  │ 10     │ Rp 8.1jt   │ Rp 95rb  │ Rp 9.5rb│ │    │
│ │ │ ...    │ ...    │ ...        │ ...      │ ...      │ │    │
│ │ │────────│────────│────────────│──────────│──────────│ │    │
│ │ │ TOTAL  │ 47     │ Rp 28.5jt  │ Rp 485rb │ Rp 10.3k│ │    │
│ │                                                        │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Perbandingan Periode

Jika checkbox "Bandingkan" aktif, setiap KPI card menampilkan:
- Value periode ini
- Value periode lalu
- Persentase naik/turun (▲ hijau / ▼ merah)

---

## 5. Tab 2: Profit per Kategori

### 5.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ PROFIT PER KATEGORI — 05 Juni 2026                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── PIE/DONUT CHART ───────────────────────────────────┐   │
│ │                                                        │   │
│ │       ╭────╮                                           │   │
│ │     ╭─┤TRFR├─╮     TRANSFER BRI:    Rp 210.000 (43%)  │   │
│ │    │  │ BRI│  │     TRANSFER OTHER:  Rp 85.000 (18%)   │   │
│ │    │  ╰────╯  │     TARIK TUNAI:     Rp 95.000 (20%)   │   │
│ │    │  Total:   │     TOPUP PULSA:    Rp 32.000 (7%)    │   │
│ │    │  Rp 485rb │     TOPUP DATA:     Rp 12.000 (2%)    │   │
│ │    ╰───────────╯     TOPUP EWALLET:  Rp 28.000 (6%)    │   │
│ │                      TOPUP PLN:      Rp 23.000 (5%)    │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── TABEL DETAIL PER KATEGORI ─────────────────────────┐   │
│ │                                                        │   │
│ │ │ Kategori       │ Trx │ Volume    │ Fee     │ %Fee  │ │   │
│ │ │────────────────│─────│───────────│─────────│───────│ │   │
│ │ │🔵 Transfer BRI │ 18  │ Rp 15.2jt │ Rp 210rb│ 43.3% │ │   │
│ │ │🟣 Transfer Lain│ 8   │ Rp 6.5jt  │ Rp 85rb │ 17.5% │ │   │
│ │ │🟢 Tarik Tunai  │ 7   │ Rp 8.5jt  │ Rp 95rb │ 19.6% │ │   │
│ │ │🟠 Topup Pulsa  │ 6   │ Rp 350rb  │ Rp 32rb │ 6.6%  │ │   │
│ │ │🟣 Topup Data   │ 3   │ Rp 180rb  │ Rp 12rb │ 2.5%  │ │   │
│ │ │🩷 Topup Ewallet│ 3   │ Rp 1.8jt  │ Rp 28rb │ 5.8%  │ │   │
│ │ │🟡 Topup PLN    │ 2   │ Rp 850rb  │ Rp 23rb │ 4.7%  │ │   │
│ │ │────────────────│─────│───────────│─────────│───────│ │   │
│ │ │ TOTAL          │ 47  │ Rp 33.4jt │ Rp 485rb│ 100%  │ │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── TREN PROFIT (jika mingguan/bulanan) ───────────────┐   │
│ │                                                        │   │
│ │  Stacked area chart profit per kategori per hari       │   │
│ │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                     │   │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                       │   │
│ │  Sen  Sel  Rab  Kam  Jum  Sab  Min                     │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Insight Otomatis

Di bawah chart, tampilkan insight auto-generated:

```
💡 Insights:
• Kategori terbesar: Transfer BRI (43% dari total fee)
• Pertumbuhan tertinggi: Topup E-Wallet (+35% vs periode lalu)
• Penurunan: Topup Data (-12% vs periode lalu)
• Rata-rata fee per trx tertinggi: Tarik Tunai (Rp 13.571)
```

---

## 6. Tab 3: Performa Kasir

### 6.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ PERFORMA KASIR — 05 Juni 2026                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── RANKING KASIR ─────────────────────────────────────┐   │
│ │                                                        │   │
│ │ │ # │ Kasir    │ Trx │ Volume    │ Fee     │ Avg Fee │ │   │
│ │ │───│──────────│─────│───────────│─────────│─────────│ │   │
│ │ │ 🥇│ Ahmad    │ 22  │ Rp 16.5jt │ Rp 265rb│ Rp 12rb │ │   │
│ │ │ 🥈│ Budi     │ 15  │ Rp 8.2jt  │ Rp 135rb│ Rp 9rb  │ │   │
│ │ │ 🥉│ Citra    │ 10  │ Rp 3.8jt  │ Rp 85rb │ Rp 8.5rb│ │   │
│ │ │───│──────────│─────│───────────│─────────│─────────│ │   │
│ │ │   │ TOTAL    │ 47  │ Rp 28.5jt │ Rp 485rb│ Rp 10.3k│ │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── DETAIL PER KASIR (expandable) ─────────────────────┐   │
│ │                                                        │   │
│ │ ▼ Ahmad (22 trx)                                       │   │
│ │ ┌──────────────────────────────────────────────────┐   │   │
│ │ │ Kategori       │ Trx │ Volume   │ Fee    │       │   │   │
│ │ │────────────────│─────│──────────│────────│       │   │   │
│ │ │ Transfer BRI   │ 10  │ Rp 8.5jt │ Rp 120k│       │   │   │
│ │ │ Tarik Tunai    │ 5   │ Rp 5.0jt │ Rp 70k │       │   │   │
│ │ │ Transfer Lain  │ 4   │ Rp 2.2jt │ Rp 50k │       │   │   │
│ │ │ Topup Pulsa    │ 3   │ Rp 800rb │ Rp 25k │       │   │   │
│ │ └──────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ▶ Budi (15 trx)                                        │   │
│ │ ▶ Citra (10 trx)                                       │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── BAR CHART COMPARISON ──────────────────────────────┐   │
│ │                                                        │   │
│ │  Ahmad  ████████████████████████ 22 trx │ Rp 265k fee │   │
│ │  Budi   ████████████████ 15 trx         │ Rp 135k fee │   │
│ │  Citra  ██████████ 10 trx               │ Rp 85k fee  │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Metrics per Kasir

| Metric | Deskripsi |
|--------|-----------|
| Total Transaksi | Count semua trx (SUCCESS only) |
| Volume | Sum nominal transaksi |
| Total Fee | Sum fee yang dihasilkan |
| Avg Fee | Fee / trx count |
| Kategori Terbanyak | Kategori dengan trx terbanyak |
| Jam Tersibuk | Jam dengan trx paling banyak |

---

## 7. Tab 4: Keuangan (Mutasi & Rekonsiliasi)

### 7.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ LAPORAN KEUANGAN — 05 Juni 2026                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── RINGKASAN PERGERAKAN REKENING ─────────────────────┐   │
│ │                                                        │   │
│ │ Rekening: [Semua ▼] / [BRI Utama ▼]                    │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────────┐ │   │
│ │ │ Saldo Awal (00:00)     : Rp 12.000.000            │ │   │
│ │ │                                                    │ │   │
│ │ │ (+) TRX_CREDIT (Tarik) : Rp  8.500.000  (7 trx)  │ │   │
│ │ │ (+) SETOR Manual       : Rp  5.000.000  (1x)     │ │   │
│ │ │ (-) TRX_DEBIT (Transf) : Rp -21.900.000 (33 trx) │ │   │
│ │ │ (-) TARIK Manual       : Rp  0                    │ │   │
│ │ │ (±) ADJUSTMENT         : Rp +150.000   (1x)      │ │   │
│ │ │                                                    │ │   │
│ │ │ ─────────────────────────────────────────────────  │ │   │
│ │ │ Saldo Akhir (23:59)    : Rp  3.750.000            │ │   │
│ │ │ Perubahan Hari Ini     : Rp -8.250.000            │ │   │
│ │ └────────────────────────────────────────────────────┘ │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── RINGKASAN PERGERAKAN KAS TUNAI ────────────────────┐   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────────┐ │   │
│ │ │ Saldo Awal (00:00)     : Rp  2.800.000            │ │   │
│ │ │                                                    │ │   │
│ │ │ (+) TRX_IN (nasabah)   : Rp 22.385.000 (33 trx)  │ │   │
│ │ │ (+) SETOR Modal        : Rp  2.000.000  (1x)     │ │   │
│ │ │ (-) TRX_OUT (tarik)    : Rp -7.930.000  (7 trx)  │ │   │
│ │ │ (-) AMBIL Tunai        : Rp -3.000.000  (1x)     │ │   │
│ │ │ (±) ADJUSTMENT         : Rp +50.000    (1x)      │ │   │
│ │ │ (±) VOID_REVERSE       : Rp -52.000    (1x)      │ │   │
│ │ │                                                    │ │   │
│ │ │ ─────────────────────────────────────────────────  │ │   │
│ │ │ Saldo Akhir (23:59)    : Rp 16.253.000            │ │   │
│ │ │ Perubahan Hari Ini     : Rp +13.453.000           │ │   │
│ │ └────────────────────────────────────────────────────┘ │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── NET POSITION ──────────────────────────────────────┐   │
│ │                                                        │   │
│ │  Rekening + Kas Tunai                                  │   │
│ │  Awal Hari : Rp 14.800.000                             │   │
│ │  Akhir Hari: Rp 20.003.000                             │   │
│ │  Delta     : +Rp 5.203.000                             │   │
│ │                                                        │   │
│ │  Breakdown Delta:                                      │   │
│ │  • Fee income       : +Rp 485.000                      │   │
│ │  • Setor manual     : +Rp 7.000.000 (rek + kas)       │   │
│ │  • Tarik/ambil      : -Rp 3.000.000                    │   │
│ │  • Adjustment       : +Rp 200.000                      │   │
│ │  • Void reversal    : -Rp 52.000                       │   │
│ │  • Net trx flow     : +Rp 570.000 (tarik > debit net) │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── RIWAYAT RECONCILIATION PERIODE INI ────────────────┐   │
│ │                                                        │   │
│ │ │ Waktu │ Target     │ App        │ Real       │ Adj  ││   │
│ │ │───────│────────────│────────────│────────────│──────││   │
│ │ │ 21:00 │ BRI Utama  │ 3.600.000  │ 3.750.000  │+150k││   │
│ │ │ 21:05 │ Kas Tunai  │ 16.203.000 │ 16.253.000 │+50k ││   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Rumus Net Position

```typescript
netPosition = totalRekeningBalance + kasTunaiBalance;

deltaHari = netPositionAkhir - netPositionAwal;

// Delta breakdown:
feeIncome = sum(trx.fee) where status = SUCCESS;
setorManual = sum(mutations) where type in (SETOR) for both rek & kas;
tarikManual = sum(mutations) where type in (TARIK) for both rek & kas;
adjustments = sum(mutations) where type = ADJUSTMENT;
voidReversals = sum(mutations) where type = VOID_REVERSE;
netTrxFlow = deltaHari - feeIncome - setorManual + tarikManual - adjustments + voidReversals;
```

---

## 8. Tab 5: Laporan Void & Gagal

### 8.1 Tampilan

```
┌──────────────────────────────────────────────────────────────┐
│ LAPORAN VOID & GAGAL — 05 Juni 2026                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──── SUMMARY ───────────────────────────────────────────┐   │
│ │                                                        │   │
│ │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │   │
│ │  │ Total Void  │  │ Total Gagal │  │ Kerugian Fee  │  │   │
│ │  │ 1           │  │ 2           │  │ Rp 5.000      │  │   │
│ │  │ (dari 47)   │  │ (dari 49)   │  │ (fee yg batal)│  │   │
│ │  └─────────────┘  └─────────────┘  └───────────────┘  │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── TABEL DETAIL ──────────────────────────────────────┐   │
│ │                                                        │   │
│ │ │ Waktu │ Ref      │ Kategori    │ Nominal │ Status │  │   │
│ │ │       │          │             │         │ Reason │  │   │
│ │ │───────│──────────│─────────────│─────────│────────│  │   │
│ │ │ 10:05 │ BRL-..25 │ Topup Pulsa │ 50.000  │ VOIDED │  │   │
│ │ │       │          │             │ fee 2rb │ Gagal  │  │   │
│ │ │       │          │             │         │ EDC    │  │   │
│ │ │ 11:20 │ BRL-..31 │ Transfer BRI│ 200.000 │ FAILED │  │   │
│ │ │       │          │             │         │ Rek    │  │   │
│ │ │       │          │             │         │ invalid│  │   │
│ │ │ 14:15 │ BRL-..38 │ Topup PLN  │ 100.000 │ FAILED │  │   │
│ │ │       │          │             │         │ Token  │  │   │
│ │ │       │          │             │         │ habis  │  │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──── ANALISIS ──────────────────────────────────────────┐   │
│ │                                                        │   │
│ │ Pola Gagal:                                            │   │
│ │ • Kategori paling sering gagal: Transfer BRI (1x)     │   │
│ │ • Kasir dengan void terbanyak: Ahmad (1x)             │   │
│ │ • Jam rawan: 10:00-11:00 (2 gagal)                    │   │
│ │                                                        │   │
│ │ Rate: 3/49 = 6.1% (target < 5%)                       │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Metrics Void/Gagal

| Metric | Formula |
|--------|---------|
| **Total Void** | Count where status = VOIDED |
| **Total Gagal** | Count where status = FAILED |
| **Success Rate** | SUCCESS / (SUCCESS + FAILED + VOIDED) × 100% |
| **Kerugian Fee** | Sum fee dari transaksi VOIDED (fee yang sudah diambil lalu harus dikembalikan) |
| **Failure Rate Target** | Config di shopSettings (default: < 5%) |

---

## 9. Export Formats

### 9.1 PDF Report

Layout PDF:

```
┌─────────────────────────────────────────────┐
│ LOGO        LAPORAN BRILINK                 │
│             [Nama Toko]                     │
│             Periode: 05 Juni 2026           │
│             Dicetak: 05/06/2026 22:00       │
├─────────────────────────────────────────────┤
│                                             │
│ 1. RINGKASAN                                │
│    Total Transaksi: 47                      │
│    Volume: Rp 28.500.000                    │
│    Total Fee: Rp 485.000                    │
│    Success Rate: 93.6%                      │
│                                             │
│ 2. BREAKDOWN KATEGORI                       │
│    [Tabel per kategori]                     │
│                                             │
│ 3. PERGERAKAN KEUANGAN                      │
│    [Saldo awal → akhir per rekening]        │
│    [Kas tunai awal → akhir]                 │
│                                             │
│ 4. PERFORMA KASIR                           │
│    [Ranking tabel]                          │
│                                             │
│ 5. TRANSAKSI BERMASALAH                     │
│    [List void & gagal]                      │
│                                             │
├─────────────────────────────────────────────┤
│ Footer: Generated by Maslahat Tani v2       │
└─────────────────────────────────────────────┘
```

### 9.2 Excel/CSV Export

**Sheet 1: Summary**
- KPI summary (trx count, volume, fee, success rate)
- Saldo awal/akhir

**Sheet 2: Transactions**
- Semua transaksi detail (per row)
- Kolom: DateTime, Ref, Category, Customer, Destination, Amount, Fee, Total, Status, Cashier

**Sheet 3: Category Breakdown**
- Per kategori: count, volume, fee, percentage

**Sheet 4: Cashier Performance**
- Per kasir: count, volume, fee, avg fee

**Sheet 5: Mutations**
- Semua mutasi rekening + kas tunai
- Kolom: DateTime, Target, Type, Amount, BalanceBefore, BalanceAfter, Description

### 9.3 Print

- Sama dengan PDF tapi langsung ke printer dialog browser
- Optimized untuk A4 portrait
- Margin & font size adjusted untuk thermal printer (opsional, format struk)

---

## 10. API Endpoints

### 10.1 Laporan Ringkasan

```
GET  /api/brilink/reports/summary
     Query: shopId, period (daily|weekly|monthly), date, compare (true|false)
     Response: {
       current: {
         totalTransactions, volume, totalFee, avgFee,
         successRate, statusBreakdown: { success, failed, voided },
         hourly/daily breakdown: [{ label, count, volume, fee }]
       },
       previous?: { ... same structure ... },
       comparison?: { trxChange%, volumeChange%, feeChange% }
     }
```

### 10.2 Laporan Kategori

```
GET  /api/brilink/reports/categories
     Query: shopId, period, date
     Response: {
       categories: [{
         category, count, volume, fee, feePercent, volumePercent,
         avgFeePerTrx, previousFee?, changePercent?
       }],
       totalVolume, totalFee,
       insights: string[]
     }
```

### 10.3 Laporan Kasir

```
GET  /api/brilink/reports/cashiers
     Query: shopId, period, date
     Response: {
       cashiers: [{
         userId, name, email,
         totalTransactions, volume, totalFee, avgFee,
         topCategory, peakHour,
         categoryBreakdown: [{ category, count, fee }]
       }]
     }
```

### 10.4 Laporan Keuangan

```
GET  /api/brilink/reports/finance
     Query: shopId, period, date, accountId? (optional, null = all)
     Response: {
       accounts: [{
         accountId, label, accountNumber,
         openingBalance, closingBalance,
         creditTotal, debitTotal, setorTotal, tarikTotal, adjustmentTotal,
         mutations: [{ type, count, total }]
       }],
       cashBox: {
         openingBalance, closingBalance,
         inTotal, outTotal, setorTotal, tarikTotal, adjustmentTotal, voidReverseTotal,
         mutations: [{ type, count, total }]
       },
       netPosition: {
         opening, closing, delta,
         deltaBreakdown: { feeIncome, setorManual, tarikManual, adjustments, voidReversals, netTrxFlow }
       },
       reconciliations: ReconciliationRecord[]
     }
```

### 10.5 Laporan Void/Gagal

```
GET  /api/brilink/reports/failures
     Query: shopId, period, date
     Response: {
       summary: { voidCount, failedCount, totalAttempted, successRate, feeLoss },
       transactions: [{
         id, refNumber, category, amount, fee, status, reason,
         cashierName, createdAt
       }],
       analysis: {
         topFailCategory, topFailCashier, peakFailHour, failureRate, targetRate
       }
     }
```

### 10.6 Export

```
GET  /api/brilink/reports/export/pdf
     Query: shopId, period, date, sections[] (summary|categories|cashiers|finance|failures)
     Response: Binary PDF file (Content-Type: application/pdf)

GET  /api/brilink/reports/export/excel
     Query: shopId, period, date
     Response: Binary XLSX file (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

GET  /api/brilink/reports/export/csv
     Query: shopId, period, date, type (transactions|mutations|summary)
     Response: CSV file (Content-Type: text/csv)
```

---

## 11. Scheduled Reports (Future Enhancement)

### 11.1 Auto-Generate

Config di shopSettings:

```json
{
  "brilinkReportConfig": {
    "autoDaily": true,       // Generate laporan harian jam 23:59
    "autoWeekly": true,      // Generate laporan mingguan hari Minggu
    "autoMonthly": true,     // Generate laporan bulanan tanggal 1
    "sendEmail": false,      // Email ke admin (future)
    "retentionDays": 365     // Simpan laporan generated selama 1 tahun
  }
}
```

### 11.2 Report Archive (Future)

```
GET  /api/brilink/reports/archive
     Query: shopId, year?, month?
     Response: [{
       id, period, date, generatedAt, downloadUrl
     }]
```

---

## 12. Business Rules

### 12.1 Data Source

- Semua data dari `BrilinkTransaction` (status SUCCESS, FAILED, VOIDED)
- Mutasi dari `BrilinkMutation` (per rekening) dan `BrilinkCashMutation` (kas tunai)
- Reconciliation dari `BrilinkReconciliation`
- Fee = field `fee` pada transaksi (bukan recalculate dari rules, karena rules bisa berubah)

### 12.2 Timezone

- Semua laporan menggunakan **WIB (UTC+7)**
- "Hari ini" = 00:00:00 WIB s/d 23:59:59 WIB
- "Minggu ini" = Senin 00:00 WIB s/d Minggu 23:59 WIB
- "Bulan ini" = Tanggal 1 00:00 WIB s/d tanggal terakhir 23:59 WIB

### 12.3 Saldo Awal Periode

Untuk menghitung "saldo awal":
- Cari mutation terakhir **sebelum** start time periode
- Ambil `balanceAfter` dari mutation itu = saldo awal periode
- Jika tidak ada mutation sebelumnya → gunakan initial balance (saat account/cashbox dibuat)

### 12.4 Comparison Logic

```typescript
function getPreviousPeriod(period: string, date: Date) {
  switch (period) {
    case 'daily':   return subDays(date, 1);     // kemarin
    case 'weekly':  return subWeeks(date, 1);    // minggu lalu
    case 'monthly': return subMonths(date, 1);   // bulan lalu
  }
}
```

### 12.5 Insights Generation

Auto-generate insights berdasarkan data:

```typescript
function generateInsights(current, previous) {
  const insights: string[] = [];
  
  // Kategori terbesar
  const topCat = current.categories.sort((a,b) => b.fee - a.fee)[0];
  insights.push(`Kategori terbesar: ${topCat.category} (${topCat.feePercent}% dari total fee)`);
  
  // Pertumbuhan tertinggi
  if (previous) {
    const growth = current.categories.map(c => ({
      category: c.category,
      growth: calcGrowth(c.fee, previous.categories.find(p => p.category === c.category)?.fee || 0)
    })).sort((a,b) => b.growth - a.growth);
    
    if (growth[0].growth > 0) {
      insights.push(`Pertumbuhan tertinggi: ${growth[0].category} (+${growth[0].growth}%)`);
    }
  }
  
  // Success rate warning
  if (current.successRate < 95) {
    insights.push(`⚠️ Success rate ${current.successRate}% — di bawah target 95%`);
  }
  
  return insights;
}
```

---

## 13. Acceptance Criteria

### Functional
- [ ] Admin bisa lihat laporan ringkasan transaksi per periode (harian/mingguan/bulanan)
- [ ] Admin bisa lihat breakdown profit per kategori dengan chart
- [ ] Admin bisa lihat ranking performa kasir dengan detail per kategori
- [ ] Admin bisa lihat ringkasan pergerakan keuangan (rekening + kas tunai)
- [ ] Admin bisa lihat laporan void/gagal dengan analisis pola
- [ ] Perbandingan antar periode berfungsi (current vs previous)
- [ ] KPI cards dengan persentase perubahan tampil benar
- [ ] Navigasi antar periode (prev/next) lancar
- [ ] Export PDF berfungsi (semua section)
- [ ] Export Excel/CSV berfungsi
- [ ] Print report berfungsi
- [ ] Insights auto-generated tampil relevan
- [ ] Net position calculation akurat
- [ ] Timezone WIB konsisten di semua laporan

### Non-Functional
- [ ] Load laporan < 1s (harian), < 2s (mingguan), < 3s (bulanan)
- [ ] Export PDF generate < 5s
- [ ] Export Excel generate < 3s
- [ ] Support data 6 bulan tanpa timeout
- [ ] Chart render smooth di mobile

---

## 14. Dependencies

- **Data Source**: BrilinkTransaction, BrilinkMutation, BrilinkCashMutation, BrilinkReconciliation
- **Existing Dashboard**: Bisa reuse helper period (getPeriodRange, getPreviousPeriodRange)
- **PDF Library**: Suggest `@react-pdf/renderer` (frontend) atau `pdfkit` (backend generate)
- **Excel Library**: Suggest `exceljs` (backend)
- **Chart**: Reuse chart component dari Dashboard BRILink (ApexCharts / Chart.js)

---

## 15. Perbedaan vs Dashboard BRILink

| Aspek | Dashboard | Laporan |
|-------|-----------|---------|
| **Fokus** | Real-time monitoring | Historical analysis |
| **Period** | Today / 7 hari / 30 hari | Exact day / week / month |
| **Comparison** | Otomatis vs yesterday | Optional toggle |
| **Export** | Tidak ada | PDF, Excel, CSV, Print |
| **Detail Level** | Summary KPI | Drill-down per jam/hari, per kasir, per kategori |
| **Keuangan** | Balance cards saja | Full saldo awal → akhir + breakdown mutasi |
| **Void** | Count alert saja | Detail + analisis pola |
| **Use Case** | Cek cepat "gimana hari ini?" | Evaluasi, pembukuan, pelaporan |
