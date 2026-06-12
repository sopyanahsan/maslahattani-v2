<template>
  <div class="font-hanken overflow-x-hidden w-full">

    <!-- ============================================================ -->
    <!-- STEP 1: Form Transfer                                         -->
    <!-- ============================================================ -->
    <template v-if="step === 'form'">
      <!-- Header -->
      <div class="shrink-0 px-4 py-3 bg-white dark:bg-[#1e2020] border-b border-slate-200 dark:border-[#3d4948] flex items-center gap-3">
        <RouterLink to="/brilink/menu" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a] transition-colors">
          <ChevronLeftIcon class="w-5 h-5 text-slate-600 dark:text-[#bcc9c7]" />
        </RouterLink>
        <div>
          <h1 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">{{ categoryTitle }}</h1>
          <p class="text-[10px] text-slate-500 dark:text-[#869392]">Pilih sumber dana &amp; isi data tujuan</p>
        </div>
      </div>

      <!-- Saldo strip: pilih sumber dana -->
      <div class="bg-gradient-to-br from-[#00756f] via-[#00A19B] to-[#00bdb6] px-4 py-4 overflow-hidden">
        <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-2">Sumber Dana (pilih rekening)</p>
        <div ref="sourceStrip" class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory">
          <!-- Rekening agen -->
          <button
            v-for="acc in accounts"
            :key="acc.id"
            type="button"
            :class="[
              'shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-2xl px-4 py-3 text-left transition-all border',
              selectedAccountId === acc.id
                ? 'bg-white/25 border-white/60 shadow-lg scale-[1.02]'
                : 'bg-white/10 border-white/20 hover:bg-white/15',
            ]"
            @click="selectedAccountId = acc.id; isCustomerCard = false"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <CreditCardIcon class="w-3.5 h-3.5 text-white/70" />
              <p class="text-[10px] font-semibold text-white/80 uppercase tracking-wider truncate">{{ acc.label }}</p>
              <span v-if="selectedAccountId === acc.id && !isCustomerCard" class="ml-auto w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
                <CheckIcon class="w-2.5 h-2.5 text-[#00756f]" />
              </span>
            </div>
            <p class="text-[9px] text-white/50 font-mono">{{ acc.accountNumber }}</p>
            <p class="text-base font-bold text-white font-mono leading-tight mt-0.5">{{ formatRupiah(acc.balance) }}</p>
          </button>

          <!-- Kartu Customer (sumber dana nasabah — agen cuma terima profit admin) -->
          <button
            type="button"
            :class="[
              'shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-2xl px-4 py-3 text-left transition-all border',
              isCustomerCard
                ? 'bg-amber-400/30 border-amber-300/60 shadow-lg scale-[1.02]'
                : 'bg-white/10 border-white/20 hover:bg-white/15',
            ]"
            @click="isCustomerCard = true; selectedAccountId = ''"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <UserIcon class="w-3.5 h-3.5 text-white/70" />
              <p class="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Kartu Customer</p>
              <span v-if="isCustomerCard" class="ml-auto w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
                <CheckIcon class="w-2.5 h-2.5 text-[#00756f]" />
              </span>
            </div>
            <p class="text-[9px] text-amber-200/80 leading-tight">Uang dari nasabah langsung</p>
            <p class="text-[10px] text-white/60 mt-0.5">Hanya profit admin masuk ke agen</p>
          </button>

          <!-- Empty state -->
          <div v-if="accounts.length === 0 && !accountsLoading"
            class="shrink-0 snap-start w-[55vw] min-w-[180px] rounded-2xl border border-dashed border-white/30 px-4 py-4 flex flex-col items-center justify-center text-white/50">
            <LandmarkIcon class="w-5 h-5 mb-1" />
            <p class="text-[10px] text-center">Belum ada rekening</p>
          </div>

          <!-- Loading -->
          <template v-if="accountsLoading">
            <div v-for="i in 2" :key="i" class="shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-2xl bg-white/10 border border-white/20 px-4 py-3 animate-pulse">
              <div class="h-3 w-20 rounded bg-white/20 mb-2" />
              <div class="h-5 w-28 rounded bg-white/20" />
            </div>
          </template>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#1a1c1c]">

        <!-- Bank Tujuan -->
        <div v-if="showBankField">
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            Bank Tujuan <span class="text-red-500">*</span>
          </label>
          <!-- Transfer Sesama BRI: locked -->
          <div v-if="selectedCategory === 'TRANSFER_BRI'"
            class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-slate-50 dark:bg-[#292a2a] flex items-center text-slate-700 dark:text-[#e3e2e2] font-medium">
            <LandmarkIcon class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2] mr-2 shrink-0" />
            Bank Rakyat Indonesia (BRI)
          </div>
          <!-- Transfer Antar Bank: bisa search & ganti -->
          <button
            v-else
            type="button"
            class="w-full h-10 px-3 text-left text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] flex items-center justify-between hover:border-[#00A19B] dark:hover:border-[#5fd9d2] transition-colors"
            @click="showBankSearch = true"
          >
            <span :class="form.bankCode ? 'text-slate-900 dark:text-[#e3e2e2] font-medium' : 'text-slate-400 dark:text-[#869392]'">
              {{ selectedBankName || 'Cari bank tujuan...' }}
            </span>
            <SearchIcon class="w-4 h-4 text-slate-400 dark:text-[#869392] shrink-0" />
          </button>
        </div>

        <!-- No Rekening Tujuan (numeric only) — TIDAK tampil untuk TARIK TUNAI -->
        <div v-if="selectedCategory !== 'TARIK_TUNAI'">
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            {{ destinationLabel }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.destination"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            required
            :placeholder="destinationPlaceholder"
            class="w-full h-10 px-3 text-sm font-mono border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
            @input="filterNumericOnly"
          />
        </div>

        <!-- Nama Penerima (opsional) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            Nama Penerima <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
          </label>
          <input
            v-model="form.customerName"
            type="text"
            placeholder="Nama lengkap penerima"
            class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
            @input="searchCustomer"
            @focus="showSuggestions = true"
          />
          <!-- Autocomplete -->
          <div v-if="showSuggestions && suggestions.length > 0"
            class="mt-1 bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl shadow-lg max-h-32 overflow-y-auto z-20 relative">
            <button v-for="s in suggestions" :key="s.id" type="button"
              class="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#292a2a] border-b border-slate-50 dark:border-[#292a2a] last:border-0"
              @click="selectSuggestion(s)">
              <p class="text-xs font-medium text-slate-800 dark:text-[#e3e2e2]">{{ s.name }}</p>
              <p v-if="s.phone" class="text-[10px] text-slate-400 dark:text-[#869392]">{{ s.phone }}</p>
            </button>
          </div>
        </div>

        <!-- No HP (optional) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            No. HP Customer <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
          </label>
          <input
            v-model="form.customerPhone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
          />
        </div>

        <!-- Metode Admin — HANYA untuk Tarik Tunai -->
        <div v-if="selectedCategory === 'TARIK_TUNAI'">
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Metode Admin</label>
          <div class="grid grid-cols-3 gap-2">
            <button v-for="m in feeMethodOptions" :key="m.value" type="button"
              :class="[
                'p-2.5 rounded-xl border text-center transition-all',
                form.feeMethod === m.value
                  ? 'border-[#00A19B] dark:border-[#5fd9d2] bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10'
                  : 'border-slate-200 dark:border-[#3d4948] hover:border-slate-300 dark:hover:border-[#5fd9d2]/30',
              ]"
              @click="form.feeMethod = m.value"
            >
              <p :class="['text-[11px] font-bold', form.feeMethod === m.value ? 'text-[#00756f] dark:text-[#5fd9d2]' : 'text-slate-700 dark:text-[#e3e2e2]']">{{ m.label }}</p>
              <p class="text-[9px] text-slate-400 dark:text-[#869392] mt-0.5 leading-tight">{{ m.hint }}</p>
            </button>
          </div>
        </div>

        <!-- Nominal (formatted Rupiah) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            Nominal <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 dark:text-[#869392] pointer-events-none">Rp</span>
            <input
              :value="formatNumber(form.amount)"
              type="text"
              inputmode="numeric"
              required
              placeholder="0"
              class="w-full h-12 pl-12 pr-4 text-xl font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
              @input="onNominalInput"
            />
          </div>
          <p class="text-[10px] text-slate-400 dark:text-[#869392] mt-1">Minimal transfer Rp 10.000</p>
        </div>

        <!-- Fee Preview -->
        <div v-if="form.amount >= 10000" class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl p-3 space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Nominal</span>
            <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(form.amount) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Biaya Sistem <span class="text-[9px]">(EDC)</span></span>
            <span class="font-mono text-slate-600 dark:text-[#bcc9c7]">{{ formatRupiah(calculatedSystemFee) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Biaya Admin <span class="text-[9px]">(profit)</span></span>
            <span class="font-mono text-[#00A19B] dark:text-[#5fd9d2]">{{ formatRupiah(calculatedAdminFee) }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold border-t border-slate-100 dark:border-[#3d4948] pt-1.5">
            <span class="text-slate-700 dark:text-[#bcc9c7]">Total Biaya</span>
            <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(calculatedFee) }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold">
            <span class="text-slate-700 dark:text-[#bcc9c7]">Uang Diterima</span>
            <span class="font-mono text-[#00A19B] dark:text-[#5fd9d2]">{{ formatRupiah(totalReceived) }}</span>
          </div>
        </div>

        <!-- Nomor Referensi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            No. Referensi Nasabah <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span>
          </label>
          <input
            v-model="form.reference"
            type="text"
            placeholder="Nomor referensi"
            class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
          />
        </div>

        <!-- Catatan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
            Catatan <span class="text-slate-400 dark:text-[#869392] font-normal">(tidak wajib, max 30 karakter)</span>
          </label>
          <input
            v-model="form.notes"
            type="text"
            maxlength="30"
            placeholder="Catatan singkat..."
            class="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
          />
          <p class="text-[10px] text-slate-400 dark:text-[#869392] text-right mt-0.5">{{ form.notes.length }}/30</p>
        </div>

        <!-- Insufficient balance -->
        <div v-if="insufficientBalance" class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangleIcon class="w-4 h-4 shrink-0 mt-0.5" />
          <span>Nominal melebihi saldo rekening ({{ formatRupiah(selectedAccount?.balance ?? 0) }}). Setor saldo dulu.</span>
        </div>

        <!-- Selanjutnya -->
        <button
          type="button"
          :disabled="!canProceed"
          class="w-full h-12 rounded-xl text-sm font-bold text-white bg-[#00A19B] hover:brightness-110 dark:shadow-[0_0_15px_rgba(0,161,155,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          @click="goToConfirm"
        >
          Selanjutnya
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- STEP 2: Konfirmasi Transaksi                                  -->
    <!-- ============================================================ -->
    <template v-if="step === 'confirm'">
      <!-- Header -->
      <div class="shrink-0 px-4 py-3 bg-white dark:bg-[#1e2020] border-b border-slate-200 dark:border-[#3d4948] flex items-center gap-3">
        <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="step = 'form'">
          <ChevronLeftIcon class="w-5 h-5 text-slate-600 dark:text-[#bcc9c7]" />
        </button>
        <h1 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Konfirmasi Transaksi</h1>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#1a1c1c]">

        <!-- Pengirim & Penerima — hanya tampil untuk Transfer, tidak untuk Tarik Tunai -->
        <template v-if="selectedCategory !== 'TARIK_TUNAI'">
        <!-- Pengirim Card -->
        <div v-if="!isCustomerCard" class="bg-gradient-to-r from-[#00756f] to-[#00A19B] rounded-2xl px-4 py-3 text-white">
          <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-0.5">Pengirim (Sumber Dana)</p>
          <div class="flex items-center gap-2">
            <LandmarkIcon class="w-5 h-5 text-white/80 shrink-0" />
            <div>
              <p class="text-sm font-bold">{{ selectedAccount?.label }}</p>
              <p class="text-[11px] text-white/70 font-mono">{{ selectedAccount?.accountNumber }}</p>
            </div>
          </div>
        </div>
        <div v-else class="bg-gradient-to-r from-amber-500 to-amber-400 rounded-2xl px-4 py-3 text-white">
          <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-0.5">Sumber Dana</p>
          <div class="flex items-center gap-2">
            <UserIcon class="w-5 h-5 text-white/80 shrink-0" />
            <div>
              <p class="text-sm font-bold">Kartu Customer</p>
              <p class="text-[11px] text-white/70">Uang dari nasabah · hanya profit admin masuk</p>
            </div>
          </div>
        </div>

        <!-- Arrow down -->
        <div class="flex justify-center">
          <div class="w-8 h-8 rounded-full bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] flex items-center justify-center shadow-sm">
            <ChevronDownIcon class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2]" />
          </div>
        </div>

        <!-- Penerima Card -->
        <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl px-4 py-3">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-[#869392] uppercase tracking-wider mb-1">Penerima</p>
          <div class="flex items-center gap-2">
            <LandmarkIcon class="w-5 h-5 text-slate-400 dark:text-[#869392] shrink-0" />
            <div>
              <p class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2]">{{ form.customerName || 'Nasabah' }}</p>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] font-mono">{{ form.destination }}</p>
              <p v-if="selectedBankName" class="text-[10px] text-slate-400 dark:text-[#869392]">{{ selectedBankName }}</p>
            </div>
          </div>
        </div>
        </template>

        <!-- Detail Transaksi -->
        <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl p-4 space-y-2">
          <h3 class="text-xs font-bold text-slate-800 dark:text-[#e3e2e2] mb-2">Detail Transaksi</h3>

          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Jenis Layanan</span>
            <span class="font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ categoryTitle }}</span>
          </div>
          <div v-if="selectedCategory === 'TARIK_TUNAI'" class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Metode Admin</span>
            <span class="font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ feeMethodLabel }}</span>
          </div>
          <div v-if="form.reference" class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">No. Referensi</span>
            <span class="font-mono text-slate-800 dark:text-[#e3e2e2]">{{ form.reference }}</span>
          </div>
          <div v-if="form.notes" class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Catatan</span>
            <span class="text-slate-800 dark:text-[#e3e2e2]">{{ form.notes }}</span>
          </div>

          <div class="border-t border-slate-100 dark:border-[#3d4948] pt-2 mt-2 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Nominal</span>
              <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(form.amount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Biaya Sistem (EDC)</span>
              <span class="font-mono text-slate-600 dark:text-[#bcc9c7]">{{ formatRupiah(calculatedSystemFee) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Biaya Admin (profit)</span>
              <span class="font-mono text-[#00A19B] dark:text-[#5fd9d2]">{{ formatRupiah(calculatedAdminFee) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Saldo Sebelum</span>
              <span class="font-mono text-slate-600 dark:text-[#bcc9c7]">{{ formatRupiah(selectedAccount?.balance ?? 0) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Saldo Setelah</span>
              <span class="font-mono text-slate-600 dark:text-[#bcc9c7]">{{ formatRupiah((selectedAccount?.balance ?? 0) - debitAmount) }}</span>
            </div>
          </div>

          <div class="border-t border-slate-200 dark:border-[#3d4948] pt-2 mt-2">
            <div class="flex justify-between text-base font-bold">
              <span class="text-slate-800 dark:text-[#e3e2e2]">Total</span>
              <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(form.amount + calculatedFee) }}</span>
            </div>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-slate-500 dark:text-[#869392]">Uang Diterima</span>
              <span class="font-mono font-bold text-[#00A19B] dark:text-[#5fd9d2]">{{ formatRupiah(totalReceived) }}</span>
            </div>
          </div>
        </div>

        <!-- Progress bar saat proses -->
        <div v-if="submitting" class="space-y-2">
          <div class="h-2 bg-slate-200 dark:bg-[#3d4948] rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-[#00A19B] to-[#5fd9d2] rounded-full animate-progress" />
          </div>
          <p class="text-center text-xs text-slate-500 dark:text-[#869392]">Memproses transaksi...</p>
        </div>

        <!-- Error -->
        <div v-if="submitError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">{{ submitError }}</div>

        <!-- Konfirmasi Button -->
        <button
          type="button"
          :disabled="submitting"
          class="w-full h-12 rounded-xl text-sm font-bold text-white bg-[#00A19B] hover:brightness-110 dark:shadow-[0_0_15px_rgba(0,161,155,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          @click="handleSubmit"
        >
          <Loader2Icon v-if="submitting" class="w-4 h-4 animate-spin" />
          <SendIcon v-else class="w-4 h-4" />
          {{ submitting ? 'Memproses...' : 'Konfirmasi & Proses' }}
        </button>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- STEP 3: Sukses / Receipt                                      -->
    <!-- ============================================================ -->
    <template v-if="step === 'success'">
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#1a1c1c] min-h-[60vh]">
        <div class="w-16 h-16 rounded-full bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10 flex items-center justify-center mb-4">
          <CheckCircleIcon class="w-8 h-8 text-[#00A19B] dark:text-[#5fd9d2]" />
        </div>
        <h2 class="text-lg font-bold text-slate-900 dark:text-[#e3e2e2] mb-1">Transaksi Berhasil!</h2>
        <code class="text-xs font-mono text-slate-500 dark:text-[#869392]">{{ receiptRef }}</code>

        <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-2xl p-4 mt-4 w-full max-w-sm space-y-2 text-left">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Kategori</span>
            <span class="font-bold text-slate-800 dark:text-[#e3e2e2]">{{ categoryTitle }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Penerima</span>
            <span class="font-semibold text-slate-900 dark:text-[#e3e2e2]">{{ form.customerName }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Tujuan</span>
            <span class="font-mono text-slate-700 dark:text-[#bcc9c7]">{{ form.destination }}</span>
          </div>
          <div class="border-t border-slate-100 dark:border-[#3d4948] pt-2 flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Nominal</span>
            <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(form.amount) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Fee</span>
            <span class="font-mono text-[#00A19B] dark:text-[#5fd9d2]">{{ formatRupiah(calculatedFee) }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-[#3d4948] pt-2">
            <span class="text-slate-800 dark:text-[#e3e2e2]">Total</span>
            <span class="font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(form.amount + calculatedFee) }}</span>
          </div>
        </div>

        <div class="flex gap-3 mt-6 w-full max-w-sm">
          <button type="button"
            class="flex-1 h-11 border border-slate-200 dark:border-[#3d4948] rounded-xl text-sm font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-100 dark:hover:bg-[#292a2a] flex items-center justify-center gap-1.5 transition-colors"
            @click="handlePrint">
            <PrinterIcon class="w-4 h-4" /> Cetak Struk
          </button>
          <button type="button"
            class="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#00A19B] hover:brightness-110 flex items-center justify-center gap-1.5 transition-all"
            @click="resetForm">
            Transaksi Baru
          </button>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- MODAL: Bank Search                                            -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showBankSearch" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-hanken">
          <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="showBankSearch = false" />
          <div class="relative w-full sm:max-w-md bg-white dark:bg-[#1e2020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-[#3d4948] shadow-2xl max-h-[75vh] flex flex-col">
            <!-- handle -->
            <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto mt-3 sm:hidden" />
            <!-- search input -->
            <div class="px-4 pt-4 pb-2 shrink-0">
              <div class="relative">
                <SearchIcon class="w-4 h-4 text-slate-400 dark:text-[#869392] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref="bankSearchInput"
                  v-model="bankSearchQuery"
                  type="text"
                  placeholder="Cari nama bank..."
                  autofocus
                  class="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-slate-50 dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
                />
              </div>
            </div>
            <!-- bank list -->
            <div class="flex-1 overflow-y-auto px-4 pb-4">
              <div v-if="filteredBanks.length === 0" class="py-8 text-center">
                <p class="text-xs text-slate-400 dark:text-[#869392]">Bank tidak ditemukan</p>
              </div>
              <button
                v-for="bank in filteredBanks"
                :key="bank.id"
                type="button"
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-1',
                  form.bankCode === bank.code
                    ? 'bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10 border border-[#00A19B]/30 dark:border-[#5fd9d2]/30'
                    : 'hover:bg-slate-50 dark:hover:bg-[#292a2a]',
                ]"
                @click="selectBank(bank)"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#292a2a] flex items-center justify-center shrink-0">
                  <LandmarkIcon class="w-4 h-4 text-slate-500 dark:text-[#869392]" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-[#e3e2e2] truncate">{{ bank.name }}</p>
                  <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ bank.shortName }} · {{ bank.code }}</p>
                </div>
                <CheckIcon v-if="form.bankCode === bank.code" class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  CreditCard as CreditCardIcon,
  Landmark as LandmarkIcon,
  Send as SendIcon,
  Check as CheckIcon,
  CheckCircle2 as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
  Printer as PrinterIcon,
  Search as SearchIcon,
  User as UserIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import brilinkAccountService, { type BrilinkAccount } from '@/shared/services/brilink-account.service';
import brilinkProductsService, { type BankItem } from '@/shared/services/brilink-products.service';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  BRILINK_CATEGORIES,
  type BrilinkCategory,
  type BrilinkFeeDto,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const route = useRoute();

// ── Steps ─────────────────────────────────────────────────────────────────────
const step = ref<'form' | 'confirm' | 'success'>('form');

// ── Category from route query ─────────────────────────────────────────────────
const selectedCategory = ref<BrilinkCategory>((route.query.cat as BrilinkCategory) || 'TRANSFER_OTHER');

const categoryTitle = computed(() => BRILINK_CATEGORY_LABELS[selectedCategory.value] ?? 'Transfer');

const showBankField = computed(() =>
  ['TRANSFER_OTHER', 'TRANSFER_BRI'].includes(selectedCategory.value)
);

const destinationLabel = computed(() => {
  switch (selectedCategory.value) {
    case 'TRANSFER_BRI':
    case 'TRANSFER_OTHER': return 'Nomor Rekening Tujuan';
    case 'TOPUP_PULSA':
    case 'TOPUP_DATA': return 'Nomor HP';
    case 'TOPUP_EWALLET': return 'Nomor e-Wallet';
    case 'TOPUP_PLN': return 'No. Meter / ID Pelanggan';
    case 'TARIK_TUNAI': return 'Nomor Rekening Nasabah';
    default: return 'Tujuan';
  }
});

const destinationPlaceholder = computed(() => {
  switch (selectedCategory.value) {
    case 'TRANSFER_BRI': return 'Nomor rekening BRI tujuan';
    case 'TRANSFER_OTHER': return 'Nomor rekening bank lain';
    case 'TOPUP_PULSA':
    case 'TOPUP_DATA': return '08xxxxxxxxxx';
    case 'TOPUP_EWALLET': return '08xxxxxxxxxx';
    case 'TOPUP_PLN': return '1234567890';
    case 'TARIK_TUNAI': return 'Nomor rekening nasabah';
    default: return '';
  }
});

// ── Data ──────────────────────────────────────────────────────────────────────
const accounts = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(true);
const selectedAccountId = ref('');
const sourceStrip = ref<HTMLElement | null>(null);
const banks = ref<BankItem[]>([]);
const feeRules = ref<BrilinkFeeDto[]>([]);
const calculatedFee = ref(0);
const calculatedSystemFee = ref(0); // biaya sistem (potongan EDC)
const calculatedAdminFee = ref(0); // biaya admin (profit agen)

// ── Customer Card mode (sumber dana dari nasabah) ─────────────────────────────
const isCustomerCard = ref(false);

// ── Bank search modal ─────────────────────────────────────────────────────────
const showBankSearch = ref(false);
const bankSearchQuery = ref('');
const bankSearchInput = ref<HTMLInputElement | null>(null);

const filteredBanks = computed(() => {
  if (!bankSearchQuery.value.trim()) return banks.value;
  const q = bankSearchQuery.value.toLowerCase();
  return banks.value.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.shortName.toLowerCase().includes(q) ||
    b.code.toLowerCase().includes(q)
  );
});

// ── Fee method ────────────────────────────────────────────────────────────────
const feeMethodOptions = [
  { value: 'DALAM', label: 'Admin Dalam', hint: 'Termasuk dalam nominal' },
  { value: 'LUAR', label: 'Admin Luar', hint: 'Nominal + admin terpisah' },
  { value: 'POTONG', label: 'Potong Saldo', hint: 'Admin dari saldo agen' },
] as const;

const feeMethodLabel = computed(() => {
  const opt = feeMethodOptions.find(o => o.value === form.feeMethod);
  return opt ? `${opt.label} — ${opt.hint}` : form.feeMethod;
});

// ── Form ──────────────────────────────────────────────────────────────────────
const BRI_BANK_CODE = '002'; // default bank tujuan = BRI
const form = reactive({
  bankCode: BRI_BANK_CODE,
  destination: '',
  customerName: '',
  customerPhone: '',
  amount: 0,
  feeMethod: 'DALAM' as 'DALAM' | 'LUAR' | 'POTONG',
  reference: '',
  notes: '',
});

// ── Submit state ──────────────────────────────────────────────────────────────
const submitting = ref(false);
const submitError = ref<string | null>(null);
const receiptRef = ref('');
let isPrinting = false;

// ── Customer autocomplete ─────────────────────────────────────────────────────
const suggestions = ref<{ id: string; name: string; phone: string | null }[]>([]);
const showSuggestions = ref(false);
let searchTimer: any = null;

// ── Computed ──────────────────────────────────────────────────────────────────
const selectedAccount = computed(() => accounts.value.find(a => a.id === selectedAccountId.value) ?? null);

const selectedBankName = computed(() => {
  if (!form.bankCode) return '';
  const bank = banks.value.find(b => b.code === form.bankCode);
  return bank?.name ?? form.bankCode;
});

const totalReceived = computed(() => {
  // Untuk Tarik Tunai: tergantung metode admin
  if (selectedCategory.value === 'TARIK_TUNAI') {
    if (form.feeMethod === 'DALAM') return form.amount; // nasabah bayar nominal saja (fee sudah included)
    if (form.feeMethod === 'LUAR') return form.amount + calculatedFee.value; // nominal + fee
    return form.amount; // POTONG: nasabah bayar nominal, fee dari agen
  }
  // Untuk Transfer dll: nasabah selalu bayar nominal + total fee (biaya sistem + admin)
  return form.amount + calculatedFee.value;
});

const debitAmount = computed(() => {
  // Berapa yang didebit dari rekening agen
  if (selectedCategory.value === 'TARIK_TUNAI') {
    if (form.feeMethod === 'POTONG') return form.amount + calculatedFee.value;
    return form.amount;
  }
  // Transfer: selalu debit nominal saja dari rekening (fee dibayar nasabah)
  return form.amount;
});

const insufficientBalance = computed(() => {
  if (isCustomerCard.value) return false; // customer card: no balance check on agen
  return selectedAccount.value !== null &&
    form.amount > 0 &&
    debitAmount.value > selectedAccount.value.balance;
});

const canProceed = computed(() =>
  (selectedAccountId.value || isCustomerCard.value) &&
  (selectedCategory.value === 'TARIK_TUNAI' || form.destination) &&
  form.amount >= 10000 &&
  !insufficientBalance.value &&
  (!showBankField.value || form.bankCode)
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function getShopId() { return authStore.user?.shopId ?? shopStore.currentShopId ?? ''; }

function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }

function filterNumericOnly() {
  form.destination = form.destination.replace(/[^0-9]/g, '');
}

function formatNumber(n: number): string {
  if (!n || n === 0) return '';
  return n.toLocaleString('id-ID');
}

function onNominalInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
  form.amount = parseInt(raw) || 0;
  calculateFee();
}

function selectBank(bank: BankItem) {
  form.bankCode = bank.code;
  showBankSearch.value = false;
  bankSearchQuery.value = '';
}

function calculateFee() {
  if (!feeRules.value.length || form.amount <= 0) {
    calculatedFee.value = 0;
    calculatedSystemFee.value = 0;
    calculatedAdminFee.value = 0;
    return;
  }
  // Strict match: nominal HARUS dalam range min-max rule
  const rule = feeRules.value.find(
    r => r.category === selectedCategory.value && r.isActive && form.amount >= r.minAmount && form.amount <= r.maxAmount
  );

  if (!rule) {
    // Nominal di luar semua range yang diatur → fee = 0
    calculatedSystemFee.value = 0;
    calculatedAdminFee.value = 0;
    calculatedFee.value = 0;
    return;
  }

  calculatedSystemFee.value = rule.systemFee ?? 0;
  calculatedAdminFee.value = rule.feeType === 'FLAT' ? rule.feeAmount : Math.round(form.amount * rule.feePercent / 100);
  calculatedFee.value = calculatedSystemFee.value + calculatedAdminFee.value;
}

function searchCustomer() {
  showSuggestions.value = true;
  const q = form.customerName.trim();
  if (q.length < 2) { suggestions.value = []; return; }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    try {
      const shopId = getShopId();
      const { data } = await (await import('@/shared/services/api')).default.get('/customers/autocomplete', { params: { shopId, q } });
      suggestions.value = data;
    } catch { suggestions.value = []; }
  }, 300);
}

function selectSuggestion(s: { id: string; name: string; phone: string | null }) {
  form.customerName = s.name;
  form.customerPhone = s.phone || '';
  showSuggestions.value = false;
  suggestions.value = [];
}

function goToConfirm() {
  if (!canProceed.value) return;
  calculateFee();
  submitError.value = null;
  step.value = 'confirm';
}

async function handleSubmit() {
  // Validasi: harus ada sumber dana (rekening agen atau kartu customer)
  if (!selectedAccount.value && !isCustomerCard.value) return;

  submitting.value = true;
  submitError.value = null;
  try {
    const result = await brilinkService.createTransaction({
      category: selectedCategory.value,
      customerName: form.customerName || 'Nasabah',
      customerPhone: form.customerPhone || undefined,
      destination: form.destination || (selectedCategory.value === 'TARIK_TUNAI' ? 'TUNAI' : ''),
      amount: form.amount,
      accountId: selectedAccountId.value || undefined,
      idempotencyKey: crypto.randomUUID(),
      clientCreatedAt: new Date().toISOString(),
    });
    receiptRef.value = result.summary?.refNumber ?? result.id ?? '';
    // Update local account balance (hanya kalau pakai rekening agen)
    if (result.account && selectedAccountId.value) {
      const idx = accounts.value.findIndex(a => a.id === result.account!.id);
      if (idx !== -1) accounts.value[idx] = { ...accounts.value[idx], balance: result.account.balance };
    }
    step.value = 'success';
  } catch (e: any) {
    submitError.value = e?.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.';
  } finally {
    submitting.value = false;
  }
}

function handlePrint() {
  if (isPrinting) return;
  isPrinting = true;
  const metodeLabels: Record<string, string> = { DALAM: 'Admin Dalam', LUAR: 'Admin Luar', POTONG: 'Potong Saldo' };

  import('@/shared/services/thermal-print.service').then(async ({ thermalPrint }) => {
    try {
      if (!thermalPrint.isConnected) await thermalPrint.connect();
      await thermalPrint.printBrilinkReceipt({
        shopName: 'Posify',
        refNumber: receiptRef.value,
        date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        cashierName: authStore.user?.username || '-',
        category: categoryTitle.value,
        metodeAdmin: selectedCategory.value === 'TARIK_TUNAI' ? metodeLabels[form.feeMethod] : undefined,
        customerName: form.customerName || '-',
        customerPhone: form.customerPhone || undefined,
        destination: selectedCategory.value === 'TARIK_TUNAI' ? undefined : form.destination,
        bankName: selectedBankName.value || undefined,
        amount: form.amount,
        systemFee: calculatedSystemFee.value || undefined,
        adminFee: calculatedAdminFee.value || undefined,
        fee: calculatedFee.value,
        total: totalReceived.value,
        status: 'Sukses',
      });
    } catch { /* silent */ }
    finally { isPrinting = false; }
  }).catch(() => { isPrinting = false; });
}

function resetForm() {
  form.bankCode = BRI_BANK_CODE;
  form.destination = '';
  form.customerName = '';
  form.customerPhone = '';
  form.amount = 0;
  form.feeMethod = 'DALAM';
  form.reference = '';
  form.notes = '';
  calculatedFee.value = 0;
  submitError.value = null;
  receiptRef.value = '';
  step.value = 'form';
}

// ── Data load ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const shopId = getShopId();
  if (!shopId) { accountsLoading.value = false; return; }

  // Read category from query
  const catParam = route.query.cat as string;
  if (catParam && BRILINK_CATEGORIES.includes(catParam as BrilinkCategory)) {
    selectedCategory.value = catParam as BrilinkCategory;
  }

  // Lock bank to BRI for Transfer Sesama
  if (selectedCategory.value === 'TRANSFER_BRI') {
    form.bankCode = BRI_BANK_CODE;
  }

  // Load accounts, banks, fee rules in parallel
  const [accsRes, banksRes, feesRes] = await Promise.allSettled([
    brilinkAccountService.list(shopId),
    brilinkProductsService.listBanks(undefined, true),
    brilinkService.listFees(shopId),
  ]);

  if (accsRes.status === 'fulfilled') {
    const allActive = accsRes.value.filter(a => a.isActive);
    // Sort: default rekening pertama, lalu sisanya by createdAt
    const def = allActive.find(a => a.isDefault) ?? allActive[0];
    if (def) {
      // Pindahkan default ke index 0 supaya tampil pertama di strip
      const rest = allActive.filter(a => a.id !== def.id);
      accounts.value = [def, ...rest];
      selectedAccountId.value = def.id;
    } else {
      accounts.value = allActive;
    }
    // Scroll strip ke awal (posisi 0) agar rekening default terlihat
    setTimeout(() => { sourceStrip.value?.scrollTo({ left: 0, behavior: 'instant' }); }, 50);
  }
  accountsLoading.value = false;

  if (banksRes.status === 'fulfilled') {
    banks.value = banksRes.value;
  }

  if (feesRes.status === 'fulfilled') {
    feeRules.value = feesRes.value;
  }
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes progress {
  0% { width: 5%; }
  50% { width: 70%; }
  90% { width: 90%; }
  100% { width: 95%; }
}
.animate-progress {
  animation: progress 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
</style>
