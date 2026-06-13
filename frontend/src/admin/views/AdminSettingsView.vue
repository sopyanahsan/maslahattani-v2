<template>
  <div class="space-y-5">
    <div>
    <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-5 text-white shadow-lg">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
      <h1 class="relative text-lg font-bold">Pengaturan</h1>
      <p class="relative text-xs text-slate-300 mt-0.5">Kelola konfigurasi toko, struk, dan preferensi sistem.</p>
    </div>
      <p class="text-xs text-slate-500 dark:text-[#869392] mt-0.5">
        Konfigurasi toko, struk, bahasa, alert, dan preferensi sistem.
      </p>
    </div>

    <!-- Tab switcher -->
    <div
      class="border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
    >
      <nav class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0',
            activeTab === tab.value
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900',
          ]"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat pengaturan...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- TAB: TOKO                                    -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'shop'"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]"
        >
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <StoreIcon class="w-4 h-4 text-blue-600" /> Data Toko
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveShop">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Nama Toko
              </label>
              <input
                v-model="shopForm.name"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                No. Telepon
              </label>
              <input
                v-model="shopForm.phone"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Alamat
            </label>
            <textarea
              v-model="shopForm.address"
              rows="2"
              class="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>
          <div
            v-if="shopSuccess"
            class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700"
          >
            {{ shopSuccess }}
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="savingShop"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingShop" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================ -->
      <!-- ZONA WAKTU (inside Toko tab)                  -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'shop'"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            Zona Waktu
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">Atur zona waktu sesuai lokasi cabang.</p>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="tz in timezoneOptions"
              :key="tz.value"
              type="button"
              :class="[
                'p-4 rounded-lg border-2 text-left transition-all',
                currentTimezone === tz.value
                  ? 'border-[#00A19B] bg-[#00A19B]/5[#00A19B]/10'
                  : 'border-slate-200 hover:border-slate-200'
              ]"
              @click="handleChangeTimezone(tz.value)"
            >
              <p class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2]">{{ tz.label }}</p>
              <p class="text-[10px] text-slate-500 mt-0.5">{{ tz.offset }}</p>
              <p v-if="currentTimezone === tz.value" class="text-[10px] font-semibold text-[#00A19B] mt-1">Aktif</p>
            </button>
          </div>
          <div v-if="tzSuccess" class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700">
            {{ tzSuccess }}
          </div>
          <div v-if="tzError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ tzError }}
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- TAB: STRUK & POS                             -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'receipt'"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]"
        >
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PrinterIcon class="w-4 h-4 text-amber-600" /> Pengaturan Struk
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveReceipt">
          <div class="flex items-center gap-3">
            <input
              id="autoPrint"
              v-model="receiptForm.autoPrint"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
            />
            <label for="autoPrint" class="text-xs font-semibold text-slate-700">
              Auto-print setelah transaksi
            </label>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="mergeReceipts"
              v-model="receiptForm.mergeReceipts"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
            />
            <label for="mergeReceipts" class="text-xs font-semibold text-slate-700">
              Gabungkan struk multi-item
            </label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Pesan di Footer Struk
            </label>
            <input
              v-model="receiptForm.footerMessage"
              type="text"
              placeholder="Terima kasih sudah berbelanja!"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <!-- Logo Struk -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Logo Struk
            </label>
            <p class="text-[10px] text-slate-500 mb-2">
              Logo akan muncul di bagian atas struk. Format: PNG, JPG, SVG. Maks 2MB.
            </p>
            <div v-if="receiptForm.logoUrl" class="flex items-center gap-3 mb-2">
              <div class="w-16 h-16 border border-slate-200 rounded-md overflow-hidden bg-white flex items-center justify-center p-1">
                <img :src="receiptForm.logoUrl" alt="Logo struk" class="max-w-full max-h-full object-contain" />
              </div>
              <button
                type="button"
                class="h-7 px-2 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 flex items-center gap-1"
                @click="removeLogo"
              >
                <XIcon class="w-3 h-3" />
                Hapus
              </button>
            </div>
            <label
              class="inline-flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 cursor-pointer transition-colors"
            >
              <Loader2Icon v-if="uploadingLogo" class="w-3.5 h-3.5 animate-spin" />
              <ImagePlusIcon v-else class="w-3.5 h-3.5" />
              {{ uploadingLogo ? 'Uploading...' : (receiptForm.logoUrl ? 'Ganti Logo' : 'Upload Logo') }}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                class="hidden"
                :disabled="uploadingLogo"
                @change="handleLogoUpload"
              />
            </label>
            <p v-if="logoError" class="text-[10px] text-red-600 mt-1">{{ logoError }}</p>
          </div>
          <div
            v-if="receiptSuccess"
            class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700"
          >
            {{ receiptSuccess }}
          </div>
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="h-9 px-3 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1.5"
              @click="showReceiptPreview = !showReceiptPreview"
            >
              <component :is="showReceiptPreview ? EyeOffIcon : EyeIcon" class="w-3.5 h-3.5" />
              {{ showReceiptPreview ? 'Tutup Preview' : 'Preview Struk' }}
            </button>
            <button
              type="submit"
              :disabled="savingReceipt"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingReceipt" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>

        <!-- Receipt Preview Panel -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[600px]"
          leave-from-class="opacity-100 max-h-[600px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div
            v-if="showReceiptPreview"
            class="border-t border-slate-200 bg-slate-50/30 p-5 overflow-hidden"
          >
            <p class="text-[11px] text-slate-500 text-center mb-3">
              Preview menggunakan data toko & footer yang sedang diisi.
            </p>
            <ReceiptPreview
              :shop-name="shopForm.name"
              :shop-address="shopForm.address"
              :shop-phone="shopForm.phone"
              :footer-message="receiptForm.footerMessage"
              :logo-url="receiptForm.logoUrl"
            />
          </div>
        </Transition>
      </section>

      <!-- POS / Kasir Settings (same tab as receipt) -->
      <section
        v-if="activeTab === 'receipt'"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]"
        >
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon class="w-4 h-4 text-blue-600" /> POS / Kasir
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Preferensi untuk aplikasi kasir (webapp).
          </p>
        </div>
        <div class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-700">Konfirmasi sebelum checkout</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Tampilkan dialog konfirmasi sebelum transaksi diproses.</p>
            </div>
            <button
              type="button"
              :class="['w-10 h-5 rounded-full relative transition-colors', posForm.confirmBeforeCheckout ? 'bg-emerald-500' : 'bg-slate-300']"
              @click="posForm.confirmBeforeCheckout = !posForm.confirmBeforeCheckout"
            >
              <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', posForm.confirmBeforeCheckout ? 'left-[22px]' : 'left-0.5']" />
            </button>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-700">Tampilkan barcode scanner</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Aktifkan input scan barcode di halaman POS.</p>
            </div>
            <button
              type="button"
              :class="['w-10 h-5 rounded-full relative transition-colors', posForm.showBarcodeScanner ? 'bg-emerald-500' : 'bg-slate-300']"
              @click="posForm.showBarcodeScanner = !posForm.showBarcodeScanner"
            >
              <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', posForm.showBarcodeScanner ? 'left-[22px]' : 'left-0.5']" />
            </button>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Default metode bayar</label>
            <select v-model="posForm.defaultPaymentMethod" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 outline-none">
              <option value="CASH">Cash (Tunai)</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Metode bayar yang otomatis terpilih saat checkout.</p>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- TAB: NOTIFIKASI                              -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'alerts'"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]"
        >
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BellIcon class="w-4 h-4 text-orange-600" />
            Notifikasi & Alert
          </h3>
          <p class="text-[11px] text-slate-500 mt-1">
            Konfigurasi threshold yang muncul di Dashboard Retail &amp; BRILink.
          </p>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveAlert">
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 mb-1"
              for="lowStockThreshold"
            >
              Threshold Stok Menipis (unit)
            </label>
            <input
              id="lowStockThreshold"
              v-model.number="alertForm.lowStockThreshold"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 mt-1">
              Produk dengan stok ≤ angka ini akan masuk alert "Stok Menipis".
              Default: 5 unit.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 mb-1"
              for="shiftDurationWarningHours"
            >
              Threshold Shift Lama (jam)
            </label>
            <input
              id="shiftDurationWarningHours"
              v-model.number="alertForm.shiftDurationWarningHours"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 mt-1">
              Shift OPEN yang sudah lebih dari sekian jam akan dianggap "lupa
              ditutup". Default: 8 jam.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 mb-1"
              for="overdueDebtDaysBeforeNotice"
            >
              H- Notifikasi Hutang Jatuh Tempo (hari)
            </label>
            <input
              id="overdueDebtDaysBeforeNotice"
              v-model.number="alertForm.overdueDebtDaysBeforeNotice"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 mt-1">
              0 = tampil saat tepat jatuh tempo. 3 = tampil 3 hari sebelumnya.
              Default: 0.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 mb-1"
              for="brilinkFailedTransactionThreshold"
            >
              Threshold Transaksi BRILink Gagal (per hari)
            </label>
            <input
              id="brilinkFailedTransactionThreshold"
              v-model.number="alertForm.brilinkFailedTransactionThreshold"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 mt-1">
              Jika jumlah transaksi BRILink gagal hari ini ≥ angka ini, akan muncul alert
              di Dashboard BRILink. Default: 5.
            </p>
          </div>

          <div
            v-if="alertSuccess"
            class="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-700"
          >
            {{ alertSuccess }}
          </div>
          <div
            v-if="alertError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ alertError }}
          </div>

          <div class="flex items-center justify-between">
            <button
              type="button"
              class="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
              @click="resetAlertToDefault"
            >
              Reset ke default
            </button>
            <button
              type="submit"
              :disabled="savingAlert"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="savingAlert" class="w-3.5 h-3.5 animate-spin" />
              Simpan Threshold
            </button>
          </div>
        </form>

        <!-- Notification Sound Settings -->
        <div class="border-t border-slate-200 pt-5 mt-5">
          <h4 class="text-sm font-bold text-slate-900 mb-3">Suara Notifikasi</h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700">Aktifkan suara notifikasi</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Bunyi saat ada alert baru (stok rendah, hutang jatuh tempo, dll)</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', notifSoundEnabled ? 'bg-emerald-500' : 'bg-slate-300']"
                @click="toggleNotifSound"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', notifSoundEnabled ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <div v-if="notifSoundEnabled">
              <label class="block text-xs font-semibold text-slate-700 mb-2">Pilih Tone</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tone in toneOptions"
                  :key="tone.value"
                  type="button"
                  :class="['h-8 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5',
                    notifSoundTone === tone.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200']"
                  @click="selectTone(tone.value)"
                >
                  {{ tone.icon }} {{ tone.label }}
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-2">Klik untuk preview & select.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- TAB: Sistem (Toggles + Keamanan)            -->
      <!-- ============================================ -->
      <section v-if="activeTab === 'system'" class="space-y-5">
        <SystemSettingsView />

        <!-- Keamanan Section -->
        <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] bg-slate-50 dark:bg-[#292a2a]">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon class="w-4 h-4 text-red-600" /> Keamanan
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Pengaturan autentikasi dan keamanan akun.
            </p>
          </div>
          <div class="p-5 space-y-5">
            <!-- 2FA for Super Admin -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700">2FA wajib untuk Super Admin</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Kode OTP dikirim ke email setiap login Super Admin.</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.otpSuperAdmin ? 'bg-emerald-500' : 'bg-slate-300']"
                @click="securityForm.otpSuperAdmin = !securityForm.otpSuperAdmin"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', securityForm.otpSuperAdmin ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <!-- 2FA for Admin Cabang -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700">2FA untuk Admin Cabang</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Opsional — admin cabang bisa aktifkan sendiri di Profil.</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.otpAdminCabang ? 'bg-emerald-500' : 'bg-slate-300']"
                @click="securityForm.otpAdminCabang = !securityForm.otpAdminCabang"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', securityForm.otpAdminCabang ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <div class="border-t border-slate-200 pt-4 space-y-4">
              <!-- Max PIN attempts -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Max percobaan PIN (sebelum lock)
                </label>
                <input
                  v-model.number="securityForm.maxPinAttempts"
                  type="number"
                  min="3"
                  max="10"
                  class="w-full h-9 px-3 text-sm font-mono border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 outline-none"
                />
                <p class="text-[10px] text-slate-500 mt-1">
                  Kasir yang salah PIN sebanyak ini akan di-lock sementara. Default: 5.
                </p>
              </div>

              <!-- PIN lock duration -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi lock PIN (menit)
                </label>
                <input
                  v-model.number="securityForm.pinLockDurationMinutes"
                  type="number"
                  min="1"
                  max="60"
                  class="w-full h-9 px-3 text-sm font-mono border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 outline-none"
                />
                <p class="text-[10px] text-slate-500 mt-1">
                  Berapa lama akun kasir di-lock setelah max percobaan. Default: 15 menit.
                </p>
              </div>
            </div>

            <!-- Force password change for new accounts -->
            <div class="border-t border-slate-200 pt-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-700">Wajib ganti password/PIN saat login pertama</p>
                  <p class="text-[10px] text-slate-500 mt-0.5">Akun baru wajib mengubah kredensial sebelum bisa mengakses sistem.</p>
                </div>
                <button
                  type="button"
                  :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.forceChangeOnFirstLogin ? 'bg-emerald-500' : 'bg-slate-300']"
                  @click="securityForm.forceChangeOnFirstLogin = !securityForm.forceChangeOnFirstLogin"
                >
                  <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', securityForm.forceChangeOnFirstLogin ? 'left-[22px]' : 'left-0.5']" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch, type Component } from 'vue';
