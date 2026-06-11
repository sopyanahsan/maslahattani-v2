<template>
  <div class="space-y-0 -mx-4 -mt-4 font-hanken">

    <!-- ============================================================ -->
    <!-- HEADER — Posify v2 teal gradient                             -->
    <!-- ============================================================ -->
    <header class="relative overflow-hidden px-4 pt-4 pb-5 bg-gradient-to-br from-[#00756f] via-[#00A19B] to-[#00bdb6]">
      <!-- decorative blobs -->
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
        <div class="ml-auto">
          <LandmarkIcon class="w-7 h-7 text-white/30" />
        </div>
      </div>

      <!-- ── Saldo cards strip: Kas Tunai + semua rekening, slideable ── -->
      <div class="relative z-10">
        <div
          ref="saldoStrip"
          class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory"
        >
          <!-- Kas Tunai card -->
          <div class="shrink-0 snap-start w-44 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 flex flex-col gap-1">
            <div class="flex items-center gap-1.5 mb-0.5">
              <WalletIcon class="w-3.5 h-3.5 text-white/70" />
              <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Kas Tunai</p>
            </div>
            <div v-if="kasLoading" class="h-5 w-20 rounded bg-white/20 animate-pulse" />
            <p v-else class="text-base font-bold text-white font-mono leading-tight whitespace-nowrap">
              {{ formatRupiah(saldoKas) }}
            </p>
            <p v-if="kasLowBalance" class="text-[9px] text-amber-300 font-semibold flex items-center gap-1">
              <AlertTriangleIcon class="w-3 h-3" /> Di bawah minimum
            </p>
          </div>

          <!-- Per-Rekening cards -->
          <template v-if="accountsLoading">
            <div v-for="i in 2" :key="i" class="shrink-0 snap-start w-52 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 animate-pulse">
              <div class="h-3 w-24 rounded bg-white/20 mb-2" />
              <div class="h-5 w-32 rounded bg-white/20 mb-3" />
              <div class="flex gap-2">
                <div class="h-6 flex-1 rounded-lg bg-white/20" />
                <div class="h-6 flex-1 rounded-lg bg-white/20" />
              </div>
            </div>
          </template>

          <template v-else>
            <div
              v-for="acc in accounts"
              :key="acc.id"
              class="shrink-0 snap-start w-52 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 flex flex-col gap-1"
            >
              <div class="flex items-center gap-1.5 mb-0.5">
                <CreditCardIcon class="w-3.5 h-3.5 text-white/70" />
                <p class="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate max-w-[130px]">{{ acc.label }}</p>
                <span v-if="acc.isDefault" class="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" title="Default" />
              </div>
              <p class="text-[9px] text-white/50 font-mono leading-none">{{ acc.accountNumber }}</p>
              <p
                class="text-base font-bold font-mono leading-tight whitespace-nowrap"
                :class="acc.balance < acc.lowBalanceThreshold ? 'text-amber-300' : 'text-white'"
              >
                {{ formatRupiah(acc.balance) }}
              </p>
              <p v-if="acc.balance < acc.lowBalanceThreshold" class="text-[9px] text-amber-300 font-semibold flex items-center gap-1">
                <AlertTriangleIcon class="w-3 h-3" /> Saldo menipis
              </p>
              <!-- Tambah / Tarik per rekening -->
              <div class="flex gap-1.5 mt-1">
                <button
                  type="button"
                  class="flex-1 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openModal(acc, 'tambah')"
                >
                  <PlusIcon class="w-3 h-3" /> Tambah
                </button>
                <button
                  type="button"
                  class="flex-1 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openModal(acc, 'tarik')"
                >
                  <MinusIcon class="w-3 h-3" /> Tarik
                </button>
              </div>
            </div>

            <!-- Empty rekening hint -->
            <div
              v-if="accounts.length === 0"
              class="shrink-0 snap-start w-52 rounded-2xl border border-dashed border-white/30 px-4 py-3 flex flex-col items-center justify-center gap-1 text-white/50"
            >
              <LandmarkIcon class="w-5 h-5" />
              <p class="text-[10px] text-center">Belum ada rekening BRI</p>
              <p class="text-[9px] text-center text-white/30">Tambah via panel admin</p>
            </div>
          </template>
        </div>

        <!-- scroll dots indicator -->
        <div v-if="accounts.length > 0" class="flex justify-center gap-1 mt-2">
          <div
            v-for="(_, i) in [null, ...accounts]"
            :key="i"
            class="w-1 h-1 rounded-full transition-all"
            :class="activeCard === i ? 'bg-white w-3' : 'bg-white/30'"
          />
        </div>
      </div>
    </header>

    <!-- ============================================================ -->
    <!-- QUICK ACTIONS — Tambah Saldo & Tarik Saldo (default rekening) -->
    <!-- ============================================================ -->
    <div v-if="defaultAccount" class="px-4 py-3 bg-white dark:bg-[#1e2020] border-b border-slate-100 dark:border-[#3d4948]">
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 h-10 rounded-xl bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10 text-[#00756f] dark:text-[#5fd9d2] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#00A19B]/20 dark:border-[#5fd9d2]/20 hover:bg-[#00A19B]/20 transition-colors"
          @click="openModal(defaultAccount!, 'tambah')"
        >
          <PlusCircleIcon class="w-4 h-4" /> Tambah Saldo
        </button>
        <button
          type="button"
          class="flex-1 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-red-200/50 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          @click="openModal(defaultAccount!, 'tarik')"
        >
          <MinusCircleIcon class="w-4 h-4" /> Tarik Saldo
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- LAYANAN TRANSAKSI GRID                                        -->
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
        <li
          v-for="trx in recentTransactions"
          :key="trx.id"
          class="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] px-3.5 py-3"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-[#00A19B]/10 dark:bg-[#5fd9d2]/10 flex items-center justify-center shrink-0">
              <BanknoteIcon class="w-4 h-4 text-[#00A19B] dark:text-[#5fd9d2]" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-[#e3e2e2] truncate">
                {{ BRILINK_CATEGORY_LABELS[trx.category] }}
              </p>
              <p class="text-[10px] text-slate-400 dark:text-[#869392] truncate">
                {{ trx.customerName }} · {{ formatTime(trx.createdAt) }}
              </p>
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
    <!-- MODAL: Tambah Saldo / Tarik Saldo                             -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-hanken">
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" @click="closeModal" />
        <form
          class="relative w-full sm:max-w-sm bg-white dark:bg-[#1e2020] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-[#3d4948] shadow-2xl p-5 space-y-4 animate-slide-up sm:animate-none"
          @submit.prevent="handleSubmit"
        >
          <!-- handle bar mobile -->
          <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-[#3d4948] mx-auto sm:hidden -mt-1 mb-1" />

          <!-- title -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-[#e3e2e2]">
                {{ modalType === 'tambah' ? 'Tambah Saldo' : 'Tarik Saldo' }}
              </h3>
              <p class="text-[11px] text-slate-500 dark:text-[#869392] mt-0.5">{{ modalAccount?.label }} · {{ modalAccount?.accountNumber }}</p>
            </div>
            <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292a2a]" @click="closeModal">
              <XIcon class="w-4 h-4 text-slate-400 dark:text-[#869392]" />
            </button>
          </div>

          <!-- saldo sekarang -->
          <div class="rounded-xl px-4 py-3 flex items-center justify-between"
            :class="modalType === 'tambah' ? 'bg-[#00A19B]/8 dark:bg-[#5fd9d2]/8 border border-[#00A19B]/15 dark:border-[#5fd9d2]/15' : 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'">
            <span class="text-xs text-slate-500 dark:text-[#869392]">Saldo saat ini</span>
            <span class="text-sm font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(modalAccount?.balance ?? 0) }}</span>
          </div>

          <!-- nominal input -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">
              Jumlah (Rp) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="modalForm.amount"
              type="number"
              min="1"
              required
              placeholder="0"
              class="w-full h-11 px-4 text-base font-mono font-bold text-center border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] focus:ring-2 focus:ring-[#00A19B]/20 outline-none"
            />
            <!-- quick amount chips -->
            <div class="grid grid-cols-4 gap-1.5 mt-2">
              <button
                v-for="n in [100000, 500000, 1000000, 2000000]"
                :key="n"
                type="button"
                class="h-7 rounded-lg border border-slate-200 dark:border-[#3d4948] text-[10px] font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
                @click="modalForm.amount += n"
              >
                +{{ n >= 1000000 ? (n / 1000000) + 'Jt' : (n / 1000) + 'K' }}
              </button>
            </div>
            <button type="button" class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5 hover:text-slate-600 dark:hover:text-[#bcc9c7]" @click="modalForm.amount = 0">Reset</button>
          </div>

          <!-- referensi -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Referensi <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span></label>
            <input
              v-model="modalForm.reference"
              type="text"
              placeholder="No. setoran / keterangan"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
            />
          </div>

          <!-- notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-[#bcc9c7] mb-1.5">Catatan <span class="text-slate-400 dark:text-[#869392] font-normal">(opsional)</span></label>
            <input
              v-model="modalForm.notes"
              type="text"
              placeholder="Opsional"
              class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1a1c1c] text-slate-900 dark:text-[#e3e2e2] focus:border-[#00A19B] dark:focus:border-[#5fd9d2] outline-none"
            />
          </div>

          <!-- error -->
          <div v-if="modalError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">
            {{ modalError }}
          </div>

          <!-- actions -->
          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 h-11 border border-slate-200 dark:border-[#3d4948] rounded-xl text-sm font-semibold text-slate-600 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
              @click="closeModal"
            >Batal</button>
            <button
              type="submit"
              :disabled="modalSubmitting || modalForm.amount <= 0"
              :class="[
                'flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40',
                modalType === 'tambah'
                  ? 'bg-[#00A19B] hover:brightness-110 dark:shadow-[0_0_15px_rgba(0,161,155,0.3)]'
                  : 'bg-red-500 hover:bg-red-600',
              ]"
            >
              <Loader2Icon v-if="modalSubmitting" class="w-4 h-4 animate-spin" />
              <PlusCircleIcon v-else-if="modalType === 'tambah'" class="w-4 h-4" />
              <MinusCircleIcon v-else class="w-4 h-4" />
              {{ modalSubmitting ? 'Memproses...' : modalType === 'tambah' ? 'Tambah Saldo' : 'Tarik Saldo' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================================ -->
    <!-- TOAST                                                          -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm"
          :class="toast.type === 'success' ? 'bg-[#00A19B] text-white' : 'bg-red-600 text-white'"
        >
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

// ── Refs ──────────────────────────────────────────────────────────────────────
const accounts = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(true);

const saldoKas = ref(0);
const kasLoading = ref(true);
const kasLowBalance = ref(false);

const recentTransactions = ref<BrilinkTransactionDto[]>([]);
const loading = ref(true);

// saldo strip scroll state
const saldoStrip = ref<HTMLElement | null>(null);
const activeCard = ref(0);

// Modal
const showModal = ref(false);
const modalType = ref<'tambah' | 'tarik'>('tambah');
const modalAccount = ref<BrilinkAccount | null>(null);
const modalSubmitting = ref(false);
const modalError = ref<string | null>(null);
const modalForm = reactive({ amount: 0, reference: '', notes: '' });

// Toast
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ── Computed ──────────────────────────────────────────────────────────────────
const defaultAccount = computed(() =>
  accounts.value.find((a) => a.isDefault && a.isActive) ??
  accounts.value.find((a) => a.isActive) ??
  accounts.value[0] ??
  null
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function shopId(): string {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? '';
}

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(acc: BrilinkAccount, type: 'tambah' | 'tarik') {
  modalAccount.value = acc;
  modalType.value = type;
  modalForm.amount = 0;
  modalForm.reference = '';
  modalForm.notes = '';
  modalError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalError.value = null;
}

async function handleSubmit() {
  if (!modalAccount.value || modalForm.amount <= 0) return;
  modalSubmitting.value = true;
  modalError.value = null;
  try {
    const payload = {
      amount: modalForm.amount,
      reference: modalForm.reference || undefined,
      notes: modalForm.notes || undefined,
    };
    let updated: BrilinkAccount;
    if (modalType.value === 'tambah') {
      const res = await brilinkAccountService.setor(modalAccount.value.id, payload);
      updated = res.account;
    } else {
      const res = await brilinkAccountService.tarik(modalAccount.value.id, payload);
      updated = res.account;
    }
    // Update account balance in local list
    const idx = accounts.value.findIndex((a) => a.id === updated.id);
    if (idx !== -1) accounts.value[idx] = { ...accounts.value[idx], balance: updated.balance };

    showToast('success', `${modalType.value === 'tambah' ? 'Tambah' : 'Tarik'} saldo berhasil!`);
    closeModal();
  } catch (e: any) {
    modalError.value = e?.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.';
  } finally {
    modalSubmitting.value = false;
  }
}

// ── Scroll dots tracker ───────────────────────────────────────────────────────
function setupScrollTracker() {
  const el = saldoStrip.value;
  if (!el) return;
  el.addEventListener('scroll', () => {
    const cardW = 208 + 12; // w-52 = 208px + gap-3 = 12px
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

  // Load all in parallel
  const [accs, txResponse, cashbox] = await Promise.allSettled([
    brilinkAccountService.list(id),
    brilinkService.listTransactions({ shopId: id, limit: 5 }),
    brilinkCashboxService.getCashBox(id),
  ]);

  if (accs.status === 'fulfilled') {
    accounts.value = accs.value.filter((a) => a.isActive);
  }
  accountsLoading.value = false;

  if (txResponse.status === 'fulfilled') {
    recentTransactions.value = txResponse.value.data;
  }
  loading.value = false;

  if (cashbox.status === 'fulfilled') {
    saldoKas.value = cashbox.value.balance;
    kasLowBalance.value = cashbox.value.isLowBalance;
  }
  kasLoading.value = false;

  // Setup scroll tracker after DOM settles
  setTimeout(setupScrollTracker, 100);
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
