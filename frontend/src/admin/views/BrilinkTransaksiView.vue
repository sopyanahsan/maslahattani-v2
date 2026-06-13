<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Transaksi BRILink</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Daftar transaksi BRILink — transfer, tarik tunai, top-up, dan PLN.
      </p>
    </div>

    <!-- ============================================ -->
    <!-- KPI TARGET CARDS (today vs target)           -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Transaksi -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <HashIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-[#869392]">HARI INI</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Total Transaksi</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-[#e3e2e2] dark:text-slate-100">
          {{ kpi ? kpi.transactions.current : 0 }}
          <span class="text-xs font-normal text-slate-400 dark:text-[#869392]">/ {{ kpi?.transactions.target ?? 0 }}</span>
        </p>
        <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-blue-500 transition-all duration-500" :style="{ width: (kpi?.transactions.percent ?? 0) + '%' }" />
        </div>
      </div>

      <!-- Volume -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <BanknoteIcon class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-[#869392]">{{ kpi?.volume.percent ?? 0 }}%</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Volume</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-[#e3e2e2] dark:text-slate-100">{{ formatCompact(kpi?.volume.current ?? 0) }}</p>
        <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-indigo-500 transition-all duration-500" :style="{ width: (kpi?.volume.percent ?? 0) + '%' }" />
        </div>
      </div>

      <!-- Fee / Profit -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUpIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-[#869392]">{{ kpi?.fee.percent ?? 0 }}%</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Fee / Profit</p>
        <p class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ formatCompact(kpi?.fee.current ?? 0) }}</p>
        <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" :style="{ width: (kpi?.fee.percent ?? 0) + '%' }" />
        </div>
      </div>

      <!-- Achievement -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <TrophyIcon class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span class="text-base">{{ achievementEmoji }}</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Achievement</p>
        <p class="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{{ kpi?.achievement ?? 0 }}%</p>
        <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-amber-500 transition-all duration-500" :style="{ width: (kpi?.achievement ?? 0) + '%' }" />
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CHART (Transaksi / Profit)                   -->
    <!-- ============================================ -->
    <BrilinkTrxProfitChart
      :type="chartType"
      :period="chartPeriod"
      :transactions-data="chartTrxData"
      :profit-chart-data="chartProfitData"
      :loading="chartLoading"
      :error="chartError"
      @update:type="onChartTypeChange"
      @update:period="onChartPeriodChange"
    />

    <!-- ============================================ -->
    <!-- FILTER BAR                                    -->
    <!-- ============================================ -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <!-- Search -->
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#869392]" />
        <input
          v-model="filterSearch"
          type="text"
          placeholder="Cari ref / nama / tujuan..."
          class="h-9 pl-9 pr-3 w-56 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @input="debouncedFetch"
        />
      </div>

      <!-- Periode preset -->
      <select
        v-model="filterPeriod"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="onPeriodPresetChange"
      >
        <option value="all">Semua Waktu</option>
        <option value="today">Hari Ini</option>
        <option value="7d">7 Hari</option>
        <option value="1m">1 Bulan</option>
        <option value="3m">3 Bulan</option>
        <option value="custom">Custom</option>
      </select>

      <!-- Custom date range -->
      <template v-if="filterPeriod === 'custom'">
        <input
          v-model="filterStartDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetAndFetch"
        />
        <input
          v-model="filterEndDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetAndFetch"
        />
      </template>

      <!-- Category filter -->
      <select
        v-model="filterCategory"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Kategori</option>
        <option v-for="c in categoryOptions" :key="c" :value="c">{{ categoryLabel(c) }}</option>
      </select>

      <!-- Status filter -->
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="SUCCESS">Sukses</option>
        <option value="VOIDED">Void</option>
        <option value="FAILED">Gagal</option>
        <option value="PENDING">Pending</option>
      </select>

      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-slate-400 self-center">
        {{ meta.total }} transaksi
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat transaksi...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="transactions.length === 0"
      class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center"
    >
      <ReceiptIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada transaksi</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Sesuaikan filter atau tunggu transaksi BRILink masuk.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Ref</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kategori</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Customer / Tujuan</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nominal</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Fee</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kasir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="trx in transactions"
              :key="trx.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              @click="openDetail(trx)"
            >
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                {{ formatDateTime(trx.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-slate-900 dark:text-slate-100">{{ trx.refNumber }}</code>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', categoryBadge(trx.category)]">
                  {{ getCategoryShort(trx.category) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px]">{{ trx.customerName }}</p>
                <p class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{{ trx.destination }}</p>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {{ formatRupiah(trx.amount) }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {{ trx.fee > 0 ? '+' + formatRupiah(trx.fee) : '—' }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusBadge(trx.status)]">
                  {{ statusLabel(trx.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {{ trx.cashierName || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
      >
        <p class="text-xs text-slate-500 dark:text-slate-400">Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
        <div class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            @click="goPage(meta!.page - 1)"
          >Prev</button>
          <button
            :disabled="meta.page >= meta.totalPages"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            @click="goPage(meta!.page + 1)"
          >Next</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DETAIL DRAWER (slide from right)             -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showDrawer && detailTrx" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" @click="showDrawer = false"></div>
        <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
          <!-- Drawer header -->
          <div class="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">Detail Transaksi</h2>
              <code class="text-xs font-mono text-slate-500 dark:text-slate-400">{{ detailTrx.refNumber }}</code>
            </div>
            <button class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" @click="showDrawer = false">
              <XIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div class="p-5 space-y-5">
            <!-- Status -->
            <div class="flex items-center gap-2">
              <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase', statusBadge(detailTrx.status)]">
                {{ statusLabel(detailTrx.status) }}
              </span>
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', categoryBadge(detailTrx.category)]">
                {{ categoryLabel(detailTrx.category) }}
              </span>
            </div>

            <!-- Info transaksi -->
            <div>
              <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Informasi Transaksi</p>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Customer</dt>
                  <dd class="font-semibold text-slate-900 dark:text-slate-100 text-right">{{ detailTrx.customerName }}</dd>
                </div>
                <div v-if="detailTrx.customerPhone" class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">No. HP</dt>
                  <dd class="font-mono text-slate-900 dark:text-slate-100">{{ detailTrx.customerPhone }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Tujuan</dt>
                  <dd class="font-mono text-slate-900 dark:text-slate-100 text-right break-all">{{ detailTrx.destination }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Nominal</dt>
                  <dd class="font-mono font-semibold text-slate-900 dark:text-slate-100">{{ formatRupiah(detailTrx.amount) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Fee Agen</dt>
                  <dd class="font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(detailTrx.fee) }}</dd>
                </div>
                <div class="flex justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <dt class="text-slate-700 dark:text-slate-300 font-semibold">Total Bayar</dt>
                  <dd class="font-mono font-bold text-slate-900 dark:text-slate-100">{{ formatRupiah(detailTrx.total) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Impact keuangan -->
            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Impact Keuangan</p>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Flow</dt>
                  <dd>
                    <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', detailTrx.flowDirection === 'CREDIT' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300']">
                      {{ detailTrx.flowDirection || '—' }}
                    </span>
                  </dd>
                </div>
                <div v-if="detailTrx.accountLabel" class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Rekening</dt>
                  <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ detailTrx.accountLabel }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Impact Rekening</dt>
                  <dd :class="['font-mono font-semibold', (detailTrx.accountImpact ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400']">
                    {{ signedRupiah(detailTrx.accountImpact ?? 0) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Impact Kas Tunai</dt>
                  <dd :class="['font-mono font-semibold', (detailTrx.cashImpact ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400']">
                    {{ signedRupiah(detailTrx.cashImpact ?? 0) }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Meta -->
            <div>
              <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Meta</p>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Kasir</dt>
                  <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ detailTrx.cashierName || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500 dark:text-slate-400">Waktu</dt>
                  <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatDateTime(detailTrx.createdAt) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Void info -->
            <div v-if="detailTrx.status === 'VOIDED'" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 space-y-1">
              <p class="text-xs font-bold text-red-800 dark:text-red-200">Transaksi Di-void</p>
              <p v-if="detailTrx.voidedAt" class="text-[11px] text-red-700 dark:text-red-300">
                {{ formatDateTime(detailTrx.voidedAt) }}
              </p>
              <p class="text-[11px] text-red-700 dark:text-red-300">Alasan: {{ detailTrx.voidReason }}</p>
              <p class="text-[11px] text-red-700 dark:text-red-300">✓ Saldo rekening &amp; kas tunai sudah dikembalikan</p>
            </div>

            <!-- Void action (only SUCCESS) -->
            <button
              v-if="detailTrx.status === 'SUCCESS'"
              class="w-full h-10 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              @click="openVoidModal(detailTrx)"
            >
              <Trash2Icon class="w-4 h-4" />
              Void Transaksi
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- VOID MODAL                                    -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showVoidModal && voidTrx" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showVoidModal = false"></div>
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleVoid">
          <h3 class="text-sm font-bold text-red-700 dark:text-red-400">Void Transaksi BRILink</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Batalkan <strong class="text-slate-900 dark:text-slate-100">{{ voidTrx.refNumber }}</strong>
            ({{ formatRupiah(voidTrx.amount) }})? Saldo rekening &amp; kas tunai akan dikembalikan otomatis.
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alasan Void <span class="text-red-500">*</span></label>
            <textarea
              v-model="voidReason"
              required
              minlength="5"
              rows="3"
              placeholder="Contoh: Gagal proses di mesin EDC / salah input nominal"
              class="w-full text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          <div v-if="voidError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ voidError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showVoidModal = false">Batal</button>
            <button type="submit" :disabled="voiding || voidReason.length < 5" class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="voiding" class="w-3.5 h-3.5 animate-spin" />
              Konfirmasi Void
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  X as XIcon,
  Trash2 as Trash2Icon,
  Hash as HashIcon,
  Banknote as BanknoteIcon,
  TrendingUp as TrendingUpIcon,
  Trophy as TrophyIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import BrilinkTrxProfitChart from '@/admin/components/dashboard-brilink/BrilinkTrxProfitChart.vue';
import brilinkService, {
  BRILINK_CATEGORIES,
  BRILINK_CATEGORY_LABELS,
  type BrilinkCategory,
  type BrilinkStatus,
  type BrilinkTransactionDto,
  type BrilinkListResponse,
  type BrilinkKpiResponse,
  type BrilinkChartType,
  type BrilinkChartPeriod,
  type BrilinkTransactionsChartData,
  type BrilinkProfitChartData,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const route = useRoute();

// ============================================
// State
// ============================================
const transactions = ref<BrilinkTransactionDto[]>([]);
const meta = ref<BrilinkListResponse['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const kpi = ref<BrilinkKpiResponse | null>(null);

// Chart state
const chartType = ref<BrilinkChartType>('transactions');
const chartPeriod = ref<BrilinkChartPeriod>('today');
const chartTrxData = ref<BrilinkTransactionsChartData | null>(null);
const chartProfitData = ref<BrilinkProfitChartData | null>(null);
const chartLoading = ref(false);
const chartError = ref<string | null>(null);

// Filters
const filterSearch = ref('');
const filterPeriod = ref('all');
const filterCategory = ref('');
const filterStatus = ref('');
const filterStartDate = ref('');
const filterEndDate = ref('');
const currentPage = ref(1);

const categoryOptions = BRILINK_CATEGORIES;

// Drawer
const showDrawer = ref(false);
const detailTrx = ref<BrilinkTransactionDto | null>(null);

// Void
const showVoidModal = ref(false);
const voidTrx = ref<BrilinkTransactionDto | null>(null);
const voiding = ref(false);
const voidError = ref<string | null>(null);
const voidReason = ref('');

// ============================================
// Helpers
// ============================================
function getShopId(): string | undefined {
  return shopStore.currentShopId || authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

function signedRupiah(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return sign + formatRupiah(Math.abs(amount));
}

function formatCompact(amount: number): string {
  if (!amount) return 'Rp 0';
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

function formatDateTime(iso: string): string {
  // Force Asia/Jakarta timezone — Prisma stores UTC in TIMESTAMP WITHOUT TZ
  // so we need explicit timeZone to avoid browser treating it as local
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function categoryLabel(c: BrilinkCategory): string {
  return BRILINK_CATEGORY_LABELS[c] ?? c;
}

function getCategoryShort(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'TF BRI', TRANSFER_OTHER: 'TF Lain', TARIK_TUNAI: 'Tarik',
    TOPUP_PULSA: 'Pulsa', TOPUP_DATA: 'Data', TOPUP_EWALLET: 'E-Wallet', TOPUP_PLN: 'PLN',
  };
  return map[cat] ?? cat;
}

function categoryBadge(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    TRANSFER_OTHER: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    TARIK_TUNAI: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    TOPUP_PULSA: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    TOPUP_DATA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    TOPUP_EWALLET: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    TOPUP_PLN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  };
  return map[cat] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { SUCCESS: 'Sukses', FAILED: 'Gagal', PENDING: 'Pending', VOIDED: 'Void' };
  return map[s] ?? s;
}

function statusBadge(s: string): string {
  switch (s) {
    case 'SUCCESS': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'FAILED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'PENDING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    case 'VOIDED': return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
}

const achievementEmoji = ref('');
function computeEmoji() {
  const a = kpi.value?.achievement ?? 0;
  achievementEmoji.value = a >= 100 ? '🏆' : a >= 75 ? '🔥' : a >= 50 ? '💪' : a >= 25 ? '🙂' : '🎯';
}

// ============================================
// Date range from preset
// ============================================
function getDateRange(): { startDate?: string; endDate?: string } {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  switch (filterPeriod.value) {
    case 'today':
      return { startDate: toISO(today), endDate: toISO(today) };
    case '7d': {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      return { startDate: toISO(s), endDate: toISO(today) };
    }
    case '1m': {
      const s = new Date(today); s.setDate(s.getDate() - 29);
      return { startDate: toISO(s), endDate: toISO(today) };
    }
    case '3m': {
      const s = new Date(today); s.setDate(s.getDate() - 89);
      return { startDate: toISO(s), endDate: toISO(today) };
    }
    case 'custom':
      return {
        startDate: filterStartDate.value || undefined,
        endDate: filterEndDate.value || undefined,
      };
    default:
      return {};
  }
}

// ============================================
// Fetch
// ============================================
async function fetchTransactions() {
  const shopId = getShopId();
  if (!shopId) return;
  loading.value = true;
  error.value = null;
  try {
    const range = getDateRange();
    const res = await brilinkService.listTransactions({
      shopId,
      category: (filterCategory.value as BrilinkCategory) || undefined,
      status: (filterStatus.value as BrilinkStatus) || undefined,
      search: filterSearch.value || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      page: currentPage.value,
      limit: 20,
    });
    transactions.value = res.data;
    meta.value = res.meta;
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal memuat transaksi.';
  } finally {
    loading.value = false;
  }
}

async function fetchKpi() {
  const shopId = getShopId();
  if (!shopId) return;
  try {
    kpi.value = await brilinkService.getKpi(shopId);
    computeEmoji();
  } catch {
    kpi.value = null;
  }
}

async function fetchChart() {
  const shopId = getShopId();
  if (!shopId) return;
  chartLoading.value = true;
  chartError.value = null;
  try {
    const res = await brilinkService.getChart({
      shopId,
      period: chartPeriod.value,
      type: chartType.value,
    });
    if (chartType.value === 'transactions') {
      chartTrxData.value = res as BrilinkTransactionsChartData;
    } else {
      chartProfitData.value = res as BrilinkProfitChartData;
    }
  } catch (err: any) {
    chartError.value = err?.response?.data?.message || err?.message || 'Gagal memuat grafik.';
  } finally {
    chartLoading.value = false;
  }
}

// ============================================
// Handlers
// ============================================
function resetAndFetch() {
  currentPage.value = 1;
  fetchTransactions();
}

function onPeriodPresetChange() {
  if (filterPeriod.value !== 'custom') {
    filterStartDate.value = '';
    filterEndDate.value = '';
  }
  resetAndFetch();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchTransactions();
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchTransactions();
  }, 300);
}

function onChartTypeChange(t: BrilinkChartType) {
  chartType.value = t;
  fetchChart();
}

function onChartPeriodChange(p: BrilinkChartPeriod) {
  chartPeriod.value = p;
  fetchChart();
}

// Drawer & void
function openDetail(trx: BrilinkTransactionDto) {
  detailTrx.value = trx;
  showDrawer.value = true;
}

function openVoidModal(trx: BrilinkTransactionDto) {
  voidTrx.value = trx;
  voidError.value = null;
  voidReason.value = '';
  showVoidModal.value = true;
}

async function handleVoid() {
  if (!voidTrx.value) return;
  voiding.value = true;
  voidError.value = null;
  try {
    await brilinkService.voidTransaction(voidTrx.value.id, voidReason.value);
    showVoidModal.value = false;
    showDrawer.value = false;
    await Promise.all([fetchTransactions(), fetchKpi()]);
  } catch (err: any) {
    voidError.value = err?.response?.data?.message || err?.message || 'Gagal void transaksi.';
  } finally {
    voiding.value = false;
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  // Honor query params from dashboard deep-links
  if (route.query.status) filterStatus.value = String(route.query.status);
  if (route.query.category) filterCategory.value = String(route.query.category);

  fetchTransactions();
  fetchKpi();
  fetchChart();
});
</script>
