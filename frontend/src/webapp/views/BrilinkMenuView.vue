<template>
  <div class="space-y-0 -mx-4 -mt-4 font-hanken">

    <!-- ============================================================ -->
    <!-- HEADER — gradient teal Posify v2                              -->
    <!-- ============================================================ -->
    <header class="relative overflow-hidden px-4 pt-4 pb-5 bg-gradient-to-br from-[#00756f] via-[#00A19B] to-[#00bdb6]">
      <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
      <div class="absolute -left-6 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <!-- nav row -->
      <div class="relative z-10 flex items-center gap-3 mb-5">
        <RouterLink to="/dashboard" class="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
          <ChevronLeftIcon class="w-5 h-5 text-white" />
        </RouterLink>
        <div>
          <h1 class="font-bold text-base text-white leading-tight">Agen BRILink</h1>
          <p class="text-[11px] text-white/70 leading-none">Kelola saldo &amp; transaksi</p>
        </div>
        <LandmarkIcon class="ml-auto w-7 h-7 text-white/30" />
      </div>

      <!-- ── Saldo strip: Kas Tunai + semua rekening ── -->
      <div class="relative z-10">
        <div ref="saldoStrip" class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory">

          <!-- KAS TUNAI AGEN card — klik untuk Cash In / Cash Out -->
          <div
            class="shrink-0 snap-start w-48 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition-transform"
            @click="openKasPanel"
          >
            <div class="flex items-center justify-between mb-0.5">
              <div class="flex items-center gap-1.5">
                <WalletIcon class="w-3.5 h-3.5 text-white/70" />
                <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Kas Tunai Agen</p>
              </div>
              <ChevronRightIcon class="w-3.5 h-3.5 text-white/40" />
            </div>
            <div v-if="kasLoading" class="h-5 w-20 rounded bg-white/20 animate-pulse" />
            <template v-else>
              <p class="text-base font-bold text-white font-mono leading-tight whitespace-nowrap">
                {{ formatRupiah(saldoKas) }}
              </p>
              <p v-if="!kasPernahDipakai" class="text-[9px] text-white/50">Belum ada kas masuk</p>
              <p v-else-if="kasLowBalance" class="text-[9px] text-amber-300 font-semibold flex items-center gap-1">
                <AlertTriangleIcon class="w-3 h-3" /> Menipis
              </p>
              <p v-else class="text-[9px] text-white/40">Tap untuk kelola</p>
            </template>
            <!-- mini actions hint -->
            <div class="flex gap-1 mt-1">
              <span class="flex-1 h-5 rounded-md bg-white/20 text-white text-[8px] font-bold flex items-center justify-center gap-0.5">
                <ArrowDownCircleIcon class="w-2.5 h-2.5" /> Cash In
              </span>
              <span class="flex-1 h-5 rounded-md bg-white/20 text-white text-[8px] font-bold flex items-center justify-center gap-0.5">
                <ArrowUpCircleIcon class="w-2.5 h-2.5" /> Cash Out
              </span>
            </div>
          </div>

          <!-- Per-Rekening cards -->
          <template v-if="accountsLoading">
            <div v-for="i in 2" :key="i" class="shrink-0 snap-start w-52 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 animate-pulse">
              <div class="h-3 w-24 rounded bg-white/20 mb-2" />
              <div class="h-5 w-32 rounded bg-white/20 mb-3" />
              <div class="flex gap-2"><div class="h-6 flex-1 rounded-lg bg-white/20" /><div class="h-6 flex-1 rounded-lg bg-white/20" /></div>
            </div>
          </template>

          <template v-else>
            <div
              v-for="acc in accounts"
              :key="acc.id"
              class="shrink-0 snap-start w-56 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 flex flex-col gap-1"
            >
              <div class="flex items-center gap-1.5 mb-0.5">
                <CreditCardIcon class="w-3.5 h-3.5 text-white/70" />
                <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate max-w-[130px]">{{ acc.label }}</p>
                <span v-if="acc.isDefault" class="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" title="Default" />
              </div>
              <p class="text-[9px] text-white/50 font-mono leading-none">{{ acc.accountNumber }}</p>
              <p class="text-base font-bold font-mono leading-tight whitespace-nowrap"
                :class="acc.balance < acc.lowBalanceThreshold ? 'text-amber-300' : 'text-white'">
                {{ formatRupiah(acc.balance) }}
              </p>
              <p v-if="acc.balance < acc.lowBalanceThreshold" class="text-[9px] text-amber-300 font-semibold flex items-center gap-1">
                <AlertTriangleIcon class="w-3 h-3" /> Saldo menipis
              </p>
              <!-- Tambah / Tarik / Pindah per rekening -->
              <div class="flex gap-1 mt-1">
                <button type="button"
                  class="flex-1 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openRekModal(acc, 'tambah')">
                  <PlusIcon class="w-2.5 h-2.5" /> Tambah
                </button>
                <button type="button"
                  class="flex-1 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openRekModal(acc, 'tarik')">
                  <MinusIcon class="w-2.5 h-2.5" /> Tarik
                </button>
                <button type="button"
                  class="flex-1 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openPindahModal(acc)">
                  <ArrowLeftRightIcon class="w-2.5 h-2.5" /> Pindah
                </button>
              </div>
            </div>

            <!-- Empty -->
            <div v-if="accounts.length === 0"
              class="shrink-0 snap-start w-52 rounded-2xl border border-dashed border-white/30 px-4 py-3 flex flex-col items-center justify-center gap-1 text-white/50">
              <LandmarkIcon class="w-5 h-5" />
              <p class="text-[10px] text-center">Belum ada rekening BRI</p>
              <p class="text-[9px] text-center text-white/30">Tambah via panel admin</p>
            </div>
          </template>
        </div>

        <!-- scroll dots -->
        <div v-if="accounts.length > 0" class="flex justify-center gap-1 mt-2">
          <div v-for="(_, i) in [null, ...accounts]" :key="i"
            class="h-1 rounded-full transition-all"
            :class="activeCard === i ? 'bg-white w-3' : 'bg-white/30 w-1'" />
        </div>
      </div>
    </header>

    <!-- ============================================================ -->
    <!-- LAYANAN TRANSAKSI                                             -->
    <!-- ============================================================ -->
    <div class="px-4 pt-4 pb-2 bg-slate-50 dark:bg-[#1a1c1c]">
      <h3 class="text-xs font-bold text-slate-500 dark:text-[#869392] uppercase tracking-wider mb-3">Layanan Transaksi</h3>
      <div class="grid grid-cols-3 gap-2.5">

        <RouterLink to="/brilink/transaction?cat=TRANSFER_BRI"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRightIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Transfer Sesama</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TRANSFER_OTHER"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <SendIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Transfer Antar Bank</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TARIK_TUNAI"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BanknoteIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Tarik Tunai</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_EWALLET"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <SmartphoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Top Up e-Wallet</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PULSA"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PhoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Pulsa &amp; Data</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PLN"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] hover:border-[#00A19B] dark:hover:border-[#5fd9d2] hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,161,155,0.2)] transition-all group">
          <div class="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ZapIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-700 dark:text-[#e3e2e2] text-[11px] text-center leading-tight">Token Listrik</span>
        </RouterLink>

      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TRANSAKSI TERAKHIR                                            -->
    <!-- ============================================================ -->
    <div class="px-4 pt-4 pb-6 bg-slate-50 dark:bg-[#1a1c1c]">
      <h3 class="text-xs font-bold text-slate-500 dark:text-[#869392] uppercase tracking-wider mb-3">Transaksi Terakhir</h3>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      </div>
      <div v-else-if="recentTransactions.length === 0"
        class="rounded-2xl border border-dashed border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] p-6 text-center">
        <p class="text-xs text-slate-400 dark:text-[#869392]">Belum ada transaksi BRILink.</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="trx in recentTransactions" :key="trx.id"
          class="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] px-3.5 py-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10 flex items-center justify-center shrink-0">
              <BanknoteIcon class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2]" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-[#e3e2e2] truncate">{{ BRILINK_CATEGORY_LABELS[trx.category] }}</p>
              <p class="text-[10px] text-slate-400 dark:text-[#869392] truncate">{{ trx.customerName }} · {{ formatTime(trx.createdAt) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0 ml-3">
            <p class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2] font-mono">{{ formatRupiah(trx.amount) }}</p>
            <p class="text-[10px] text-[#00A19B] dark:text-[#5fd9d2] font-mono font-semibold">+{{ formatRupiah(trx.fee) }}</p>
          </div>
        </li>
      </ul>
    </div>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET: Kas Tunai Agen — Cash In / Cash Out            -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showKasPanel" class="fixed inset-0 z-50 flex items-end justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showKasPanel = false" />
          <div class="relative w-full max-w-lg bg-white dark:bg-[#1e2020] rounded-t-3xl border-t border-slate-200 dark:border-[#3d4948] shadow-2xl">
            <!-- handle -->
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto mt-3 mb-1" />

            <!-- header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-[#3d4948]">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <WalletIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2]">Kas Tunai Agen</p>
                  <p class="text-[10px] text-slate-400 dark:text-[#869392]">
                    Saldo: <span class="font-mono font-semibold">{{ formatRupiah(saldoKas) }}</span>
                  </p>
                </div>
              </div>
              <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showKasPanel = false">
                <XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" />
              </button>
            </div>

            <!-- tab Cash In / Cash Out -->
            <div class="flex gap-2 px-5 pt-4 pb-2">
              <button
                type="button"
                :class="['flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border',
                  kasTab === 'cashin'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-[#1a1c1c] text-slate-600 dark:text-[#bcc9c7] border-slate-200 dark:border-[#3d4948] hover:border-emerald-400']"
                @click="kasTab = 'cashin'; kasForm.amount = 0; kasForm.notes = ''; kasError = null"
              >
                <ArrowDownCircleIcon class="w-4 h-4" /> Cash In
              </button>
              <button
                type="button"
                :class="['flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border',
                  kasTab === 'cashout'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white dark:bg-[#1a1c1c] text-slate-600 dark:text-[#bcc9c7] border-slate-200 dark:border-[#3d4948] hover:border-red-400']"
                @click="kasTab = 'cashout'; kasForm.amount = 0; kasForm.notes = ''; kasError = null"
              >
                <ArrowUpCircleIcon class="w-4 h-4" /> Cash Out
              </button>
            </div>

            <!-- form -->
            <form class="px-5 pb-6 space-y-4" @submit.prevent="handleKasSubmit">
              <!-- nominal -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                  Jumlah (Rp) <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.number="kasForm.amount"
                  type="number" min="1" required placeholder="0"
                  class="w-full h-12 px-4 text-xl font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
                />
                <div class="grid grid-cols-4 gap-1.5 mt-2">
                  <button v-for="n in [100000,500000,1000000,5000000]" :key="n" type="button"
                    class="h-7 rounded-lg border border-slate-200 dark:border-[#3d4948] text-[10px] font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                    @click="kasForm.amount += n">
                    +{{ n >= 1000000 ? (n/1000000)+'Jt' : (n/1000)+'K' }}
                  </button>
                </div>
                <button type="button" class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5 hover:text-slate-600" @click="kasForm.amount = 0">Reset</button>
              </div>

              <!-- keterangan / catatan — WAJIB biar mutasi informatif -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                  Keterangan <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
                </label>
                <input
                  v-model="kasForm.notes"
                  type="text"
                  :placeholder="kasTab === 'cashin' ? 'Contoh: Setoran modal pagi, transfer dari kantor...' : 'Contoh: Ambil untuk bayar listrik, biaya operasional...'"
                  class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
                />
              </div>

              <!-- error -->
              <div v-if="kasError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">{{ kasError }}</div>

              <!-- submit -->
              <button
                type="submit"
                :disabled="kasSubmitting || kasForm.amount <= 0"
                :class="['w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40',
                  kasTab === 'cashin' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600']"
              >
                <Loader2Icon v-if="kasSubmitting" class="w-4 h-4 animate-spin" />
                <ArrowDownCircleIcon v-else-if="kasTab === 'cashin'" class="w-4 h-4" />
                <ArrowUpCircleIcon v-else class="w-4 h-4" />
                {{ kasSubmitting ? 'Memproses...' : kasTab === 'cashin' ? 'Cash In Kas' : 'Cash Out Kas' }}
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET: Rekening — Tambah / Tarik Saldo                -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showRekModal" class="fixed inset-0 z-50 flex items-end justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showRekModal = false" />
          <form
            class="relative w-full max-w-lg bg-white dark:bg-[#1e2020] rounded-t-3xl border-t border-slate-200 dark:border-[#3d4948] shadow-2xl p-5 space-y-4"
            @submit.prevent="handleRekSubmit"
          >
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto -mt-1 mb-1" />

            <!-- title -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">
                  {{ rekType === 'tambah' ? 'Tambah Saldo Rekening' : 'Tarik Saldo Rekening' }}
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">
                  {{ rekAccount?.label }} · <span class="font-mono">{{ rekAccount?.accountNumber }}</span>
                </p>
              </div>
              <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showRekModal = false">
                <XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" />
              </button>
            </div>

            <!-- saldo info -->
            <div class="rounded-xl px-4 py-3 flex items-center justify-between"
              :class="rekType === 'tambah'
                ? 'bg-[#00A19B]/8 dark:bg-[#5fd9d2]/8 border border-[#00A19B]/15 dark:border-[#5fd9d2]/15'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'">
              <span class="text-xs text-slate-500 dark:text-[#869392]">Saldo saat ini</span>
              <span class="text-sm font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(rekAccount?.balance ?? 0) }}</span>
            </div>

            <!-- nominal -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Jumlah (Rp) <span class="text-red-500">*</span></label>
              <input
                v-model.number="rekForm.amount"
                type="number" min="1" required placeholder="0"
                class="w-full h-11 px-4 text-base font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
              />
              <div class="grid grid-cols-4 gap-1.5 mt-2">
                <button v-for="n in [100000,500000,1000000,2000000]" :key="n" type="button"
                  class="h-7 rounded-lg border border-slate-200 dark:border-[#3d4948] text-[10px] font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                  @click="rekForm.amount += n">
                  +{{ n >= 1000000 ? (n/1000000)+'Jt' : (n/1000)+'K' }}
                </button>
              </div>
              <button type="button" class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5 hover:text-slate-600" @click="rekForm.amount = 0">Reset</button>
            </div>

            <!-- referensi -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                Referensi <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
              </label>
              <input
                v-model="rekForm.reference"
                type="text"
                :placeholder="rekType === 'tambah' ? 'No. setoran / bukti transfer...' : 'No. referensi penarikan...'"
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              />
            </div>

            <!-- catatan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                Keterangan <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
              </label>
              <input
                v-model="rekForm.notes"
                type="text"
                :placeholder="rekType === 'tambah' ? 'Contoh: Top up modal BRILink, transfer dari BRI...' : 'Contoh: Bayar tagihan, ambil laba...'"
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              />
            </div>

            <div v-if="rekError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">{{ rekError }}</div>

            <div class="flex gap-2 pt-1">
              <button type="button"
                class="flex-1 h-11 border border-slate-200 dark:border-[#3d4948] rounded-xl text-sm font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                @click="showRekModal = false">Batal</button>
              <button type="submit" :disabled="rekSubmitting || rekForm.amount <= 0"
                :class="['flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40',
                  rekType === 'tambah' ? 'bg-[#00A19B] hover:brightness-110 dark:shadow-[0_0_15px_rgba(0,161,155,0.3)]' : 'bg-red-500 hover:bg-red-600']">
                <Loader2Icon v-if="rekSubmitting" class="w-4 h-4 animate-spin" />
                <PlusCircleIcon v-else-if="rekType === 'tambah'" class="w-4 h-4" />
                <MinusCircleIcon v-else class="w-4 h-4" />
                {{ rekSubmitting ? 'Memproses...' : rekType === 'tambah' ? 'Tambah Saldo' : 'Tarik Saldo' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET: Pindah Saldo Antar Rekening                    -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showPindahModal" class="fixed inset-0 z-50 flex items-end justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showPindahModal = false" />
          <form
            class="relative w-full max-w-lg bg-white dark:bg-[#1e2020] rounded-t-3xl border-t border-slate-200 dark:border-[#3d4948] shadow-2xl p-5 space-y-4"
            @submit.prevent="handlePindahSubmit"
          >
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto -mt-1 mb-1" />

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Pindah Saldo Antar Rekening</h3>
                <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">Transfer internal BRILink</p>
              </div>
              <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="showPindahModal = false">
                <XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" />
              </button>
            </div>

            <!-- Dari rekening -->
            <div class="rounded-xl px-4 py-3 bg-[#00A19B]/8 dark:bg-[#5fd9d2]/8 border border-[#00A19B]/15 dark:border-[#5fd9d2]/15">
              <p class="text-[10px] font-semibold text-[#00756f] dark:text-[#5fd9d2] uppercase tracking-wide mb-0.5">Dari</p>
              <p class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2]">{{ pindahFrom?.label }}</p>
              <p class="text-[10px] font-mono text-slate-500 dark:text-[#869392]">
                {{ pindahFrom?.accountNumber }} · Saldo: {{ formatRupiah(pindahFrom?.balance ?? 0) }}
              </p>
            </div>

            <!-- Tujuan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Rekening Tujuan <span class="text-red-500">*</span></label>
              <select
                v-model="pindahToId"
                required
                class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              >
                <option value="">— Pilih rekening tujuan —</option>
                <option
                  v-for="acc in accounts.filter(a => a.id !== pindahFrom?.id)"
                  :key="acc.id" :value="acc.id">
                  {{ acc.label }} ({{ acc.accountNumber }}) — {{ formatRupiah(acc.balance) }}
                </option>
              </select>
            </div>

            <!-- nominal -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Jumlah (Rp) <span class="text-red-500">*</span></label>
              <input
                v-model.number="pindahAmount"
                type="number" min="1" :max="pindahFrom?.balance ?? 0" required placeholder="0"
                class="w-full h-11 px-4 text-base font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
              />
              <!-- Pindah semua -->
              <button type="button"
                class="text-[10px] text-[#00A19B] dark:text-[#5fd9d2] font-semibold mt-1 hover:underline"
                @click="pindahAmount = pindahFrom?.balance ?? 0">
                Pindah semua ({{ formatRupiah(pindahFrom?.balance ?? 0) }})
              </button>
            </div>

            <!-- catatan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
                Keterangan <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
              </label>
              <input
                v-model="pindahNotes"
                type="text"
                placeholder="Contoh: Pemerataan saldo, konsolidasi rekening..."
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
              />
            </div>

            <div v-if="pindahError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">{{ pindahError }}</div>

            <div class="flex gap-2 pt-1">
              <button type="button"
                class="flex-1 h-11 border border-slate-200 dark:border-[#3d4948] rounded-xl text-sm font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                @click="showPindahModal = false">Batal</button>
              <button type="submit" :disabled="pindahSubmitting || !pindahToId || pindahAmount <= 0"
                class="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#00A19B] hover:brightness-110 dark:shadow-[0_0_15px_rgba(0,161,155,0.3)] flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
                <Loader2Icon v-if="pindahSubmitting" class="w-4 h-4 animate-spin" />
                <ArrowLeftRightIcon v-else class="w-4 h-4" />
                {{ pindahSubmitting ? 'Memproses...' : 'Pindah Saldo' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================================ -->
    <!-- TOAST                                                          -->
    <!-- ============================================================ -->
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
import { ref, computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Landmark as LandmarkIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowLeftRight as ArrowLeftRightIcon,
  Send as SendIcon,
  Banknote as BanknoteIcon,
  Smartphone as SmartphoneIcon,
  Phone as PhoneIcon,
  Zap as ZapIcon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  PlusCircle as PlusCircleIcon,
  MinusCircle as MinusCircleIcon,
  ArrowDownCircle as ArrowDownCircleIcon,
  ArrowUpCircle as ArrowUpCircleIcon,
  X as XIcon,
  CheckCircle2 as CheckCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import brilinkAccountService, {
  type BrilinkAccount,
} from '@/shared/services/brilink-account.service';
import brilinkCashboxService from '@/shared/services/brilink-cashbox.service';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  type BrilinkTransactionDto,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

// ── State umum ────────────────────────────────────────────────────────────────
const accounts        = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(true);
const saldoKas        = ref(0);
const kasLoading      = ref(true);
const kasLowBalance   = ref(false);
const kasPernahDipakai = ref(false);
const recentTransactions = ref<BrilinkTransactionDto[]>([]);
const loading         = ref(true);

// scroll strip
const saldoStrip = ref<HTMLElement | null>(null);
const activeCard = ref(0);

// toast
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ── Kas Tunai panel ───────────────────────────────────────────────────────────
const showKasPanel  = ref(false);
const kasTab        = ref<'cashin' | 'cashout'>('cashin');
const kasSubmitting = ref(false);
const kasError      = ref<string | null>(null);
const kasForm       = reactive({ amount: 0, notes: '' });

// ── Rekening Tambah / Tarik modal ─────────────────────────────────────────────
const showRekModal  = ref(false);
const rekType       = ref<'tambah' | 'tarik'>('tambah');
const rekAccount    = ref<BrilinkAccount | null>(null);
const rekSubmitting = ref(false);
const rekError      = ref<string | null>(null);
const rekForm       = reactive({ amount: 0, reference: '', notes: '' });

// ── Pindah saldo modal ────────────────────────────────────────────────────────
const showPindahModal  = ref(false);
const pindahFrom       = ref<BrilinkAccount | null>(null);
const pindahToId       = ref('');
const pindahAmount     = ref(0);
const pindahNotes      = ref('');
const pindahSubmitting = ref(false);
const pindahError      = ref<string | null>(null);

// ── Computed ──────────────────────────────────────────────────────────────────
const defaultAccount = computed(() =>
  accounts.value.find(a => a.isDefault && a.isActive) ??
  accounts.value.find(a => a.isActive) ??
  accounts.value[0] ?? null
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function shopId() { return authStore.user?.shopId ?? shopStore.currentShopId ?? ''; }

function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }

function formatTime(iso: string) {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 3000);
}

// ── Kas panel ─────────────────────────────────────────────────────────────────
function openKasPanel() {
  kasTab.value = 'cashin';
  kasForm.amount = 0;
  kasForm.notes = '';
  kasError.value = null;
  showKasPanel.value = true;
}

async function handleKasSubmit() {
  const id = shopId();
  if (!id || kasForm.amount <= 0) return;
  kasSubmitting.value = true;
  kasError.value = null;
  try {
    const payload = { amount: kasForm.amount, notes: kasForm.notes || undefined };
    const res = kasTab.value === 'cashin'
      ? await brilinkCashboxService.setor(id, payload)
      : await brilinkCashboxService.tarik(id, payload);
    saldoKas.value = res.balance ?? res.cashBox?.balance ?? saldoKas.value;
    // recalc state
    kasPernahDipakai.value = true;
    kasLowBalance.value = res.isLowBalance ?? (saldoKas.value < (res.lowBalanceThreshold ?? 0));
    showToast('success', kasTab.value === 'cashin' ? 'Cash In berhasil!' : 'Cash Out berhasil!');
    showKasPanel.value = false;
  } catch (e: any) {
    kasError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.';
  } finally {
    kasSubmitting.value = false;
  }
}

// ── Rekening Tambah / Tarik ───────────────────────────────────────────────────
function openRekModal(acc: BrilinkAccount, type: 'tambah' | 'tarik') {
  rekAccount.value = acc;
  rekType.value = type;
  rekForm.amount = 0;
  rekForm.reference = '';
  rekForm.notes = '';
  rekError.value = null;
  showRekModal.value = true;
}

async function handleRekSubmit() {
  if (!rekAccount.value || rekForm.amount <= 0) return;
  rekSubmitting.value = true;
  rekError.value = null;
  try {
    const payload = {
      amount: rekForm.amount,
      reference: rekForm.reference || undefined,
      notes: rekForm.notes || undefined,
    };
    const res = rekType.value === 'tambah'
      ? await brilinkAccountService.setor(rekAccount.value.id, payload)
      : await brilinkAccountService.tarik(rekAccount.value.id, payload);

    const updated = res.account;
    const idx = accounts.value.findIndex(a => a.id === updated.id);
    if (idx !== -1) accounts.value[idx] = { ...accounts.value[idx], balance: updated.balance };

    showToast('success', rekType.value === 'tambah' ? 'Tambah saldo berhasil!' : 'Tarik saldo berhasil!');
    showRekModal.value = false;
  } catch (e: any) {
    rekError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.';
  } finally {
    rekSubmitting.value = false;
  }
}

// ── Pindah saldo ──────────────────────────────────────────────────────────────
function openPindahModal(acc: BrilinkAccount) {
  pindahFrom.value = acc;
  pindahToId.value = '';
  pindahAmount.value = 0;
  pindahNotes.value = '';
  pindahError.value = null;
  showPindahModal.value = true;
}

async function handlePindahSubmit() {
  if (!pindahFrom.value || !pindahToId.value || pindahAmount.value <= 0) return;
  pindahSubmitting.value = true;
  pindahError.value = null;
  try {
    await brilinkAccountService.transferInternal({
      fromAccountId: pindahFrom.value.id,
      toAccountId: pindahToId.value,
      amount: pindahAmount.value,
      notes: pindahNotes.value || undefined,
    });
    // Reload semua rekening untuk saldo terbaru
    const id = shopId();
    if (id) accounts.value = (await brilinkAccountService.list(id)).filter(a => a.isActive);
    showToast('success', 'Pindah saldo berhasil!');
    showPindahModal.value = false;
  } catch (e: any) {
    pindahError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.';
  } finally {
    pindahSubmitting.value = false;
  }
}

// ── Scroll dots ───────────────────────────────────────────────────────────────
function setupScrollTracker() {
  const el = saldoStrip.value;
  if (!el) return;
  el.addEventListener('scroll', () => {
    const cardW = 192 + 12; // w-48 = 192px + gap-3 = 12px
    activeCard.value = Math.round(el.scrollLeft / cardW);
  }, { passive: true });
}

// ── Data load ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const id = shopId();
  if (!id) {
    loading.value = false;
    accountsLoading.value = false;
    kasLoading.value = false;
    return;
  }

  const [accs, txRes, cashboxRes] = await Promise.allSettled([
    brilinkAccountService.list(id),
    brilinkService.listTransactions({ shopId: id, limit: 5 }),
    brilinkCashboxService.getCashBox(id),
  ]);

  if (accs.status === 'fulfilled') accounts.value = accs.value.filter(a => a.isActive);
  accountsLoading.value = false;

  if (txRes.status === 'fulfilled') recentTransactions.value = txRes.value.data;
  loading.value = false;

  if (cashboxRes.status === 'fulfilled') {
    const cb = cashboxRes.value;
    saldoKas.value = cb.balance;
    const sudahDipakai = cb.balance > 0 || (cb.recentMutations?.length ?? 0) > 0;
    kasPernahDipakai.value = sudahDipakai;
    kasLowBalance.value = sudahDipakai && cb.isLowBalance;
  }
  kasLoading.value = false;

  setTimeout(setupScrollTracker, 100);
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Bottom sheet slide up */
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from .sheet-leave-to { opacity: 0; }
.sheet-enter-from > :last-child, .sheet-leave-to > :last-child { transform: translateY(100%); }

/* Toast */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
