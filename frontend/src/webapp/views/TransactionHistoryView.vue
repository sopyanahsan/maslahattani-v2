<template>
  <div class="font-hanken overflow-x-hidden w-full">
    <!-- Header -->
    <div class="px-4 pt-4 pb-3 bg-white dark:bg-[#1e2020] border-b border-slate-200 dark:border-[#3d4948]">
      <h1 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2] flex items-center gap-2">
        <ReceiptIcon class="w-5 h-5 text-[#00A19B] dark:text-[#5fd9d2]" /> Riwayat Transaksi
      </h1>
    </div>

    <!-- Tabs: Retail / BRILink -->
    <div class="px-4 pt-3 bg-white dark:bg-[#1e2020]">
      <div class="flex rounded-xl bg-slate-100 dark:bg-[#292a2a] p-1">
        <button :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', trxType === 'retail' ? 'bg-[#00A19B] text-white shadow-sm' : 'text-slate-500 dark:text-[#869392]']" @click="trxType = 'retail'; meta.page = 1; fetchTransactions()">Retail</button>
        <button v-if="settingsStore.isBrilinkEnabled" :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', trxType === 'brilink' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#869392]']" @click="trxType = 'brilink'; meta.page = 1; fetchTransactions()">BRILink</button>
      </div>
    </div>

    <!-- Search + Date -->
    <div class="px-4 py-3 space-y-2.5 bg-white dark:bg-[#1e2020] border-b border-slate-100 dark:border-[#3d4948]">
      <div class="relative">
        <SearchIcon class="w-4 h-4 text-slate-400 dark:text-[#869392] absolute left-3 top-1/2 -translate-y-1/2" />
        <input v-model="search" type="text" :placeholder="trxType === 'retail' ? 'Cari no. struk atau produk...' : 'Cari ref, customer, tujuan...'" class="w-full bg-slate-50 dark:bg-[#1a1c1c] rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-[#e3e2e2] placeholder:text-slate-400 dark:placeholder:text-[#869392] border border-transparent focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:bg-white dark:focus:bg-[#1e2020] focus:ring-2 focus:ring-[#00A19B]/20 outline-none transition-all" @input="debouncedFetch" />
      </div>
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <CalendarIcon class="w-3.5 h-3.5 text-slate-400 dark:text-[#869392] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input v-model="startDate" type="date" class="w-full h-9 pl-8 pr-2 text-xs border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none" @change="fetchTransactions" />
        </div>
        <span class="text-slate-300 dark:text-[#3d4948]">—</span>
        <div class="flex-1 relative">
          <CalendarIcon class="w-3.5 h-3.5 text-slate-400 dark:text-[#869392] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input v-model="endDate" type="date" class="w-full h-9 pl-8 pr-2 text-xs border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none" @change="fetchTransactions" />
        </div>
      </div>
      <!-- Status filters -->
      <div class="flex gap-1.5 overflow-x-auto hide-scrollbar">
        <button v-for="f in currentStatusFilters" :key="f.value" :class="['shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors', statusFilter === f.value ? 'bg-[#00A19B] dark:bg-[#5fd9d2] text-white' : 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-200 dark:hover:bg-[#3d4948]']" @click="statusFilter = f.value; meta.page = 1; fetchTransactions()">{{ f.label }}</button>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-2 gap-2.5 px-4 py-3 bg-slate-50 dark:bg-[#1a1c1c]">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl p-3 text-center">
        <p class="text-[10px] font-semibold text-slate-500 dark:text-[#869392] uppercase">Total Transaksi</p>
        <p class="text-lg font-bold text-slate-900 dark:text-[#e3e2e2] font-mono">{{ meta.total }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl p-3 text-center">
        <p class="text-[10px] font-semibold text-slate-500 dark:text-[#869392] uppercase">Total Omzet</p>
        <p class="text-lg font-bold text-[#00A19B] dark:text-[#5fd9d2] font-mono">{{ formatRupiahShort(totalOmzet) }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 py-3 space-y-2 bg-slate-50 dark:bg-[#1a1c1c] min-h-[40vh]">

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      </div>

      <!-- Empty -->
      <div v-else-if="transactions.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <ReceiptIcon class="w-10 h-10 text-slate-200 dark:text-[#3d4948] mb-3" />
        <p class="text-sm text-slate-500 dark:text-[#869392]">Tidak ada transaksi ditemukan</p>
      </div>

      <!-- Transaction list -->
      <template v-else>
        <!-- RETAIL list -->
        <template v-if="trxType === 'retail'">
          <button v-for="trx in transactions" :key="trx.id"
            class="w-full text-left bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl p-3.5 hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.15)] transition-all"
            @click="openRetailDetail(trx)">
            <div class="flex items-center gap-3">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', retailStatusIconBg(trx.status)]">
                <ReceiptIcon class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-[#e3e2e2] truncate">{{ trx.items?.map((i: any) => i.product?.name).join(', ') || trx.transactionNumber }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-mono text-slate-400 dark:text-[#869392]">{{ trx.transactionNumber }}</span>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded-full', retailStatusBadge(trx.status)]">{{ retailStatusLabel(trx.status) }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(trx.totalPrice) }}</p>
                <p class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5">{{ formatTime(trx.createdAt) }}</p>
              </div>
            </div>
          </button>
        </template>

        <!-- BRILINK list -->
        <template v-else>
          <button v-for="trx in transactions" :key="trx.id"
            class="w-full text-left bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl p-3.5 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all"
            @click="openBrilinkDetail(trx)">
            <div class="flex items-center gap-3">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', brilinkStatusIconBg(trx.status)]">
                <LandmarkIcon class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-[#e3e2e2] truncate">{{ trx.customerName || 'Nasabah' }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded-full', brilinkCategoryBadge(trx.category)]">{{ BRILINK_CATEGORY_LABELS[trx.category] || trx.category }}</span>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded-full', brilinkStatusBadge(trx.status)]">{{ brilinkStatusLabel(trx.status) }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(trx.amount) }}</p>
                <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+{{ formatRupiah(trx.fee) }}</p>
                <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ formatTime(trx.createdAt) }}</p>
              </div>
            </div>
          </button>
        </template>
      </template>

      <!-- Pagination -->
      <div v-if="meta.totalPages > 1" class="flex items-center justify-center gap-2 pt-3 pb-2">
        <button :disabled="meta.page <= 1" class="h-9 px-4 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-xl disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7] hover:bg-white dark:hover:bg-[#1e2020] transition-colors" @click="meta.page--; fetchTransactions()">Prev</button>
        <span class="text-xs text-slate-500 dark:text-[#869392] font-mono">{{ meta.page }} / {{ meta.totalPages }}</span>
        <button :disabled="meta.page >= meta.totalPages" class="h-9 px-4 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-xl disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7] hover:bg-white dark:hover:bg-[#1e2020] transition-colors" @click="meta.page++; fetchTransactions()">Next</button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DETAIL MODAL: Retail Transaction                               -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showRetailDetail && selectedRetail" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showRetailDetail = false" />
          <div class="relative w-full sm:max-w-md bg-white dark:bg-[#1e2020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-[#3d4948] shadow-2xl max-h-[90vh] overflow-y-auto">
            <!-- handle -->
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto mt-3 sm:hidden" />

            <!-- header -->
            <div class="sticky top-0 bg-white dark:bg-[#1e2020] border-b border-slate-100 dark:border-[#3d4948] px-5 py-3 flex items-center justify-between z-10">
              <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Detail Transaksi</h3>
              <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showRetailDetail = false"><XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" /></button>
            </div>

            <div class="p-5 space-y-4">
              <!-- Status card -->
              <div class="bg-slate-50 dark:bg-[#1a1c1c] rounded-2xl p-4 space-y-2">
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Status</span><span :class="['text-xs font-bold px-2 py-0.5 rounded-full', retailStatusBadge(selectedRetail.status)]">{{ retailStatusLabel(selectedRetail.status) }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">No. Struk</span><span class="text-xs font-mono font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ selectedRetail.transactionNumber }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Tanggal</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ formatDateTime(selectedRetail.createdAt) }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Pembayaran</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ selectedRetail.payments?.[0]?.method || '-' }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Kasir</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ selectedRetail.user?.username || selectedRetail.user?.email || '-' }}</span></div>
              </div>

              <!-- Items -->
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-[#e3e2e2] mb-2">Item ({{ selectedRetail.items?.length || 0 }})</p>
                <div class="space-y-1.5">
                  <div v-for="item in selectedRetail.items" :key="item.id" class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1e2020] border border-slate-100 dark:border-[#3d4948]">
                    <div>
                      <p class="text-sm font-medium text-slate-800 dark:text-[#e3e2e2]">{{ item.product?.name || 'Produk' }}</p>
                      <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ item.quantity }} × {{ formatRupiah(item.unitPrice) }}</p>
                    </div>
                    <span class="text-sm font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(item.subtotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="border-t border-slate-200 dark:border-[#3d4948] pt-3 space-y-1.5">
                <div class="flex justify-between text-xs text-slate-600 dark:text-[#bcc9c7]"><span>Subtotal</span><span class="font-mono">{{ formatRupiah(selectedRetail.totalPrice + (selectedRetail.totalDiscount || 0)) }}</span></div>
                <div v-if="selectedRetail.totalDiscount > 0" class="flex justify-between text-xs text-red-500 dark:text-[#ffb4ab]"><span>Diskon</span><span class="font-mono">-{{ formatRupiah(selectedRetail.totalDiscount) }}</span></div>
                <div class="flex justify-between text-base font-bold text-slate-900 dark:text-[#e3e2e2] pt-1 border-t border-slate-100 dark:border-[#3d4948]"><span>Total</span><span class="font-mono">{{ formatRupiah(selectedRetail.totalPrice) }}</span></div>
                <div v-if="selectedRetail.payments?.[0]" class="flex justify-between text-xs text-slate-600 dark:text-[#bcc9c7]"><span>Bayar</span><span class="font-mono">{{ formatRupiah(selectedRetail.payments[0].amount) }}</span></div>
                <div v-if="selectedRetail.payments?.[0]?.amount > selectedRetail.totalPrice" class="flex justify-between text-xs text-[#00A19B] dark:text-[#5fd9d2]"><span>Kembali</span><span class="font-mono">{{ formatRupiah(selectedRetail.payments[0].amount - selectedRetail.totalPrice) }}</span></div>
                <div class="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-[#3d4948]"><span>Profit</span><span class="font-mono font-bold">{{ formatRupiah(selectedRetail.totalPrice - selectedRetail.totalCost) }}</span></div>
              </div>

              <!-- Actions -->
              <div class="pt-2 border-t border-slate-200 dark:border-[#3d4948] space-y-2">
                <button class="w-full h-10 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 bg-[#00A19B] hover:brightness-110 transition-all" @click="handlePrint(selectedRetail)">
                  <PrinterIcon class="w-4 h-4" /> Cetak Struk
                </button>
                <button v-if="selectedRetail.status === 'COMPLETED'" class="w-full h-10 border-2 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 font-semibold text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-2 transition-colors" @click="handleVoidRetail">
                  <Trash2Icon class="w-4 h-4" /> Batalkan Transaksi
                </button>
              </div>

              <!-- Void info -->
              <div v-if="selectedRetail.status === 'VOIDED'" class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3">
                <p class="text-xs font-semibold text-red-700 dark:text-red-400">Transaksi dibatalkan</p>
                <p v-if="selectedRetail.voidReason" class="text-[10px] text-red-600 dark:text-red-400/80 mt-0.5">Alasan: {{ selectedRetail.voidReason }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================================ -->
    <!-- DETAIL MODAL: BRILink Transaction                              -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showBrilinkDetail && selectedBrilink" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showBrilinkDetail = false" />
          <div class="relative w-full sm:max-w-md bg-white dark:bg-[#1e2020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-[#3d4948] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto mt-3 sm:hidden" />

            <div class="sticky top-0 bg-white dark:bg-[#1e2020] border-b border-slate-100 dark:border-[#3d4948] px-5 py-3 flex items-center justify-between z-10">
              <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Detail Transaksi BRILink</h3>
              <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showBrilinkDetail = false"><XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" /></button>
            </div>

            <div class="p-5 space-y-4">
              <!-- Status card -->
              <div class="bg-slate-50 dark:bg-[#1a1c1c] rounded-2xl p-4 space-y-2">
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Status</span><span :class="['text-xs font-bold px-2 py-0.5 rounded-full', brilinkStatusBadge(selectedBrilink.status)]">{{ brilinkStatusLabel(selectedBrilink.status) }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">No. Ref</span><span class="text-xs font-mono font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ selectedBrilink.refNumber }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Kategori</span><span :class="['text-xs font-bold px-2 py-0.5 rounded-full', brilinkCategoryBadge(selectedBrilink.category)]">{{ BRILINK_CATEGORY_LABELS[selectedBrilink.category] }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Tanggal</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ formatDateTime(selectedBrilink.createdAt) }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Kasir</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ selectedBrilink.cashierName || '-' }}</span></div>
                <div v-if="selectedBrilink.accountLabel" class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Rekening</span><span class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ selectedBrilink.accountLabel }}</span></div>
              </div>

              <!-- Customer & Destination -->
              <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl p-4 space-y-2">
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Customer</span><span class="text-xs font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ selectedBrilink.customerName }}</span></div>
                <div v-if="selectedBrilink.customerPhone" class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">No. HP</span><span class="text-xs font-mono text-slate-700 dark:text-[#bcc9c7]">{{ selectedBrilink.customerPhone }}</span></div>
                <div class="flex justify-between"><span class="text-xs text-slate-500 dark:text-[#869392]">Tujuan</span><span class="text-xs font-mono text-slate-700 dark:text-[#bcc9c7]">{{ selectedBrilink.destination }}</span></div>
              </div>

              <!-- Sumber & Aliran Dana -->
              <div class="bg-[#00A19B]/5 dark:bg-[#5fd9d2]/5 border border-[#00A19B]/15 dark:border-[#5fd9d2]/15 rounded-2xl p-4 space-y-2.5">
                <p class="text-[10px] font-bold text-[#00756f] dark:text-[#5fd9d2] uppercase tracking-wider">Aliran Dana</p>
                <!-- Sumber dana keluar -->
                <div class="flex items-start gap-2">
                  <div class="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-[9px] font-bold text-red-600 dark:text-red-400">↑</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-[#869392]">Dana Keluar Dari</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-[#e3e2e2]">
                      {{ selectedBrilink.accountLabel ? selectedBrilink.accountLabel + (selectedBrilink.accountNumber ? ' (...' + selectedBrilink.accountNumber.slice(-4) + ')' : '') : 'Kartu Customer' }}
                    </p>
                    <p v-if="selectedBrilink.accountImpact" class="text-[10px] text-red-500 dark:text-red-400 font-mono">-{{ formatRupiah(Math.abs(selectedBrilink.accountImpact)) }}</p>
                  </div>
                </div>
                <!-- Profit fee masuk ke -->
                <div class="flex items-start gap-2">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">↓</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-[#869392]">Profit Admin Masuk Ke</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-[#e3e2e2]">
                      {{ selectedBrilink.accountLabel ? selectedBrilink.accountLabel : 'Kas Tunai Agen' }}
                    </p>
                    <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+{{ formatRupiah(selectedBrilink.fee) }}</p>
                  </div>
                </div>
                <!-- Kas tunai impact (jika ada) -->
                <div v-if="selectedBrilink.cashImpact && selectedBrilink.cashImpact !== 0" class="flex items-start gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    :class="selectedBrilink.cashImpact > 0 ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'">
                    <span :class="['text-[9px] font-bold', selectedBrilink.cashImpact > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']">{{ selectedBrilink.cashImpact > 0 ? '↓' : '↑' }}</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-[#869392]">Kas Tunai Agen</p>
                    <p :class="['text-[10px] font-mono font-semibold', selectedBrilink.cashImpact > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400']">
                      {{ selectedBrilink.cashImpact > 0 ? '+' : '-' }}{{ formatRupiah(Math.abs(selectedBrilink.cashImpact)) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Metode Admin — hanya untuk TARIK_TUNAI -->
              <div v-if="selectedBrilink.category === 'TARIK_TUNAI' && selectedBrilink.feeMethod" class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 space-y-1.5">
                <p class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Metode Admin</p>
                <p class="text-sm font-bold text-amber-800 dark:text-amber-300">{{ feeMethodDetail(selectedBrilink.feeMethod) }}</p>
                <p class="text-[10px] text-amber-600 dark:text-amber-400/80">{{ feeMethodHint(selectedBrilink.feeMethod) }}</p>
              </div>

              <!-- Financial breakdown -->
              <div class="border-t border-slate-200 dark:border-[#3d4948] pt-3 space-y-1.5">
                <div class="flex justify-between text-xs text-slate-600 dark:text-[#bcc9c7]"><span>Nominal</span><span class="font-mono">{{ formatRupiah(selectedBrilink.amount) }}</span></div>
                <div class="flex justify-between text-xs text-[#00A19B] dark:text-[#5fd9d2]"><span>Fee (profit)</span><span class="font-mono font-bold">+{{ formatRupiah(selectedBrilink.fee) }}</span></div>
                <div class="flex justify-between text-base font-bold text-slate-900 dark:text-[#e3e2e2] pt-1 border-t border-slate-100 dark:border-[#3d4948]"><span>Total</span><span class="font-mono">{{ formatRupiah(selectedBrilink.amount + selectedBrilink.fee) }}</span></div>
                <div v-if="selectedBrilink.feeMethod" class="flex justify-between text-xs text-slate-500 dark:text-[#869392]"><span>Metode Admin</span><span class="font-semibold">{{ selectedBrilink.feeMethod }}</span></div>
                <div v-if="selectedBrilink.flowDirection" class="flex justify-between text-xs text-slate-500 dark:text-[#869392]"><span>Flow</span><span :class="selectedBrilink.flowDirection === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'" class="font-semibold">{{ selectedBrilink.flowDirection === 'CREDIT' ? '↑ Kredit' : '↓ Debit' }}</span></div>
              </div>

              <!-- Void info -->
              <div v-if="selectedBrilink.status === 'VOIDED'" class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3">
                <p class="text-xs font-semibold text-red-700 dark:text-red-400">Transaksi di-void</p>
                <p v-if="selectedBrilink.voidReason" class="text-[10px] text-red-600 dark:text-red-400/80 mt-0.5">{{ selectedBrilink.voidReason }}</p>
              </div>

              <!-- Actions -->
              <div class="pt-2 border-t border-slate-200 dark:border-[#3d4948]">
                <button class="w-full h-10 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 bg-[#00A19B] hover:brightness-110 transition-all" @click="handlePrintBrilink">
                  <PrinterIcon class="w-4 h-4" /> Cetak Struk
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import {
  Receipt as ReceiptIcon, Search as SearchIcon, Calendar as CalendarIcon,
  Loader2 as Loader2Icon, X as XIcon, Landmark as LandmarkIcon,
  Trash2 as Trash2Icon, Printer as PrinterIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useToast } from '@/shared/composables/useToast';
import api from '@/shared/services/api';
import { BRILINK_CATEGORY_LABELS } from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const toast = useToast();

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(false);
const transactions = ref<any[]>([]);
const search = ref('');
const startDate = ref(new Date().toISOString().slice(0, 10));
const endDate = ref(new Date().toISOString().slice(0, 10));
const statusFilter = ref('');
const trxType = ref<'retail' | 'brilink'>('retail');
const meta = reactive({ total: 0, page: 1, totalPages: 1 });

// Detail modals
const showRetailDetail = ref(false);
const selectedRetail = ref<any>(null);
const showBrilinkDetail = ref(false);
const selectedBrilink = ref<any>(null);

// ── Filters ───────────────────────────────────────────────────────────────────
const retailStatusFilters = [
  { value: '', label: 'Semua' },
  { value: 'COMPLETED', label: 'Lunas' },
  { value: 'PENDING', label: 'Open Bill' },
  { value: 'HUTANG', label: 'Hutang' },
  { value: 'VOIDED', label: 'Void' },
];
const brilinkStatusFilters = [
  { value: '', label: 'Semua' },
  { value: 'SUCCESS', label: 'Sukses' },
  { value: 'VOIDED', label: 'Void' },
  { value: 'FAILED', label: 'Gagal' },
];
const currentStatusFilters = computed(() => trxType.value === 'retail' ? retailStatusFilters : brilinkStatusFilters);

const totalOmzet = computed(() => {
  if (trxType.value === 'retail') return transactions.value.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.totalPrice, 0);
  return transactions.value.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + (t.amount || 0), 0);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(fetchTransactions, 400); }

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number): string {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + 'rb';
  return formatRupiah(n);
}
function formatTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
}
function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Retail status helpers
function retailStatusLabel(s: string) { return { COMPLETED: 'Lunas', PENDING: 'Open Bill', VOIDED: 'Void', HUTANG: 'Hutang' }[s] || s; }
function retailStatusBadge(s: string) { return { COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', VOIDED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', HUTANG: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' }[s] || 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7]'; }
function retailStatusIconBg(s: string) { return { COMPLETED: 'bg-[#00A19B]/10 text-[#00A19B] dark:text-[#5fd9d2]', PENDING: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', VOIDED: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400', HUTANG: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' }[s] || 'bg-slate-100 dark:bg-[#292a2a] text-slate-500 dark:text-[#869392]'; }

// BRILink status helpers
function brilinkStatusLabel(s: string) { return { SUCCESS: 'Sukses', VOIDED: 'Void', FAILED: 'Gagal', PENDING: 'Pending' }[s] || s; }

// Fee method detail helpers (untuk Tarik Tunai)
function feeMethodDetail(method: string): string {
  switch (method) {
    case 'DALAM': return 'Admin Dalam';
    case 'LUAR': return 'Admin Luar';
    case 'POTONG': return 'Potong Saldo';
    default: return method;
  }
}
function feeMethodHint(method: string): string {
  switch (method) {
    case 'DALAM': return 'Biaya admin sudah termasuk dalam nominal. Nasabah bayar nominal saja.';
    case 'LUAR': return 'Biaya admin di luar nominal. Nasabah bayar nominal + admin terpisah.';
    case 'POTONG': return 'Biaya admin dipotong dari saldo agen. Nasabah bayar nominal saja.';
    default: return '';
  }
}
function brilinkStatusBadge(s: string) { return { SUCCESS: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', VOIDED: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300', FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' }[s] || 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7]'; }
function brilinkStatusIconBg(s: string) { return { SUCCESS: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', VOIDED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', FAILED: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' }[s] || 'bg-slate-100 dark:bg-[#292a2a] text-slate-500 dark:text-[#869392]'; }
function brilinkCategoryBadge(cat: string) { return { TRANSFER_BRI: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', TRANSFER_OTHER: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', TARIK_TUNAI: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', TOPUP_PULSA: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300', TOPUP_DATA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', TOPUP_EWALLET: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300', TOPUP_PLN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' }[cat] || 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7]'; }

// ── Data fetch ────────────────────────────────────────────────────────────────
async function fetchTransactions() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  loading.value = true;
  try {
    if (trxType.value === 'retail') {
      const params: any = { shopId, startDate: startDate.value, endDate: endDate.value, page: meta.page, limit: 20 };
      if (search.value) params.search = search.value;
      if (statusFilter.value) params.status = statusFilter.value;
      const { data } = await api.get('/transactions', { params });
      transactions.value = data.data || [];
      meta.total = data.meta?.total || 0;
      meta.totalPages = data.meta?.totalPages || 1;
    } else {
      const params: any = { shopId, startDate: startDate.value, endDate: endDate.value, page: meta.page, limit: 20 };
      if (statusFilter.value) params.status = statusFilter.value;
      if (search.value) params.search = search.value;
      const { data } = await api.get('/brilink/transactions', { params });
      transactions.value = data.data || [];
      meta.total = data.meta?.total || 0;
      meta.totalPages = data.meta?.totalPages || 1;
    }
  } catch { transactions.value = []; meta.total = 0; meta.totalPages = 1; }
  finally { loading.value = false; }
}

// ── Detail modal openers ──────────────────────────────────────────────────────
function openRetailDetail(trx: any) { selectedRetail.value = trx; showRetailDetail.value = true; }
function openBrilinkDetail(trx: any) { selectedBrilink.value = trx; showBrilinkDetail.value = true; }

// ── Actions ───────────────────────────────────────────────────────────────────
async function handleVoidRetail() {
  if (!selectedRetail.value) return;
  const reason = prompt('Alasan batalkan transaksi:');
  if (!reason) return;
  try {
    await api.post(`/transactions/${selectedRetail.value.id}/void`, { reason, otp: '000000' });
    selectedRetail.value.status = 'VOIDED';
    selectedRetail.value.voidReason = reason;
    toast.success('Transaksi berhasil dibatalkan');
    await fetchTransactions();
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Gagal membatalkan.');
  }
}

// Print guard — prevent double-print
let isPrinting = false;

function handlePrint(trx: any) {
  if (isPrinting) return;
  isPrinting = true;
  import('@/shared/services/thermal-print.service').then(async ({ thermalPrint }) => {
    try {
      if (!thermalPrint.isConnected) await thermalPrint.connect();
      await thermalPrint.printReceipt({
        shopName: 'Posify',
        trxNumber: trx.transactionNumber,
        date: formatDateTime(trx.createdAt),
        cashierName: trx.user?.username || '-',
        items: (trx.items || []).map((i: any) => ({ name: i.product?.name || 'Produk', qty: i.quantity, price: i.unitPrice, subtotal: i.subtotal })),
        subtotal: trx.totalPrice,
        total: trx.totalPrice,
        paid: trx.payments?.[0]?.amount || trx.totalPrice,
        change: Math.max(0, (trx.payments?.[0]?.amount || 0) - trx.totalPrice),
        method: trx.payments?.[0]?.method || 'CASH',
      });
      toast.success('Struk dicetak!');
    } catch (err: any) {
      if (err.message !== 'cancelled') toast.error(err.message || 'Gagal cetak.');
    } finally { isPrinting = false; }
  }).catch(() => { isPrinting = false; });
}

function handlePrintBrilink() {
  if (isPrinting || !selectedBrilink.value) return;
  isPrinting = true;
  const trx = selectedBrilink.value;

  // Determine metode admin label (only for TARIK_TUNAI)
  let metodeAdmin: string | undefined;
  if (trx.category === 'TARIK_TUNAI' && trx.feeMethod) {
    const labels: Record<string, string> = { DALAM: 'Admin Dalam', LUAR: 'Admin Luar', POTONG: 'Potong Saldo' };
    metodeAdmin = labels[trx.feeMethod] || trx.feeMethod;
  }

  // Status label
  const statusLabels: Record<string, string> = { SUCCESS: 'Sukses', VOIDED: 'Void', FAILED: 'Gagal', PENDING: 'Pending' };

  import('@/shared/services/thermal-print.service').then(async ({ thermalPrint }) => {
    try {
      if (!thermalPrint.isConnected) await thermalPrint.connect();
      await thermalPrint.printBrilinkReceipt({
        shopName: 'Posify', // TODO: dari shop settings
        refNumber: trx.refNumber,
        date: formatDateTime(trx.createdAt),
        cashierName: trx.cashierName || '-',
        category: BRILINK_CATEGORY_LABELS[trx.category] || trx.category,
        metodeAdmin,
        customerName: trx.customerName || '-',
        customerPhone: trx.customerPhone || undefined,
        destination: trx.category === 'TARIK_TUNAI' ? undefined : trx.destination,
        bankName: trx.accountLabel || undefined,
        amount: trx.amount,
        adminFee: trx.fee || 0,
        fee: trx.fee || 0,
        total: trx.amount + (trx.fee || 0),
        status: statusLabels[trx.status] || trx.status,
      });
      toast.success('Struk BRILink dicetak!');
    } catch (err: any) {
      if (err.message !== 'cancelled') toast.error(err.message || 'Gagal cetak.');
    } finally { isPrinting = false; }
  }).catch(() => { isPrinting = false; });
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => { fetchTransactions(); });
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
</style>
