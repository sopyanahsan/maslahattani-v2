/**
 * Export Service — PDF & Excel generation for reports.
 *
 * Uses:
 * - Simple HTML table → .xls for Excel export (no external dependency, works in all browsers)
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

/**
 * Generate an Excel file using HTML table approach.
 * This creates a .xls file that Excel/Google Sheets/LibreOffice can open.
 * No external library needed — works with Vite ESM without issues.
 */
function downloadAsExcel(filename: string, sheets: Array<{ name: string; html: string }>) {
  let workbookHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  workbookHtml += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
  
  sheets.forEach((sheet, i) => {
    workbookHtml += `<x:ExcelWorksheet><x:Name>${sheet.name}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`;
  });
  
  workbookHtml += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
  
  sheets.forEach((sheet) => {
    workbookHtml += sheet.html;
  });
  
  workbookHtml += '</body></html>';

  const blob = new Blob(['\uFEFF' + workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function tableRow(cells: (string | number)[], bold = false): string {
  const tag = bold ? 'th' : 'td';
  return '<tr>' + cells.map(c => `<${tag} style="border:1px solid #ccc;padding:4px 8px;">${c}</${tag}>`).join('') + '</tr>';
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
  // Sheet 1: Ringkasan
  let sheet1 = '<table>';
  sheet1 += `<tr><td colspan="2" style="font-size:16px;font-weight:bold;">LAPORAN PENJUALAN</td></tr>`;
  sheet1 += `<tr><td colspan="2">Toko: ${shopName || '-'}</td></tr>`;
  sheet1 += `<tr><td colspan="2">Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}</td></tr>`;
  sheet1 += `<tr><td colspan="2">Dicetak: ${new Date().toLocaleString('id-ID')}</td></tr>`;
  sheet1 += '<tr><td></td></tr>';
  sheet1 += tableRow(['Metrik', 'Nilai'], true);
  sheet1 += tableRow(['Omzet', report.summary.omzet]);
  sheet1 += tableRow(['Modal', report.summary.modal]);
  sheet1 += tableRow(['Profit', report.summary.profit]);
  sheet1 += tableRow(['Diskon', report.summary.diskon]);
  sheet1 += tableRow(['Total Transaksi', report.summary.totalTransactions]);
  sheet1 += tableRow(['Transaksi Void', report.summary.totalVoided]);
  sheet1 += tableRow(['Margin (%)', report.summary.marginPercent]);
  sheet1 += '<tr><td></td></tr>';
  sheet1 += `<tr><td colspan="3" style="font-weight:bold;">METODE PEMBAYARAN</td></tr>`;
  sheet1 += tableRow(['Metode', 'Jumlah', 'Total'], true);
  report.methodBreakdown.forEach(m => { sheet1 += tableRow([m.method, m.count, m.totalAmount]); });
  sheet1 += '</table>';

  // Sheet 2: Top Produk
  let sheet2 = '<table>';
  sheet2 += `<tr><td colspan="5" style="font-size:14px;font-weight:bold;">TOP 10 PRODUK</td></tr>`;
  sheet2 += '<tr><td></td></tr>';
  sheet2 += tableRow(['#', 'Produk', 'SKU', 'Qty Terjual', 'Revenue'], true);
  report.topProducts.forEach((p, i) => { sheet2 += tableRow([i + 1, p.productName, p.sku, p.totalQty, p.totalRevenue]); });
  sheet2 += '</table>';

  // Sheet 3: Trend Harian
  let sheet3 = '<table>';
  sheet3 += `<tr><td colspan="4" style="font-size:14px;font-weight:bold;">TREND HARIAN</td></tr>`;
  sheet3 += '<tr><td></td></tr>';
  sheet3 += tableRow(['Tanggal', 'Omzet', 'Profit', 'Transaksi'], true);
  report.dailyTrend.forEach(d => { sheet3 += tableRow([d.date, d.omzet, d.profit, d.transactions]); });
  sheet3 += '</table>';

  downloadAsExcel(
    `Laporan_Penjualan_${getFilenameDate(startDate, endDate)}.xls`,
    [
      { name: 'Ringkasan', html: sheet1 },
      { name: 'Top Produk', html: sheet2 },
      { name: 'Trend Harian', html: sheet3 },
    ],
  );
}

export async function exportBrilinkExcel(
  report: BrilinkReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  let html = '<table>';
  html += `<tr><td colspan="4" style="font-size:16px;font-weight:bold;">LAPORAN BRILINK</td></tr>`;
  html += `<tr><td colspan="4">Toko: ${shopName || '-'}</td></tr>`;
  html += `<tr><td colspan="4">Periode: ${startDate ? fmtDate(startDate) : '-'} s/d ${endDate ? fmtDate(endDate) : '-'}</td></tr>`;
  html += '<tr><td></td></tr>';
  html += tableRow(['Total Transaksi', report.summary.totalTransactions, '', '']);
  html += tableRow(['Volume', report.summary.volume, '', '']);
  html += tableRow(['Pendapatan Fee', report.summary.feeEarnings, '', '']);
  html += tableRow(['Rata-rata Fee', report.summary.avgFee, '', '']);
  html += '<tr><td></td></tr>';
  html += `<tr><td colspan="4" style="font-weight:bold;">PER KATEGORI</td></tr>`;
  html += tableRow(['Kategori', 'Transaksi', 'Volume', 'Fee'], true);
  report.categoryBreakdown.forEach(c => { html += tableRow([c.category, c.count, c.volume, c.fee]); });
  html += '</table>';

  downloadAsExcel(
    `Laporan_BRILink_${getFilenameDate(startDate, endDate)}.xls`,
    [{ name: 'BRILink', html }],
  );
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
  const autoTable = (autoTableModule as any).default || autoTableModule;

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
      `Halaman ${i}/${pageCount} — Generated by Posify`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 7,
      { align: 'center' },
    );
  }

  doc.save(`Laporan_Penjualan_${getFilenameDate(startDate, endDate)}.pdf`);
}

export async function exportBrilinkPDF(
  report: BrilinkReportResponse,
  startDate?: string,
  endDate?: string,
  shopName?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

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

  doc.setFontSize(7);
  doc.text(
    `Halaman 1/1 — Generated by Posify`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 7,
    { align: 'center' },
  );

  doc.save(`Laporan_BRILink_${getFilenameDate(startDate, endDate)}.pdf`);
}
