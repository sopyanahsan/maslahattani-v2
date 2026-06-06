<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Pengaturan</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Konfigurasi toko, struk, bahasa, alert, dan preferensi sistem.
      </p>
    </div>

    <!-- Tab switcher -->
    <div
      class="border-b border-slate-200 dark:border-slate-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
    >
      <nav class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0',
            activeTab === tab.value
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
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
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat pengaturan...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- TAB: TOKO                                    -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'shop'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <StoreIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" /> Data Toko
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveShop">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Toko
              </label>
              <input
                v-model="shopForm.name"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Telepon
              </label>
              <input
                v-model="shopForm.phone"
                type="text"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat
            </label>
            <textarea
              v-model="shopForm.address"
              rows="2"
              class="w-full text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div
            v-if="shopSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
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
      <!-- TAB: STRUK & POS                             -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'receipt'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PrinterIcon class="w-4 h-4 text-amber-600 dark:text-amber-400" /> Pengaturan Struk
          </h3>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveReceipt">
          <div class="flex items-center gap-3">
            <input
              id="autoPrint"
              v-model="receiptForm.autoPrint"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="autoPrint" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Auto-print setelah transaksi
            </label>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="mergeReceipts"
              v-model="receiptForm.mergeReceipts"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="mergeReceipts" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gabungkan struk multi-item
            </label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pesan di Footer Struk
            </label>
            <input
              v-model="receiptForm.footerMessage"
              type="text"
              placeholder="Terima kasih sudah berbelanja!"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div
            v-if="receiptSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ receiptSuccess }}
          </div>
          <div class="flex justify-end">
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
      </section>

      <!-- POS / Kasir Settings (same tab as receipt) -->
      <section
        v-if="activeTab === 'receipt'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" /> POS / Kasir
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Preferensi untuk aplikasi kasir (webapp).
          </p>
        </div>
        <div class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Konfirmasi sebelum checkout</p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tampilkan dialog konfirmasi sebelum transaksi diproses.</p>
            </div>
            <button
              type="button"
              :class="['w-10 h-5 rounded-full relative transition-colors', posForm.confirmBeforeCheckout ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
              @click="posForm.confirmBeforeCheckout = !posForm.confirmBeforeCheckout"
            >
              <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', posForm.confirmBeforeCheckout ? 'left-[22px]' : 'left-0.5']" />
            </button>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Tampilkan barcode scanner</p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Aktifkan input scan barcode di halaman POS.</p>
            </div>
            <button
              type="button"
              :class="['w-10 h-5 rounded-full relative transition-colors', posForm.showBarcodeScanner ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
              @click="posForm.showBarcodeScanner = !posForm.showBarcodeScanner"
            >
              <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', posForm.showBarcodeScanner ? 'left-[22px]' : 'left-0.5']" />
            </button>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default metode bayar</label>
            <select v-model="posForm.defaultPaymentMethod" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none">
              <option value="CASH">Cash (Tunai)</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer Bank</option>
            </select>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Metode bayar yang otomatis terpilih saat checkout.</p>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- TAB: NOTIFIKASI                              -->
      <!-- ============================================ -->
      <section
        v-if="activeTab === 'alerts'"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div
          class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BellIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            Notifikasi & Alert
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi threshold yang muncul di Dashboard Retail &amp; BRILink.
          </p>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="handleSaveAlert">
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="lowStockThreshold"
            >
              Threshold Stok Menipis (unit)
            </label>
            <input
              id="lowStockThreshold"
              v-model.number="alertForm.lowStockThreshold"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Produk dengan stok ≤ angka ini akan masuk alert "Stok Menipis".
              Default: 5 unit.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="shiftDurationWarningHours"
            >
              Threshold Shift Lama (jam)
            </label>
            <input
              id="shiftDurationWarningHours"
              v-model.number="alertForm.shiftDurationWarningHours"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Shift OPEN yang sudah lebih dari sekian jam akan dianggap "lupa
              ditutup". Default: 8 jam.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="overdueDebtDaysBeforeNotice"
            >
              H- Notifikasi Hutang Jatuh Tempo (hari)
            </label>
            <input
              id="overdueDebtDaysBeforeNotice"
              v-model.number="alertForm.overdueDebtDaysBeforeNotice"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              0 = tampil saat tepat jatuh tempo. 3 = tampil 3 hari sebelumnya.
              Default: 0.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              for="brilinkFailedTransactionThreshold"
            >
              Threshold Transaksi BRILink Gagal (per hari)
            </label>
            <input
              id="brilinkFailedTransactionThreshold"
              v-model.number="alertForm.brilinkFailedTransactionThreshold"
              type="number"
              min="0"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Jika jumlah transaksi BRILink gagal hari ini ≥ angka ini, akan muncul alert
              di Dashboard BRILink. Default: 5.
            </p>
          </div>

          <div
            v-if="alertSuccess"
            class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ alertSuccess }}
          </div>
          <div
            v-if="alertError"
            class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300"
          >
            {{ alertError }}
          </div>

          <div class="flex items-center justify-between">
            <button
              type="button"
              class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
        <div class="border-t border-slate-200 dark:border-slate-700 pt-5 mt-5">
          <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Suara Notifikasi</h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Aktifkan suara notifikasi</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Bunyi saat ada alert baru (stok rendah, hutang jatuh tempo, dll)</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', notifSoundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                @click="toggleNotifSound"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', notifSoundEnabled ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <div v-if="notifSoundEnabled">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Tone</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tone in toneOptions"
                  :key="tone.value"
                  type="button"
                  :class="['h-8 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5',
                    notifSoundTone === tone.value
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800']"
                  @click="selectTone(tone.value)"
                >
                  {{ tone.icon }} {{ tone.label }}
                </button>
              </div>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Klik untuk preview & select.</p>
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
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SettingsIcon class="w-4 h-4 text-red-600 dark:text-red-400" /> Keamanan
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pengaturan autentikasi dan keamanan akun.
            </p>
          </div>
          <div class="p-5 space-y-5">
            <!-- 2FA for Super Admin -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">2FA wajib untuk Super Admin</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kode OTP dikirim ke email setiap login Super Admin.</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.otpSuperAdmin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                @click="securityForm.otpSuperAdmin = !securityForm.otpSuperAdmin"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', securityForm.otpSuperAdmin ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <!-- 2FA for Admin Cabang -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">2FA untuk Admin Cabang</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Opsional — admin cabang bisa aktifkan sendiri di Profil.</p>
              </div>
              <button
                type="button"
                :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.otpAdminCabang ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                @click="securityForm.otpAdminCabang = !securityForm.otpAdminCabang"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', securityForm.otpAdminCabang ? 'left-[22px]' : 'left-0.5']" />
              </button>
            </div>

            <div class="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
              <!-- Max PIN attempts -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max percobaan PIN (sebelum lock)
                </label>
                <input
                  v-model.number="securityForm.maxPinAttempts"
                  type="number"
                  min="3"
                  max="10"
                  class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none"
                />
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Kasir yang salah PIN sebanyak ini akan di-lock sementara. Default: 5.
                </p>
              </div>

              <!-- PIN lock duration -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Durasi lock PIN (menit)
                </label>
                <input
                  v-model.number="securityForm.pinLockDurationMinutes"
                  type="number"
                  min="1"
                  max="60"
                  class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none"
                />
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Berapa lama akun kasir di-lock setelah max percobaan. Default: 15 menit.
                </p>
              </div>
            </div>

            <!-- Force password change for new accounts -->
            <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Wajib ganti password/PIN saat login pertama</p>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Akun baru wajib mengubah kredensial sebelum bisa mengakses sistem.</p>
                </div>
                <button
                  type="button"
                  :class="['w-10 h-5 rounded-full relative transition-colors', securityForm.forceChangeOnFirstLogin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
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
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import settingsService from '@/shared/services/settings.service';
import SystemSettingsView from '@/admin/views/SystemSettingsView.vue';
import dashboardService from '@/shared/services/dashboard.service';
import { useNotifSound } from '@/shared/composables/useNotifSound';

const { preview: previewTone } = useNotifSound();

const authStore = useAuthStore();
const shopStore = useShopStore();

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

// Receipt form
const receiptForm = reactive({
  autoPrint: true,
  mergeReceipts: false,
  footerMessage: '',
});
const savingReceipt = ref(false);
const receiptSuccess = ref<string | null>(null);

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
    if (data.settings?.receiptConfig) {
      try {
        const rc =
          typeof data.settings.receiptConfig === 'string'
            ? JSON.parse(data.settings.receiptConfig)
            : data.settings.receiptConfig;
        receiptForm.autoPrint = rc.autoPrint ?? true;
        receiptForm.mergeReceipts = rc.mergeReceipts ?? false;
        receiptForm.footerMessage = rc.footerMessage ?? '';
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
