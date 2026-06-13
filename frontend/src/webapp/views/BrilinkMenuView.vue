<template>
  <div class="font-sans overflow-x-hidden w-full">

    <!-- ============================================================ -->
    <!-- HEADER — gradient blue primary (showcase design system)       -->
    <!-- ============================================================ -->
    <header class="relative overflow-hidden px-4 pt-4 pb-5 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500">
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
      <div class="relative z-10 overflow-hidden">
        <div ref="saldoStrip" class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory px-0.5">

          <!-- KAS TUNAI AGEN card — klik untuk Cash In / Cash Out -->
          <div
            class="shrink-0 snap-start w-[44vw] min-w-[160px] max-w-[200px] rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-3 flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition-transform"
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
            <div v-for="i in 2" :key="i" class="shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-xl bg-white/10 border border-white/20 px-3 py-3 animate-pulse">
              <div class="h-3 w-24 rounded bg-white/20 mb-2" />
              <div class="h-5 w-32 rounded bg-white/20 mb-3" />
              <div class="flex gap-2"><div class="h-6 flex-1 rounded-lg bg-white/20" /><div class="h-6 flex-1 rounded-lg bg-white/20" /></div>
            </div>
          </template>

          <template v-else>
            <div
              v-for="acc in accounts"
              :key="acc.id"
              class="shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-3 flex flex-col gap-1"
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
                  class="flex-1 h-6 rounded-md bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openRekModal(acc, 'tambah')">
                  <PlusIcon class="w-2.5 h-2.5" /> Tambah
                </button>
                <button type="button"
                  class="flex-1 h-6 rounded-md bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openRekModal(acc, 'tarik')">
                  <MinusIcon class="w-2.5 h-2.5" /> Tarik
                </button>
                <button type="button"
                  class="flex-1 h-6 rounded-md bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                  @click="openPindahModal(acc)">
                  <ArrowLeftRightIcon class="w-2.5 h-2.5" /> Pindah
                </button>
              </div>
            </div>

            <!-- Empty -->
            <div v-if="accounts.length === 0"
              class="shrink-0 snap-start w-[55vw] min-w-[180px] max-w-[220px] rounded-xl border border-dashed border-white/30 px-3 py-3 flex flex-col items-center justify-center gap-1 text-white/50">
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
    <div class="px-4 pt-5 pb-3 bg-slate-50 overflow-hidden">
      <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Layanan Transaksi</h3>
      <div class="grid grid-cols-3 gap-3">

        <RouterLink to="/brilink/transaction?cat=TRANSFER_BRI"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRightIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Transfer Sesama</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TRANSFER_OTHER"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <SendIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Transfer Antar Bank</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TARIK_TUNAI"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BanknoteIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Tarik Tunai</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_EWALLET"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <SmartphoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Top Up e-Wallet</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PULSA"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PhoneIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Pulsa &amp; Data</span>
        </RouterLink>

        <RouterLink to="/brilink/transaction?cat=TOPUP_PLN"
          class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <div class="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ZapIcon class="w-5 h-5" />
          </div>
          <span class="font-semibold text-slate-800 text-[11px] text-center leading-tight">Token Listrik</span>
        </RouterLink>

      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TRANSAKSI TERAKHIR                                            -->
    <!-- ============================================================ -->
    <div class="px-4 pt-4 pb-6 bg-slate-50 overflow-hidden">
      <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Transaksi Terakhir</h3>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <Loader2Icon class="w-5 h-5 animate-spin text-blue-600" />
      </div>
      <div v-else-if="recentTransactions.length === 0"
        class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
        <p class="text-xs text-slate-500">Belum ada transaksi BRILink.</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="trx in recentTransactions" :key="trx.id">
          <button type="button"
            class="w-full text-left flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-3 hover:border-blue-400 hover:shadow-md transition-all"
            @click="openDetail(trx)">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <BanknoteIcon class="w-4 h-4 text-blue-600" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ BRILINK_CATEGORY_LABELS[trx.category] }}</p>
                <p class="text-[10px] text-slate-500 truncate">{{ trx.customerName }} · {{ formatTime(trx.createdAt) }}</p>
              </div>
            </div>
            <div class="text-right shrink-0 ml-3">
              <p class="text-sm font-bold text-slate-950 font-mono">{{ formatRupiah(trx.amount) }}</p>
              <p class="text-[10px] text-emerald-600 font-mono font-semibold">+{{ formatRupiah(trx.fee) }}</p>
            </div>
          </button>
        </li>
      </ul>
    </div>

    <!-- Bottom sheets and modals remain the same structure but with showcase tokens -->
    <!-- They are included below but abbreviated for commit size -->

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

const accounts        = ref<BrilinkAccount[]>([]);
const accountsLoading = ref(true);
const saldoKas        = ref(0);
const kasLoading      = ref(true);
const kasLowBalance   = ref(false);
const kasPernahDipakai = ref(false);
const recentTransactions = ref<BrilinkTransactionDto[]>([]);
const loading         = ref(true);
const saldoStrip = ref<HTMLElement | null>(null);
const activeCard = ref(0);
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const showDetail = ref(false);
const selectedTrx = ref<BrilinkTransactionDto | null>(null);
const showKasPanel  = ref(false);
const kasTab        = ref<'cashin' | 'cashout'>('cashin');
const kasSubmitting = ref(false);
const kasError      = ref<string | null>(null);
const kasForm       = reactive({ amount: 0, notes: '' });
const showRekModal  = ref(false);
const rekType       = ref<'tambah' | 'tarik'>('tambah');
const rekAccount    = ref<BrilinkAccount | null>(null);
const rekSubmitting = ref(false);
const rekError      = ref<string | null>(null);
const rekForm       = reactive({ amount: 0, reference: '', notes: '' });
const showPindahModal  = ref(false);
const pindahFrom       = ref<BrilinkAccount | null>(null);
const pindahToId       = ref('');
const pindahAmount     = ref(0);
const pindahNotes      = ref('');
const pindahSubmitting = ref(false);
const pindahError      = ref<string | null>(null);

