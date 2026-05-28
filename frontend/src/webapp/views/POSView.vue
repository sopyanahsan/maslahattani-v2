<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -mx-4 -mt-4">
    <!-- Top: Search + Scan + View Toggle -->
    <div class="shrink-0 bg-white border-b border-slate-200 p-3 space-y-3">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <SearchIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk..."
            class="w-full bg-slate-100 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border border-transparent outline-none transition-all"
            @input="debouncedSearch"
          />
        </div>
        <button class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" @click="showScanModal = true">
          <CameraIcon class="w-5 h-5" />
        </button>
        <div class="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
          <button :class="['w-9 h-9 flex items-center justify-center', viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']" @click="viewMode = 'grid'">
            <LayoutGridIcon class="w-4 h-4" />
          </button>
          <button :class="['w-9 h-9 flex items-center justify-center', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']" @click="viewMode = 'list'">
            <ListIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="flex overflow-x-auto gap-2 hide-scrollbar">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="['px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors', selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Product Area -->
    <div class="flex-1 overflow-y-auto p-3 bg-slate-50">
      <!-- Loading -->
      <div v-if="productsLoading" class="flex items-center justify-center py-12">
        <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <PackageIcon class="w-12 h-12 text-slate-300 mb-3" />
        <p class="text-sm text-slate-500">{{ searchQuery ? 'Produk tidak ditemukan' : 'Cari atau scan produk' }}</p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          v-for="product in filteredProducts"
          :key="product.id"
          :disabled="product.totalStock <= 0"
          class="bg-white border border-slate-200 rounded-xl p-2.5 text-left hover:border-blue-300 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          @click="addToCart(product)"
        >
          <div class="relative w-full aspect-[4/3] bg-slate-100 rounded-lg mb-2 overflow-hidden">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
            <PackageIcon v-else class="w-8 h-8 text-slate-300 absolute inset-0 m-auto" />
            <span class="absolute top-1.5 right-1.5 text-[9px] font-bold bg-white/90 text-slate-700 px-1.5 py-0.5 rounded shadow-sm">
              {{ product.totalStock }} {{ product.unit || 'pcs' }}
            </span>
          </div>
          <p class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">{{ product.name }}</p>
          <p class="text-xs font-mono font-bold text-blue-600">{{ formatRupiah(product.price) }}</p>
        </button>
      </div>

      <!-- List View -->
      <div v-else class="space-y-2">
        <button
          v-for="product in filteredProducts"
          :key="product.id"
          :disabled="product.totalStock <= 0"
          class="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-blue-300 transition-all disabled:opacity-40"
          @click="addToCart(product)"
        >
          <div class="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
            <PackageIcon v-else class="w-5 h-5 text-slate-300" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ product.name }}</p>
            <p class="text-[10px] text-slate-500 font-mono">{{ product.sku }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-mono font-bold text-blue-600">{{ formatRupiah(product.price) }}</p>
            <p class="text-[10px] text-slate-500">{{ product.totalStock }} {{ product.unit || 'pcs' }}</p>
          </div>
          <PlusCircleIcon class="w-5 h-5 text-blue-500 shrink-0" />
        </button>
      </div>
    </div>

    <!-- Bottom Cart Bar -->
    <div v-if="cart.length > 0" class="shrink-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-slate-600">
          <ShoppingCartIcon class="w-4 h-4 inline mr-1" />{{ totalItems }} item
        </span>
        <span class="text-lg font-bold text-blue-600">{{ formatRupiah(totalPrice) }}</span>
      </div>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors" @click="showCart = true">
        Bayar Pesanan
      </button>
    </div>

    <!-- Empty Cart Bottom -->
    <div v-else class="shrink-0 bg-white border-t border-slate-200 p-3">
      <button disabled class="w-full bg-slate-200 text-slate-400 font-bold py-3 rounded-xl cursor-not-allowed">
        Bayar Pesanan
      </button>
    </div>

    <!-- Scan Modal -->
    <Teleport to="body">
      <div v-if="showScanModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showScanModal = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
          <h3 class="text-base font-bold text-slate-800">Scan Barcode</h3>
          <div class="w-full aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
            <CameraIcon class="w-12 h-12 text-slate-300" />
          </div>
          <p class="text-xs text-slate-500">Arahkan kamera ke barcode produk</p>
          <button class="w-full h-10 bg-slate-100 text-slate-700 font-semibold rounded-lg" @click="showScanModal = false">Tutup</button>
        </div>
      </div>
    </Teleport>

    <!-- Cart Modal -->
    <CartModal
      v-if="showCart"
      :cart="cart"
      :total-price="totalPrice"
      @close="showCart = false"
      @update-qty="updateQty"
      @remove-item="removeFromCart"
      @checkout-success="handleCheckoutSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search as SearchIcon, Camera as CameraIcon, LayoutGrid as LayoutGridIcon,
  List as ListIcon, Package as PackageIcon, PlusCircle as PlusCircleIcon,
  ShoppingCart as ShoppingCartIcon, Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import posService, { type POSProductDto, type CartItem, createCartItem, recalcCartItem } from '@/shared/services/pos.service';
import CartModal from '@/webapp/components/cart/CartModal.vue';

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const selectedCategory = ref('Semua');
const categories = ref(['Semua']);
const products = ref<POSProductDto[]>([]);
const productsLoading = ref(false);
const cart = ref<CartItem[]>([]);
const showScanModal = ref(false);
const showCart = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'Semua') return products.value;
  return products.value.filter(p => (p as any).category === selectedCategory.value);
});

const totalItems = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0));
const totalPrice = computed(() => cart.value.reduce((sum, i) => sum + i.subtotal, 0));

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }

function selectCategory(cat: string) { selectedCategory.value = cat; }

async function fetchProducts() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  productsLoading.value = true;
  try {
    products.value = await posService.searchProducts(shopId, searchQuery.value || undefined);
    // Extract unique categories
    const cats = new Set(products.value.map((p: any) => p.category).filter(Boolean));
    categories.value = ['Semua', ...Array.from(cats)];
  } catch { products.value = []; }
  finally { productsLoading.value = false; }
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchProducts, 300);
}

function addToCart(product: POSProductDto) {
  const existing = cart.value.find(i => i.productId === product.id);
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
  const item = cart.value.find(i => i.productId === productId);
  if (!item) return;
  if (qty <= 0) { removeFromCart(productId); return; }
  item.quantity = Math.min(qty, item.maxStock);
  Object.assign(item, recalcCartItem(item));
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter(i => i.productId !== productId);
}

function handleCheckoutSuccess() {
  cart.value = [];
  showCart.value = false;
}

onMounted(fetchProducts);
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
