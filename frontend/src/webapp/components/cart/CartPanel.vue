<template>
  <div class="h-full flex flex-col bg-white border-l border-slate-200">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-2">
        <ShoppingCartIcon class="w-4 h-4 text-blue-600" />
        <h2 class="font-bold text-sm text-slate-800">Keranjang</h2>
        <span v-if="cart.length > 0" class="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{{ cart.length }}</span>
      </div>
    </div>

    <!-- Cart Items -->
    <div class="flex-1 overflow-y-auto px-4 py-2 space-y-1">
      <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-full text-center">
        <ShoppingCartIcon class="w-8 h-8 text-slate-200 mb-2" />
        <p class="text-xs text-slate-400">Tap produk untuk menambahkan</p>
      </div>
      <div v-for="item in cart" :key="item.productId" class="py-2 border-b border-slate-50 last:border-0">
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-800 truncate">{{ item.name }}</p>
            <p class="text-[10px] text-slate-500">{{ item.quantity }} × {{ formatRupiah(item.price) }}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-600" @click="$emit('update-qty', item.productId, item.quantity - 1)"><MinusIcon class="w-2.5 h-2.5" /></button>
            <span class="w-5 text-center text-[10px] font-bold">{{ item.quantity }}</span>
            <button class="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600" @click="$emit('update-qty', item.productId, item.quantity + 1)"><PlusIcon class="w-2.5 h-2.5" /></button>
          </div>
          <span class="text-[11px] font-bold text-slate-800 w-16 text-right shrink-0">{{ formatRupiah(item.subtotal) }}</span>
        </div>
        <div class="flex items-center gap-1.5 mt-1">
          <span class="text-[9px] text-slate-400">Diskon:</span>
          <input :value="item.discount || 0" type="number" min="0" class="w-16 h-4 px-1 text-[9px] font-mono border border-slate-200 rounded text-right focus:border-blue-400 outline-none" @change="(e) => $emit('update-discount', item.productId, Number((e.target as HTMLInputElement).value) || 0)" />
        </div>
      </div>
    </div>

    <!-- Summary + Payment (always visible) -->
    <div class="shrink-0 border-t border-slate-200 px-4 py-3 space-y-2.5 bg-slate-50/80 overflow-y-auto max-h-[50%]">
      <!-- Totals -->
      <div class="space-y-0.5">
        <div class="flex justify-between text-[11px] text-slate-600"><span>Subtotal</span><span class="font-mono">{{ formatRupiah(totalPrice) }}</span></div>
        <div class="flex justify-between text-[11px] text-red-500"><span>Diskon</span><span class="font-mono">- {{ formatRupiah(discount) }}</span></div>
        <div class="flex justify-between text-sm font-bold text-blue-600 pt-1 border-t border-slate-200"><span>Total</span><span class="font-mono">{{ formatRupiah(grandTotal) }}</span></div>
      </div>

      <!-- Payment Method -->
      <div>
        <p class="text-[10px] font-semibold text-slate-600 mb-1">Metode Bayar</p>
        <div class="grid grid-cols-2 gap-1.5">
          <button :class="['py-1.5 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all', paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500']" @click="paymentMethod = 'CASH'">
            <BanknoteIcon class="w-3.5 h-3.5" /> Tunai
          </button>
          <button disabled class="py-1.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 opacity-50">
            <QrCodeIcon class="w-3.5 h-3.5" /> QRIS
          </button>
        </div>
      </div>

      <!-- Kas Tujuan -->
      <div>
        <p class="text-[10px] font-semibold text-slate-600 mb-1">Kas Tujuan</p>
        <select v-model="selectedKas" class="w-full h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none">
          <option v-for="kas in kasOptions" :key="kas.id" :value="kas.id">{{ kas.label }}</option>
        </select>
      </div>

      <!-- Uang Customer -->
      <div v-if="paymentMethod === 'CASH'">
        <p class="text-[10px] font-semibold text-slate-600 mb-1">Uang Customer</p>
        <input v-model.number="amountPaid" type="number" :min="grandTotal" placeholder="0" class="w-full h-8 px-3 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none text-right" />
        <div class="flex gap-1.5 mt-1">
          <button class="flex-1 h-6 text-[10px] font-semibold bg-slate-100 rounded hover:bg-slate-200" @click="amountPaid = grandTotal">Pas</button>
          <button class="flex-1 h-6 text-[10px] font-semibold bg-slate-100 rounded hover:bg-slate-200" @click="amountPaid = 50000">50rb</button>
          <button class="flex-1 h-6 text-[10px] font-semibold bg-slate-100 rounded hover:bg-slate-200" @click="amountPaid = 100000">100rb</button>
        </div>
        <div v-if="change > 0" class="mt-1.5 flex justify-between items-center bg-emerald-50 rounded-lg px-2.5 py-1.5">
          <span class="text-[10px] text-emerald-700">Kembalian</span>
          <span class="text-xs font-bold font-mono text-emerald-600">{{ formatRupiah(change) }}</span>
        </div>
      </div>

      <!-- Submit -->
      <button
        :disabled="!canCheckout || checking"
        class="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        @click="handleCheckout"
      >
        <Loader2Icon v-if="checking" class="w-4 h-4 animate-spin" />
        <span>{{ checking ? 'Proses...' : 'Proses Pembayaran' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ShoppingCart as ShoppingCartIcon, Minus as MinusIcon, Plus as PlusIcon, Banknote as BanknoteIcon, QrCode as QrCodeIcon, Loader2 as Loader2Icon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { CartItem } from '@/shared/services/pos.service';
import posService from '@/shared/services/pos.service';
import { addPendingTransaction } from '@/shared/services/offline-store';

const props = defineProps<{ cart: CartItem[]; totalPrice: number }>();
const emit = defineEmits<{
  (e: 'update-qty', productId: string, qty: number): void;
  (e: 'update-discount', productId: string, discount: number): void;
  (e: 'checkout-success'): void;
}>();

const router = useRouter();
const paymentMethod = ref<'CASH' | 'QRIS'>('CASH');
const selectedKas = ref('default');
const kasOptions = ref([{ id: 'default', label: 'Kas Retail / Toko' }]);
const amountPaid = ref(0);
const checking = ref(false);

const discount = computed(() => props.cart.reduce((sum, i) => sum + (i.discount || 0), 0));
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
  const idempotencyKey = crypto.randomUUID();
  const payload = {
    items: props.cart.map(i => ({ productId: i.productId, quantity: i.quantity, discount: i.discount > 0 ? i.discount : undefined })),
    paymentMethod: paymentMethod.value,
    amountPaid: paymentMethod.value === 'CASH' ? amountPaid.value || grandTotal.value : undefined,
    idempotencyKey,
    clientCreatedAt: new Date().toISOString(),
  };
  try {
    if (navigator.onLine) {
      const response = await posService.createTransaction(payload);
      router.push({ name: 'webapp-receipt', query: { trxNumber: response.summary.transactionNumber, total: String(grandTotal.value), paid: String(amountPaid.value || grandTotal.value), change: String(change.value), method: paymentMethod.value } });
    } else {
      await addPendingTransaction(payload);
      router.push({ name: 'webapp-receipt', query: { trxNumber: 'OFFLINE-' + idempotencyKey.slice(0, 8), total: String(grandTotal.value), paid: String(amountPaid.value || grandTotal.value), change: String(change.value), method: paymentMethod.value, offline: '1' } });
    }
    emit('checkout-success');
  } catch { /* error */ }
  finally { checking.value = false; }
}
</script>