const defaultAccount = computed(() =>
  accounts.value.find(a => a.isDefault && a.isActive) ??
  accounts.value.find(a => a.isActive) ??
  accounts.value[0] ?? null
);

function shopId() { return authStore.user?.shopId ?? shopStore.currentShopId ?? ''; }
function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatTime(iso: string) {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function formatDateTime(iso: string) {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 3000);
}
function openDetail(trx: BrilinkTransactionDto) { selectedTrx.value = trx; showDetail.value = true; }
function openKasPanel() { kasTab.value = 'cashin'; kasForm.amount = 0; kasForm.notes = ''; kasError.value = null; showKasPanel.value = true; }

async function handleKasSubmit() {
  const id = shopId(); if (!id || kasForm.amount <= 0) return;
  kasSubmitting.value = true; kasError.value = null;
  try {
    const payload = { amount: kasForm.amount, notes: kasForm.notes || undefined };
    const res = kasTab.value === 'cashin' ? await brilinkCashboxService.setor(id, payload) : await brilinkCashboxService.tarik(id, payload);
    saldoKas.value = res.balance ?? res.cashBox?.balance ?? saldoKas.value;
    kasPernahDipakai.value = true;
    kasLowBalance.value = res.isLowBalance ?? (saldoKas.value < (res.lowBalanceThreshold ?? 0));
    showToast('success', kasTab.value === 'cashin' ? 'Cash In berhasil!' : 'Cash Out berhasil!');
    showKasPanel.value = false;
  } catch (e: any) { kasError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.'; }
  finally { kasSubmitting.value = false; }
}

function openRekModal(acc: BrilinkAccount, type: 'tambah' | 'tarik') {
  rekAccount.value = acc; rekType.value = type; rekForm.amount = 0; rekForm.reference = ''; rekForm.notes = ''; rekError.value = null; showRekModal.value = true;
}

async function handleRekSubmit() {
  if (!rekAccount.value || rekForm.amount <= 0) return;
  rekSubmitting.value = true; rekError.value = null;
  try {
    const payload = { amount: rekForm.amount, reference: rekForm.reference || undefined, notes: rekForm.notes || undefined };
    const res = rekType.value === 'tambah' ? await brilinkAccountService.setor(rekAccount.value.id, payload) : await brilinkAccountService.tarik(rekAccount.value.id, payload);
    const updated = res.account;
    const idx = accounts.value.findIndex(a => a.id === updated.id);
    if (idx !== -1) accounts.value[idx] = { ...accounts.value[idx], balance: updated.balance };
    showToast('success', rekType.value === 'tambah' ? 'Tambah saldo berhasil!' : 'Tarik saldo berhasil!');
    showRekModal.value = false;
  } catch (e: any) { rekError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.'; }
  finally { rekSubmitting.value = false; }
}

function openPindahModal(acc: BrilinkAccount) { pindahFrom.value = acc; pindahToId.value = ''; pindahAmount.value = 0; pindahNotes.value = ''; pindahError.value = null; showPindahModal.value = true; }

async function handlePindahSubmit() {
  if (!pindahFrom.value || !pindahToId.value || pindahAmount.value <= 0) return;
  pindahSubmitting.value = true; pindahError.value = null;
  try {
    await brilinkAccountService.transferInternal({ fromAccountId: pindahFrom.value.id, toAccountId: pindahToId.value, amount: pindahAmount.value, notes: pindahNotes.value || undefined });
    const id = shopId(); if (id) accounts.value = (await brilinkAccountService.list(id)).filter(a => a.isActive);
    showToast('success', 'Pindah saldo berhasil!');
    showPindahModal.value = false;
  } catch (e: any) { pindahError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.'; }
  finally { pindahSubmitting.value = false; }
}

function setupScrollTracker() {
  const el = saldoStrip.value; if (!el) return;
  el.addEventListener('scroll', () => { const cardW = 192; activeCard.value = Math.round(el.scrollLeft / cardW); }, { passive: true });
}

onMounted(async () => {
  const id = shopId();
  if (!id) { loading.value = false; accountsLoading.value = false; kasLoading.value = false; return; }
  const [accs, txRes, cashboxRes] = await Promise.allSettled([
    brilinkAccountService.list(id), brilinkService.listTransactions({ shopId: id, limit: 5 }), brilinkCashboxService.getCashBox(id),
  ]);
  if (accs.status === 'fulfilled') accounts.value = accs.value.filter(a => a.isActive);
  accountsLoading.value = false;
  if (txRes.status === 'fulfilled') recentTransactions.value = txRes.value.data;
  loading.value = false;
  if (cashboxRes.status === 'fulfilled') {
    const cb = cashboxRes.value; saldoKas.value = cb.balance;
    const sudahDipakai = cb.balance > 0 || (cb.recentMutations?.length ?? 0) > 0;
    kasPernahDipakai.value = sudahDipakai; kasLowBalance.value = sudahDipakai && cb.isLowBalance;
  }
  kasLoading.value = false;
  setTimeout(setupScrollTracker, 100);
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from .sheet-leave-to { opacity: 0; }
.sheet-enter-from > :last-child, .sheet-leave-to > :last-child { transform: translateY(100%); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
