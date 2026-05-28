<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex flex-col justify-end">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>

      <!-- Bottom Sheet -->
      <div class="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div class="flex items-center gap-2">
            <ShoppingCartIcon class="w-5 h-5 text-blue-600" />
            <h2 class="font-bold text-base text-slate-800">Keranjang</h2>
            <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{{ cart.length }}</span>
          </div>
          <button class="p-1 hover:bg-slate-100 rounded-lg" @click="$emit('close')">
            <XIcon class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <!-- Cart Items (scrollable) -->
        <div class="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          <div v-for="item in cart" :key="item.productId" class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ item.name }}</p>
              <p class="text-xs text-slate-500">1 {{ (item as any).unit || 'pcs' }} x {{ formatRupiah(item.price) }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200" @click="$emit('update-qty', item.productId, item.quantity - 1)">
                <MinusIcon class="w-3.5 h-3.5" />
              </button>
              <span class="w-8 text-center text-sm font-bold text-slate-800">{{ item.quantity }}</span>
              <button class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100" @click="$emit('update-qty', item.productId, item.quantity + 1)">
                <PlusIcon class="w-3.5 h-3.5" />
              </button>
            </div>
            <span class="text-sm font-bold text-slate-800 w-24 text-right shrink-0">{{ formatRupiah(item.subtotal) }}</span>
          </div>
        </div>

        <!-- Summary + Payment -->
        <div class="shrink-0 border-t border-slate-200 px-5 py-4 space-y-4 bg-slate-50">
          <!-- Totals -->
          <div class="space-y-1">
            <div class="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span class="font-mono">{{ formatRupiah(totalPrice) }}</span>
            </div>
            <div class="flex justify-between text-sm text-red-500">
              <span>Diskon</span>
              <span class="font-mono">- {{ formatRupiah(discount) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold text-blue-600 pt-1 border-t border-slate-200">
              <span>Total Bayar</span>
              <span class="font-mono">{{ formatRupiah(grandTotal) }}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <p class="text-xs font-semibold text-slate-600 mb-2">Metode Pembayaran</p>
            <div class="grid grid-cols-2 gap-2">
              <button :class="['p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all', paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white']" @click="paymentMethod = 'CASH'">
                <BanknoteIcon class="w-5 h-5" :class="paymentMethod === 'CASH' ? 'text-blue-600' : 'text-slate-400'" />
                <span class="text-xs font-semibold" :class="paymentMethod === 'CASH' ? 'text-blue-600' : 'text-slate-500'">Tunai</span>
              </button>
              <button disabled class="p-3 rounded-xl border-2 border-slate-200 bg-slate-50 flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
                <QrCodeIcon class="w-5 h-5 text-slate-400" />
                <span class="text-xs font-semibold text-slate-400">QRIS</span>
                <span class="text-[9px] text-slate-400">Nonaktif</span>
              </button>
            </div>
          </div>

          <!-- Kas Tujuan -->
          <div>
            <p class="text-xs font-semibold text-slate-600 mb-1.5">Kas Tujuan Tunai</p>
            <select v-model="selectedKas" class="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none">
              <option v-for="kas in kasOptions" :key="kas.id" :value="kas.id">{{ kas.label }}</option>
            </select>
            <p class="text-[10px] text-slate-400 mt-1">Default Kas Retail. Kas tambahan dari Admin otomatis muncul.</p>
          </div>

          <!-- Uang Customer (only for CASH) -->
          <div v-if="paymentMethod === 'CASH'">
            <p class="text-xs font-semibold text-slate-600 mb-1.5">Uang Customer</p>
            <input v-model.number="amountPaid" type="number" :min="grandTotal" placeholder="0" class="w-full h-11 px-4 text-base font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none text-right" />
            <div class="flex gap-2 mt-2">
              <button class="flex-1 h-8 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200" @click="amountPaid = grandTotal">Pas</button>
              <button class="flex-1 h-8 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200" @click="amountPaid = 50000">50rb</button>
              <button class="flex-1 h-8 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200" @click="amountPaid = 100000">100rb</button>
            </div>
            <div v-if="change > 0" class="mt-2 flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2">
              <span class="text-xs text-emerald-700 font-medium">Kembalian</span>
              <span class="text-sm font-bold font-mono text-emerald-600">{{ formatRupiah(change) }}</span>
            </div>
          </div>

          <!-- Error -->
          <div v-if="checkoutError" class="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{{ checkoutError }}</div>

          <!-- Submit -->
          <button
            :disabled="!canCheckout || checking"
            class="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            @click="handleCheckout"
          >
            <Loader2Icon v-if="checking" class="w-5 h-5 animate-spin" />
            <span>{{ checking ? 'Memproses...' : 'Proses Pembayaran' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ShoppingCart as ShoppingCartIcon, X as XIcon, Minus as MinusIcon,
  Plus as PlusIcon, Banknote as BanknoteIcon, QrCode as QrCodeIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { CartItem } from '@/shared/services/pos.service';
import posService from '@/shared/services/pos.service';
import { addPendingTransaction } from '@/shared/services/offline-store';

const props = defineProps<{
  cart: CartItem[];
  totalPrice: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update-qty', productId: string, qty: number): void;
  (e: 'remove-item', productId: string): void;
  (e: 'checkout-success'): void;
}>();

const router = useRouter();
const paymentMethod = ref<'CASH' | 'QRIS'>('CASH');
const selectedKas = ref('default');
const kasOptions = ref([{ id: 'default', label: 'Kas Retail / Toko' }]);
const amountPaid = ref(0);
const discount = ref(0);
const checking = ref(false);
const checkoutError = ref<string | null>(null);

const grandTotal = computed(() => Math.max(0, props.totalPrice - discount.value));
const change = computed(() => Math.max(0, (amountPaid.value || 0) - grandTotal.value));
const canCheckout = computed(() => {
  if (props.cart.length === 0) return false;
  if (paymentMethod.value === 'CASH' && amountPaid.value < grandTotal.value) return false;
  return true;
});

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

async function handleCheckout() {
  checking.value = true;
  checkoutError.value = null;

  const idempotencyKey = crypto.randomUUID();
  const payload = {
    items: props.cart.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      discount: i.discount > 0 ? i.discount : undefined,
    })),
    paymentMethod: paymentMethod.value,
    amountPaid: paymentMethod.value === 'CASH' ? amountPaid.value || grandTotal.value : undefined,
    idempotencyKey,
    clientCreatedAt: new Date().toISOString(),
  };

  try {
    if (navigator.onLine) {
      const response = await posService.createTransaction(payload);
      // Navigate to receipt
      router.push({ name: 'webapp-receipt', query: { trxNumber: response.summary.transactionNumber, total: String(grandTotal.value), paid: String(amountPaid.value || grandTotal.value), change: String(change.value), method: paymentMethod.value } });
    } else {
      await addPendingTransaction(payload);
      router.push({ name: 'webapp-receipt', query: { trxNumber: 'OFFLINE-' + idempotencyKey.slice(0, 8), total: String(grandTotal.value), paid: String(amountPaid.value || grandTotal.value), change: String(change.value), method: paymentMethod.value, offline: '1' } });
    }
    emit('checkout-success');
  } catch (err: any) {
    checkoutError.value = err?.response?.data?.message || err?.message || 'Gagal memproses pembayaran.';
  } finally {
    checking.value = false;
  }
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
