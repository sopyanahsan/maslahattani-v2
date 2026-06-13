<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">Laporan Retail</h1>
      <p class="text-xs text-slate-500 mt-0.5">Analisis penjualan, laba rugi, produk, dan customer.</p>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
      <input v-model="startDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
      <input v-model="endDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5" @click="fetchAll">
        Terapkan
      </button>
      <div class="flex items-center gap-1.5">
        <button v-for="r in quickRanges" :key="r.label" type="button" :class="['h-7 px-2.5 text-[11px] font-medium rounded-md transition-colors', activeRange === r.label ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50']" @click="applyRange(r.days, r.label)">{{ r.label }}</button>
      </div>
      <!-- Export Buttons -->
      <div v-if="salesReport" class="flex items-center gap-1.5 sm:ml-auto">
        <button
          type="button"
          :disabled="exporting"
          class="h-8 px-3 text-[11px] font-semibold border border-red-200 text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5"
          @click="handleExport('pdf')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          {{ exporting ? 'Exporting...' : 'PDF' }}
        </button>
        <button
          type="button"
          :disabled="exporting"
          class="h-8 px-3 text-[11px] font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1.5"
          @click="handleExport('excel')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          {{ exporting ? 'Exporting...' : 'Excel' }}
        </button>
        <button
          type="button"
          class="h-8 px-3 text-[11px] font-semibold border border-slate-200 text-slate-600 rounded-md hover:bg-slate-100 flex items-center gap-1.5"
          @click="handleExportCSV"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          CSV
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      <button v-for="tab in tabs" :key="tab.key" type="button" :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors', activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900']" @click="activeTab = tab.key">{{ tab.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-4 border-slate-200 border-t-[#03a29c] rounded-full animate-spin" />
      <span class="ml-3 text-sm text-slate-500">Memuat laporan...</span>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- TAB: Penjualan                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'sales' && salesReport">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Omzet</p>
            <p class="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">{{ formatRupiah(salesReport.summary.omzet) }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Laba Kotor</p>
            <p class="text-lg font-bold font-mono tabular-nums text-emerald-600 mt-1">{{ formatRupiah(salesReport.summary.profit) }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Transaksi</p>
            <p class="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">{{ salesReport.summary.totalTransactions }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Margin</p>
            <p class="text-lg font-bold font-mono tabular-nums text-blue-600 mt-1">{{ salesReport.summary.marginPercent }}%</p>
          </div>
        </div>

        <!-- Grafik Trend Penjualan -->
        <div v-if="salesReport.dailyTrend.length > 0" class="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 mb-4">Grafik Trend Penjualan</h3>
          <div class="flex gap-2">
            <div class="flex flex-col justify-between h-48 text-right pr-1 shrink-0 w-12">
              <span class="text-[9px] font-mono tabular-nums text-slate-400">{{ formatCompact(trendYMax) }}</span>
              <span class="text-[9px] font-mono tabular-nums text-slate-400">{{ formatCompact(Math.round(trendYMax * 0.5)) }}</span>
              <span class="text-[9px] font-mono tabular-nums text-slate-400">0</span>
            </div>
            <div class="flex-1 relative h-48">
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div class="border-b border-dashed border-slate-200" />
                <div class="border-b border-dashed border-slate-200" />
                <div class="border-b border-slate-200" />
              </div>
              <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                <path :d="trendAreaPath" fill="url(#trendGrad)" />
                <polyline :points="trendLinePath" fill="none" stroke="#03a29c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <circle v-for="(pt, i) in trendCoords" :key="i" :cx="pt.x" :cy="pt.y" r="3.5" fill="#03a29c" stroke="white" stroke-width="1.5" />
                <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#03a29c" stop-opacity="0.25" /><stop offset="100%" stop-color="#03a29c" stop-opacity="0.02" /></linearGradient></defs>
              </svg>
            </div>
          </div>
          <div class="flex mt-2 ml-14">
            <div v-for="(d, i) in salesReport.dailyTrend" :key="i" class="flex-1 text-center">
              <span v-if="shouldShowTrendLabel(i)" class="text-[8px] font-mono text-slate-400">{{ formatShortDate(d.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Method Breakdown -->
        <div v-if="salesReport.methodBreakdown.length > 0" class="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 mb-3">Breakdown Metode Bayar</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="m in salesReport.methodBreakdown" :key="m.method" class="border border-slate-200 rounded-lg p-3 text-center">
              <span :class="['inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-2', methodBadge(m.method)]">{{ m.method }}</span>
              <p class="text-sm font-bold font-mono tabular-nums text-slate-900">{{ formatRupiah(m.totalAmount) }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ m.count }} trx</p>
            </div>
          </div>
        </div>

        <!-- Daily Trend Table -->
        <div v-if="salesReport.dailyTrend.length > 0" class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900">Trend Harian</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Tanggal</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Omzet</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Profit</th><th class="px-4 py-2 text-center text-[10px] font-bold text-slate-600 uppercase">Trx</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="d in salesReport.dailyTrend" :key="d.date" class="hover:bg-slate-50"><td class="px-4 py-2 text-xs font-mono tabular-nums text-slate-700">{{ d.date }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-slate-900">{{ formatRupiah(d.omzet) }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-emerald-600">{{ formatRupiah(d.profit) }}</td><td class="px-4 py-2 text-center text-xs font-mono tabular-nums text-slate-700">{{ d.transactions }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Laba Rugi                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'labarugi' && salesReport">
        <!-- P&L Statement -->
        <div class="bg-white border border-slate-200 rounded-lg p-5 shadow-sm max-w-lg">
          <h3 class="text-sm font-bold text-slate-900 mb-4">Laporan Laba Rugi</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm"><span class="text-slate-700">Pendapatan (Omzet)</span><span class="font-mono tabular-nums font-bold text-slate-900">{{ formatRupiah(salesReport.summary.omzet) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-700">HPP (Harga Pokok Penjualan)</span><span class="font-mono tabular-nums text-red-500">- {{ formatRupiah(salesReport.summary.modal) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-700">Diskon Diberikan</span><span class="font-mono tabular-nums text-amber-500">- {{ formatRupiah(salesReport.summary.diskon) }}</span></div>
            <div class="border-t border-slate-200 pt-3 flex justify-between text-base"><span class="font-bold text-slate-900">Laba Kotor</span><span class="font-mono tabular-nums font-bold text-emerald-600">{{ formatRupiah(salesReport.summary.profit) }}</span></div>
            <div class="flex justify-between text-xs text-slate-400"><span>Margin Profit</span><span class="font-mono tabular-nums">{{ salesReport.summary.marginPercent }}%</span></div>
            <div class="flex justify-between text-xs text-slate-400"><span>Void</span><span class="font-mono tabular-nums">{{ salesReport.summary.totalVoided }} transaksi</span></div>
          </div>
        </div>

        <!-- Perbandingan Periode -->
        <div v-if="comparison" class="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 mb-4">Perbandingan Periode</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Omzet</p>
              <p class="text-sm font-bold font-mono tabular-nums text-slate-900">{{ formatRupiah(comparison.current.omzet) }}</p>
              <p class="text-[10px] text-slate-400">vs {{ formatRupiah(comparison.previous.omzet) }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.omzet >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.omzet >= 0 ? '+' : '' }}{{ comparison.change.omzet }}%</span>
            </div>
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Profit</p>
              <p class="text-sm font-bold font-mono tabular-nums text-emerald-600">{{ formatRupiah(comparison.current.profit) }}</p>
              <p class="text-[10px] text-slate-400">vs {{ formatRupiah(comparison.previous.profit) }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.profit >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.profit >= 0 ? '+' : '' }}{{ comparison.change.profit }}%</span>
            </div>
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Transaksi</p>
              <p class="text-sm font-bold font-mono tabular-nums text-slate-900">{{ comparison.current.transactions }}</p>
              <p class="text-[10px] text-slate-400">vs {{ comparison.previous.transactions }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.transactions >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.transactions >= 0 ? '+' : '' }}{{ comparison.change.transactions }}%</span>
            </div>
          </div>
          <p class="text-[10px] text-slate-400 mt-3 text-center">{{ comparison.current.period }} vs {{ comparison.previous.period }}</p>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Produk                                  -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'products' && productReport">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Total Produk</p>
            <p class="text-lg font-bold text-slate-900 mt-1">{{ productReport.totalProducts }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Terjual</p>
            <p class="text-lg font-bold text-emerald-600 mt-1">{{ productReport.productsWithSales }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Tidak Laku</p>
            <p class="text-lg font-bold text-red-500 mt-1">{{ productReport.productsWithoutSales }}</p>
          </div>
        </div>

        <!-- Top Selling -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-emerald-50"><h3 class="text-sm font-bold text-emerald-800">Top 10 Produk Terlaris</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">#</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Qty</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Revenue</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="(p, i) in productReport.topSelling" :key="p.productId" class="hover:bg-slate-50"><td class="px-4 py-2 text-xs text-slate-400">{{ i + 1 }}</td><td class="px-4 py-2 text-xs font-medium text-slate-900">{{ p.name }} <span class="text-slate-400">({{ p.sku }})</span></td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-slate-700">{{ p.qtySold }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums font-semibold text-slate-900">{{ formatRupiah(p.revenue) }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Slow Moving -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-red-50"><h3 class="text-sm font-bold text-red-800">Produk Slow Moving (Ga Laku)</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Harga</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Terjual</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="p in productReport.slowMoving" :key="p.productId" class="hover:bg-slate-50"><td class="px-4 py-2 text-xs font-medium text-slate-900">{{ p.name }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-slate-700">{{ formatRupiah(p.price || 0) }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums" :class="p.qtySold === 0 ? 'text-red-500 font-bold' : 'text-slate-600'">{{ p.qtySold }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Highest Margin -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-blue-50"><h3 class="text-sm font-bold text-blue-800">Produk Margin Tertinggi</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Margin</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">%</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Total Profit</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="p in productReport.highestMargin" :key="p.productId" class="hover:bg-slate-50"><td class="px-4 py-2 text-xs font-medium text-slate-900">{{ p.name }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-slate-700">{{ formatRupiah(p.margin || 0) }}</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums text-blue-600 font-bold">{{ p.marginPercent }}%</td><td class="px-4 py-2 text-right text-xs font-mono tabular-nums font-semibold text-emerald-600">{{ formatRupiah(p.totalProfit || 0) }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Kategori Produk -->
        <div v-if="productReport.categoryBreakdown && productReport.categoryBreakdown.length > 0" class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-violet-50"><h3 class="text-sm font-bold text-violet-800">Penjualan per Kategori Produk</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Kategori</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Qty Terjual</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Revenue</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="c in productReport.categoryBreakdown" :key="c.categoryId" class="hover:bg-slate-50"><td class="px-4 py-2.5 text-xs font-semibold text-slate-800">{{ c.name }}</td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums text-slate-500">{{ c.productCount }}</td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums text-slate-700">{{ c.qty }}</td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums font-semibold text-slate-900">{{ formatRupiah(c.revenue) }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Stok Menipis -->
        <div v-if="productReport.lowStock && productReport.lowStock.length > 0" class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-amber-50">
            <h3 class="text-sm font-bold text-amber-800">Stok Menipis (≤ {{ productReport.lowStockThreshold }} pcs)</h3>
            <p class="text-[10px] text-amber-600 mt-0.5">Produk yang perlu segera di-restock</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">SKU</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Sisa Stok</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Threshold</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="s in productReport.lowStock" :key="s.productId" class="hover:bg-amber-50/50"><td class="px-4 py-2.5 text-xs font-semibold text-slate-800">{{ s.name }}</td><td class="px-4 py-2.5 text-xs font-mono text-slate-400">{{ s.sku }}</td><td class="px-4 py-2.5 text-right"><span :class="['text-xs font-mono tabular-nums font-bold', s.currentStock === 0 ? 'text-red-600' : 'text-amber-600']">{{ s.currentStock }}</span></td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums text-slate-400">≤ {{ s.threshold }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Customer                                -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'customers' && customerReport">
        <!-- Summary -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Total Customer</p>
            <p class="text-lg font-bold text-slate-900 mt-1">{{ customerReport.summary.totalUniqueCustomers }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Repeat</p>
            <p class="text-lg font-bold text-blue-600 mt-1">{{ customerReport.summary.repeatCustomers }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">New</p>
            <p class="text-lg font-bold text-blue-600 mt-1">{{ customerReport.summary.newCustomers }}</p>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
            <p class="text-[10px] text-slate-500 uppercase">Baru Daftar</p>
            <p class="text-lg font-bold text-amber-600 mt-1">{{ customerReport.summary.newlyRegistered }}</p>
          </div>
        </div>

        <!-- Top Spenders -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50"><h3 class="text-sm font-bold text-slate-900">Customer Ranking (Top Spender)</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">#</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Nama</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Total Belanja</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Profit</th><th class="px-4 py-2 text-center text-[10px] font-bold text-slate-600 uppercase">Trx</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Avg/Visit</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="(c, i) in customerReport.topSpenders" :key="c.customerId" class="hover:bg-slate-50"><td class="px-4 py-2.5 text-xs text-slate-400 font-bold">{{ i + 1 }}</td><td class="px-4 py-2.5"><p class="text-xs font-semibold text-slate-900">{{ c.name }}</p><p v-if="c.phone" class="text-[10px] text-slate-400">{{ c.phone }}</p></td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums font-bold text-slate-900">{{ formatRupiah(c.totalSpent) }}</td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums text-emerald-600">{{ formatRupiah(c.totalProfit) }}</td><td class="px-4 py-2.5 text-center text-xs font-mono tabular-nums text-slate-700">{{ c.transactionCount }}</td><td class="px-4 py-2.5 text-right text-xs font-mono tabular-nums text-slate-600">{{ formatRupiah(c.avgPerVisit) }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import reportsService, { exportToCSV, type SalesReportResponse, type ProductReportResponse, type CustomerReportResponse, type SalesComparisonResponse } from '@/shared/services/reports.service';
import { exportSalesExcel, exportSalesPDF } from '@/shared/services/export.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const loading = ref(false);
const exporting = ref(false);
const activeTab = ref<'sales' | 'labarugi' | 'products' | 'customers'>('sales');
const activeRange = ref('30 Hari');
const startDate = ref('');
const endDate = ref('');

const salesReport = ref<SalesReportResponse | null>(null);
const productReport = ref<ProductReportResponse | null>(null);
const customerReport = ref<CustomerReportResponse | null>(null);
const comparison = ref<SalesComparisonResponse | null>(null);

const tabs = [
  { key: 'sales', label: 'Penjualan' },
  { key: 'labarugi', label: 'Laba Rugi' },
  { key: 'products', label: 'Produk' },
  { key: 'customers', label: 'Customer' },
];

const quickRanges = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
];

function getShopId(): string | undefined { return shopStore.currentShopId || authStore.user?.shopId || undefined; }

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return String(amount);
}

function formatShortDate(d: string): string {
  const parts = d.split('-');
  return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function applyRange(days: number, label: string) {
  activeRange.value = label;
  const now = new Date();
  if (days === 0) { startDate.value = now.toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  else if (days === -1) { startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  else { const s = new Date(now); s.setDate(s.getDate() - days + 1); startDate.value = s.toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  fetchAll();
}

async function fetchAll() {
  const shopId = getShopId(); if (!shopId) return;
  loading.value = true;
  try {
    const [sales, products, customers, comp] = await Promise.allSettled([
      reportsService.getSalesReport(shopId, startDate.value || undefined, endDate.value || undefined),
      reportsService.getProductReport(shopId, startDate.value || undefined, endDate.value || undefined),
      reportsService.getCustomerReport(shopId, startDate.value || undefined, endDate.value || undefined),
      startDate.value && endDate.value ? reportsService.getSalesComparison(shopId, startDate.value, endDate.value) : Promise.resolve(null),
    ]);
    salesReport.value = sales.status === 'fulfilled' ? sales.value : null;
    productReport.value = products.status === 'fulfilled' ? products.value : null;
    customerReport.value = customers.status === 'fulfilled' ? customers.value : null;
    comparison.value = comp.status === 'fulfilled' ? comp.value : null;
  } finally { loading.value = false; }
}

// ============================================
// Trend Chart (SVG line in Penjualan tab)
// ============================================

const trendYMax = computed(() => {
  if (!salesReport.value) return 100000;
  const max = Math.max(...salesReport.value.dailyTrend.map(d => d.omzet), 1);
  const h = max * 1.2;
  const mag = Math.pow(10, Math.floor(Math.log10(h)));
  return Math.ceil(h / mag) * mag;
});

const trendCoords = computed(() => {
  if (!salesReport.value) return [];
  const data = salesReport.value.dailyTrend;
  const n = data.length;
  if (n === 0) return [];
  const w = 600, h = 200, px = 20, py = 15;
  return data.map((d, i) => ({
    x: px + (n === 1 ? (w - px * 2) / 2 : (i / (n - 1)) * (w - px * 2)),
    y: py + (h - py * 2) - (d.omzet / trendYMax.value) * (h - py * 2),
  }));
});

const trendLinePath = computed(() => trendCoords.value.map(p => `${p.x},${p.y}`).join(' '));

const trendAreaPath = computed(() => {
  const pts = trendCoords.value;
  if (pts.length === 0) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},185 L${pts[0].x},185 Z`;
});

function shouldShowTrendLabel(idx: number): boolean {
  const total = salesReport.value?.dailyTrend.length || 0;
  if (total <= 10) return true;
  if (total <= 15) return idx % 2 === 0;
  return idx % 3 === 0;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

async function handleExport(format: 'pdf' | 'excel') {
  if (!salesReport.value) return;
  exporting.value = true;
  try {
    const shopName = shopStore.currentShopName || 'Toko';
    // Merge productReport data into salesReport for complete export
    const exportData = {
      ...salesReport.value,
      productReport: productReport.value || null,
    };
    if (format === 'pdf') {
      await exportSalesPDF(exportData, startDate.value, endDate.value, shopName);
    } else {
      await exportSalesExcel(exportData, startDate.value, endDate.value, shopName);
    }
  } catch (e) {
    console.error('Export error:', e);
  } finally {
    exporting.value = false;
  }
}

function handleExportCSV() {
  if (!salesReport.value) return;
  const s = salesReport.value.summary;
  // Export summary + daily trend as CSV
  const headers = ['Tanggal', 'Omzet', 'Profit', 'Transaksi'];
  const rows = salesReport.value.dailyTrend.map(d => [d.date, d.omzet, d.profit, d.transactions]);
  // Prepend summary row
  rows.unshift(['TOTAL', s.omzet, s.profit, s.totalTransactions]);
  exportToCSV(`laporan-retail-${startDate.value || 'all'}-${endDate.value || 'all'}.csv`, headers, rows);
}

onMounted(() => { applyRange(30, '30 Hari'); });
</script>

<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-5 > *, .space-y-6 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-5 > *:nth-child(1), .space-y-6 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2), .space-y-6 > *:nth-child(2) { animation-delay: 70ms; }
.space-y-5 > *:nth-child(3), .space-y-6 > *:nth-child(3) { animation-delay: 140ms; }
.space-y-5 > *:nth-child(4), .space-y-6 > *:nth-child(4) { animation-delay: 210ms; }
.space-y-5 > *:nth-child(5), .space-y-6 > *:nth-child(5) { animation-delay: 280ms; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.grid > div[class*="rounded-lg"] { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.grid > div:nth-child(1) { animation-delay: 100ms; }
.grid > div:nth-child(2) { animation-delay: 180ms; }
.grid > div:nth-child(3) { animation-delay: 260ms; }
.grid > div:nth-child(4) { animation-delay: 340ms; }
table tbody tr { transition: all 0.15s ease; }
table tbody tr:hover { box-shadow: inset 3px 0 0 #2563EB; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
div[class*="rounded-lg"][class*="shadow-xl"] { animation: scaleIn 0.25s ease-out; }
</style>
