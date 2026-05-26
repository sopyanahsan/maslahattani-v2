<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Top bar: search -->
    <div class="shrink-0 px-4 py-3 bg-white border-b border-slate-200">
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Cari produk (nama / SKU)..."
          class="w-full h-10 pl-9 pr-3 text-sm border border-slate-300 rounded-lg
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Main content: 2-column (products | cart) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- ============================================ -->
      <!-- LEFT: Product Grid                          -->
      <!-- ============================================ -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- Loading -->
        <div v-if="productsLoading" class="flex items-center justify-center py-12">
          <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          <span class="ml-2 text-sm text-slate-500">Memuat produk...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="products.length === 0" class="text-center py-12">
          <PackageIcon class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-sm text-slate-500">
            {{ searchQuery ? 'Produk tidak ditemukan.' : 'Ketik nama/SKU untuk cari produk.' }}
          </p>
        </div>

        <!-- Product grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          <button
            v-for="product in products"
            :key="product.id"
            type="button"
            :disabled="product.totalStock <= 0"
            class="bg-white border border-slate-200 rounded-lg p-3 text-left
                   hover:border-blue-300 hover:bg-blue-50/30 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white"
            @click="addToCart(product)"
          >
            <p class="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight mb-1">
              {{ product.name }}
            </p>
            <code class="text-[10px] font-mono text-slate-500 block mb-1.5">{{ product.sku }}</code>
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-blue-700">
                {{ formatRupiah(product.price) }}
              </span>
              <span
                :class="[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded',
                  product.totalStock > 5 ? 'bg-emerald-100 text-emerald-700' :
                  product.totalStock > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700',
                ]"
              >
                {{ product.totalStock > 0 ? product.totalStock : 'Habis' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- RIGHT: Cart Panel                           -->
      <!-- ============================================ -->
      <div class="w-80 lg:w-96 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
        <!-- Cart header -->
        <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShoppingCartIcon class="w-4 h-4 text-blue-600" />
            Keranjang
            <span v-if="cart.length > 0" class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              {{ totals.totalItems }}
            </span>
          </h2>
          <button
            v-if="cart.length > 0"
            type="button"
            class="text-[10px] font-semibold text-red-600 hover:text-red-700"
            @click="clearCart"
          >
            Kosongkan
          </button>
        </div>

        <!-- Cart items -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
            <ShoppingCartIcon class="w-8 h-8 text-slate-200 mb-2" />
            <p class="text-xs text-slate-500">Keranjang kosong</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Tap produk untuk menambahkan</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="item in cart"
              :key="item.productId"
              class="px-4 py-3 space-y-2"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-slate-900 truncate">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-500 font-mono">
                    {{ formatRupiah(item.price) }} /pcs
                  </p>
                </div>
                <button
                  type="button"
                  class="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 transition-colors"
                  @click="removeFromCart(item.productId)"
                >
                  <XIcon class="w-3 h-3 text-red-500" />
                </button>
              </div>

              <!-- Qty controls -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-slate-100 transition-colors text-slate-600"
                    @click="updateQty(item.productId, item.quantity - 1)"
                  >
                    <MinusIcon class="w-3 h-3" />
                  </button>
                  <input
                    :value="item.quantity"
                    type="number"
                    min="1"
                    :max="item.maxStock"
                    class="w-10 h-7 text-center text-xs font-mono font-semibold border border-slate-200
                           rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    @change="(e) => updateQty(item.productId, parseInt((e.target as HTMLInputElement).value) || 1)"
                  />
                  <button
                    type="button"
                    :disabled="item.quantity >= item.maxStock"
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-slate-100 transition-colors text-slate-600
                           disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="updateQty(item.productId, item.quantity + 1)"
                  >
                    <PlusIcon class="w-3 h-3" />
                  </button>
                </div>
                <span class="text-xs font-mono font-bold text-slate-900">
                  {{ formatRupiah(item.subtotal) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart footer / checkout -->
        <div v-if="cart.length > 0" class="shrink-0 border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          <!-- Totals -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs text-slate-500">
              <span>Subtotal ({{ totals.totalItems }} item)</span>
              <span class="font-mono">{{ formatRupiah(totals.totalPrice) }}</span>
            </div>
            <div v-if="totals.totalDiscount > 0" class="flex justify-between text-xs text-red-600">
              <span>Diskon</span>
              <span class="font-mono">-{{ formatRupiah(totals.totalDiscount) }}</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-slate-950 pt-1 border-t border-slate-200">
              <span>Total</span>
              <span class="font-mono">{{ formatRupiah(totals.totalPrice) }}</span>
            </div>
          </div>

          <!-- Payment method -->
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Metode Bayar</p>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                :class="[
                  'h-8 rounded-md text-[10px] font-bold uppercase transition-colors border',
                  selectedMethod === method.value
                    ? method.activeClass
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100',
                ]"
                @click="selectedMethod = method.value"
              >
                {{ method.label }}
              </button>
            </div>
          </div>

          <!-- Amount paid (cash only) -->
          <div v-if="selectedMethod === 'CASH'">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Uang Dibayar</label>
            <input
              v-model.number="amountPaid"
              type="number"
              :min="totals.totalPrice"
              :placeholder="String(totals.totalPrice)"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <p v-if="change > 0" class="text-xs font-mono text-emerald-600 mt-1">
              Kembalian: {{ formatRupiah(change) }}
            </p>
          </div>

          <!-- Error -->
          <div v-if="checkoutError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ checkoutError }}
          </div>

          <!-- Checkout button -->
          <button
            type="button"
            :disabled="checking"
            class="w-full h-11 bg-blue-600 text-white text-sm font-bold rounded-lg
                   hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
            @click="handleCheckout"
          >
            <Loader2Icon v-if="checking" class="w-4 h-4 animate-spin" />
            <CheckCircleIcon v-else class="w-4 h-4" />
            {{ checking ? 'Memproses...' : 'Bayar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Success Receipt Modal                        -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showReceipt && receiptData" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon class="w-7 h-7 text-emerald-600" />
            </div>
            <h2 class="text-base font-bold text-slate-950">Transaksi Berhasil!</h2>
            <code class="text-xs font-mono text-slate-500">{{ receiptData.transactionNumber }}</code>
          </div>

          <div class="bg-slate-50 rounded-lg p-4 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Total</span>
              <span class="font-mono font-bold text-slate-900">{{ formatRupiah(receiptData.totalPrice) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Metode</span>
              <span :class="['font-bold uppercase px-1.5 py-0.5 rounded text-[10px]', methodBadge(receiptData.paymentMethod)]">
                {{ receiptData.paymentMethod }}
              </span>
            </div>
            <div v-if="receiptData.paymentMethod === 'CASH'" class="flex justify-between text-xs">
              <span class="text-slate-500">Dibayar</span>
              <span class="font-mono text-slate-700">{{ formatRupiah(receiptData.amountPaid) }}</span>
            </div>
            <div v-if="receiptData.change > 0" class="flex justify-between text-xs">
              <span class="text-slate-500">Kembalian</span>
              <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(receiptData.change) }}</span>
            </div>
            <div class="border-t border-slate-200 pt-2 flex justify-between text-xs">
              <span class="text-slate-500">Profit</span>
              <span class="font-mono text-emerald-600">+{{ formatRupiah(receiptData.profit) }}</span>
            </div>
          </div>

          <button
            type="button"
            class="w-full h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-blue-700 transition-colors"
            @click="closeReceipt"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  CheckCircle2 as CheckCircleIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import posService, {
  type POSProductDto,
  type CartItem,
  type PaymentMethod,
  type TransactionSummary,
  createCartItem,
  recalcCartItem,
  calcCartTotals,
} from '@/shared/services/pos.service';

const authStore = useAuthStore();
const searchInput = ref<HTMLInputElement | null>(null);

// ============================================
// Products state
// ============================================
const products = ref<POSProductDto[]>([]);
const productsLoading = ref(false);
const searchQuery = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Cart state
// ============================================
const cart = ref<CartItem[]>([]);
const selectedMethod = ref<PaymentMethod>('CASH');
const amountPaid = ref<number>(0);
const checking = ref(false);
const checkoutError = ref<string | null>(null);

// Receipt
const showReceipt = ref(false);
const receiptData = ref<TransactionSummary | null>(null);

const paymentMethods = [
  { value: 'CASH' as PaymentMethod, label: 'Cash', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { value: 'QRIS' as PaymentMethod, label: 'QRIS', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
  { value: 'TRANSFER' as PaymentMethod, label: 'TF', activeClass: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
  { value: 'HUTANG' as PaymentMethod, label: 'Hutang', activeClass: 'border-amber-500 bg-amber-50 text-amber-700' },
];

// ============================================
// Computed
// ============================================
const totals = computed(() => calcCartTotals(cart.value));
const change = computed(() => {
  if (selectedMethod.value !== 'CASH') return 0;
  return Math.max(0, (amountPaid.value || 0) - totals.value.totalPrice);
});

// ============================================
// Methods
// ============================================

function getShopId(): string {
  return authStore.user?.shopId ?? '';
}

async function fetchProducts() {
  const shopId = getShopId();
  if (!shopId) return;
  productsLoading.value = true;
  try {
    products.value = await posService.searchProducts(shopId, searchQuery.value || undefined);
  } catch {
    products.value = [];
  } finally {
    productsLoading.value = false;
  }
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchProducts, 300);
}

function addToCart(product: POSProductDto) {
  const existing = cart.value.find((i) => i.productId === product.id);
  if (existing) {
    if (existing.quantity < existing.maxStock) {
      existing.quantity += 1;
      Object.assign(existing, recalcCartItem(existing));
    }
  } else {
    cart.value.push(createCartItem(product, 1));
  }
}

function updateQty(productId: string, qty: number) {
  const item = cart.value.find((i) => i.productId === productId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  item.quantity = Math.min(qty, item.maxStock);
  Object.assign(item, recalcCartItem(item));
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter((i) => i.productId !== productId);
}

function clearCart() {
  cart.value = [];
  checkoutError.value = null;
}

async function handleCheckout() {
  if (cart.value.length === 0) return;

  // Validate cash payment
  if (selectedMethod.value === 'CASH' && amountPaid.value < totals.value.totalPrice) {
    checkoutError.value = 'Uang dibayar kurang dari total.';
    return;
  }

  checking.value = true;
  checkoutError.value = null;

  try {
    const idempotencyKey = crypto.randomUUID();
    const response = await posService.createTransaction({
      items: cart.value.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        discount: i.discount > 0 ? i.discount : undefined,
      })),
      paymentMethod: selectedMethod.value,
      amountPaid: selectedMethod.value === 'CASH' ? amountPaid.value || totals.value.totalPrice : undefined,
      idempotencyKey,
      clientCreatedAt: new Date().toISOString(),
    });

    receiptData.value = response.summary;
    showReceipt.value = true;

    // Reset cart
    cart.value = [];
    amountPaid.value = 0;
    selectedMethod.value = 'CASH';

    // Refresh product stock
    await fetchProducts();
  } catch (err: any) {
    checkoutError.value = err.response?.data?.message ?? err.message ?? 'Gagal memproses transaksi.';
  } finally {
    checking.value = false;
  }
}

function closeReceipt() {
  showReceipt.value = false;
  receiptData.value = null;
  // Focus search for next transaction
  searchInput.value?.focus();
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchProducts();
  searchInput.value?.focus();
});
</script>