import {
  Store as StoreIcon,
  Globe as GlobeIcon,
  Printer as PrinterIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ImagePlus as ImagePlusIcon,
  X as XIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import api from '@/shared/services/api';
import settingsService from '@/shared/services/settings.service';
import SystemSettingsView from '@/admin/views/SystemSettingsView.vue';
import dashboardService from '@/shared/services/dashboard.service';
import { useNotifSound } from '@/shared/composables/useNotifSound';
import ReceiptPreview from '@/admin/components/receipt/ReceiptPreview.vue';
import { uploadToCloudinary } from '@/shared/services/upload.service';

const { preview: previewTone } = useNotifSound();

const authStore = useAuthStore();
const shopStore = useShopStore();
const settingsStore = useSettingsStore();

/**
 * Sumber shopId yang reliable:
 * - shopStore.currentShopId di-hydrate sync dari localStorage saat store init,
 *   jadi sudah tersedia ketika view ini mount.
 * - authStore.user?.shopId di-set async (fetchUser/login) & untuk super-admin
 *   nilainya null (currentShop yang dipakai). Dipakai sebagai fallback saja.
 */
const shopId = computed(
  () => shopStore.currentShopId ?? authStore.user?.shopId ?? null,
);

const loading = ref(false);
const error = ref<string | null>(null);

// Tabs
type TabValue = 'shop' | 'receipt' | 'alerts' | 'system';
const tabs: Array<{ value: TabValue; label: string; icon: Component }> = [
  { value: 'shop', label: 'Toko', icon: StoreIcon },
  { value: 'receipt', label: 'Struk & POS', icon: PrinterIcon },
  { value: 'alerts', label: 'Notifikasi', icon: BellIcon },
  { value: 'system', label: 'Sistem', icon: SettingsIcon },
];
const activeTab = ref<TabValue>('shop');

// Shop form
const shopForm = reactive({ name: '', address: '', phone: '' });
const savingShop = ref(false);
const shopSuccess = ref<string | null>(null);

// Language form
const languageForm = reactive({ language: 'id' });
const savingLang = ref(false);
const langSuccess = ref<string | null>(null);

// Timezone
const timezoneOptions = [
  { value: 'Asia/Jakarta', label: 'WIB', offset: 'UTC+7 — Jawa, Sumatera, Kalbar' },
  { value: 'Asia/Makassar', label: 'WITA', offset: 'UTC+8 — Kalimantan, Bali, Sulawesi, NTT/NTB' },
  { value: 'Asia/Jayapura', label: 'WIT', offset: 'UTC+9 — Papua, Maluku' },
];
const currentTimezone = ref('Asia/Jakarta');
const tzSuccess = ref<string | null>(null);
const tzError = ref<string | null>(null);

async function handleChangeTimezone(tz: string) {
  tzSuccess.value = null;
  tzError.value = null;
  try {
    const sid = shopId.value;
    if (!sid) return;
    const { data } = await api.put('/settings/timezone', { shopId: sid, timezone: tz });
    currentTimezone.value = tz;
    tzSuccess.value = data.message || 'Zona waktu berhasil diubah.';
    // Sync to settings store + localStorage
    settingsStore.settings.timezone = tz;
    localStorage.setItem('shop_timezone', tz);
    setTimeout(() => { tzSuccess.value = null; }, 3000);
  } catch (e: any) {
    tzError.value = e.response?.data?.message || 'Gagal mengubah zona waktu.';
  }
}

// Receipt form
const receiptForm = reactive({
  autoPrint: true,
  mergeReceipts: false,
  footerMessage: '',
  logoUrl: '',
});
const savingReceipt = ref(false);
const receiptSuccess = ref<string | null>(null);
const showReceiptPreview = ref(false);
const uploadingLogo = ref(false);
const logoError = ref<string | null>(null);

// POS form
const posForm = reactive({
  confirmBeforeCheckout: true,
  showBarcodeScanner: true,
  defaultPaymentMethod: 'CASH',
});

// Security form
const securityForm = reactive({
  otpSuperAdmin: true,
  otpAdminCabang: false,
  maxPinAttempts: 5,
  pinLockDurationMinutes: 15,
  forceChangeOnFirstLogin: true,
});

// Alert form
const alertForm = reactive({
  lowStockThreshold: 5,
  shiftDurationWarningHours: 8,
  overdueDebtDaysBeforeNotice: 0,
  brilinkFailedTransactionThreshold: 5,
});

// Notification sound settings
const notifSoundEnabled = ref(localStorage.getItem('notif_sound_enabled') !== 'false');
const notifSoundTone = ref(localStorage.getItem('notif_sound_tone') || 'chime');
const toneOptions = [
  { value: 'chime', label: 'Chime', icon: '🔔' },
  { value: 'beep', label: 'Beep', icon: '📢' },
  { value: 'bell', label: 'Bell', icon: '🛎️' },
  { value: 'silent', label: 'Silent', icon: '🔇' },
];

function toggleNotifSound() {
  notifSoundEnabled.value = !notifSoundEnabled.value;
  localStorage.setItem('notif_sound_enabled', String(notifSoundEnabled.value));
}

function selectTone(tone: string) {
  notifSoundTone.value = tone;
  localStorage.setItem('notif_sound_tone', tone);
  previewTone(tone as any);
}

const savingAlert = ref(false);
const alertSuccess = ref<string | null>(null);
const alertError = ref<string | null>(null);

async function fetchSettings() {
  if (!shopId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const data = await settingsService.getSettings(shopId.value);
    shopForm.name = data.shop.name;
    shopForm.address = data.shop.address;
    shopForm.phone = data.shop.phone;
    languageForm.language = data.settings?.language ?? 'id';
    currentTimezone.value = data.settings?.timezone ?? 'Asia/Jakarta';
    if (data.settings?.receiptConfig) {
      try {
        const rc =
          typeof data.settings.receiptConfig === 'string'
            ? JSON.parse(data.settings.receiptConfig)
            : data.settings.receiptConfig;
        receiptForm.autoPrint = rc.autoPrint ?? true;
        receiptForm.mergeReceipts = rc.mergeReceipts ?? false;
        receiptForm.footerMessage = rc.footerMessage ?? '';
        receiptForm.logoUrl = rc.logoUrl ?? '';
      } catch {
        /* ignore parse error */
      }
    }

    // Alert config (separate endpoint)
    try {
      const alertCfg = await dashboardService.getAlertConfig(shopId.value);
      alertForm.lowStockThreshold = alertCfg.lowStockThreshold;
      alertForm.shiftDurationWarningHours = alertCfg.shiftDurationWarningHours;
      alertForm.overdueDebtDaysBeforeNotice =
        alertCfg.overdueDebtDaysBeforeNotice;
      alertForm.brilinkFailedTransactionThreshold =
        (alertCfg as any).brilinkFailedTransactionThreshold ?? 5;
    } catch {
      /* keep defaults */
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message ?? err.message ?? 'Gagal memuat pengaturan.';
  } finally {
    loading.value = false;
  }
}

async function handleSaveShop() {
  if (!shopId.value) return;
  savingShop.value = true;
  shopSuccess.value = null;
  try {
    await settingsService.updateShop(shopId.value, {
      name: shopForm.name,
      address: shopForm.address,
      phone: shopForm.phone,
    });
    shopSuccess.value = 'Data toko berhasil disimpan.';
    setTimeout(() => {
      shopSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingShop.value = false;
  }
}

async function handleSaveLanguage() {
  if (!shopId.value) return;
  savingLang.value = true;
  langSuccess.value = null;
  try {
    await settingsService.updateLanguage({
      shopId: shopId.value,
      language: languageForm.language,
    });
    langSuccess.value = 'Bahasa berhasil disimpan.';
    setTimeout(() => {
      langSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingLang.value = false;
  }
}

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    logoError.value = 'File harus berupa gambar (PNG, JPG, SVG).';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    logoError.value = 'Ukuran file maksimal 2MB.';
    return;
  }

  uploadingLogo.value = true;
  logoError.value = null;
  try {
    const result = await uploadToCloudinary(file, 'posify/logos');
    receiptForm.logoUrl = result.url;
  } catch (err: any) {
    logoError.value = err?.message || 'Gagal upload logo.';
  } finally {
    uploadingLogo.value = false;
    input.value = '';
  }
}

function removeLogo() {
  receiptForm.logoUrl = '';
}

async function handleSaveReceipt() {
  if (!shopId.value) return;
  savingReceipt.value = true;
  receiptSuccess.value = null;
  try {
    await settingsService.updateReceiptConfig({
      shopId: shopId.value,
      autoPrint: receiptForm.autoPrint,
      mergeReceipts: receiptForm.mergeReceipts,
      footerMessage: receiptForm.footerMessage,
      logoUrl: receiptForm.logoUrl,
    });
    receiptSuccess.value = 'Pengaturan struk berhasil disimpan.';
    setTimeout(() => {
      receiptSuccess.value = null;
    }, 3000);
  } catch {
    /* silent */
  } finally {
    savingReceipt.value = false;
  }
}

async function handleSaveAlert() {
  if (!shopId.value) return;
  savingAlert.value = true;
  alertSuccess.value = null;
  alertError.value = null;
  try {
    const updated = await dashboardService.updateAlertConfig(shopId.value, {
      lowStockThreshold: Number(alertForm.lowStockThreshold) || 0,
      shiftDurationWarningHours:
        Number(alertForm.shiftDurationWarningHours) || 0,
      overdueDebtDaysBeforeNotice:
        Number(alertForm.overdueDebtDaysBeforeNotice) || 0,
      brilinkFailedTransactionThreshold:
        Number(alertForm.brilinkFailedTransactionThreshold) || 5,
    } as any);
    alertForm.lowStockThreshold = updated.lowStockThreshold;
    alertForm.shiftDurationWarningHours = updated.shiftDurationWarningHours;
    alertForm.overdueDebtDaysBeforeNotice = updated.overdueDebtDaysBeforeNotice;
    alertForm.brilinkFailedTransactionThreshold =
      (updated as any).brilinkFailedTransactionThreshold ?? 5;
    alertSuccess.value = 'Threshold berhasil disimpan.';
    setTimeout(() => {
      alertSuccess.value = null;
    }, 3000);
  } catch (err: any) {
    alertError.value =
      err?.response?.data?.message || err?.message || 'Gagal menyimpan threshold.';
  } finally {
    savingAlert.value = false;
  }
}

function resetAlertToDefault() {
  alertForm.lowStockThreshold = 5;
  alertForm.shiftDurationWarningHours = 8;
  alertForm.overdueDebtDaysBeforeNotice = 0;
  alertForm.brilinkFailedTransactionThreshold = 5;
}

onMounted(fetchSettings);

// Refetch kalau shop aktif baru tersedia/berubah setelah mount (mis. fetchUser
// async selesai atau super-admin ganti cabang).
watch(shopId, (next, prev) => {
  if (next && next !== prev) fetchSettings();
});
</script>


<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-5 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 160ms; }
.space-y-5 > *:nth-child(4) { animation-delay: 240ms; }
div[class*="bg-gradient-to-r"][class*="from-slate-700"] { background-size: 200% 200%; animation: headerShimmer 8s ease infinite; }
@keyframes headerShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
input, select, textarea { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
@keyframes tabPop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
button[class*="border-blue-600"] { animation: tabPop 0.2s ease-out; }
</style>
