<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div></div>
      <button
        type="button"
        class="h-9 px-4 bg-[#03a29c] text-white text-xs font-semibold rounded-lg
               hover:bg-[#028a85] transition-colors flex items-center gap-1.5 shrink-0"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Catat Hutang
      </button>
    </div>


    <!-- Summary cards (5 KPI) -->
    <div v-if="summary" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-3 shadow-sm">
        <p class="text-[10px] text-slate-500 dark:text-[#869392]">Piutang Aktif</p>
        <p class="text-base font-bold font-mono tabular-nums text-slate-950 dark:text-[#e3e2e2] mt-0.5">{{ formatRupiah(summary.totalOutstanding) }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-3 shadow-sm">
        <p class="text-[10px] text-slate-500 dark:text-[#869392]">Sudah Dibayar</p>
        <p class="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{{ formatRupiah(summary.totalPaid ?? 0) }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-3 shadow-sm">
        <p class="text-[10px] text-slate-500 dark:text-[#869392]">Pelanggan</p>
        <p class="text-base font-bold font-mono tabular-nums text-slate-950 dark:text-[#e3e2e2] mt-0.5">{{ summary.totalDebtors }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-3 shadow-sm">
        <p class="text-[10px] text-slate-500 dark:text-[#869392]">Overdue</p>
        <p class="text-base font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-0.5">{{ summary.overdue }}</p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-3 shadow-sm">
        <p class="text-[10px] text-slate-500 dark:text-[#869392]">Rata-rata Umur</p>
        <p class="text-base font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{{ summary.avgAgeDays ?? 0 }} hari</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#869392]" />
        <input v-model="searchCustomer" type="text" placeholder="Cari nama pelanggan..."
          class="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none"
          @input="debouncedSearch" />
      </div>
      <select v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none"
        @change="resetAndFetch">
        <option value="">Semua Status</option>
        <option value="PENDING">Pending</option>
        <option value="PARTIALLY_PAID">Sebagian</option>
        <option value="PAID">Lunas</option>
        <option value="OVERDUE">Overdue</option>
      </select>
      <select v-model="filterSort"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none"
        @change="resetAndFetch">
        <option value="newest">Terbaru</option>
        <option value="due_date">Jatuh Tempo Terdekat</option>
        <option value="remaining_desc">Sisa Terbesar</option>
      </select>
    </div>


    <!-- Loading / Error / Empty -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-[#03a29c]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-[#bcc9c7]">Memuat data hutang...</span>
    </div>
    <div v-else-if="error" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 shadow-sm flex items-start gap-2">
      <AlertCircleIcon class="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-bold text-red-800 dark:text-red-200">Error</p>
        <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
    </div>
    <div v-else-if="debts.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-300 dark:border-[#3d4948] rounded-xl p-10 text-center">
      <HandCoinsIcon class="w-12 h-12 text-slate-300 dark:text-[#3d4948] mx-auto mb-3" />
      <p class="text-sm font-bold text-slate-700 dark:text-[#bcc9c7]">Belum ada data hutang</p>
      <p class="text-xs text-slate-500 dark:text-[#869392] mt-1">Catat hutang pelanggan pertama lewat tombol di atas.</p>
    </div>

    <!-- Debt table -->
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px]">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Pelanggan</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Produk</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Progress</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Umur</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Jatuh Tempo</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-[#3d4948]">
            <tr v-for="debt in debts" :key="debt.id" class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900 dark:text-[#e3e2e2]">{{ debt.customerName }}</p>
                <p v-if="debt.customerPhone" class="text-[10px] text-slate-500 dark:text-[#869392]">{{ debt.customerPhone }}</p>
              </td>
              <td class="px-4 py-3">
                <template v-if="debt.transaction">
                  <p class="text-xs text-slate-700 dark:text-[#bcc9c7]">Transaksi #{{ debt.transaction.transactionNumber }}</p>
                  <p class="text-[10px] text-slate-500 dark:text-[#869392]">{{ debt.transaction.items?.length || 0 }} item</p>
                </template>
                <template v-else-if="debt.manualItems && debt.manualItems.length > 0">
                  <p class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ debt.manualItems.map(i => i.name).join(', ') }}</p>
                  <p class="text-[10px] text-slate-500 dark:text-[#869392]">{{ debt.manualItems.length }} item</p>
                </template>
                <template v-else-if="debt.product">
                  <p class="text-xs text-slate-700 dark:text-[#bcc9c7]">{{ debt.product.name }}</p>
                  <p class="text-[10px] text-slate-500 dark:text-[#869392]">{{ debt.quantity }} × {{ formatRupiah(debt.unitPrice) }}</p>
                </template>
                <template v-else>
                  <p class="text-xs text-slate-400 dark:text-[#869392]">—</p>
                </template>
              </td>
              <td class="px-4 py-3">
                <div class="w-full max-w-[120px] ml-auto">
                  <div class="flex items-center justify-between text-[10px] mb-1">
                    <span class="font-mono tabular-nums text-slate-600 dark:text-[#bcc9c7]">{{ formatRupiah(debt.paidAmount) }}</span>
                    <span class="font-mono tabular-nums text-slate-900 dark:text-[#e3e2e2] font-bold">{{ formatRupiah(debt.totalAmount) }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-slate-200 dark:bg-[#3d4948] overflow-hidden">
                    <div class="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
                      :style="{ width: Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) + '%' }" />
                  </div>
                  <p class="text-[10px] font-mono tabular-nums mt-0.5 text-right" :class="debt.totalAmount - debt.paidAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                    Sisa: {{ formatRupiah(debt.totalAmount - debt.paidAmount) }}
                  </p>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-xs font-mono tabular-nums" :class="getAgeDays(debt.createdAt) > 30 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-[#bcc9c7]'">
                  {{ getAgeDays(debt.createdAt) }}h
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="debt.dueDate" :class="['text-xs font-mono tabular-nums', isOverdue(debt.dueDate) ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-[#bcc9c7]']">
                  {{ formatDate(debt.dueDate) }}
                </span>
                <span v-else class="text-xs text-slate-400 dark:text-[#869392]">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', debtStatusBadge(debt.status)]">
                  {{ debtStatusLabel(debt.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button class="w-7 h-7 rounded-md border border-slate-200 dark:border-[#3d4948] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#292a2a]" title="Detail" @click="openDetailModal(debt)">
                    <EyeIcon class="w-3.5 h-3.5 text-slate-600 dark:text-[#bcc9c7]" />
                  </button>
                  <button
                    v-if="debt.status !== 'PAID' && debt.status !== 'CANCELLED'"
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-[#3d4948] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#292a2a]"
                    title="Edit (jatuh tempo, catatan)"
                    @click="openEditModal(debt)"
                  >
                    <PencilIcon class="w-3.5 h-3.5 text-slate-600 dark:text-[#bcc9c7]" />
                  </button>
                  <a
                    v-if="debt.customerPhone && debt.status !== 'PAID'"
                    :href="getWaReminderLink(debt)"
                    target="_blank"
                    class="w-7 h-7 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    title="WA Reminder"
                  >
                    <MessageCircleIcon class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </a>
                  <button v-if="debt.status !== 'PAID' && debt.status !== 'CANCELLED'"
                    class="h-7 px-2 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    @click="openPayModal(debt)">Bayar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 dark:border-[#3d4948] flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-[#bcc9c7]">Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
        <div class="flex items-center gap-1">
          <button :disabled="meta.page <= 1" class="h-7 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-md hover:bg-slate-50 dark:hover:bg-[#292a2a] disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7]" @click="goPage(meta!.page - 1)">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" class="h-7 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-md hover:bg-slate-50 dark:hover:bg-[#292a2a] disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7]" @click="goPage(meta!.page + 1)">Next</button>
        </div>
      </div>
    </div>


    <!-- Detail Modal with Payment History -->
    <Teleport to="body">
      <div v-if="showDetailModal && detailDebt" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showDetailModal = false"></div>
        <div class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-start justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2]">Detail Hutang</h3>
            <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', debtStatusBadge(detailDebt.status)]">{{ debtStatusLabel(detailDebt.status) }}</span>
          </div>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div><p class="text-slate-500 dark:text-[#869392]">Pelanggan</p><p class="font-semibold text-slate-900 dark:text-[#e3e2e2]">{{ detailDebt.customerName }}</p></div>
            <div><p class="text-slate-500 dark:text-[#869392]">Item</p><p class="font-semibold text-slate-900 dark:text-[#e3e2e2]">{{ getDebtItemLabel(detailDebt) }}</p></div>
            <div><p class="text-slate-500 dark:text-[#869392]">Total</p><p class="font-semibold text-slate-900 dark:text-[#e3e2e2] font-mono tabular-nums">{{ formatRupiah(detailDebt.totalAmount) }}</p></div>
            <div><p class="text-slate-500 dark:text-[#869392]">Sisa</p><p class="font-semibold font-mono tabular-nums" :class="detailDebt.totalAmount - detailDebt.paidAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ formatRupiah(detailDebt.totalAmount - detailDebt.paidAmount) }}</p></div>
          </div>
          <!-- Progress -->
          <div>
            <div class="h-2 rounded-full bg-slate-200 dark:bg-[#3d4948] overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: Math.min(100, (detailDebt.paidAmount / detailDebt.totalAmount) * 100) + '%' }" />
            </div>
            <p class="text-[10px] text-slate-500 dark:text-[#869392] mt-1">{{ Math.round((detailDebt.paidAmount / detailDebt.totalAmount) * 100) }}% terbayar</p>
          </div>
          <!-- Payment history -->
          <div>
            <p class="text-[11px] font-bold text-slate-600 dark:text-[#bcc9c7] uppercase tracking-wide mb-2">Riwayat Cicilan ({{ detailDebt.debtPayments?.length || 0 }})</p>
            <div v-if="!detailDebt.debtPayments?.length" class="text-center py-4">
              <p class="text-xs text-slate-400 dark:text-[#869392]">Belum ada pembayaran.</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="(p, idx) in detailDebt.debtPayments" :key="p.id" class="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-[#3d4948]">
                <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{{ idx + 1 }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-800 dark:text-[#e3e2e2]">{{ formatRupiah(p.amount) }} <span class="text-[10px] font-normal text-slate-500 dark:text-[#869392]">via {{ p.method }}</span></p>
                  <p class="text-[10px] text-slate-500 dark:text-[#869392]">{{ formatDateTime(p.createdAt) }}<span v-if="p.notes"> · {{ p.notes }}</span></p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 dark:bg-[#292a2a] rounded-md hover:bg-slate-200 dark:hover:bg-[#3d4948]" @click="showDetailModal = false">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- Create Debt Modal (Multi-item manual) -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCreateModal = false"></div>
        <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto" @submit.prevent="handleCreate">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2]">Catat Hutang Baru</h2>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Nama Pelanggan <span class="text-red-500">*</span></label><input v-model="createForm.customerName" type="text" required placeholder="Pak Ahmad" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">No. HP</label><input v-model="createForm.customerPhone" type="text" placeholder="08123456789" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
          </div>

          <!-- Manual Items -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-700 dark:text-[#bcc9c7]">Item Hutang <span class="text-red-500">*</span></label>
              <button type="button" class="text-[10px] font-semibold text-[#03a29c] hover:underline" @click="addItem">+ Tambah Item</button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, idx) in createForm.items" :key="idx" class="flex items-center gap-2">
                <input v-model="item.name" type="text" required placeholder="Nama barang" class="flex-1 h-8 px-2 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] outline-none" />
                <input v-model.number="item.qty" type="number" min="1" required placeholder="Qty" class="w-16 h-8 px-2 text-sm font-mono border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] outline-none text-center" />
                <input v-model.number="item.price" type="number" min="0" required placeholder="Harga" class="w-24 h-8 px-2 text-sm font-mono border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] outline-none" />
                <button v-if="createForm.items.length > 1" type="button" class="w-7 h-7 rounded-md border border-red-200 dark:border-red-800 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" @click="removeItem(idx)">
                  <span class="text-red-500 text-xs font-bold">×</span>
                </button>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-[#869392]">Total:</span>
              <span class="font-bold font-mono tabular-nums text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(computedTotal) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">DP (Rp)</label><input v-model.number="createForm.downPayment" type="number" min="0" placeholder="0" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
            <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Jatuh Tempo</label><input v-model="createForm.dueDate" type="date" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
          </div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Catatan</label><input v-model="createForm.notes" type="text" placeholder="Bayar akhir bulan" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
          <div v-if="createError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ createError }}</div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 dark:bg-[#292a2a] rounded-md hover:bg-slate-200 dark:hover:bg-[#3d4948]" @click="showCreateModal = false">Batal</button>
            <button type="submit" :disabled="creating" class="h-9 px-4 text-xs font-semibold text-white bg-[#03a29c] rounded-md hover:bg-[#028a85] disabled:opacity-50 flex items-center gap-1.5"><Loader2Icon v-if="creating" class="w-3.5 h-3.5 animate-spin" />Simpan</button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Pay Debt Modal -->
    <Teleport to="body">
      <div v-if="showPayModal && payingDebt" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showPayModal = false"></div>
        <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handlePay">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2]">Bayar Hutang</h2>
          <div class="bg-slate-50 dark:bg-[#292a2a] rounded-md px-3 py-2 space-y-1">
            <p class="text-xs font-medium text-slate-900 dark:text-[#e3e2e2]">{{ payingDebt.customerName }}</p>
            <p class="text-[11px] text-slate-500 dark:text-[#869392]">{{ getDebtItemLabel(payingDebt) }}</p>
            <p class="text-xs font-mono tabular-nums text-red-600 dark:text-red-400">Sisa: {{ formatRupiah(payingDebt.totalAmount - payingDebt.paidAmount) }}</p>
          </div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Jumlah Bayar (Rp) <span class="text-red-500">*</span></label><input v-model.number="payForm.amount" type="number" min="1" :max="payingDebt.totalAmount - payingDebt.paidAmount" required class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Metode <span class="text-red-500">*</span></label><select v-model="payForm.method" required class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none"><option value="CASH">Cash</option><option value="QRIS">QRIS</option><option value="TRANSFER">Transfer</option></select></div>
          <div><label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Catatan</label><input v-model="payForm.notes" type="text" placeholder="Cicilan ke-2" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" /></div>
          <div v-if="payError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ payError }}</div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 dark:bg-[#292a2a] rounded-md hover:bg-slate-200 dark:hover:bg-[#3d4948]" @click="showPayModal = false">Batal</button>
            <button type="submit" :disabled="paying" class="h-9 px-4 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"><Loader2Icon v-if="paying" class="w-3.5 h-3.5 animate-spin" />Bayar</button>
          </div>
        </form>
      </div>
    </Teleport>
    <!-- Edit Debt Modal (jatuh tempo, catatan) -->
    <Teleport to="body">
      <div v-if="showEditModal && editingDebt" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showEditModal = false"></div>
        <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleEdit">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2]">Edit Hutang</h2>
          <div class="bg-slate-50 dark:bg-[#292a2a] rounded-md px-3 py-2">
            <p class="text-xs font-medium text-slate-900 dark:text-[#e3e2e2]">{{ editingDebt.customerName }}</p>
            <p class="text-[10px] text-slate-500 dark:text-[#869392]">Sisa: {{ formatRupiah(editingDebt.totalAmount - editingDebt.paidAmount) }}</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Jatuh Tempo</label>
            <input v-model="editForm.dueDate" type="date" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Nama Pelanggan</label>
            <input v-model="editForm.customerName" type="text" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">No. HP</label>
            <input v-model="editForm.customerPhone" type="text" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Catatan</label>
            <input v-model="editForm.notes" type="text" placeholder="Bayar akhir bulan" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none" />
          </div>
          <div v-if="editError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-xs text-red-700 dark:text-red-300">{{ editError }}</div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 dark:bg-[#292a2a] rounded-md hover:bg-slate-200 dark:hover:bg-[#3d4948]" @click="showEditModal = false">Batal</button>
            <button type="submit" :disabled="editing" class="h-9 px-4 text-xs font-semibold text-white bg-[#03a29c] rounded-md hover:bg-[#028a85] disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="editing" class="w-3.5 h-3.5 animate-spin" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { Plus as PlusIcon, Search as SearchIcon, HandCoins as HandCoinsIcon, Loader2 as Loader2Icon, AlertCircle as AlertCircleIcon, Eye as EyeIcon, MessageCircle as MessageCircleIcon, Pencil as PencilIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import debtsService, { type DebtDto, type DebtListResponse, type DebtStatus, type PaymentMethod, type ManualDebtItem } from '@/shared/services/debts.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const debts = ref<DebtDto[]>([]);
const meta = ref<DebtListResponse['meta'] | null>(null);
const summary = ref<DebtListResponse['summary'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const searchCustomer = ref('');
const filterStatus = ref<string>('');
const filterSort = ref<string>('newest');
const currentPage = ref(1);

const showDetailModal = ref(false);
const detailDebt = ref<DebtDto | null>(null);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const createForm = reactive({ customerName: '', customerPhone: '', items: [{ name: '', qty: 1, price: 0 }] as ManualDebtItem[], downPayment: 0, dueDate: '', notes: '' });
const showPayModal = ref(false);
const payingDebt = ref<DebtDto | null>(null);
const paying = ref(false);
const payError = ref<string | null>(null);
const payForm = reactive({ amount: 0, method: 'CASH' as string, notes: '' });

// Edit modal
const showEditModal = ref(false);
const editingDebt = ref<DebtDto | null>(null);
const editing = ref(false);
const editError = ref<string | null>(null);
const editForm = reactive({ dueDate: '', customerName: '', customerPhone: '', notes: '' });

function getShopId(): string | undefined { return shopStore.currentShopId || authStore.user?.shopId || undefined; }
function formatRupiah(n: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(iso: string): string { const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z'); return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function isOverdue(dueDate: string): boolean { return new Date(dueDate) < new Date(); }

function getAgeDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function getWaReminderLink(debt: DebtDto): string {
  const phone = (debt.customerPhone || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
  const sisa = formatRupiah(debt.totalAmount - debt.paidAmount);
  const text = encodeURIComponent(
    `Halo ${debt.customerName}, ini reminder dari toko kami.\n\nAnda masih memiliki hutang sebesar ${sisa}.\n${debt.dueDate ? `Jatuh tempo: ${formatDate(debt.dueDate)}\n` : ''}Mohon segera dilunasi. Terima kasih! 🙏`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function debtStatusBadge(status: string): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    case 'PARTIALLY_PAID': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'PAID': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'OVERDUE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'CANCELLED': return 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#869392]';
    default: return 'bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#869392]';
  }
}
function debtStatusLabel(status: string): string {
  switch (status) { case 'PENDING': return 'Pending'; case 'PARTIALLY_PAID': return 'Sebagian'; case 'PAID': return 'Lunas'; case 'OVERDUE': return 'Overdue'; case 'CANCELLED': return 'Batal'; default: return status; }
}

async function fetchDebts() {
  const shopId = getShopId(); if (!shopId) return;
  if (debts.value.length === 0) loading.value = true;
  error.value = null;
  try {
    const res = await debtsService.list({ shopId, status: (filterStatus.value as DebtStatus) || undefined, customerName: searchCustomer.value || undefined, sortBy: (filterSort.value as any) || undefined, page: currentPage.value, limit: 20 });
    debts.value = res.data; meta.value = res.meta; summary.value = res.summary;
  } catch (err: any) { if (debts.value.length === 0) error.value = err?.response?.data?.message || err?.message || 'Gagal memuat.'; } finally { loading.value = false; }
}
function resetAndFetch() { currentPage.value = 1; fetchDebts(); }
function goPage(p: number) { currentPage.value = p; fetchDebts(); }
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSearch() { if (searchTimeout) clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage.value = 1; fetchDebts(); }, 400); }

function openDetailModal(debt: DebtDto) { detailDebt.value = debt; showDetailModal.value = true; }
function openCreateModal() { createError.value = null; Object.assign(createForm, { customerName: '', customerPhone: '', items: [{ name: '', qty: 1, price: 0 }], downPayment: 0, dueDate: '', notes: '' }); showCreateModal.value = true; }
function openPayModal(debt: DebtDto) { payingDebt.value = debt; payError.value = null; payForm.amount = debt.totalAmount - debt.paidAmount; payForm.method = 'CASH'; payForm.notes = ''; showPayModal.value = true; }

function openEditModal(debt: DebtDto) {
  editingDebt.value = debt;
  editError.value = null;
  editForm.dueDate = debt.dueDate ? debt.dueDate.slice(0, 10) : '';
  editForm.customerName = debt.customerName;
  editForm.customerPhone = debt.customerPhone || '';
  editForm.notes = debt.notes || '';
  showEditModal.value = true;
}

async function handleEdit() {
  if (!editingDebt.value) return;
  editing.value = true; editError.value = null;
  try {
    await debtsService.update(editingDebt.value.id, {
      dueDate: editForm.dueDate || undefined,
      customerName: editForm.customerName || undefined,
      customerPhone: editForm.customerPhone || undefined,
      notes: editForm.notes || undefined,
    });
    showEditModal.value = false;
    await fetchDebts();
  } catch (err: any) {
    editError.value = err?.response?.data?.message || err?.message || 'Gagal menyimpan.';
  } finally { editing.value = false; }
}

async function handleCreate() {
  const shopId = getShopId(); if (!shopId) return; creating.value = true; createError.value = null;
  try {
    const validItems = createForm.items.filter(i => i.name.trim() && i.qty > 0 && i.price > 0);
    if (validItems.length === 0) { createError.value = 'Tambahkan minimal 1 item dengan nama, qty, dan harga.'; creating.value = false; return; }
    await debtsService.create({
      shopId,
      customerName: createForm.customerName,
      customerPhone: createForm.customerPhone || undefined,
      manualItems: validItems,
      downPayment: createForm.downPayment || undefined,
      dueDate: createForm.dueDate || undefined,
      notes: createForm.notes || undefined,
    });
    showCreateModal.value = false; await fetchDebts();
  } catch (err: any) { createError.value = err?.response?.data?.message || err?.message || 'Gagal.'; } finally { creating.value = false; }
}
async function handlePay() {
  if (!payingDebt.value) return;
  const remaining = payingDebt.value.totalAmount - payingDebt.value.paidAmount;
  if (payForm.amount <= 0) { payError.value = 'Jumlah bayar harus lebih dari 0.'; return; }
  if (payForm.amount > remaining) {
    payError.value = `Melebihi sisa hutang. Maksimal: ${formatRupiah(remaining)}`;
    payForm.amount = remaining;
    return;
  }
  paying.value = true; payError.value = null;
  try { await debtsService.pay(payingDebt.value.id, { amount: payForm.amount, method: payForm.method as PaymentMethod, notes: payForm.notes || undefined }); showPayModal.value = false; await fetchDebts(); } catch (err: any) { payError.value = err?.response?.data?.message || err?.message || 'Gagal.'; } finally { paying.value = false; }
}

function addItem() { createForm.items.push({ name: '', qty: 1, price: 0 }); }
function removeItem(idx: number) { createForm.items.splice(idx, 1); }
const computedTotal = computed(() => createForm.items.reduce((sum, i) => sum + (i.price * i.qty), 0));

function getDebtItemLabel(debt: DebtDto): string {
  if (debt.transaction) return `Transaksi #${debt.transaction.transactionNumber} (${debt.transaction.items?.length || 0} item)`;
  if (debt.manualItems && debt.manualItems.length > 0) return debt.manualItems.map(i => `${i.name} ×${i.qty}`).join(', ');
  if (debt.product) return `${debt.product.name} ×${debt.quantity}`;
  return '—';
}

onMounted(fetchDebts);

useAutoRefresh(fetchDebts);
</script>
