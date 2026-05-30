/**
 * Export Service — PDF & Excel generation for reports.
 *
 * Uses:
 * - xlsx (SheetJS) for Excel export
 * - jspdf + jspdf-autotable for PDF export
 *
 * All exports are client-side (no backend endpoint needed).
 */

import type {
  SalesReportResponse,
  BrilinkReportResponse,
} from './reports.service';

// ============================================
// HELPERS
// ============================================

function fmtRp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getFilenameDate(start?: string, end?: string): string {
  const s = start || 'all';
  const e = end || 'all';
  return `${s}_${e}`;
}

// ============================================
// EXCEL EXPORT
// ============================================

export async function exportSalesExcel(
  report: SalesReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Ringkasan ---
  const summaryData = [
    ['LAPORAN PENJUALAN'],
    [`Toko: ${shopName || '-'}`],
    [`Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`],
    [`Dicetak: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['Metrik', 'Nilai'],
    ['Omzet', report.summary.omzet],
    ['Modal', report.summary.modal],
    ['Profit', report.summary.profit],
    ['Diskon', report.summary.diskon],
    ['Total Transaksi', report.summary.totalTransactions],
    ['Transaksi Void', report.summary.totalVoided],
    ['Margin (%)', report.summary.marginPercent],
    [],
    ['METODE PEMBAYARAN'],
    ['Metode', 'Jumlah', 'Total'],
    ...report.methodBreakdown.map(m => [m.method, m.count, m.totalAmount]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  // Set column widths
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // --- Sheet 2: Top Produk ---
  const topData = [
    ['TOP 10 PRODUK'],
    [`Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`],
    [],
    ['#', 'Produk', 'SKU', 'Qty Terjual', 'Revenue'],
    ...report.topProducts.map((p, i) => [i + 1, p.productName, p.sku, p.totalQty, p.totalRevenue]),
  ];
  const wsTop = XLSX.utils.aoa_to_sheet(topData);
  wsTop['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsTop, 'Top Produk');

  // --- Sheet 3: Trend Harian ---
  const trendData = [
    ['TREND HARIAN'],
    [`Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`],
    [],
    ['Tanggal', 'Omzet', 'Profit', 'Transaksi'],
    ...report.dailyTrend.map(d => [d.date, d.omzet, d.profit, d.transactions]),
  ];
  const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
  wsTrend['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTrend, 'Trend Harian');

  // Download
  const filename = `Laporan_Penjualan_${getFilenameDate(startDate, endDate)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export async function exportBrilinkExcel(
  report: BrilinkReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  const data = [
    ['LAPORAN BRILINK'],
    [`Toko: ${shopName || '-'}`],
    [`Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`],
    [`Dicetak: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['RINGKASAN'],
    ['Total Transaksi', report.summary.totalTransactions],
    ['Volume', report.summary.volume],
    ['Pendapatan Fee', report.summary.feeEarnings],
    ['Rata-rata Fee', report.summary.avgFee],
    [],
    ['PER KATEGORI'],
    ['Kategori', 'Transaksi', 'Volume', 'Fee'],
    ...report.categoryBreakdown.map(c => [c.category, c.count, c.volume, c.fee]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'BRILink');

  const filename = `Laporan_BRILink_${getFilenameDate(startDate, endDate)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ============================================
// PDF EXPORT
// ============================================

export async function exportSalesPDF(
  report: SalesReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN PENJUALAN', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(shopName || 'Toko', pageWidth / 2, 22, { align: 'center' });
  doc.text(
    `Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`,
    pageWidth / 2, 28, { align: 'center' },
  );
  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 33, { align: 'center' });

  // Summary table
  let yPos = 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 14, yPos);
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Omzet', fmtRp(report.summary.omzet)],
      ['Modal', fmtRp(report.summary.modal)],
      ['Profit', fmtRp(report.summary.profit)],
      ['Diskon', fmtRp(report.summary.diskon)],
      ['Total Transaksi', String(report.summary.totalTransactions)],
      ['Margin', `${report.summary.marginPercent}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Payment method breakdown
  yPos = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Metode Pembayaran', 14, yPos);
  yPos += 2;

  if (report.methodBreakdown.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Metode', 'Jumlah Trx', 'Total']],
      body: report.methodBreakdown.map(m => [m.method, String(m.count), fmtRp(m.totalAmount)]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top products
  if (report.topProducts.length > 0) {
    // Check if we need a new page
    if (yPos > 220) { doc.addPage(); yPos = 15; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Produk', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produk', 'SKU', 'Qty', 'Revenue']],
      body: report.topProducts.map((p, i) => [
        String(i + 1), p.productName, p.sku, String(p.totalQty), fmtRp(p.totalRevenue),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 8 }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Daily trend
  if (report.dailyTrend.length > 0) {
    if (yPos > 200) { doc.addPage(); yPos = 15; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Trend Harian', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['Tanggal', 'Omzet', 'Profit', 'Trx']],
      body: report.dailyTrend.map(d => [
        d.date, fmtRp(d.omzet), fmtRp(d.profit), String(d.transactions),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Halaman ${i}/${pageCount} — Generated by Ngalir`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 7,
      { align: 'center' },
    );
  }

  // Download
  const filename = `Laporan_Penjualan_${getFilenameDate(startDate, endDate)}.pdf`;
  doc.save(filename);
}

export async function exportBrilinkPDF(
  report: BrilinkReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN BRILINK', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(shopName || 'Toko', pageWidth / 2, 22, { align: 'center' });
  doc.text(
    `Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}`,
    pageWidth / 2, 28, { align: 'center' },
  );
  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 33, { align: 'center' });

  // Summary
  let yPos = 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 14, yPos);
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Total Transaksi', String(report.summary.totalTransactions)],
      ['Volume', fmtRp(report.summary.volume)],
      ['Pendapatan Fee', fmtRp(report.summary.feeEarnings)],
      ['Rata-rata Fee/Trx', fmtRp(report.summary.avgFee)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Category breakdown
  yPos = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Per Kategori', 14, yPos);
  yPos += 2;

  if (report.categoryBreakdown.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Kategori', 'Transaksi', 'Volume', 'Fee']],
      body: report.categoryBreakdown.map(c => [
        c.category, String(c.count), fmtRp(c.volume), fmtRp(c.fee),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  doc.setFontSize(7);
  doc.text(
    `Halaman 1/1 — Generated by Ngalir`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 7,
    { align: 'center' },
  );

  const filename = `Laporan_BRILink_${getFilenameDate(startDate, endDate)}.pdf`;
  doc.save(filename);
}
