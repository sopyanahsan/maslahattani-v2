<template>
  <div class="space-y-5 p-4 font-hanken">
    <!-- Greeting -->
    <header>
      <p class="text-xs text-slate-500 dark:text-[#bcc9c7]">{{ currentDateLabel }}</p>
      <h1 class="font-bold text-xl text-slate-900 dark:text-[#e3e2e2] mt-0.5">{{ userName }}</h1>
    </header>

    <!-- Row 1: Penjualan Retail + BRILink (KPI cards) -->
    <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-2 gap-3' : ''">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-4 rounded-xl shadow-sm hover:border-[#00A19B] dark:hover:border-[#5fd9d2] transition-colors">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[11px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase tracking-wide">Penjualan Retail</span>
          <ShoppingCartIcon class="w-5 h-5 text-[#00A19B] dark:text-[#5fd9d2] shrink-0" />
        </div>
        <p class="text-xl font-bold font-mono text-slate-900 dark:text-[#e3e2e2] mb-3 truncate">{{ formatRupiah(retailOmzet) }}</p>
        <div class="h-8 bg-slate-100 dark:bg-[#292a2a] rounded overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#03a29c]/50 to-[#5fd9d2]/50 rounded transition-[width] duration-500 ease-out" :style="{ width: retailProgress + '%' }"></div>
        </div>
        <p class="text-[10px] text-slate-400 dark:text-[#bcc9c7] mt-2">{{ stats.retail }} / {{ TRX_TARGET }} transaksi</p>
      </div>
      <div v-if="settingsStore.isBrilinkEnabled" class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-4 rounded-xl shadow-sm hover:border-emerald-400 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[11px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase tracking-wide">Penjualan BRILink</span>
          <LandmarkIcon class="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        </div>
        <p class="text-xl font-bold font-mono text-slate-900 dark:text-[#e3e2e2] mb-3 truncate">{{ formatRupiah(brilinkOmzet) }}</p>
        <div class="h-8 bg-slate-100 dark:bg-[#292a2a] rounded overflow-hidden">
          <div class="h-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/40 rounded transition-[width] duration-500 ease-out" :style="{ width: brilinkProgress + '%' }"></div>
        </div>
        <p class="text-[10px] text-slate-400 dark:text-[#bcc9c7] mt-2">{{ stats.brilink }} / {{ TRX_TARGET }} transaksi</p>
      </div>
    </div>

    <!-- Row 2: Total Trx, Profit Retail, Profit BRILink -->
    <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 rounded-xl shadow-sm hover:border-[#00A19B] dark:hover:border-[#5fd9d2] transition-colors">
        <div class="flex justify-between items-start mb-1.5">
          <span class="text-[10px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase">Total Trx</span>
          <ReceiptIcon class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2] shrink-0" />
        </div>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ stats.total }}</p>
        <p class="text-[9px] text-slate-400 dark:text-[#869392] mt-0.5">{{ settingsStore.isBrilinkEnabled ? 'Retail + BRILink' : 'Retail' }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 rounded-xl shadow-sm hover:border-emerald-400 transition-colors">
        <div class="flex justify-between items-start mb-1.5">
          <span class="text-[10px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase">Profit Retail</span>
          <TrendingUpIcon class="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        </div>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2] truncate">{{ formatRupiah(profitRetail) }}</p>
      </div>
      <div v-if="settingsStore.isBrilinkEnabled" class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 rounded-xl shadow-sm hover:border-emerald-400 transition-colors">
        <div class="flex justify-between items-start mb-1.5">
          <span class="text-[10px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase">Profit BRILink</span>
          <TrendingUpIcon class="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        </div>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2] truncate">{{ formatRupiah(profitBrilink) }}</p>
      </div>
    </div>

    <!-- Row 3: Pengeluaran Hari Ini -->
    <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-4 rounded-xl shadow-sm">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[11px] font-bold text-slate-500 dark:text-[#bcc9c7] uppercase tracking-wide">Pengeluaran Hari Ini</span>
        <WalletIcon class="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
      </div>
      <p class="text-2xl font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(expenses) }}</p>
      <p class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5">{{ expenseCount }} catatan pengeluaran</p>
      <!-- Action buttons -->
      <div class="grid grid-cols-3 gap-2 mt-3">
        <button
          class="h-9 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          @click="openExpenseModal('cashin')"
        >
          <ArrowDownIcon class="w-3.5 h-3.5" /> Cash In
        </button>
        <button
          class="h-9 rounded-lg border border-[#00A19B]/30 bg-[#00A19B]/10 text-[#00756f] dark:text-[#5fd9d2] text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#00A19B]/20 transition-colors"
          @click="openExpenseModal('transfer')"
        >
          <ArrowLeftRightIcon class="w-3.5 h-3.5" /> Transfer
        </button>
        <button
          class="h-9 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          @click="openExpenseModal('cashout')"
        >
          <ArrowUpIcon class="w-3.5 h-3.5" /> Cash Out
        </button>
      </div>
    </div>

    <!-- Akses Cepat -->
    <div>
      <h3 class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2] mb-3">Akses Cepat</h3>
      <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-3 sm:grid-cols-6 gap-3' : 'grid grid-cols-3 gap-3'">
        <RouterLink to="/retail/pos" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-[#00A19B]/10 text-[#00A19B] dark:text-[#5fd9d2] flex items-center justify-center"><ShoppingCartIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Kasir</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><BanknoteIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Tarik Tunai</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ArrowLeftRightIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Transfer</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><SmartphoneIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Top Up</span>
        </RouterLink>
        <RouterLink to="/reports" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7] flex items-center justify-center"><BarChart3Icon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Laporan</span>
        </RouterLink>
        <RouterLink to="/retail/history" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7] flex items-center justify-center"><HistoryIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Riwayat</span>
        </RouterLink>
        <RouterLink to="/opname" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center"><ClipboardCheckIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Stok Opname</span>
        </RouterLink>
      </div>
    </div>

    <!-- Transaksi Terakhir -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2]">Transaksi Terakhir</h3>
        <RouterLink to="/retail/history" class="text-xs font-semibold text-[#00A19B] dark:text-[#5fd9d2] hover:underline">Lihat Semua &gt;</RouterLink>
      </div>
      <div v-if="settingsStore.isBrilinkEnabled" class="flex rounded-lg border border-slate-200 dark:border-[#3d4948] overflow-hidden mb-3 w-fit">
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'retail' ? 'bg-[#00A19B] text-white' : 'bg-white dark:bg-[#1e2020] text-slate-500 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a]']" @click="trxTab = 'retail'">Retail</button>
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'brilink' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1e2020] text-slate-500 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a]']" @click="trxTab = 'brilink'">BRILink</button>
      </div>
      <div v-if="visibleTransactions.length === 0" class="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 dark:bg-[#1a1c1c] rounded-xl border border-slate-200 dark:border-[#3d4948] border-dashed text-center">
        <ReceiptIcon class="w-8 h-8 mb-2 text-slate-300 dark:text-[#869392]" />
        <p class="text-sm text-slate-500 dark:text-[#bcc9c7]">Belum ada transaksi {{ trxTab === 'retail' ? 'retail' : 'BRILink' }}</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="(trx, index) in visibleTransactions" :key="index" class="flex items-center justify-between p-3 border border-slate-100 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] shadow-sm">
          <div class="flex items-center gap-3">
            <div :class="['w-9 h-9 rounded-full flex items-center justify-center shrink-0', trxTab === 'retail' ? 'bg-[#00A19B]/10 text-[#00A19B] dark:text-[#5fd9d2]' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400']">
              <ReceiptIcon class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-[#e3e2e2] truncate">{{ trx.itemNames }}</p>
              <p class="text-xs font-bold" :class="trxTab === 'retail' ? 'text-[#00A19B] dark:text-[#5fd9d2]' : 'text-emerald-600 dark:text-emerald-400'">{{ formatRupiah(trx.amount) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[11px] text-slate-500 dark:text-[#bcc9c7]">{{ trx.timestamp }}</p>
            <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ trx.method }}</p>
          </div>
        </li>
      </ul>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: Pengeluaran / Cash In / Transfer                       -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showExpenseModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showExpenseModal = false" />
          <form
            class="relative w-full sm:max-w-md bg-white dark:bg-[#1e2020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-[#3d4948] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            @submit.prevent="handleExpenseSubmit"
          >
            <!-- handle bar -->
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto sm:hidden -mt-1 mb-1" />

            <!-- Header -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">
                  {{ expenseType === 'cashin' ? 'Cash In (Pemasukan)' : expenseType === 'transfer' ? 'Transfer Antar Kas' : 'Cash Out (Pengeluaran)' }}
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">
                  {{ expenseType === 'cashin' ? 'Tambah dana ke kas / rekening' : expenseType === 'transfer' ? 'Pindah saldo antar kas / rekening' : 'Catat pengeluaran dari kas / rekening' }}
                </p>
              </div>
              <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showExpenseModal = false">
                <XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" />
              </button>
            </div>

            <!-- Source selection -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-2">
                {{ expenseType === 'transfer' ? 'Dari' : 'Sumber Dana' }} <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-1 gap-1.5">
                <!-- Kas Retail -->
                <label
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    expenseSource === 'kas_retail'
                      ? 'border-[#00A19B] dark:border-[#5fd9d2] bg-[#00A19B]/5 dark:bg-[#5fd9d2]/5'
                      : 'border-slate-200 dark:border-[#3d4948] hover:border-slate-300 dark:hover:border-[#5fd9d2]/30']"
                >
                  <input v-model="expenseSource" type="radio" value="kas_retail" class="accent-[#00A19B]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-700 dark:text-[#e3e2e2]">Kas Retail</p>
                    <p class="text-[10px] text-slate-400 dark:text-[#869392]">Kas penjualan toko</p>
                  </div>
                  <span class="text-xs font-bold font-mono text-slate-700 dark:text-[#e3e2e2] shrink-0">{{ formatRupiah(kasRetailBalance) }}</span>
                </label>

                <!-- Kas BRILink (if enabled) -->
                <label
                  v-if="settingsStore.isBrilinkEnabled"
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    expenseSource === 'kas_brilink'
                      ? 'border-[#00A19B] dark:border-[#5fd9d2] bg-[#00A19B]/5 dark:bg-[#5fd9d2]/5'
                      : 'border-slate-200 dark:border-[#3d4948] hover:border-slate-300 dark:hover:border-[#5fd9d2]/30']"
                >
                  <input v-model="expenseSource" type="radio" value="kas_brilink" class="accent-[#00A19B]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-700 dark:text-[#e3e2e2]">Kas Tunai Agen</p>
                    <p class="text-[10px] text-slate-400 dark:text-[#869392]">Kas fisik agen BRILink</p>
                  </div>
                  <span class="text-xs font-bold font-mono text-slate-700 dark:text-[#e3e2e2] shrink-0">{{ formatRupiah(kasBrilinkBalance) }}</span>
                </label>

                <!-- Per-Rekening BRI (if enabled & has accounts) -->
                <label
                  v-for="acc in brilinkAccounts"
                  :key="acc.id"
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    expenseSource === 'rek_' + acc.id
                      ? 'border-[#00A19B] dark:border-[#5fd9d2] bg-[#00A19B]/5 dark:bg-[#5fd9d2]/5'
                      : 'border-slate-200 dark:border-[#3d4948] hover:border-slate-300 dark:hover:border-[#5fd9d2]/30']"
                >
                  <input v-model="expenseSource" type="radio" :value="'rek_' + acc.id" class="accent-[#00A19B]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-700 dark:text-[#e3e2e2]">{{ acc.label }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-[#869392] font-mono">{{ acc.accountNumber }}</p>
                  </div>
                  <span class="text-xs font-bold font-mono text-slate-700 dark:text-[#e3e2e2] shrink-0">{{ formatRupiah(acc.balance) }}</span>
                </label>
              </div>
            </div>

            <!-- Transfer: destination (only for transfer type) -->
            <div v-if="expenseType === 'transfer'">
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Tujuan <span class="text-red-500">*</span></label>
              <select
                v-model="transferDest"
                required
                class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              >
                <option value="">— Pilih tujuan —</option>
                <option v-if="expenseSource !== 'kas_retail'" value="kas_retail">Kas Retail · {{ formatRupiah(kasRetailBalance) }}</option>
                <option v-if="expenseSource !== 'kas_brilink' && settingsStore.isBrilinkEnabled" value="kas_brilink">Kas Tunai Agen · {{ formatRupiah(kasBrilinkBalance) }}</option>
                <option
                  v-for="acc in brilinkAccounts.filter(a => expenseSource !== 'rek_' + a.id)"
                  :key="acc.id"
                  :value="'rek_' + acc.id"
                >{{ acc.label }} ({{ acc.accountNumber }}) · {{ formatRupiah(acc.balance) }}</option>
              </select>
            </div>

            <!-- Nominal -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Jumlah (Rp) <span class="text-red-500">*</span></label>
              <input
                v-model.number="expenseForm.amount"
                type="number" min="1" required placeholder="0"
                class="w-full h-11 px-4 text-lg font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
              />
              <div class="grid grid-cols-4 gap-1.5 mt-2">
                <button v-for="n in [10000, 50000, 100000, 500000]" :key="n" type="button"
                  class="h-7 rounded-lg border border-slate-200 dark:border-[#3d4948] text-[10px] font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                  @click="expenseForm.amount += n">
                  +{{ n >= 1000000 ? (n/1000000)+'Jt' : (n/1000)+'K' }}
                </button>
              </div>
            </div>

            <!-- Catatan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                Keterangan <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional tapi disarankan)</span>
              </label>
              <input
                v-model="expenseForm.notes"
                type="text"
                :placeholder="expenseType === 'cashout' ? 'Contoh: Bayar listrik, beli ATK, biaya kirim...' : expenseType === 'cashin' ? 'Contoh: Setoran modal pagi, transfer dari owner...' : 'Contoh: Pindah modal ke rekening BRI...'"
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              />
            </div>

            <!-- Error -->
            <div v-if="expenseError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">{{ expenseError }}</div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="expenseSubmitting || expenseForm.amount <= 0 || !expenseSource || (expenseType === 'transfer' && !transferDest)"
              :class="['w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40',
                expenseType === 'cashin' ? 'bg-emerald-600 hover:bg-emerald-700'
                : expenseType === 'transfer' ? 'bg-[#00A19B] hover:brightness-110'
                : 'bg-red-500 hover:bg-red-600']"
            >
              <Loader2Icon v-if="expenseSubmitting" class="w-4 h-4 animate-spin" />
              <ArrowDownIcon v-else-if="expenseType === 'cashin'" class="w-4 h-4" />
              <ArrowLeftRightIcon v-else-if="expenseType === 'transfer'" class="w-4 h-4" />
              <ArrowUpIcon v-else class="w-4 h-4" />
              {{ expenseSubmitting ? 'Memproses...' : expenseType === 'cashin' ? 'Cash In' : expenseType === 'transfer' ? 'Transfer' : 'Cash Out' }}
            </button>
          </form>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast"
          class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm"
          :class="toast.type === 'success' ? 'bg-[#00A19B] text-white' : 'bg-red-600 text-white'">
          <CheckCircleIcon v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
          <XIcon v-else class="w-4 h-4 shrink-0" />
          <span>{{ toast.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ShoppingCart as ShoppingCartIcon, Landmark as LandmarkIcon,
  BarChart3 as BarChart3Icon, Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon, Wallet as WalletIcon,
  Banknote as BanknoteIcon, ArrowLeftRight as ArrowLeftRightIcon,
  Smartphone as SmartphoneIcon, History as HistoryIcon,
  ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon,
  ClipboardCheck as ClipboardCheckIcon,
  X as XIcon, Loader2 as Loader2Icon,
  CheckCircle2 as CheckCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import posService from '@/shared/services/pos.service';
import kasRetailService from '@/shared/services/kas-retail.service';
import brilinkCashboxService from '@/shared/services/brilink-cashbox.service';
import brilinkAccountService, { type BrilinkAccount } from '@/shared/services/brilink-account.service';

const authStore = useAuthStore();
const shiftStore = useShiftStore();
const settingsStore = useSettingsStore();

const userName = computed(() => authStore.user?.username || 'Kasir');
const currentDateLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
);

// ── KPI Data ──────────────────────────────────────────────────────────────────
const retailOmzet = ref(0);
const brilinkOmzet = ref(0);
const profitRetail = ref(0);
const profitBrilink = ref(0);
const expenses = ref(0);
const expenseCount = ref(0);
const stats = ref({ total: 0, retail: 0, brilink: 0 });

const TRX_TARGET = 50;
const retailProgress = computed(() => Math.min(100, Math.round((stats.value.retail / TRX_TARGET) * 100)));
const brilinkProgress = computed(() => Math.min(100, Math.round((stats.value.brilink / TRX_TARGET) * 100)));

// ── Transactions ──────────────────────────────────────────────────────────────
const trxTab = ref<'retail' | 'brilink'>('retail');
const retailTransactions = ref<any[]>([]);
const brilinkTransactions = ref<any[]>([]);
const visibleTransactions = computed(() => trxTab.value === 'retail' ? retailTransactions.value : brilinkTransactions.value);

// ── Saldo sources for modal ────────────────────────────────────────────────────
const kasRetailBalance = ref(0);
const kasBrilinkBalance = ref(0);

// ── BRILink accounts (for expense modal) ──────────────────────────────────────
const brilinkAccounts = ref<BrilinkAccount[]>([]);

// ── Expense modal ─────────────────────────────────────────────────────────────
const showExpenseModal = ref(false);
const expenseType = ref<'cashin' | 'cashout' | 'transfer'>('cashout');
const expenseSource = ref('');
const transferDest = ref('');
const expenseSubmitting = ref(false);
const expenseError = ref<string | null>(null);
const expenseForm = reactive({ amount: 0, notes: '' });

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(type: 'success' | 'error', msg: string) {
  toast.value = { type, message: msg };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 3000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

function getShopId() { return authStore.user?.shopId || ''; }

function today() { return new Date().toISOString().slice(0, 10); }

// ── Open expense modal ────────────────────────────────────────────────────────
function openExpenseModal(type: 'cashin' | 'cashout' | 'transfer') {
  expenseType.value = type;
  expenseSource.value = '';
  transferDest.value = '';
  expenseForm.amount = 0;
  expenseForm.notes = '';
  expenseError.value = null;
  showExpenseModal.value = true;
}

// ── Handle expense submit ─────────────────────────────────────────────────────
async function handleExpenseSubmit() {
  if (!expenseSource.value || expenseForm.amount <= 0) return;
  if (expenseType.value === 'transfer' && !transferDest.value) return;

  expenseSubmitting.value = true;
  expenseError.value = null;

  const shopId = getShopId();
  const amount = expenseForm.amount;
  const notes = expenseForm.notes || undefined;

  try {
    if (expenseType.value === 'transfer') {
      // Transfer: not a simple cash out/in — needs special handling
      // For now we do: tarik from source, setor to dest
      await doMutation(expenseSource.value, 'out', amount, notes ? `Transfer ke tujuan — ${notes}` : 'Transfer antar kas/rekening');
      await doMutation(transferDest.value, 'in', amount, notes ? `Transfer dari sumber — ${notes}` : 'Transfer antar kas/rekening');
    } else if (expenseType.value === 'cashout') {
      await doMutation(expenseSource.value, 'out', amount, notes);
    } else {
      // cashin
      await doMutation(expenseSource.value, 'in', amount, notes);
    }

    showToast('success', expenseType.value === 'cashin' ? 'Cash In berhasil!' : expenseType.value === 'transfer' ? 'Transfer berhasil!' : 'Cash Out tercatat!');
    showExpenseModal.value = false;
    // Refresh data
    await refresh();
  } catch (e: any) {
    expenseError.value = e?.response?.data?.message ?? e?.message ?? 'Terjadi kesalahan.';
  } finally {
    expenseSubmitting.value = false;
  }
}

/**
 * Execute a single mutation (cash in/out) to the correct source
 */
async function doMutation(source: string, direction: 'in' | 'out', amount: number, notes?: string) {
  const shopId = getShopId();

  if (source === 'kas_retail') {
    await kasRetailService.createMutation({
      shopId,
      type: direction === 'in' ? 'CASH_IN' : 'CASH_OUT',
      amount,
      notes,
    });
  } else if (source === 'kas_brilink') {
    if (direction === 'in') {
      await brilinkCashboxService.setor(shopId, { amount, notes });
    } else {
      await brilinkCashboxService.tarik(shopId, { amount, notes });
    }
  } else if (source.startsWith('rek_')) {
    const accId = source.replace('rek_', '');
    if (direction === 'in') {
      await brilinkAccountService.setor(accId, { amount, notes });
    } else {
      await brilinkAccountService.tarik(accId, { amount, notes });
    }
  }
}

// ── Fetch pengeluaran hari ini ────────────────────────────────────────────────
async function fetchExpenses() {
  const shopId = getShopId();
  if (!shopId) return;

  let totalExp = 0;
  let totalCount = 0;

  try {
    // 1. Kas Retail: CASH_OUT today
    const retailHistory = await kasRetailService.getHistory({
      shopId,
      startDate: today(),
      endDate: today(),
    });
    const retailOuts = retailHistory.data.filter(m => m.type === 'CASH_OUT');
    totalExp += retailOuts.reduce((sum, m) => sum + m.amount, 0);
    totalCount += retailOuts.length;
  } catch { /* silent */ }

  if (settingsStore.isBrilinkEnabled) {
    try {
      // 2. Kas BRILink: TARIK today
      const kasMut = await brilinkCashboxService.getMutations({
        shopId,
        type: 'TARIK',
        startDate: today(),
        endDate: today(),
      });
      totalExp += kasMut.data.reduce((sum, m) => sum + m.amount, 0);
      totalCount += kasMut.data.length;
    } catch { /* silent */ }

    try {
      // 3. Rekening BRI: TARIK today
      const accMut = await brilinkAccountService.getAllMutations({
        shopId,
        type: 'TARIK',
        startDate: today(),
        endDate: today(),
      });
      totalExp += accMut.data.reduce((sum: number, m: any) => sum + m.amount, 0);
      totalCount += accMut.data.length;
    } catch { /* silent */ }
  }

  expenses.value = totalExp;
  expenseCount.value = totalCount;
}

// ── Main refresh ──────────────────────────────────────────────────────────────
async function refresh() {
  const shopId = getShopId();
  if (!shopId) return;

  // Fetch retail transactions
  try {
    const res = await posService.getTodayTransactions(shopId, authStore.user?.id);
    const data = res.data ?? [];
    const completed = data.filter((t: any) => t.status === 'COMPLETED');
    retailOmzet.value = completed.reduce((sum: number, t: any) => sum + t.totalPrice, 0);
    profitRetail.value = completed.reduce((sum: number, t: any) => sum + (t.totalPrice - t.totalCost), 0);
    stats.value.retail = completed.length;
    stats.value.total = completed.length + stats.value.brilink;
    retailTransactions.value = completed.slice(0, 5).map((t: any) => ({
      itemNames: t.items?.map((i: any) => i.product?.name || i.productId).join(', ') || `#${t.transactionNumber}`,
      timestamp: new Date(t.createdAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }),
      amount: t.totalPrice,
      method: t.payments?.[0]?.method === 'CASH' ? 'Tunai' : t.payments?.[0]?.method === 'QRIS' ? 'QRIS' : t.payments?.[0]?.method || 'Tunai',
    }));
  } catch { /* silent */ }

  // Fetch BRILink accounts (for modal source options)
  if (settingsStore.isBrilinkEnabled) {
    try {
      brilinkAccounts.value = (await brilinkAccountService.list(shopId)).filter(a => a.isActive);
    } catch { /* silent */ }

    try {
      const cb = await brilinkCashboxService.getCashBox(shopId);
      kasBrilinkBalance.value = cb.balance;
    } catch { /* silent */ }
  }

  // Fetch Kas Retail balance
  try {
    const kasRes = await kasRetailService.getCashBox(shopId);
    kasRetailBalance.value = kasRes.balance;
  } catch { /* silent */ }

  // Fetch pengeluaran
  await fetchExpenses();
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  try { await shiftStore.fetchCurrentShift(); } catch { /* */ }
  await refresh();
  refreshInterval = setInterval(refresh, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
