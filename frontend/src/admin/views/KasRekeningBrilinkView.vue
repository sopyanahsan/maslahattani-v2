<template>
  <div class="space-y-5">
    <!-- Header -->
    <div></div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>


    <!-- ============================================ -->
    <!-- TAB: Rekening BRI                            -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'rekening'">
      <!-- Actions bar -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-600 dark:text-slate-400">Daftar rekening BRI agen.</p>
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg
                 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          @click="openAccountModal(null)"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          Tambah Rekening
        </button>
      </div>

      <!-- Loading -->
      <div v-if="accountsLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat rekening...</span>
      </div>


      <!-- Empty -->
      <div
        v-else-if="accounts.length === 0"
        class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center"
      >
        <LandmarkIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada rekening BRI</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tambahkan rekening BRI agen untuk mulai tracking saldo.</p>
      </div>

      <!-- Account cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="account in accounts"
          :key="account.id"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ account.label }}</h4>
                <span
                  v-if="account.isDefault"
                  class="text-[9px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
                >Default</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{{ account.accountNumber }}</p>
              <p v-if="account.accountHolder" class="text-[11px] text-slate-500 dark:text-slate-400">{{ account.accountHolder }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Edit"
                @click="openAccountModal(account)"
              >
                <PencilIcon class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                class="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Hapus"
                @click="handleDeleteAccount(account)"
              >
                <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>


          <!-- Balance -->
          <div class="mb-3">
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Saldo</p>
            <p
              :class="[
                'text-lg font-bold font-mono',
                account.balance < account.lowBalanceThreshold
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100',
              ]"
            >
              {{ formatRupiah(account.balance) }}
            </p>
            <p v-if="account.balance < account.lowBalanceThreshold" class="text-[10px] text-red-500 dark:text-red-400">
              ⚠ Di bawah threshold ({{ formatRupiah(account.lowBalanceThreshold) }})
            </p>
          </div>

          <!-- Setor / Tarik buttons -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              @click="openMutationModal(account, 'setor')"
            >
              + Setor
            </button>
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
              @click="openMutationModal(account, 'tarik')"
            >
              - Tarik
            </button>
            <button
              type="button"
              class="flex-1 h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              @click="openMutationsHistory(account)"
            >
              Riwayat
            </button>
          </div>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- TAB: Mutasi                                   -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'mutasi'">
      <!-- Filter bar -->
      <div class="flex flex-col sm:flex-row gap-3">
        <select
          v-model="mutasiFilter.accountId"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetMutasiAndFetch"
        >
          <option value="">Semua Rekening</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.label }}</option>
        </select>

        <select
          v-model="mutasiFilter.type"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetMutasiAndFetch"
        >
          <option value="">Semua Tipe</option>
          <option value="SETOR">Setor</option>
          <option value="TARIK">Tarik</option>
          <option value="TRX_DEBIT">Trx Debit</option>
          <option value="TRX_CREDIT">Trx Credit</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>

        <input
          v-model="mutasiFilter.startDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetMutasiAndFetch"
        />
        <input
          v-model="mutasiFilter.endDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @change="resetMutasiAndFetch"
        />

        <div class="flex-1"></div>
        <span v-if="mutasiMeta" class="text-xs text-slate-500 dark:text-slate-400 self-center">
          {{ mutasiMeta.total }} mutasi
        </span>
      </div>

      <!-- Loading -->
      <div v-if="mutasiLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat mutasi...</span>
      </div>

      <!-- Empty -->
      <div
        v-else-if="mutasiData.length === 0"
        class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center"
      >
        <WalletIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada mutasi</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Lakukan setor/tarik atau transaksi BRILink untuk melihat mutasi.</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tanggal</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Rekening</th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipe</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Deskripsi</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Jumlah</th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Saldo Setelah</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Oleh</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="mut in mutasiData"
                :key="mut.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ formatDateTime(mut.createdAt) }}</td>
                <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{{ mut.accountLabel }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', mutationTypeBadge(mut.type)]">
                    {{ mutationTypeLabel(mut.type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{{ mut.description }}</td>
                <td class="px-4 py-3 text-right">
                  <span :class="['text-xs font-bold font-mono', mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']">
                    {{ mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-xs font-mono text-slate-700 dark:text-slate-300">{{ formatRupiah(mut.balanceAfter) }}</td>
                <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{{ mut.createdBy?.username || mut.createdBy?.email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="mutasiMeta && mutasiMeta.totalPages > 1"
          class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Halaman {{ mutasiMeta.page }} dari {{ mutasiMeta.totalPages }}
          </p>
          <div class="flex items-center gap-1">
            <button
              :disabled="mutasiMeta.page <= 1"
              class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              @click="fetchMutasi(mutasiMeta!.page - 1)"
            >
              Prev
            </button>
            <button
              :disabled="mutasiMeta.page >= mutasiMeta.totalPages"
              class="h-7 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              @click="fetchMutasi(mutasiMeta!.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Metode Kas                              -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'metode'">
      <!-- Loading -->
      <div v-if="metodeLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat konfigurasi...</span>
      </div>

      <template v-else>
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Konfigurasi tampilan kategori BRILink di UI kasir.
          </p>
          <button
            type="button"
            :disabled="savingMetode"
            class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            @click="handleSaveMetode"
          >
            <Loader2Icon v-if="savingMetode" class="w-3.5 h-3.5 animate-spin" />
            Simpan Semua
          </button>
        </div>

        <div
          v-if="metodeSuccess"
          class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2 text-xs text-emerald-700 dark:text-emerald-300 mb-3"
        >
          {{ metodeSuccess }}
        </div>

        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide w-12">#</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kategori</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nama Tampilan</th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Warna</th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Aktif</th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Urutan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="(item, key) in metodeSorted"
                  :key="key"
                  class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td class="px-4 py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">{{ item.sortOrder + 1 }}</td>
                  <td class="px-4 py-3">
                    <code class="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{{ key }}</code>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="metodeConfig[key].displayName"
                      type="text"
                      class="h-8 px-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full max-w-[180px]"
                    />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <select
                      v-model="metodeConfig[key].color"
                      class="h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 outline-none"
                    >
                      <option value="blue">Blue</option>
                      <option value="indigo">Indigo</option>
                      <option value="amber">Amber</option>
                      <option value="pink">Pink</option>
                      <option value="purple">Purple</option>
                      <option value="cyan">Cyan</option>
                      <option value="yellow">Yellow</option>
                      <option value="emerald">Emerald</option>
                      <option value="red">Red</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      :class="[
                        'w-9 h-5 rounded-full relative transition-colors',
                        metodeConfig[key].isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
                      ]"
                      @click="metodeConfig[key].isActive = !metodeConfig[key].isActive"
                    >
                      <span
                        :class="[
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          metodeConfig[key].isActive ? 'left-[18px]' : 'left-0.5',
                        ]"
                      />
                    </button>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        class="w-6 h-6 text-xs border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        :disabled="item.sortOrder <= 0"
                        @click="moveCategory(String(key), -1)"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        class="w-6 h-6 text-xs border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        :disabled="item.sortOrder >= 6"
                        @click="moveCategory(String(key), 1)"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>


    <!-- ============================================ -->
    <!-- MODAL: Create/Edit Account                   -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showAccountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showAccountModal = false" />
        <form
          class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleSaveAccount"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ editingAccount ? 'Edit Rekening' : 'Tambah Rekening Baru' }}
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Label <span class="text-red-500">*</span></label>
            <input v-model="accountForm.label" type="text" required placeholder="BRI Default"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No. Rekening <span class="text-red-500">*</span></label>
            <input v-model="accountForm.accountNumber" type="text" required placeholder="1234567890"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik</label>
            <input v-model="accountForm.accountHolder" type="text" placeholder="Nama pemilik rekening"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Saldo Awal</label>
              <input v-model.number="accountForm.balance" type="number" min="0" placeholder="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Threshold Low Balance</label>
              <input v-model.number="accountForm.lowBalanceThreshold" type="number" min="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="accountForm.isDefault" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Default</span>
            </label>
          </div>


          <div v-if="accountModalError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ accountModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showAccountModal = false">Batal</button>
            <button type="submit" :disabled="savingAccount" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingAccount" class="w-3.5 h-3.5 animate-spin" />
              {{ editingAccount ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Setor / Tarik                         -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showMutationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showMutationModal = false" />
        <form
          class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleMutationSubmit"
        >
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ mutationType === 'setor' ? 'Setor Saldo' : 'Tarik Saldo' }} — {{ mutationAccount?.label }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Saldo saat ini: <span class="font-mono font-bold">{{ formatRupiah(mutationAccount?.balance ?? 0) }}</span>
          </p>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="mutationForm.amount" type="number" min="1" required
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Referensi</label>
            <input v-model="mutationForm.reference" type="text" placeholder="No. setoran / keterangan"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
            <input v-model="mutationForm.notes" type="text" placeholder="Opsional"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>


          <div v-if="mutationModalError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
            {{ mutationModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" @click="showMutationModal = false">Batal</button>
            <button type="submit" :disabled="savingMutation"
              :class="[
                'h-9 px-4 text-xs font-semibold text-white rounded-md disabled:opacity-50 flex items-center gap-1.5',
                mutationType === 'setor' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
              ]">
              <Loader2Icon v-if="savingMutation" class="w-3.5 h-3.5 animate-spin" />
              {{ mutationType === 'setor' ? 'Setor' : 'Tarik' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Mutations History                      -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showHistoryModal = false" />
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Riwayat Mutasi — {{ historyAccount?.label }}</h3>
            <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" @click="showHistoryModal = false">✕</button>
          </div>


          <div v-if="historyLoading" class="flex items-center justify-center py-8">
            <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          </div>
          <div v-else-if="historyData.length === 0" class="text-center py-8">
            <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada mutasi.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="mut in historyData"
              :key="mut.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
            >
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', mutationTypeStyle(mut.type)]">
                {{ mutationTypeIcon(mut.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ mut.description }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(mut.createdAt) }}
                  <span v-if="mut.createdBy"> &bull; {{ mut.createdBy.username || mut.createdBy.email }}</span>
                </p>
              </div>
              <div class="text-right shrink-0">
                <p :class="['text-xs font-bold font-mono', mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']">
                  {{ mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}
                </p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Saldo: {{ formatRupiah(mut.balanceAfter) }}
                </p>
              </div>
            </div>
          </div>


          <!-- Pagination -->
          <div v-if="historyMeta && historyMeta.totalPages > 1" class="flex items-center justify-between pt-2">
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Hal. {{ historyMeta.page }} / {{ historyMeta.totalPages }}</p>
            <div class="flex gap-1">
              <button :disabled="historyMeta.page <= 1" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page - 1)">Prev</button>
              <button :disabled="historyMeta.page >= historyMeta.totalPages" class="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page + 1)">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  Loader2 as Loader2Icon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Landmark as LandmarkIcon,
  Wallet as WalletIcon,
  Boxes as BoxesIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import brilinkAccountService, {
  type BrilinkAccount,
  type BrilinkMutationItem,
  type MutationsResponse,
} from '@/shared/services/brilink-account.service';
import settingsService from '@/shared/services/settings.service';


const authStore = useAuthStore();

// Tabs
type TabKey = 'rekening' | 'mutasi' | 'metode';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'rekening', label: 'Rekening BRI' },
  { key: 'mutasi', label: 'Mutasi' },
  { key: 'metode', label: 'Metode Kas' },
];
const activeTab = ref<TabKey>('rekening');

// ============================================
// Accounts State
// ============================================
const accounts = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(false);
const showAccountModal = ref(false);
const editingAccount = ref<BrilinkAccount | null>(null);
const savingAccount = ref(false);
const accountModalError = ref<string | null>(null);
const accountForm = reactive({
  label: '',
  accountNumber: '',
  accountHolder: '',
  balance: 0,
  lowBalanceThreshold: 1000000,
  isDefault: false,
});

// ============================================
// Mutation (Setor/Tarik) State
// ============================================
const showMutationModal = ref(false);
const mutationType = ref<'setor' | 'tarik'>('setor');
const mutationAccount = ref<BrilinkAccount | null>(null);
const savingMutation = ref(false);
const mutationModalError = ref<string | null>(null);
const mutationForm = reactive({
  amount: 0,
  reference: '',
  notes: '',
});

// ============================================
// History State
// ============================================
const showHistoryModal = ref(false);
const historyAccount = ref<BrilinkAccount | null>(null);
const historyLoading = ref(false);
const historyData = ref<BrilinkMutationItem[]>([]);
const historyMeta = ref<MutationsResponse['meta'] | null>(null);


// ============================================
// Helpers
// ============================================
function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function mutationTypeIcon(type: string): string {
  switch (type) {
    case 'SETOR': return '↑';
    case 'TARIK': return '↓';
    case 'TRX_DEBIT': return '−';
    case 'TRX_CREDIT': return '+';
    case 'ADJUSTMENT': return '⟳';
    default: return '?';
  }
}

function mutationTypeStyle(type: string): string {
  switch (type) {
    case 'SETOR':
    case 'TRX_CREDIT':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    case 'TARIK':
    case 'TRX_DEBIT':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'ADJUSTMENT':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}


// ============================================
// Accounts Methods
// ============================================
async function fetchAccounts() {
  const shopId = getShopId();
  if (!shopId) return;
  accountsLoading.value = true;
  try {
    accounts.value = await brilinkAccountService.list(shopId);
  } catch {
    accounts.value = [];
  } finally {
    accountsLoading.value = false;
  }
}

function openAccountModal(account: BrilinkAccount | null) {
  editingAccount.value = account;
  accountModalError.value = null;
  if (account) {
    accountForm.label = account.label;
    accountForm.accountNumber = account.accountNumber;
    accountForm.accountHolder = account.accountHolder || '';
    accountForm.balance = account.balance;
    accountForm.lowBalanceThreshold = account.lowBalanceThreshold;
    accountForm.isDefault = account.isDefault;
  } else {
    accountForm.label = '';
    accountForm.accountNumber = '';
    accountForm.accountHolder = '';
    accountForm.balance = 0;
    accountForm.lowBalanceThreshold = 1000000;
    accountForm.isDefault = false;
  }
  showAccountModal.value = true;
}

async function handleSaveAccount() {
  const shopId = getShopId();
  if (!shopId) return;
  savingAccount.value = true;
  accountModalError.value = null;
  try {
    if (editingAccount.value) {
      await brilinkAccountService.update(editingAccount.value.id, {
        label: accountForm.label,
        accountNumber: accountForm.accountNumber,
        accountHolder: accountForm.accountHolder || undefined,
        lowBalanceThreshold: accountForm.lowBalanceThreshold,
        isDefault: accountForm.isDefault,
      });
    } else {
      await brilinkAccountService.create({
        shopId,
        label: accountForm.label,
        accountNumber: accountForm.accountNumber,
        accountHolder: accountForm.accountHolder || undefined,
        balance: accountForm.balance || 0,
        lowBalanceThreshold: accountForm.lowBalanceThreshold,
        isDefault: accountForm.isDefault,
      });
    }
    showAccountModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    accountModalError.value = err?.response?.data?.message || err?.message || 'Gagal menyimpan.';
  } finally {
    savingAccount.value = false;
  }
}


async function handleDeleteAccount(account: BrilinkAccount) {
  if (!confirm(`Hapus rekening "${account.label}"?`)) return;
  try {
    await brilinkAccountService.remove(account.id);
    await fetchAccounts();
  } catch {
    /* silent */
  }
}

// ============================================
// Setor / Tarik Methods
// ============================================
function openMutationModal(account: BrilinkAccount, type: 'setor' | 'tarik') {
  mutationAccount.value = account;
  mutationType.value = type;
  mutationModalError.value = null;
  mutationForm.amount = 0;
  mutationForm.reference = '';
  mutationForm.notes = '';
  showMutationModal.value = true;
}

async function handleMutationSubmit() {
  if (!mutationAccount.value) return;
  savingMutation.value = true;
  mutationModalError.value = null;
  try {
    const payload = {
      amount: mutationForm.amount,
      reference: mutationForm.reference || undefined,
      notes: mutationForm.notes || undefined,
    };
    if (mutationType.value === 'setor') {
      await brilinkAccountService.setor(mutationAccount.value.id, payload);
    } else {
      await brilinkAccountService.tarik(mutationAccount.value.id, payload);
    }
    showMutationModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    mutationModalError.value = err?.response?.data?.message || err?.message || 'Gagal.';
  } finally {
    savingMutation.value = false;
  }
}

// ============================================
// History Methods
// ============================================
function openMutationsHistory(account: BrilinkAccount) {
  historyAccount.value = account;
  historyData.value = [];
  historyMeta.value = null;
  showHistoryModal.value = true;
  fetchHistory(1);
}

async function fetchHistory(page: number) {
  if (!historyAccount.value) return;
  historyLoading.value = true;
  try {
    const res = await brilinkAccountService.getMutations(historyAccount.value.id, page, 10);
    historyData.value = res.data;
    historyMeta.value = res.meta;
  } catch {
    historyData.value = [];
  } finally {
    historyLoading.value = false;
  }
}

onMounted(fetchAccounts);

// ============================================
// MUTASI TAB STATE
// ============================================
interface AllMutationItem {
  id: string;
  accountId: string;
  accountLabel: string;
  accountNumber: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string;
  notes: string | null;
  createdBy: { username: string | null; email: string } | null;
  createdAt: string;
}

const mutasiData = ref<AllMutationItem[]>([]);
const mutasiMeta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
const mutasiLoading = ref(false);
const mutasiFilter = reactive({
  accountId: '',
  type: '',
  startDate: '',
  endDate: '',
});

function mutationTypeBadge(type: string): string {
  switch (type) {
    case 'SETOR': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'TARIK': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'TRX_DEBIT': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    case 'TRX_CREDIT': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'ADJUSTMENT': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
}

function mutationTypeLabel(type: string): string {
  switch (type) {
    case 'SETOR': return 'Setor';
    case 'TARIK': return 'Tarik';
    case 'TRX_DEBIT': return 'Trx Debit';
    case 'TRX_CREDIT': return 'Trx Credit';
    case 'ADJUSTMENT': return 'Adjustment';
    default: return type;
  }
}

async function fetchMutasi(page = 1) {
  const shopId = getShopId();
  if (!shopId) return;
  mutasiLoading.value = true;
  try {
    const res = await brilinkAccountService.getAllMutations({
      shopId,
      accountId: mutasiFilter.accountId || undefined,
      type: mutasiFilter.type || undefined,
      startDate: mutasiFilter.startDate || undefined,
      endDate: mutasiFilter.endDate || undefined,
      page,
      limit: 20,
    });
    mutasiData.value = res.data;
    mutasiMeta.value = res.meta;
  } catch {
    mutasiData.value = [];
    mutasiMeta.value = null;
  } finally {
    mutasiLoading.value = false;
  }
}

function resetMutasiAndFetch() {
  fetchMutasi(1);
}

// ============================================
// METODE KAS TAB STATE
// ============================================
interface BrilinkCategoryItem {
  displayName: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

const metodeConfig = reactive<Record<string, BrilinkCategoryItem>>({});
const metodeLoading = ref(false);
const savingMetode = ref(false);
const metodeSuccess = ref<string | null>(null);

const metodeSorted = computed(() => {
  const entries = Object.entries(metodeConfig);
  entries.sort((a, b) => a[1].sortOrder - b[1].sortOrder);
  return Object.fromEntries(entries);
});

function moveCategory(key: string, direction: number) {
  const currentOrder = metodeConfig[key].sortOrder;
  const targetOrder = currentOrder + direction;

  // Find the other category at target position
  const otherKey = Object.keys(metodeConfig).find(
    (k) => metodeConfig[k].sortOrder === targetOrder,
  );
  if (otherKey) {
    metodeConfig[otherKey].sortOrder = currentOrder;
  }
  metodeConfig[key].sortOrder = targetOrder;
}

async function fetchMetodeConfig() {
  const shopId = getShopId();
  if (!shopId) return;
  metodeLoading.value = true;
  try {
    const data = await settingsService.getBrilinkCategories(shopId);
    Object.assign(metodeConfig, data);
  } catch {
    /* keep empty */
  } finally {
    metodeLoading.value = false;
  }
}

async function handleSaveMetode() {
  const shopId = getShopId();
  if (!shopId) return;
  savingMetode.value = true;
  metodeSuccess.value = null;
  try {
    const updated = await settingsService.updateBrilinkCategories(shopId, metodeConfig);
    Object.assign(metodeConfig, updated);
    metodeSuccess.value = 'Konfigurasi berhasil disimpan.';
    setTimeout(() => { metodeSuccess.value = null; }, 3000);
  } catch {
    /* silent */
  } finally {
    savingMetode.value = false;
  }
}

// Watch tab changes to load data on demand
watch(activeTab, (tab) => {
  if (tab === 'mutasi' && mutasiData.value.length === 0) {
    fetchMutasi(1);
  }
  if (tab === 'metode' && Object.keys(metodeConfig).length === 0) {
    fetchMetodeConfig();
  }
});

onMounted(() => {
  fetchAccounts();
});

useAutoRefresh(fetchAccounts);
</script>
