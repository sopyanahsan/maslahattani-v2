/**
 * Export Service — PDF & Excel generation for reports.
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
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getFilenameDate(start?: string, end?: string): string {
  return `${start || 'all'}_${end || 'all'}`;
}

function downloadAsExcel(filename: string, sheets: Array<{ name: string; html: string }>) {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
  sheets.forEach((s) => { html += `<x:ExcelWorksheet><x:Name>${s.name}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`; });
  html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
  sheets.forEach((s) => { html += s.html; });
  html += '</body></html>';

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function th(cells: (string | number)[]): string {
  return '<tr>' + cells.map(c => `<th style="border:1px solid #999;padding:5px 10px;background:#f0f0f0;font-weight:bold;text-align:left;">${c}</th>`).join('') + '</tr>';
}
function td(cells: (string | number)[], alignRight: number[] = []): string {
  return '<tr>' + cells.map((c, i) => `<td style="border:1px solid #ddd;padding:4px 8px;${alignRight.includes(i) ? 'text-align:right;' : ''}">${c}</td>`).join('') + '</tr>';
}
function title(text: string, colspan: number): string {
  return `<tr><td colspan="${colspan}" style="font-size:14px;font-weight:bold;padding:8px 0;">${text}</td></tr>`;
}
function subtitle(text: string, colspan: number): string {
  return `<tr><td colspan="${colspan}" style="font-size:11px;color:#666;padding:2px 0;">${text}</td></tr>`;
}
function spacer(colspan: number): string {
  return `<tr><td colspan="${colspan}" style="height:10px;"></td></tr>`;
}

// ============================================
// EXCEL: SALES REPORT
// ============================================

export async function exportSalesExcel(
  report: SalesReportResponse,
  startDate?: string, endDate?: string, shopName?: string,
): Promise<void> {
  // Sheet 1: Ringkasan + Laba Rugi + Metode Bayar
  let s1 = '<table>';
  s1 += title('LAPORAN PENJUALAN RETAIL', 2);
  s1 += subtitle(`Toko: ${shopName || '-'} | Periode: ${fmtDate(startDate || '')} s/d ${fmtDate(endDate || '')}`, 2);
  s1 += subtitle(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, 2);
  s1 += spacer(2);
  s1 += title('LABA RUGI', 2);
  s1 += th(['Metrik', 'Nilai (Rp)']);
  s1 += td(['Omzet (Penjualan)', fmtRp(report.summary.omzet)], [1]);
  s1 += td(['HPP (Harga Pokok)', fmtRp(report.summary.modal)], [1]);
  s1 += td(['Diskon Diberikan', fmtRp(report.summary.diskon)], [1]);
  s1 += td(['Laba Kotor', fmtRp(report.summary.profit)], [1]);
  s1 += td(['Total Transaksi', report.summary.totalTransactions], [1]);
  s1 += td(['Transaksi Void', report.summary.totalVoided], [1]);
  s1 += td(['Margin Profit', `${report.summary.marginPercent}%`], [1]);
  s1 += spacer(2);
  s1 += title('METODE PEMBAYARAN', 3);
  s1 += th(['Metode', 'Jumlah Trx', 'Total']);
  report.methodBreakdown.forEach(m => { s1 += td([m.method, m.count, fmtRp(m.totalAmount)], [2]); });
  s1 += '</table>';

  // Sheet 2: Top Produk
  let s2 = '<table>';
  s2 += title('TOP 10 PRODUK TERLARIS', 4);
  s2 += th(['#', 'Produk', 'SKU', 'Qty Terjual', 'Revenue']);
  report.topProducts.forEach((p, i) => { s2 += td([i + 1, p.productName, p.sku, p.totalQty, fmtRp(p.totalRevenue)], [3, 4]); });
  s2 += '</table>';

  // Sheet 3: Trend Harian
  let s3 = '<table>';
  s3 += title('TREND HARIAN', 4);
  s3 += th(['Tanggal', 'Omzet', 'Profit', 'Transaksi']);
  report.dailyTrend.forEach(d => { s3 += td([d.date, fmtRp(d.omzet), fmtRp(d.profit), d.transactions], [1, 2]); });
  s3 += '</table>';

  downloadAsExcel(`Laporan_Retail_${getFilenameDate(startDate, endDate)}.xls`, [
    { name: 'Ringkasan', html: s1 },
    { name: 'Top Produk', html: s2 },
    { name: 'Trend Harian', html: s3 },
  ]);
}

// ============================================
// EXCEL: BRILINK REPORT
// ============================================

export async function exportBrilinkExcel(
  report: BrilinkReportResponse,
  startDate?: string, endDate?: string, shopName?: string,
): Promise<void> {
  // Sheet 1: Ringkasan + Kategori
  let s1 = '<table>';
  s1 += title('LAPORAN BRILINK', 4);
  s1 += subtitle(`Toko: ${shopName || '-'} | Periode: ${fmtDate(startDate || '')} s/d ${fmtDate(endDate || '')}`, 4);
  s1 += subtitle(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, 4);
  s1 += spacer(4);
  s1 += title('RINGKASAN', 2);
  s1 += td(['Total Transaksi', report.summary.totalTransactions], [1]);
  s1 += td(['Volume', fmtRp(report.summary.volume)], [1]);
  s1 += td(['Pendapatan Fee', fmtRp(report.summary.feeEarnings)], [1]);
  s1 += td(['Rata-rata Fee/Trx', fmtRp(report.summary.avgFee)], [1]);
  s1 += td(['Void', report.summary.voidedCount], [1]);
  s1 += spacer(4);
  s1 += title('PER KATEGORI', 5);
  s1 += th(['Kategori', 'Transaksi', 'Volume', 'Fee', '% Volume']);
  report.categoryBreakdown.forEach(c => { s1 += td([c.category, c.count, fmtRp(c.volume), fmtRp(c.fee), `${c.percentVolume}%`], [2, 3]); });
  s1 += '</table>';

  // Sheet 2: Trend Harian
  let s2 = '<table>';
  s2 += title('TREND HARIAN BRILINK', 4);
  s2 += th(['Tanggal', 'Transaksi', 'Volume', 'Fee']);
  report.dailyTrend.forEach(d => { s2 += td([d.date, d.transactions, fmtRp(d.volume), fmtRp(d.fee)], [2, 3]); });
  s2 += '</table>';

  // Sheet 3: Kasir + Top Customer
  let s3 = '<table>';
  s3 += title('PERFORMA KASIR', 4);
  s3 += th(['Kasir', 'Transaksi', 'Volume', 'Fee']);
  report.cashierPerformance.forEach(c => { s3 += td([c.cashierName, c.count, fmtRp(c.volume), fmtRp(c.fee)], [2, 3]); });
  s3 += spacer(4);
  s3 += title('TOP PELANGGAN', 4);
  s3 += th(['Nama', 'Transaksi', 'Volume', 'Fee']);
  report.topCustomers.forEach(c => { s3 += td([c.customerName, c.count, fmtRp(c.volume), fmtRp(c.fee)], [2, 3]); });
  s3 += '</table>';

  downloadAsExcel(`Laporan_BRILink_${getFilenameDate(startDate, endDate)}.xls`, [
    { name: 'Ringkasan', html: s1 },
    { name: 'Trend Harian', html: s2 },
    { name: 'Kasir & Customer', html: s3 },
  ]);
}

// ============================================
// PDF: SALES REPORT
// ============================================

export async function exportSalesPDF(
  report: SalesReportResponse,
  startDate?: string, endDate?: string, shopName?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN PENJUALAN RETAIL', pw / 2, 15, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(shopName || 'Toko', pw / 2, 22, { align: 'center' });
  doc.text(`Periode: ${fmtDate(startDate || '')} s/d ${fmtDate(endDate || '')}`, pw / 2, 28, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, pw / 2, 33, { align: 'center' });

  // Laba Rugi
  let y = 40;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Laba Rugi', 14, y); y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Omzet (Penjualan)', fmtRp(report.summary.omzet)],
      ['HPP (Harga Pokok)', fmtRp(report.summary.modal)],
      ['Diskon', fmtRp(report.summary.diskon)],
      ['Laba Kotor', fmtRp(report.summary.profit)],
      ['Total Transaksi', String(report.summary.totalTransactions)],
      ['Void', String(report.summary.totalVoided)],
      ['Margin', `${report.summary.marginPercent}%`],
    ],
    theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
    bodyStyles: { fontSize: 9 }, columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Metode Bayar
  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Metode Pembayaran', 14, y); y += 2;
  if (report.methodBreakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Metode', 'Jumlah', 'Total']],
      body: report.methodBreakdown.map(m => [m.method, String(m.count), fmtRp(m.totalAmount)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 9 }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top Products
  if (report.topProducts.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Produk Terlaris', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Produk', 'SKU', 'Qty', 'Revenue']],
      body: report.topProducts.map((p, i) => [String(i + 1), p.productName, p.sku, String(p.totalQty), fmtRp(p.totalRevenue)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 0: { cellWidth: 8 }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Daily Trend
  if (report.dailyTrend.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Trend Harian', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Tanggal', 'Omzet', 'Profit', 'Trx']],
      body: report.dailyTrend.map(d => [d.date, fmtRp(d.omzet), fmtRp(d.profit), String(d.transactions)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`Halaman ${i}/${pages} — Posify`, pw / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });
  }

  doc.save(`Laporan_Retail_${getFilenameDate(startDate, endDate)}.pdf`);
}

// ============================================
// PDF: BRILINK REPORT
// ============================================

export async function exportBrilinkPDF(
  report: BrilinkReportResponse,
  startDate?: string, endDate?: string, shopName?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN BRILINK', pw / 2, 15, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(shopName || 'Toko', pw / 2, 22, { align: 'center' });
  doc.text(`Periode: ${fmtDate(startDate || '')} s/d ${fmtDate(endDate || '')}`, pw / 2, 28, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, pw / 2, 33, { align: 'center' });

  // Ringkasan
  let y = 40;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 14, y); y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Total Transaksi', String(report.summary.totalTransactions)],
      ['Volume', fmtRp(report.summary.volume)],
      ['Pendapatan Fee', fmtRp(report.summary.feeEarnings)],
      ['Rata-rata Fee/Trx', fmtRp(report.summary.avgFee)],
      ['Void', String(report.summary.voidedCount)],
    ],
    theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
    bodyStyles: { fontSize: 9 }, columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Per Kategori
  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Breakdown per Kategori', 14, y); y += 2;
  if (report.categoryBreakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Kategori', 'Trx', 'Volume', 'Fee', '%']],
      body: report.categoryBreakdown.map(c => [c.category, String(c.count), fmtRp(c.volume), fmtRp(c.fee), `${c.percentVolume}%`]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Trend Harian
  if (report.dailyTrend.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Trend Harian', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Tanggal', 'Trx', 'Volume', 'Fee']],
      body: report.dailyTrend.map(d => [d.date, String(d.transactions), fmtRp(d.volume), fmtRp(d.fee)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Kasir Performance
  if (report.cashierPerformance.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Performa Kasir', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Kasir', 'Trx', 'Volume', 'Fee']],
      body: report.cashierPerformance.map(c => [c.cashierName, String(c.count), fmtRp(c.volume), fmtRp(c.fee)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top Customers
  if (report.topCustomers.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Top Pelanggan BRILink', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Nama', 'Trx', 'Volume', 'Fee']],
      body: report.topCustomers.map(c => [c.customerName, String(c.count), fmtRp(c.volume), fmtRp(c.fee)]),
      theme: 'grid', headStyles: { fillColor: [0, 161, 155], fontSize: 9 },
      bodyStyles: { fontSize: 8 }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`Halaman ${i}/${pages} — Posify`, pw / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });
  }

  doc.save(`Laporan_BRILink_${getFilenameDate(startDate, endDate)}.pdf`);
}
