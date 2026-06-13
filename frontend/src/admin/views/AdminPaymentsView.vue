<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div></div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="h-9 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5"
          @click="openMutationModal('CASH_IN')"
        >
          <ArrowDownIcon class="w-4 h-4 text-emerald-600" />
          Cash In
        </button>
        <button
          type="button"
          class="h-9 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5"
          @click="openMutationModal('CASH_OUT')"
        >
          <ArrowUpIcon class="w-4 h-4 text-red-600" />
          Cash Out
        </button>
        <button
          type="button"
          class="h-9 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5"
          @click="showAuditModal = true"
        >
          <ClipboardCheckIcon class="w-4 h-4 text-blue-600" />
          Audit Kas
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div v-if="kasSummary" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Saldo Kas</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-[#e3e2e2] dark:text-[#e3e2e2] mt-1">
          {{ formatRupiah(kasSummary.cashBoxBalance) }}
        </p>
        <p v-if="kasSummary.lastAudit" class="text-[10px] text-slate-400 dark:text-[#869392] mt-1">
          Audit: {{ formatDate(kasSummary.lastAudit) }}
        </p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Cash</p>
        <p class="text-lg font-bold font-mono text-emerald-600 mt-1">
          {{ formatRupiah(kasSummary.breakdown.cash) }}
        </p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">QRIS</p>
        <p class="text-lg font-bold font-mono text-blue-600 mt-1">
          {{ formatRupiah(kasSummary.breakdown.qris) }}
        </p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Transfer</p>
        <p class="text-lg font-bold font-mono text-indigo-600 mt-1">
          {{ formatRupiah(kasSummary.breakdown.transfer) }}
        </p>
      </div>
      <div class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4">
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Hutang</p>
        <p class="text-lg font-bold font-mono text-amber-600 mt-1">
          {{ formatRupiah(kasSummary.breakdown.hutang) }}
        </p>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="border-b border-slate-200 dark:border-[#3d4948] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <nav class="flex gap-1">
        <button
          type="button"
          :class="['px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
            activeTab === 'history'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-[#e3e2e2]']"
          @click="activeTab = 'history'"
        >
          Riwayat Pembayaran
        </button>
        <button
          type="button"
          :class="['px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5',
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-[#e3e2e2]']"
          @click="activeTab = 'pending'; fetchPending()"
        >
          Persetujuan Pengeluaran
          <span v-if="pendingCount > 0" class="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">{{ pendingCount }}</span>
        </button>
      </nav>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Pending Approvals                       -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'pending'">
      <div v-if="pendingLoading" class="flex items-center justify-center py-16">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
        <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat pengeluaran pending...</span>
      </div>

      <div v-else-if="pendingError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{{ pendingError }}</div>

      <div v-else-if="pendingItems.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-300 rounded-xl p-10 text-center">
        <ShieldCheckIcon class="w-10 h-10 text-emerald-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700 dark:text-[#bcc9c7]">Tidak ada pengeluaran yang menunggu persetujuan</p>
        <p class="text-xs text-slate-400 dark:text-[#869392] mt-1">Semua cash-out sudah diverifikasi.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in pendingItems"
          :key="item.id"
          class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <!-- Info -->
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">PENDING</span>
              <span class="text-xs text-slate-500 dark:text-[#869392]">{{ formatDateTime(item.createdAt) }}</span>
            </div>
            <p class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2] font-mono">{{ formatRupiah(item.amount) }}</p>
            <p class="text-xs text-slate-600 dark:text-[#bcc9c7]">
              Kasir: <strong>{{ item.user?.username ?? '—' }}</strong>
              · Kategori: {{ item.category?.name ?? '—' }}
            </p>
            <p v-if="item.notes" class="text-xs text-slate-400 dark:text-[#869392] italic">{{ item.notes }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              :disabled="actionLoading === item.id"
              class="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 rounded-lg
                     hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              @click="handleApprove(item.id)"
            >
              <Loader2Icon v-if="actionLoading === item.id" class="w-3.5 h-3.5 animate-spin" />
              <ShieldCheckIcon v-else class="w-3.5 h-3.5" />
              Setujui
            </button>
            <button
              type="button"
              :disabled="actionLoading === item.id"
              class="h-9 px-3 text-xs font-semibold text-white bg-red-600 rounded-lg
                     hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              @click="rejectModalId = item.id"
            >
              <XCircleIcon class="w-3.5 h-3.5" />
              Tolak
            </button>
          </div>
        </div>
      </div>

      <!-- Reject reason modal -->
      <Teleport to="body">
        <div v-if="rejectModalId" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40" @click="rejectModalId = null"></div>
          <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleReject(rejectModalId!)">
            <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">Alasan Penolakan</h3>
            <input
              v-model="rejectReason"
              type="text"
              placeholder="Contoh: Kategori salah, ajukan ulang"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 outline-none"
            />
            <div class="flex justify-end gap-2">
              <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 rounded-md hover:bg-slate-200" @click="rejectModalId = null">Batal</button>
              <button type="submit" :disabled="!!actionLoading" class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">Tolak</button>
            </div>
          </form>
        </div>
      </Teleport>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Payment History (existing content)      -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'history'">

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <input
        v-model="filterStartDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />
      <input
        v-model="filterEndDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      />
      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-[#869392] self-center">{{ meta.total }} pembayaran</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat riwayat...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="payments.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <WalletIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-[#bcc9c7]">Belum ada riwayat pembayaran</p>
    </div>

    <!-- Payment history table -->
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[650px]">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">No. Trx</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Metode</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Jumlah</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in payments" :key="p.id" class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors">
              <td class="px-4 py-2.5 text-xs text-slate-600 dark:text-[#bcc9c7] font-mono">{{ formatDateTime(p.createdAt) }}</td>
              <td class="px-4 py-2.5">
                <code class="text-xs font-mono text-slate-700 dark:text-[#bcc9c7]">{{ p.transaction?.transactionNumber ?? '—' }}</code>
              </td>
              <td class="px-4 py-2.5 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', methodBadge(p.method)]">
                  {{ p.method }}
                </span>
              </td>
              <td class="px-4 py-2.5 text-right text-sm font-mono font-semibold text-slate-900 dark:text-[#e3e2e2]">
                {{ formatRupiah(p.amount) }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : p.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700']">
                  {{ p.status === 'COMPLETED' ? 'OK' : p.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 dark:border-[#3d4948] flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-[#869392]">Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
        <div class="flex items-center gap-1">
          <button :disabled="meta.page <= 1" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 dark:bg-[#1a1c1c] disabled:opacity-40 disabled:cursor-not-allowed" @click="goPage(meta!.page - 1)">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 dark:bg-[#1a1c1c] disabled:opacity-40 disabled:cursor-not-allowed" @click="goPage(meta!.page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Cash Mutation Modal                          -->
    <!-- ============================================ -->
    </template><!-- end history tab -->

    <!-- ============================================ -->
    <!-- Cash Mutation Modal (always available)       -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showMutationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showMutationModal = false"></div>
        <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleMutation">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2] flex items-center gap-2">
            <component :is="mutationType === 'CASH_IN' ? ArrowDownIcon : ArrowUpIcon" :class="['w-5 h-5', mutationType === 'CASH_IN' ? 'text-emerald-600' : 'text-red-600']" />
            {{ mutationType === 'CASH_IN' ? 'Pemasukan Kas' : 'Pengeluaran Kas' }}
          </h2>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Jumlah (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="mutationForm.amount" type="number" min="1" required placeholder="500000" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Kategori <span class="text-red-500">*</span></label>
            <select v-model="mutationForm.category" required class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="">— Pilih —</option>
              <template v-if="mutationType === 'CASH_IN'">
                <option value="PENJUALAN">Penjualan</option>
                <option value="HUTANG_MASUK">Hutang Masuk</option>
                <option value="TAMBAHAN_MODAL">Tambahan Modal</option>
                <option value="LAINNYA">Lainnya</option>
              </template>
              <template v-else>
                <option value="MODAL_OPERASIONAL">Modal Operasional</option>
                <option value="PRIVE_OWNER">Prive Owner</option>
                <option value="BELANJA_STOK">Belanja Stok</option>
                <option value="LAINNYA">Lainnya</option>
              </template>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Catatan</label>
            <input v-model="mutationForm.notes" type="text" placeholder="Keterangan..." class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div v-if="mutationError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ mutationError }}</div>

          <!-- Result -->
          <div v-if="mutationResult" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
            <p class="font-bold">{{ mutationResult.message }}</p>
            <p class="mt-1 font-mono">Saldo: {{ formatRupiah(mutationResult.mutation.balanceBefore) }} → {{ formatRupiah(mutationResult.mutation.balanceAfter) }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 rounded-md hover:bg-slate-200" @click="showMutationModal = false">
              {{ mutationResult ? 'Tutup' : 'Batal' }}
            </button>
            <button v-if="!mutationResult" type="submit" :disabled="mutating" :class="['h-9 px-4 text-xs font-semibold text-white rounded-md disabled:opacity-50 flex items-center gap-1.5', mutationType === 'CASH_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700']">
              <Loader2Icon v-if="mutating" class="w-3.5 h-3.5 animate-spin" />
              {{ mutationType === 'CASH_IN' ? 'Catat Masuk' : 'Catat Keluar' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Audit Modal                                  -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showAuditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showAuditModal = false"></div>
        <form class="relative bg-white dark:bg-[#1e2020] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" @submit.prevent="handleAudit">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2] flex items-center gap-2">
            <ClipboardCheckIcon class="w-5 h-5 text-blue-600" />
            Audit Saldo Kas
          </h2>
          <p class="text-xs text-slate-500 dark:text-[#869392]">
            Hitung uang fisik di laci kas, lalu input totalnya. Sistem bandingkan dgn saldo digital.
          </p>

          <div v-if="kasSummary" class="bg-slate-50 dark:bg-[#1a1c1c] rounded-md px-3 py-2 text-xs">
            <span class="text-slate-500 dark:text-[#869392]">Saldo sistem: </span>
            <span class="font-mono font-semibold text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(kasSummary.cashBoxBalance) }}</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Saldo Fisik (Rp) <span class="text-red-500">*</span></label>
            <input v-model.number="auditForm.actualBalance" type="number" min="0" required placeholder="1500000" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1">Catatan</label>
            <input v-model="auditForm.notes" type="text" placeholder="Audit harian sore" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div v-if="auditError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ auditError }}</div>

          <div v-if="auditResult" :class="['rounded-lg p-3 text-xs border', auditResult.audit.status === 'MATCH' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800']">
            <p class="font-bold">{{ auditResult.message }}</p>
            <p class="mt-1 font-mono">Sistem: {{ formatRupiah(auditResult.audit.systemBalance) }} · Fisik: {{ formatRupiah(auditResult.audit.actualBalance) }}</p>
            <p class="font-mono">Selisih: {{ auditResult.audit.variance >= 0 ? '+' : '' }}{{ formatRupiah(auditResult.audit.variance) }} ({{ auditResult.audit.status }})</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] bg-slate-100 rounded-md hover:bg-slate-200" @click="showAuditModal = false">
              {{ auditResult ? 'Tutup' : 'Batal' }}
            </button>
            <button v-if="!auditResult" type="submit" :disabled="auditing" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="auditing" class="w-3.5 h-3.5 animate-spin" />
              Submit Audit
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
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Wallet as WalletIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  ShieldCheck as ShieldCheckIcon,
  XCircle as XCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import api from '@/shared/services/api';
import paymentsService, {
  type PaymentHistoryDto,
  type PaymentHistoryResponse,
  type KasSummary,
  type CashMutationType,
  type CashMutationResponse,
  type AuditCashResponse,
} from '@/shared/services/payments.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

// ============================================
// Tabs
// ============================================
type TabValue = 'history' | 'pending';
const activeTab = ref<TabValue>('history');

// ============================================
// State
// ============================================
const payments = ref<PaymentHistoryDto[]>([]);
const meta = ref<PaymentHistoryResponse['meta'] | null>(null);
const kasSummary = ref<KasSummary | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Pending cash-out approval
const pendingItems = ref<any[]>([]);
const pendingLoading = ref(false);
const pendingError = ref<string | null>(null);
const pendingCount = ref(0);
const rejectModalId = ref<string | null>(null);
const rejectReason = ref('');
const actionLoading = ref<string | null>(null); // id of item being approved/rejected

// Filters
const filterStartDate = ref('');
const filterEndDate = ref('');
const currentPage = ref(1);

// Mutation modal
const showMutationModal = ref(false);
const mutationType = ref<CashMutationType>('CASH_IN');
const mutating = ref(false);
const mutationError = ref<string | null>(null);
const mutationResult = ref<CashMutationResponse | null>(null);
const mutationForm = reactive({ amount: 0, category: '', notes: '' });

// Audit modal
const showAuditModal = ref(false);
const auditing = ref(false);
const auditError = ref<string | null>(null);
const auditResult = ref<AuditCashResponse | null>(null);
const auditForm = reactive({ actualBalance: 0, notes: '' });

// ============================================
// Methods
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? undefined;
}

async function fetchPending() {
  const shopId = getShopId();
  if (!shopId) return;
  pendingLoading.value = true;
  pendingError.value = null;
  try {
    const { data } = await api.get('/cash-flows', { params: { shopId, status: 'PENDING', type: 'CASH_OUT' } });
    pendingItems.value = data.data ?? data ?? [];
    pendingCount.value = pendingItems.value.length;
  } catch (err: any) {
    pendingError.value = err.response?.data?.message ?? 'Gagal memuat daftar pending.';
    pendingItems.value = [];
  } finally {
    pendingLoading.value = false;
  }
}

async function handleApprove(id: string) {
  actionLoading.value = id;
  try {
    await api.patch(`/cash-flows/${id}/verify`);
    pendingItems.value = pendingItems.value.filter((item) => item.id !== id);
    pendingCount.value = pendingItems.value.length;
    await fetchSummary();
  } catch { /* silent */ }
  finally { actionLoading.value = null; }
}

async function handleReject(id: string) {
  actionLoading.value = id;
  try {
    await api.patch(`/cash-flows/${id}/reject`, { reason: rejectReason.value || 'Ditolak oleh admin' });
    pendingItems.value = pendingItems.value.filter((item) => item.id !== id);
    pendingCount.value = pendingItems.value.length;
    rejectModalId.value = null;
    rejectReason.value = '';
  } catch { /* silent */ }
  finally { actionLoading.value = null; }
}

async function fetchHistory() {
  const shopId = getShopId();
  if (!shopId) return;
  loading.value = true;
  error.value = null;
  try {
    const response = await paymentsService.getHistory({
      shopId,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    payments.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat riwayat.';
  } finally {
    loading.value = false;
  }
}

async function fetchSummary() {
  const shopId = getShopId();
  if (!shopId) return;
  try {
    kasSummary.value = await paymentsService.getSummary(
      shopId,
      filterStartDate.value || undefined,
      filterEndDate.value || undefined,
    );
  } catch { /* silent */ }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchHistory();
  fetchSummary();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchHistory();
}

function openMutationModal(type: CashMutationType) {
  mutationType.value = type;
  mutationForm.amount = 0;
  mutationForm.category = '';
  mutationForm.notes = '';
  mutationError.value = null;
  mutationResult.value = null;
  showMutationModal.value = true;
}

async function handleMutation() {
  const shopId = getShopId();
  if (!shopId) return;
  mutating.value = true;
  mutationError.value = null;
  try {
    mutationResult.value = await paymentsService.createMutation({
      shopId,
      type: mutationType.value,
      amount: mutationForm.amount,
      category: mutationForm.category,
      notes: mutationForm.notes || undefined,
    });
    await fetchSummary();
  } catch (err: any) {
    mutationError.value = err.response?.data?.message ?? err.message ?? 'Gagal catat mutasi.';
  } finally {
    mutating.value = false;
  }
}

async function handleAudit() {
  const shopId = getShopId();
  if (!shopId) return;
  auditing.value = true;
  auditError.value = null;
  try {
    auditResult.value = await paymentsService.auditCash({
      shopId,
      actualBalance: auditForm.actualBalance,
      notes: auditForm.notes || undefined,
    });
    await fetchSummary();
  } catch (err: any) {
    auditError.value = err.response?.data?.message ?? err.message ?? 'Gagal audit kas.';
  } finally {
    auditing.value = false;
  }
}

// ============================================
// Helpers
// ============================================

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700 dark:text-[#bcc9c7]';
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchHistory();
  fetchSummary();
  fetchPending();
});

useAutoRefresh(() => { fetchHistory(); fetchSummary(); });
</script>
