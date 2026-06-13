<template>
  <div class="space-y-5">
    <!-- Header -->
    <div></div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900',
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

      <!-- ════════════════════════════════════════════ -->
      <!-- KAS TUNAI AGEN — selalu ada (auto-created)   -->
      <!-- ════════════════════════════════════════════ -->
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <!-- Card header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <WalletIcon class="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900 leading-tight">Kas Tunai Agen</p>
              <p class="text-[10px] text-slate-400 leading-none">Kas fisik BRILink · auto-tersedia</p>
            </div>
          </div>
          <!-- Riwayat button -->
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            @click="openKasMutasiModal"
          >
            <HistoryIcon class="w-3.5 h-3.5" /> Riwayat
          </button>
        </div>

        <!-- Card body -->
        <div class="px-4 py-4 flex items-center justify-between gap-4">
          <!-- Saldo display -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Saldo Kas</p>
            <div v-if="kasLoading" class="h-7 w-32 rounded-lg bg-slate-100 animate-pulse" />
            <p v-else class="text-2xl font-bold font-mono leading-tight"
              :class="kasIsLow ? 'text-red-600' : 'text-slate-900'">
              {{ formatRupiah(kasBox?.balance ?? 0) }}
            </p>
            <!-- Status badges -->
            <div class="flex items-center gap-2 mt-1">
              <span v-if="!kasLoading && !kasPernahDipakai"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                Belum ada kas masuk
              </span>
              <span v-else-if="kasIsLow"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                <AlertTriangleIcon class="w-3 h-3" /> Saldo menipis
              </span>
              <span v-else-if="!kasLoading"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                Normal
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="h-8 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
              @click="openKasModal('cashin')"
            >
              <ArrowDownCircleIcon class="w-4 h-4" /> Cash In
            </button>
            <button
              type="button"
              :disabled="!kasBox || kasBox.balance <= 0"
              class="h-8 px-3 rounded-md bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="openKasModal('cashout')"
            >
              <ArrowUpCircleIcon class="w-4 h-4" /> Cash Out
            </button>
          </div>
        </div>

        <!-- Recent mutations mini preview -->
        <template v-if="!kasLoading && kasBox?.recentMutations?.length">
          <div class="border-t border-slate-200 px-4 py-2 space-y-1">
            <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mutasi Terakhir</p>
            <div
              v-for="mut in kasBox.recentMutations.slice(0, 3)"
              :key="mut.id"
              class="flex items-center justify-between py-1"
            >
              <div class="flex items-center gap-2">
                <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded', kasMutTypeBadge(mut.type)]">
                  {{ kasMutTypeLabel(mut.type) }}
                </span>
                <span class="text-[10px] text-slate-500 truncate max-w-[160px]">{{ mut.description }}</span>
              </div>
              <span :class="['text-[10px] font-bold font-mono', kasMutIsCredit(mut.type) ? 'text-emerald-600' : 'text-red-600']">
                {{ kasMutIsCredit(mut.type) ? '+' : '−' }}{{ formatRupiah(mut.amount) }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Divider label -->
      <div class="flex items-center gap-3">
        <div class="flex-1 border-t border-slate-200" />
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rekening BRI</span>
        <div class="flex-1 border-t border-slate-200" />
      </div>

      <!-- Actions bar -->
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500">{{ accounts.length }} rekening aktif</p>
        <button type="button" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5" @click="openAccountModal(null)">
          <PlusIcon class="w-3.5 h-3.5" /> Tambah Rekening
        </button>
      </div>

      <!-- Loading -->
      <div v-if="accountsLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="accounts.length === 0" class="bg-white border border-dashed border-slate-200 rounded-lg p-10 text-center">
        <LandmarkIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700">Belum ada rekening BRI</p>
        <p class="text-xs text-slate-500 mt-1">Tambahkan rekening BRI agen untuk mulai tracking saldo.</p>
      </div>

      <template v-else>
        <!-- Saldo Rekening Strip (1 baris horizontal, sama style Kas Retail) -->
        <div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          <!-- Total Pill -->
          <div class="shrink-0 min-w-[160px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/80/60 rounded-lg px-5 py-3 shadow-sm">
            <p class="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Total BRILink</p>
            <p class="text-lg font-bold font-mono text-slate-900 whitespace-nowrap leading-tight">{{ formatRupiah(totalBrilinkBalance) }}</p>
          </div>
          <!-- Per-Rekening Pill -->
          <div v-for="account in accounts" :key="account.id"
            class="shrink-0 min-w-[180px] bg-white border border-slate-200/80/60 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow group">
            <!-- Header: label + edit/hapus -->
            <div class="flex items-start justify-between gap-1 mb-1">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">{{ account.label }}</p>
                  <span v-if="account.isDefault" class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Default" />
                </div>
                <p class="text-[9px] text-slate-400 font-mono leading-none mt-0.5">{{ account.accountNumber }}</p>
              </div>
              <!-- Edit & Hapus — muncul saat hover -->
              <div class="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button"
                  class="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                  title="Edit rekening"
                  @click="openAccountModal(account)">
                  <PencilIcon class="w-3 h-3" />
                </button>
                <button type="button"
                  class="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                  title="Hapus rekening"
                  @click="handleDeleteAccount(account)">
                  <Trash2Icon class="w-3 h-3" />
                </button>
              </div>
            </div>
            <!-- Saldo -->
            <p class="text-sm font-bold font-mono whitespace-nowrap leading-tight mb-2"
              :class="account.balance < account.lowBalanceThreshold ? 'text-red-500' : 'text-slate-900'">
              {{ formatRupiah(account.balance) }}
            </p>
            <!-- Action buttons -->
            <div class="flex items-center gap-1">
              <button type="button" class="flex-1 h-6 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold flex items-center justify-center hover:bg-emerald-100 transition-colors" @click="openMutationModal(account, 'setor')">+ Setor</button>
              <button type="button" class="flex-1 h-6 rounded-md bg-red-50 text-red-600 text-[9px] font-bold flex items-center justify-center hover:bg-red-100 transition-colors" @click="openMutationModal(account, 'tarik')">− Tarik</button>
              <button type="button" class="flex-1 h-6 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center justify-center hover:bg-blue-100 transition-colors" @click="openTransferModal(account)">⇄ Pindah</button>
            </div>
          </div>
        </div>

        <!-- Mutasi langsung di bawah strip (sama persis kayak Kas Retail) -->
        <div class="flex flex-col sm:flex-row gap-3">
          <select v-model="mutasiFilter.accountId" class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="resetMutasiAndFetch">
            <option value="">Semua Rekening</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.label }}</option>
          </select>
          <input v-model="mutasiFilter.startDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="resetMutasiAndFetch" />
          <input v-model="mutasiFilter.endDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @change="resetMutasiAndFetch" />
          <div class="flex-1"></div>
          <span v-if="mutasiMeta" class="text-xs text-slate-500 self-center">{{ mutasiMeta.total }} mutasi</span>
        </div>

        <!-- Loading mutasi -->
        <div v-if="mutasiLoading" class="flex items-center justify-center py-12">
          <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        </div>
        <!-- Empty mutasi -->
        <div v-else-if="mutasiData.length === 0" class="bg-white border border-dashed border-slate-200 rounded-lg p-8 text-center">
          <WalletIcon class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p class="text-xs text-slate-500">Belum ada mutasi.</p>
        </div>
        <!-- Mutasi Table -->
        <div v-else class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[700px]">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase">Tanggal</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase">Rekening</th>
                  <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase">Tipe</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase">Jumlah</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase">Saldo Setelah</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase">Catatan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="mut in mutasiData" :key="mut.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 text-xs text-slate-600 font-mono">{{ formatDateTime(mut.createdAt) }}</td>
                  <td class="px-4 py-3 text-xs text-slate-700">{{ mut.accountLabel }}</td>
                  <td class="px-4 py-3 text-center"><span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', mutationTypeBadge(mut.type)]">{{ mutationTypeLabel(mut.type) }}</span></td>
                  <td class="px-4 py-3 text-right"><span :class="['text-xs font-bold font-mono', mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? 'text-emerald-600' : 'text-red-600']">{{ mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}</span></td>
                  <td class="px-4 py-3 text-right text-xs font-mono text-slate-700">{{ formatRupiah(mut.balanceAfter) }}</td>
                  <td class="px-4 py-3 text-xs text-slate-600 truncate max-w-[150px]">{{ mut.description || mut.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="mutasiMeta && mutasiMeta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p class="text-xs text-slate-500">Hal. {{ mutasiMeta.page }} / {{ mutasiMeta.totalPages }}</p>
            <div class="flex gap-1">
              <button :disabled="mutasiMeta.page <= 1" class="h-7 px-2 text-xs border border-slate-200 rounded disabled:opacity-40 text-slate-700" @click="fetchMutasi(mutasiMeta!.page - 1)">Prev</button>
              <button :disabled="mutasiMeta.page >= mutasiMeta.totalPages" class="h-7 px-2 text-xs border border-slate-200 rounded disabled:opacity-40 text-slate-700" @click="fetchMutasi(mutasiMeta!.page + 1)">Next</button>
            </div>
          </div>
        </div>
      </template>
    </template>





    <!-- ============================================ -->
    <!-- TAB: Riwayat Transaksi BRILink              -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'riwayat'">
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <select
          v-model="riwayatFilter.category"
          class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
          @change="fetchRiwayat(1)"
        >
          <option value="">Semua Kategori</option>
          <option value="TRANSFER_BRI">Transfer BRI</option>
          <option value="TRANSFER_OTHER">Transfer Bank Lain</option>
          <option value="TARIK_TUNAI">Tarik Tunai</option>
          <option value="TOPUP_PULSA">Pulsa</option>
          <option value="TOPUP_DATA">Paket Data</option>
          <option value="TOPUP_EWALLET">E-Wallet</option>
          <option value="TOPUP_PLN">Token PLN</option>
        </select>
        <select
          v-model="riwayatFilter.status"
          class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
          @change="fetchRiwayat(1)"
        >
          <option value="">Semua Status</option>
          <option value="SUCCESS">Sukses</option>
          <option value="VOIDED">Void</option>
          <option value="FAILED">Gagal</option>
        </select>
        <input
          v-model="riwayatFilter.startDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
          @change="fetchRiwayat(1)"
        />
        <input
          v-model="riwayatFilter.endDate"
          type="date"
          class="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
          @change="fetchRiwayat(1)"
        />
        <div class="flex-1"></div>
        <span v-if="riwayatMeta" class="text-xs text-slate-500 self-center">{{ riwayatMeta.total }} transaksi</span>
      </div>

      <!-- Loading -->
      <div v-if="riwayatLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
        <span class="ml-2 text-sm text-slate-500">Memuat riwayat...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="riwayatData.length === 0" class="bg-white border border-dashed border-slate-200 rounded-lg p-10 text-center">
        <WalletIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700">Belum ada transaksi BRILink</p>
        <p class="text-xs text-slate-500 mt-1">Transaksi dari webapp kasir akan muncul di sini.</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Waktu</th>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Ref</th>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Kategori</th>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Customer</th>
                <th class="px-3 py-2.5 text-right text-[10px] font-bold text-slate-600 uppercase">Nominal</th>
                <th class="px-3 py-2.5 text-right text-[10px] font-bold text-slate-600 uppercase">Fee</th>
                <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 uppercase">Flow</th>
                <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 uppercase">Status</th>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Rekening</th>
                <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 uppercase">Admin</th>
                <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 uppercase">Kasir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="trx in riwayatData" :key="trx.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-3 py-2.5 text-xs text-slate-600 font-mono whitespace-nowrap">{{ formatDateTime(trx.createdAt) }}</td>
                <td class="px-3 py-2.5"><code class="text-[10px] font-mono text-slate-900">{{ trx.refNumber }}</code></td>
                <td class="px-3 py-2.5">
                  <span :class="['inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', riwayatCategoryBadge(trx.category)]">
                    {{ riwayatCategoryShort(trx.category) }}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <p class="text-xs text-slate-900 truncate max-w-[140px]">{{ trx.customerName }}</p>
                  <p class="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{{ trx.destination }}</p>
                </td>
                <td class="px-3 py-2.5 text-right text-xs font-mono font-semibold text-slate-900">{{ formatRupiah(trx.amount) }}</td>
                <td class="px-3 py-2.5 text-right text-xs font-mono text-emerald-600">{{ trx.fee > 0 ? '+' + formatRupiah(trx.fee) : '—' }}</td>
                <td class="px-3 py-2.5 text-center">
                  <span v-if="trx.flowDirection" :class="['text-[9px] font-bold px-1.5 py-0.5 rounded', trx.flowDirection === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700']">
                    {{ trx.flowDirection === 'CREDIT' ? '↑ KREDIT' : '↓ DEBIT' }}
                  </span>
                  <span v-else class="text-[9px] text-slate-400">—</span>
                </td>
                <td class="px-3 py-2.5 text-center">
                  <span :class="['inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase', riwayatStatusBadge(trx.status)]">
                    {{ riwayatStatusLabel(trx.status) }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600">
                  <span v-if="trx.accountLabel" class="font-medium text-slate-900">{{ trx.accountLabel }}</span>
                  <span v-if="trx.accountNumber" class="text-[10px] font-mono text-slate-400 ml-1">({{ trx.accountNumber.slice(-4) }})</span>
                  <span v-if="!trx.accountLabel" class="text-slate-400">—</span>
                </td>
                <td class="px-3 py-2.5 text-center">
                  <span v-if="trx.feeMethod" :class="['text-[9px] font-bold px-1.5 py-0.5 rounded', feeMethodBadge(trx.feeMethod)]">
                    {{ trx.feeMethod }}
                  </span>
                  <span v-else class="text-[9px] text-slate-400">—</span>
                </td>
                <td class="px-3 py-2.5 text-xs text-slate-600">{{ trx.cashierName || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="riwayatMeta && riwayatMeta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <p class="text-xs text-slate-500">Halaman {{ riwayatMeta.page }} dari {{ riwayatMeta.totalPages }}</p>
          <div class="flex items-center gap-1">
            <button :disabled="riwayatMeta.page <= 1" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 text-slate-700" @click="fetchRiwayat(riwayatMeta!.page - 1)">Prev</button>
            <button :disabled="riwayatMeta.page >= riwayatMeta.totalPages" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 text-slate-700" @click="fetchRiwayat(riwayatMeta!.page + 1)">Next</button>
          </div>
        </div>
      </div>
    </template>


    <!-- ============================================ -->
    <!-- MODAL: Create/Edit Account                   -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showAccountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAccountModal = false" />
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleSaveAccount"
        >
          <h3 class="text-sm font-bold text-slate-900">
            {{ editingAccount ? 'Edit Rekening' : 'Tambah Rekening Baru' }}
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Label <span class="text-red-500">*</span></label>
            <input v-model="accountForm.label" type="text" required placeholder="BRI Default"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">No. Rekening <span class="text-red-500">*</span></label>
            <input v-model="accountForm.accountNumber" type="text" required placeholder="1234567890"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Pemilik</label>
            <input v-model="accountForm.accountHolder" type="text" placeholder="Nama pemilik rekening"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                {{ editingAccount ? 'Koreksi Saldo' : 'Saldo Awal' }}
              </label>
              <input v-model.number="accountForm.balance" type="number" min="0" placeholder="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
              <!-- Hint saat mode edit -->
              <p v-if="editingAccount && accountForm.balance !== editingAccount.balance" class="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                <span>⟳</span> Akan dicatat sebagai Adjustment
              </p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Threshold Low Balance</label>
              <input v-model.number="accountForm.lowBalanceThreshold" type="number" min="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="accountForm.isDefault" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500" />
              <span class="text-xs font-semibold text-slate-700">Default</span>
            </label>
          </div>


          <div v-if="accountModalError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ accountModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showAccountModal = false">Batal</button>
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
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showMutationModal = false" />
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleMutationSubmit"
        >
          <h3 class="text-sm font-bold text-slate-900">
            {{ mutationType === 'setor' ? 'Setor Saldo' : 'Tarik Saldo' }} — {{ mutationAccount?.label }}
          </h3>
          <p class="text-xs text-slate-500">
            Saldo saat ini: <span class="font-mono font-bold">{{ formatRupiah(mutationAccount?.balance ?? 0) }}</span>
          </p>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="mutationForm.amount" type="number" min="1" required
              class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Referensi</label>
            <input v-model="mutationForm.reference" type="text" placeholder="No. setoran / keterangan"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input v-model="mutationForm.notes" type="text" placeholder="Opsional"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>


          <div v-if="mutationModalError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ mutationModalError }}
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showMutationModal = false">Batal</button>
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
    <!-- MODAL: Pindah Saldo Antar Rekening           -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTransferModal = false" />
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleTransferSubmit"
        >
          <h3 class="text-sm font-bold text-slate-900">Pindah Saldo Antar Rekening</h3>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-[10px] font-semibold text-blue-700">Dari:</p>
            <p class="text-xs font-bold text-blue-900">{{ transferFrom?.label }}</p>
            <p class="text-[10px] text-blue-600 font-mono">Saldo: {{ formatRupiah(transferFrom?.balance ?? 0) }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Rekening Tujuan *</label>
            <select
              v-model="transferToId"
              required
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 outline-none"
            >
              <option value="">— Pilih Rekening Tujuan —</option>
              <option
                v-for="acc in accounts.filter(a => a.id !== transferFrom?.id && a.isActive)"
                :key="acc.id"
                :value="acc.id"
              >
                {{ acc.label }} ({{ acc.accountNumber }}) — {{ formatRupiah(acc.balance) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Rp) *</label>
            <input
              v-model.number="transferAmount"
              type="number"
              min="1"
              :max="transferFrom?.balance ?? 0"
              required
              class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input
              v-model="transferNotes"
              type="text"
              placeholder="Opsional"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:border-blue-600 outline-none"
            />
          </div>

          <div v-if="transferError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ transferError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showTransferModal = false">Batal</button>
            <button type="submit" :disabled="savingTransfer || !transferToId || transferAmount <= 0" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="savingTransfer" class="w-3.5 h-3.5 animate-spin" />
              Pindah Saldo
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
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showHistoryModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900">Riwayat Mutasi — {{ historyAccount?.label }}</h3>
            <button type="button" class="text-slate-400 hover:text-slate-600" @click="showHistoryModal = false">✕</button>
          </div>


          <div v-if="historyLoading" class="flex items-center justify-center py-8">
            <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          </div>
          <div v-else-if="historyData.length === 0" class="text-center py-8">
            <p class="text-xs text-slate-500">Belum ada mutasi.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="mut in historyData"
              :key="mut.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
            >
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', mutationTypeStyle(mut.type)]">
                {{ mutationTypeIcon(mut.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-900 truncate">{{ mut.description }}</p>
                <p class="text-[10px] text-slate-500">
                  {{ formatDateTime(mut.createdAt) }}
                  <span v-if="mut.createdBy"> &bull; {{ mut.createdBy.username || mut.createdBy.email }}</span>
                </p>
              </div>
              <div class="text-right shrink-0">
                <p :class="['text-xs font-bold font-mono', mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? 'text-emerald-600' : 'text-red-600']">
                  {{ mut.type === 'SETOR' || mut.type === 'TRX_CREDIT' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}
                </p>
                <p class="text-[10px] text-slate-400 font-mono">
                  Saldo: {{ formatRupiah(mut.balanceAfter) }}
                </p>
              </div>
            </div>
          </div>


          <!-- Pagination -->
          <div v-if="historyMeta && historyMeta.totalPages > 1" class="flex items-center justify-between pt-2">
            <p class="text-[10px] text-slate-500">Hal. {{ historyMeta.page }} / {{ historyMeta.totalPages }}</p>
            <div class="flex gap-1">
              <button :disabled="historyMeta.page <= 1" class="h-7 px-2 text-xs border border-slate-200 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page - 1)">Prev</button>
              <button :disabled="historyMeta.page >= historyMeta.totalPages" class="h-7 px-2 text-xs border border-slate-200 rounded disabled:opacity-40" @click="fetchHistory(historyMeta!.page + 1)">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Kas Tunai — Cash In / Cash Out         -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showKasModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showKasModal = false" />
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4"
          @submit.prevent="handleKasSubmit"
        >
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', kasModalType === 'cashin' ? 'bg-emerald-50' : 'bg-red-50']">
              <ArrowDownCircleIcon v-if="kasModalType === 'cashin'" class="w-5 h-5 text-emerald-600" />
              <ArrowUpCircleIcon v-else class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                {{ kasModalType === 'cashin' ? 'Cash In — Tambah Kas' : 'Cash Out — Ambil Kas' }}
              </h3>
              <p class="text-[11px] text-slate-500">
                Saldo saat ini: <span class="font-mono font-semibold">{{ formatRupiah(kasBox?.balance ?? 0) }}</span>
              </p>
            </div>
          </div>

          <!-- Amount input -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Jumlah (Rp) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="kasForm.amount"
              type="number"
              min="1"
              required
              placeholder="0"
              class="w-full h-11 px-4 text-base font-mono font-bold text-center border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <!-- Quick chips -->
            <div class="grid grid-cols-4 gap-1.5 mt-2">
              <button
                v-for="n in [100000, 500000, 1000000, 5000000]"
                :key="n"
                type="button"
                class="h-7 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                @click="kasForm.amount += n"
              >+{{ n >= 1000000 ? (n / 1000000) + 'Jt' : (n / 1000) + 'K' }}</button>
            </div>
            <button type="button" class="text-[10px] text-slate-400 mt-0.5 hover:text-slate-600" @click="kasForm.amount = 0">Reset</button>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan <span class="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              v-model="kasForm.notes"
              type="text"
              placeholder="Keterangan kas masuk / keluar..."
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-blue-600 outline-none"
            />
          </div>

          <!-- Error -->
          <div v-if="kasModalError" class="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {{ kasModalError }}
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button type="button" class="flex-1 h-10 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50" @click="showKasModal = false">
              Batal
            </button>
            <button
              type="submit"
              :disabled="kasModalSaving || kasForm.amount <= 0"
              :class="[
                'flex-1 h-10 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-colors',
                kasModalType === 'cashin' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600',
              ]"
            >
              <Loader2Icon v-if="kasModalSaving" class="w-4 h-4 animate-spin" />
              <ArrowDownCircleIcon v-else-if="kasModalType === 'cashin'" class="w-4 h-4" />
              <ArrowUpCircleIcon v-else class="w-4 h-4" />
              {{ kasModalSaving ? 'Memproses...' : kasModalType === 'cashin' ? 'Cash In' : 'Cash Out' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Riwayat Mutasi Kas Tunai Agen          -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showKasMutasiModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showKasMutasiModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <WalletIcon class="w-4 h-4 text-emerald-600" />
              <h3 class="text-sm font-bold text-slate-900">Riwayat Mutasi — Kas Tunai Agen</h3>
            </div>
            <button type="button" class="text-slate-400 hover:text-slate-600 p-1" @click="showKasMutasiModal = false">✕</button>
          </div>

          <!-- Loading -->
          <div v-if="kasMutasiLoading" class="flex items-center justify-center py-10">
            <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          </div>

          <!-- Empty -->
          <div v-else-if="kasMutasiData.length === 0" class="text-center py-10">
            <WalletIcon class="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p class="text-xs text-slate-400">Belum ada mutasi kas tunai.</p>
          </div>

          <!-- List -->
          <div v-else class="space-y-2">
            <div
              v-for="mut in kasMutasiData"
              :key="mut.id"
              class="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span :class="['text-[9px] font-bold px-2 py-0.5 rounded shrink-0', kasMutTypeBadge(mut.type)]">
                  {{ kasMutTypeLabel(mut.type) }}
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-slate-700 truncate">{{ mut.description }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ formatDateTime(mut.createdAt) }}</p>
                </div>
              </div>
              <div class="text-right shrink-0 ml-3">
                <p :class="['text-sm font-bold font-mono', kasMutIsCredit(mut.type) ? 'text-emerald-600' : 'text-red-600']">
                  {{ kasMutIsCredit(mut.type) ? '+' : '−' }}{{ formatRupiah(mut.amount) }}
                </p>
                <p class="text-[10px] text-slate-400 font-mono">{{ formatRupiah(mut.balanceAfter) }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="kasMutasiMeta && kasMutasiMeta.totalPages > 1" class="flex items-center justify-between pt-2 border-t border-slate-200">
            <p class="text-[10px] text-slate-500">Hal. {{ kasMutasiPage }} / {{ kasMutasiMeta.totalPages }}</p>
            <div class="flex gap-1">
              <button :disabled="kasMutasiPage <= 1" class="h-7 px-2.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 text-slate-600 hover:bg-slate-50" @click="fetchKasMutasi(kasMutasiPage - 1)">Prev</button>
              <button :disabled="kasMutasiPage >= kasMutasiMeta.totalPages" class="h-7 px-2.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 text-slate-600 hover:bg-slate-50" @click="fetchKasMutasi(kasMutasiPage + 1)">Next</button>
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
import { useRealtimeRefresh } from '@/shared/composables/useRealtimeRefresh';
import {
  Loader2 as Loader2Icon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Landmark as LandmarkIcon,
  Wallet as WalletIcon,
  Boxes as BoxesIcon,
  ArrowDownCircle as ArrowDownCircleIcon,
  ArrowUpCircle as ArrowUpCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  History as HistoryIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useConfirm } from '@/shared/composables/useConfirm';
import brilinkCashboxService, {
  type BrilinkCashBox,
  type BrilinkCashMutation,
} from '@/shared/services/brilink-cashbox.service';
import brilinkAccountService, {
  type BrilinkAccount,
  type BrilinkMutationItem,
  type MutationsResponse,
} from '@/shared/services/brilink-account.service';
import brilinkService, {
  type BrilinkTransactionDto,
  type BrilinkListResponse,
  BRILINK_CATEGORY_LABELS,
  type BrilinkCategory,
} from '@/shared/services/brilink.service';
import settingsService from '@/shared/services/settings.service';


const authStore = useAuthStore();
const shopStore = useShopStore();
const { ask } = useConfirm();

// Tabs
type TabKey = 'rekening' | 'riwayat';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'rekening', label: 'Rekening BRI' },
  { key: 'riwayat', label: 'Riwayat Transaksi' },
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
  return shopStore.currentShopId || authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
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
      return 'bg-emerald-100 text-emerald-700';
    case 'TARIK':
    case 'TRX_DEBIT':
      return 'bg-red-100 text-red-700';
    case 'ADJUSTMENT':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}


// ============================================
// Computed
// ============================================
const totalBrilinkBalance = computed(() => accounts.value.reduce((sum, acc) => sum + acc.balance, 0));

// ============================================
// Accounts Methods
// ============================================
async function fetchAccounts() {
  const shopId = getShopId();
  if (!shopId) return;
  // Only show loading on first load (prevent flicker on refresh)
  if (accounts.value.length === 0) accountsLoading.value = true;
  try {
    accounts.value = await brilinkAccountService.list(shopId);
  } catch {
    // Keep existing data on error (don't blank out)
    if (accounts.value.length === 0) accounts.value = [];
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
        balance: accountForm.balance,
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
  const confirmed = await ask({ title: 'Hapus Rekening?', message: `Hapus rekening "${account.label}"?`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!confirmed) return;
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

// ============================================
// KAS TUNAI AGEN (BrilinkCashBox)
// ============================================
const kasBox = ref<BrilinkCashBox | null>(null);
const kasLoading = ref(true);

// Kas modal state
const showKasModal = ref(false);
const kasModalType = ref<'cashin' | 'cashout'>('cashin');
const kasModalSaving = ref(false);
const kasModalError = ref<string | null>(null);
const kasForm = reactive({ amount: 0, notes: '' });

// Kas mutations history
const showKasMutasiModal = ref(false);
const kasMutasiData = ref<BrilinkCashMutation[]>([]);
const kasMutasiLoading = ref(false);
const kasMutasiPage = ref(1);
const kasMutasiMeta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

const kasPernahDipakai = computed(() =>
  kasBox.value ? (kasBox.value.balance > 0 || (kasBox.value.recentMutations?.length ?? 0) > 0) : false,
);
const kasIsLow = computed(() =>
  kasPernahDipakai.value && (kasBox.value?.isLowBalance ?? false),
);

async function fetchKasBox() {
  const shopId = getShopId();
  if (!shopId) { kasLoading.value = false; return; }
  try {
    kasBox.value = await brilinkCashboxService.getCashBox(shopId);
  } catch { /* keep null */ }
  finally { kasLoading.value = false; }
}

function openKasModal(type: 'cashin' | 'cashout') {
  kasModalType.value = type;
  kasForm.amount = 0;
  kasForm.notes = '';
  kasModalError.value = null;
  showKasModal.value = true;
}

async function handleKasSubmit() {
  const shopId = getShopId();
  if (!shopId || kasForm.amount <= 0) return;
  kasModalSaving.value = true;
  kasModalError.value = null;
  try {
    const payload = { amount: kasForm.amount, notes: kasForm.notes || undefined };
    if (kasModalType.value === 'cashin') {
      await brilinkCashboxService.setor(shopId, payload);
    } else {
      await brilinkCashboxService.tarik(shopId, payload);
    }
    showKasModal.value = false;
    await fetchKasBox();
  } catch (err: any) {
    kasModalError.value = err?.response?.data?.message ?? 'Terjadi kesalahan.';
  } finally {
    kasModalSaving.value = false;
  }
}

async function openKasMutasiModal() {
  showKasMutasiModal.value = true;
  await fetchKasMutasi(1);
}

async function fetchKasMutasi(page = 1) {
  const shopId = getShopId();
  if (!shopId) return;
  kasMutasiLoading.value = true;
  try {
    const res = await brilinkCashboxService.getMutations({ shopId, page, limit: 15 });
    kasMutasiData.value = res.data;
    kasMutasiMeta.value = res.meta;
    kasMutasiPage.value = page;
  } catch { kasMutasiData.value = []; }
  finally { kasMutasiLoading.value = false; }
}

function kasMutTypeBadge(type: string): string {
  switch (type) {
    case 'SETOR': return 'bg-emerald-100 text-emerald-700';
    case 'TARIK': return 'bg-red-100 text-red-700';
    case 'TRX_IN': return 'bg-blue-100 text-blue-700';
    case 'TRX_OUT': return 'bg-orange-100 text-orange-700';
    case 'ADJUSTMENT': return 'bg-amber-100 text-amber-700';
    case 'VOID_REVERSE': return 'bg-purple-100 text-purple-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function kasMutTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SETOR: 'Cash In', TARIK: 'Cash Out',
    TRX_IN: 'Trx Masuk', TRX_OUT: 'Trx Keluar',
    ADJUSTMENT: 'Adjustment', VOID_REVERSE: 'Void',
  };
  return map[type] ?? type;
}

function kasMutIsCredit(type: string): boolean {
  return ['SETOR', 'TRX_IN', 'VOID_REVERSE'].includes(type);
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
    case 'SETOR': return 'bg-emerald-100 text-emerald-700';
    case 'TARIK': return 'bg-red-100 text-red-700';
    case 'TRX_DEBIT': return 'bg-orange-100 text-orange-700';
    case 'TRX_CREDIT': return 'bg-blue-100 text-blue-700';
    case 'ADJUSTMENT': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
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
  if (mutasiData.value.length === 0) mutasiLoading.value = true;
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
    if (mutasiData.value.length === 0) mutasiData.value = [];
  } finally {
    mutasiLoading.value = false;
  }
}

function resetMutasiAndFetch() {
  fetchMutasi(1);
}

// ============================================
// TRANSFER INTERNAL (Pindah Saldo)
// ============================================
const showTransferModal = ref(false);
const transferFrom = ref<BrilinkAccount | null>(null);
const transferToId = ref('');
const transferAmount = ref(0);
const transferNotes = ref('');
const savingTransfer = ref(false);
const transferError = ref<string | null>(null);

function openTransferModal(account: BrilinkAccount) {
  transferFrom.value = account;
  transferToId.value = '';
  transferAmount.value = 0;
  transferNotes.value = '';
  transferError.value = null;
  showTransferModal.value = true;
}

async function handleTransferSubmit() {
  if (!transferFrom.value || !transferToId.value || transferAmount.value <= 0) return;
  savingTransfer.value = true;
  transferError.value = null;
  try {
    await brilinkAccountService.transferInternal({
      fromAccountId: transferFrom.value.id,
      toAccountId: transferToId.value,
      amount: transferAmount.value,
      notes: transferNotes.value || undefined,
    });
    showTransferModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    transferError.value = err?.response?.data?.message || 'Gagal pindah saldo.';
  } finally {
    savingTransfer.value = false;
  }
}

// ============================================
// RIWAYAT TRANSAKSI TAB STATE
// ============================================
const riwayatData = ref<BrilinkTransactionDto[]>([]);
const riwayatMeta = ref<BrilinkListResponse['meta'] | null>(null);
const riwayatLoading = ref(false);
const riwayatFilter = reactive({
  category: '',
  status: '',
  startDate: '',
  endDate: '',
});

function riwayatCategoryBadge(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'bg-blue-100 text-blue-700',
    TRANSFER_OTHER: 'bg-indigo-100 text-indigo-700',
    TARIK_TUNAI: 'bg-amber-100 text-amber-700',
    TOPUP_PULSA: 'bg-pink-100 text-pink-700',
    TOPUP_DATA: 'bg-purple-100 text-purple-700',
    TOPUP_EWALLET: 'bg-cyan-100 text-cyan-700',
    TOPUP_PLN: 'bg-yellow-100 text-yellow-700',
  };
  return map[cat] || 'bg-slate-100 text-slate-700';
}

function riwayatCategoryShort(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'TF BRI', TRANSFER_OTHER: 'TF Lain', TARIK_TUNAI: 'Tarik',
    TOPUP_PULSA: 'Pulsa', TOPUP_DATA: 'Data', TOPUP_EWALLET: 'E-Wallet', TOPUP_PLN: 'PLN',
  };
  return map[cat] || cat;
}

function riwayatStatusBadge(s: string): string {
  switch (s) {
    case 'SUCCESS': return 'bg-emerald-100 text-emerald-700';
    case 'FAILED': return 'bg-red-100 text-red-700';
    case 'VOIDED': return 'bg-slate-200 text-slate-600';
    default: return 'bg-amber-100 text-amber-700';
  }
}

function riwayatStatusLabel(s: string): string {
  const map: Record<string, string> = { SUCCESS: 'Sukses', FAILED: 'Gagal', VOIDED: 'Void', PENDING: 'Pending' };
  return map[s] || s;
}

function feeMethodBadge(method: string): string {
  switch (method) {
    case 'DALAM': return 'bg-blue-100 text-blue-700';
    case 'LUAR': return 'bg-emerald-100 text-emerald-700';
    case 'POTONG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

async function fetchRiwayat(page = 1) {
  const shopId = getShopId();
  if (!shopId) return;
  riwayatLoading.value = true;
  try {
    const res = await brilinkService.listTransactions({
      shopId,
      category: (riwayatFilter.category as BrilinkCategory) || undefined,
      status: (riwayatFilter.status as any) || undefined,
      startDate: riwayatFilter.startDate || undefined,
      endDate: riwayatFilter.endDate || undefined,
      page,
      limit: 20,
    });
    riwayatData.value = res.data;
    riwayatMeta.value = res.meta;
  } catch {
    riwayatData.value = [];
    riwayatMeta.value = null;
  } finally {
    riwayatLoading.value = false;
  }
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
  if (tab === 'riwayat' && riwayatData.value.length === 0) {
    fetchRiwayat(1);
  }
  if (tab === 'metode' && Object.keys(metodeConfig).length === 0) {
    fetchMetodeConfig();
  }
});

onMounted(() => {
  fetchAccounts();
  fetchMutasi(1);
  fetchKasBox();
});

useAutoRefresh(() => { fetchAccounts(); fetchMutasi(1); fetchKasBox(); });

// Auto-refresh saat ada real-time event (data tetap tampil walau offline)
useRealtimeRefresh(() => { fetchAccounts(); fetchMutasi(1); fetchKasBox(); });
</script>
