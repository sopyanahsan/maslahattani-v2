<template>
  <div class="flex flex-col md:flex-row min-h-[calc(100vh-7.5rem)]">

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm"
        :class="{ 'bg-emerald-600 text-white': toast.type === 'success', 'bg-red-600 text-white': toast.type === 'error', 'bg-slate-800 text-white': toast.type === 'info' }">
        <CheckIcon v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
        <XIcon v-if="toast.type === 'error'" class="w-4 h-4 shrink-0" />
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- === LEFT COLUMN: Products (always visible) === -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden h-[calc(100vh-7.5rem)]">
      <!-- Top: Header + Search + Scan + View Toggle -->
      <div class="shrink-0 bg-white border-b border-slate-200 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCartIcon class="w-5 h-5 text-blue-600" /> Kasir
          </h2>
          <button class="text-xs font-medium text-slate-600 flex items-center gap-1 hover:text-blue-600 transition-colors" @click="refreshSavedBills(); showOpenBill = true">
            <ClipboardListIcon class="w-4 h-4" /> Open Bill
          </button>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <SearchIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input v-model="searchQuery" type="text" placeholder="Cari nama / SKU produk..." class="w-full bg-slate-100 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border border-transparent outline-none transition-all" @input="debouncedSearch" />
          </div>
          <button class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" @click="showScanModal = true; setTimeout(startCamera, 300)">
            <ScanBarcodeIcon class="w-5 h-5" />
          </button>
          <div class="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
            <button :class="['w-9 h-9 flex items-center justify-center', viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']" @click="viewMode = 'grid'"><LayoutGridIcon class="w-4 h-4" /></button>
            <button :class="['w-9 h-9 flex items-center justify-center', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']" @click="viewMode = 'list'"><ListIcon class="w-4 h-4" /></button>
          </div>
        </div>
        <div class="flex overflow-x-auto gap-2 hide-scrollbar">
          <button v-for="cat in categories" :key="cat" :class="['px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors', selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']" @click="selectCategory(cat)">{{ cat }}</button>
        </div>
      </div>

      <!-- Product Area (scrollable) -->
      <div class="flex-1 overflow-y-auto p-3 bg-slate-50">

        <div v-if="productsLoading" class="flex items-center justify-center py-12"><Loader2Icon class="w-5 h-5 animate-spin text-slate-400" /></div>
        <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
          <PackageIcon class="w-12 h-12 text-slate-300 mb-3" /><p class="text-sm text-slate-500">{{ searchQuery ? 'Produk tidak ditemukan' : 'Cari atau scan produk' }}</p>
        </div>
        <!-- Grid -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <button v-for="product in filteredProducts" :key="product.id" :disabled="product.totalStock <= 0" class="bg-white border border-slate-200 rounded-xl p-2.5 text-left hover:border-blue-300 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed" @click="addToCart(product)">
            <div class="relative w-full aspect-[4/3] bg-slate-100 rounded-lg mb-2 overflow-hidden">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
              <PackageIcon v-else class="w-8 h-8 text-slate-300 absolute inset-0 m-auto" />
              <span class="absolute top-1.5 right-1.5 text-[9px] font-bold bg-white/90 text-slate-700 px-1.5 py-0.5 rounded shadow-sm">{{ product.totalStock }} {{ product.unit || 'pcs' }}</span>
            </div>
            <p class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">{{ product.name }}</p>
            <p class="text-xs font-mono font-bold text-blue-600">{{ formatRupiah(product.price) }}</p>
          </button>
        </div>
        <!-- List -->
        <div v-else class="space-y-2">
          <button v-for="product in filteredProducts" :key="product.id" :disabled="product.totalStock <= 0" class="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-blue-300 transition-all disabled:opacity-40" @click="addToCart(product)">
            <div class="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
              <PackageIcon v-else class="w-5 h-5 text-slate-300" />
            </div>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-slate-800 truncate">{{ product.name }}</p><p class="text-[10px] text-slate-500 font-mono">{{ product.sku }}</p></div>
            <div class="text-right shrink-0"><p class="text-xs font-mono font-bold text-blue-600">{{ formatRupiah(product.price) }}</p><p class="text-[10px] text-slate-500">{{ product.totalStock }} {{ product.unit || 'pcs' }}</p></div>
            <PlusCircleIcon class="w-5 h-5 text-blue-500 shrink-0" />
          </button>
        </div>
      </div>

      <!-- Mobile only: Floating Glass Cart Bar -->
      <Transition name="cart-float">
        <div v-if="cart.length > 0" class="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[500px]">
          <button class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-all active:scale-[0.98]" @click="showMobileCart = true">
            <div class="flex items-center gap-3">
              <div class="relative"><ShoppingCartIcon class="w-5 h-5 text-blue-600" /><span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{{ totalItems }}</span></div>
              <span class="text-sm font-semibold text-slate-700">{{ totalItems }} item</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-base font-bold text-blue-600 font-mono">{{ formatRupiah(totalPrice) }}</span>
              <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Bayar</span>
            </div>
          </button>
        </div>
      </Transition>
    </div>


    <!-- === RIGHT COLUMN: Cart Panel (desktop/tablet only) === -->
    <aside class="hidden md:flex flex-col w-[380px] lg:w-[420px] bg-white border-l border-slate-200 shrink-0 h-[calc(100vh-7.5rem)]">
      <!-- Cart Header -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
        <ShoppingCartIcon class="w-4 h-4 text-blue-600" />
        <h3 class="text-sm font-bold text-slate-800">Keranjang</h3>
        <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{{ totalItems }}</span>
      </div>

      <!-- Cart Items (scrollable) -->
      <div class="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div v-if="cart.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
          <PackageIcon class="w-10 h-10 text-slate-200 mb-3" />
          <p class="text-xs text-slate-400">Tap produk untuk menambahkan</p>
        </div>
        <div v-for="item in cart" :key="item.productId" class="py-2.5 border-b border-slate-50 last:border-0">
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ item.name }}</p>
              <p class="text-[10px] text-slate-500">{{ formatRupiah(item.price) }} × {{ item.quantity }}</p>
              <p v-if="item.discount > 0" class="text-[10px] text-red-500">Diskon: -{{ formatRupiah(item.discount) }}</p>
              <p class="text-xs font-bold text-blue-600 mt-0.5">{{ formatRupiah(item.subtotal) }}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button class="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200" @click="updateQty(item.productId, item.quantity - 1)">
                <XIcon v-if="item.quantity === 1" class="w-3 h-3 text-red-500" />
                <MinusIcon v-else class="w-3 h-3" />
              </button>
              <span class="w-6 text-center text-xs font-bold text-slate-800">{{ item.quantity }}</span>
              <button class="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100" @click="updateQty(item.productId, item.quantity + 1)">
                <PlusIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
          <!-- Inline note input -->
          <div v-if="item.showNote" class="mt-1.5">
            <input v-model="item.note" type="text" placeholder="Catatan item..." class="w-full h-7 px-2 text-[10px] border border-slate-200 rounded bg-slate-50 focus:border-blue-400 outline-none" @blur="item.showNote = false" />
          </div>
          <!-- Inline discount input -->
          <div v-if="item.showDiscount" class="mt-1.5 flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500">Diskon Rp:</span>
            <input :value="item.discount" type="number" min="0" class="w-20 h-7 px-2 text-[10px] font-mono border border-slate-200 rounded bg-slate-50 text-right focus:border-blue-400 outline-none" @change="(e) => { item.discount = Math.min(Number((e.target as HTMLInputElement).value) || 0, item.price * item.quantity); Object.assign(item, recalcCartItem(item)); }" @blur="item.showDiscount = false" />
          </div>
          <!-- Action buttons -->
          <div class="flex items-center gap-3 mt-1.5">
            <button class="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5" @click="item.showNote = !item.showNote"><EditIcon class="w-3 h-3" /> Catatan</button>
            <button class="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5" @click="item.showDiscount = !item.showDiscount"><TagIcon class="w-3 h-3" /> Diskon</button>
          </div>
        </div>
      </div>

      <!-- Cart Footer: Summary + Actions -->
      <div class="shrink-0 border-t border-slate-200 px-4 py-3 space-y-3 bg-slate-50/80">
        <!-- Customer / Table -->
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <UserIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input v-model="customerName" type="text" placeholder="Nama pelanggan (opsional)" class="w-full h-8 pl-8 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none" />
          </div>
          <div class="flex-1 relative">
            <PhoneIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input v-model="customerPhone" type="text" placeholder="No HP (opsional)" class="w-full h-8 pl-8 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none" />
          </div>
        </div>


        <!-- Discount total trx -->
        <div>
          <button v-if="!showTrxDiscount" class="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline" @click="showTrxDiscount = true">
            <TagIcon class="w-3.5 h-3.5" /> Tambah Diskon
          </button>
          <div v-else class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500">Diskon Rp:</span>
            <input v-model.number="trxDiscount" type="number" min="0" class="w-24 h-7 px-2 text-xs font-mono border border-slate-200 rounded bg-white text-right focus:border-blue-400 outline-none" />
            <button class="text-[10px] text-red-400 hover:text-red-600" @click="trxDiscount = 0; showTrxDiscount = false">
              <XIcon class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Totals -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span class="font-mono">{{ formatRupiah(totalPrice) }}</span>
          </div>
          <div v-if="trxDiscount > 0" class="flex justify-between text-xs text-red-500">
            <span>Diskon</span>
            <span class="font-mono">- {{ formatRupiah(trxDiscount) }}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-blue-600 pt-1 border-t border-slate-200">
            <span>Total</span>
            <span class="font-mono">{{ formatRupiah(grandTotal) }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button class="flex-1 h-10 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors" @click="handleSaveBill">
            <SaveIcon class="w-4 h-4" /> Simpan Bill
          </button>
          <button
            :disabled="cart.length === 0"
            class="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: #2563eb;"
            @click="showPaymentModal = true"
          >
            <CreditCardIcon class="w-4 h-4" /> Bayar
          </button>
        </div>
      </div>
    </aside>

    <!-- === MOBILE CART BOTTOM SHEET === -->
    <Teleport to="body">
      <div v-if="showMobileCart" class="fixed inset-0 z-50 md:hidden flex items-end">
        <div class="absolute inset-0 bg-black/30" @click="showMobileCart = false"></div>
        <div class="relative bg-white rounded-t-2xl w-full max-h-[80vh] flex flex-col animate-slide-up shadow-xl">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-2">
              <ShoppingCartIcon class="w-4 h-4 text-blue-600" />
              <h3 class="text-sm font-bold text-slate-800">Keranjang ({{ totalItems }})</h3>
            </div>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="showMobileCart = false"><XIcon class="w-5 h-5 text-slate-500" /></button>
          </div>
          <!-- Items -->
          <div class="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            <div v-for="item in cart" :key="item.productId" class="py-2 border-b border-slate-50 last:border-0">
              <div class="flex items-center gap-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-500">{{ formatRupiah(item.price) }} × {{ item.quantity }}</p>
                  <p v-if="item.discount > 0" class="text-[10px] text-red-500">Diskon: -{{ formatRupiah(item.discount) }}</p>
                  <p class="text-xs font-bold text-blue-600">{{ formatRupiah(item.subtotal) }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button class="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center" @click="updateQty(item.productId, item.quantity - 1)">
                    <XIcon v-if="item.quantity === 1" class="w-3 h-3 text-red-500" />
                    <MinusIcon v-else class="w-3 h-3 text-slate-600" />
                  </button>
                  <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
                  <button class="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600" @click="updateQty(item.productId, item.quantity + 1)"><PlusIcon class="w-3 h-3" /></button>
                </div>
              </div>
              <!-- Inline note -->
              <div v-if="item.showNote" class="mt-1.5">
                <input v-model="item.note" type="text" placeholder="Catatan item..." class="w-full h-7 px-2 text-[10px] border border-slate-200 rounded bg-slate-50 focus:border-blue-400 outline-none" />
              </div>
              <!-- Inline discount -->
              <div v-if="item.showDiscount" class="mt-1.5 flex items-center gap-1.5">
                <span class="text-[10px] text-slate-500">Diskon Rp:</span>
                <input :value="item.discount" type="number" min="0" class="w-20 h-7 px-2 text-[10px] font-mono border border-slate-200 rounded bg-slate-50 text-right focus:border-blue-400 outline-none" @change="(e) => { item.discount = Math.min(Number((e.target as HTMLInputElement).value) || 0, item.price * item.quantity); Object.assign(item, recalcCartItem(item)); }" />
              </div>
              <!-- Actions -->
              <div class="flex items-center gap-3 mt-1">
                <button class="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5" @click="item.showNote = !item.showNote"><EditIcon class="w-3 h-3" /> Catatan</button>
                <button class="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5" @click="item.showDiscount = !item.showDiscount"><TagIcon class="w-3 h-3" /> Diskon</button>
              </div>
            </div>
          </div>

          <!-- Mobile cart footer -->
          <div class="shrink-0 border-t border-slate-200 px-4 py-3 space-y-3 bg-slate-50/80">
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <UserIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input v-model="customerName" type="text" placeholder="Nama pelanggan (opsional)" class="w-full h-8 pl-8 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none" />
              </div>
              <div class="flex-1 relative">
                <PhoneIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input v-model="customerPhone" type="text" placeholder="No HP (opsional)" class="w-full h-8 pl-8 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <button v-if="!showTrxDiscount" class="text-xs text-blue-600 font-medium flex items-center gap-1" @click="showTrxDiscount = true"><TagIcon class="w-3.5 h-3.5" /> Tambah Diskon</button>
              <div v-else class="flex items-center gap-2">
                <span class="text-[10px] text-slate-500">Diskon Rp:</span>
                <input v-model.number="trxDiscount" type="number" min="0" class="w-20 h-7 px-2 text-xs font-mono border border-slate-200 rounded bg-white text-right focus:border-blue-400 outline-none" />
                <button class="text-[10px] text-red-400" @click="trxDiscount = 0; showTrxDiscount = false"><XIcon class="w-3 h-3" /></button>
              </div>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span><span class="font-mono">{{ formatRupiah(totalPrice) }}</span>
            </div>
            <div v-if="trxDiscount > 0" class="flex justify-between text-xs text-red-500">
              <span>Diskon</span><span class="font-mono">- {{ formatRupiah(trxDiscount) }}</span>
            </div>
            <div class="flex justify-between text-base font-bold text-blue-600 pt-1 border-t border-slate-200">
              <span>Total</span><span class="font-mono">{{ formatRupiah(grandTotal) }}</span>
            </div>
            <div class="flex gap-2">
              <button class="flex-1 h-10 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100" @click="handleSaveBill"><SaveIcon class="w-4 h-4" /> Simpan Bill</button>
              <button :disabled="cart.length === 0" class="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-40" style="background-color: #2563eb;" @click="showMobileCart = false; showPaymentModal = true"><CreditCardIcon class="w-4 h-4" /> Bayar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- === PAYMENT MODAL (fixed frame, no scroll) === -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div class="absolute inset-0 bg-black/50" @click="showPaymentModal = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-800">Pembayaran</h3>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="showPaymentModal = false"><XIcon class="w-5 h-5 text-slate-500" /></button>
          </div>
          <!-- Total -->
          <div class="bg-blue-50 rounded-xl p-3 text-center">
            <p class="text-[10px] text-blue-500">Total Bayar</p>
            <p class="text-2xl font-bold text-blue-700 font-mono">{{ formatRupiah(grandTotal) }}</p>
          </div>
          <!-- Kas Tujuan (only if multiple kas) -->
          <div v-if="kasOptions.length > 1">
            <p class="text-xs font-semibold text-slate-600 mb-1">Kas Tujuan</p>
            <select v-model="selectedKas" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none">
              <option v-for="kas in kasOptions" :key="kas.id" :value="kas.id">{{ kas.label }}</option>
            </select>
          </div>
          <!-- Payment method -->
          <div>
            <p class="text-xs font-semibold text-slate-600 mb-1.5">Metode Pembayaran</p>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="m in ['Tunai','QRIS','Hutang']" :key="m" :class="['py-2 rounded-lg border-2 text-xs font-semibold transition-all', paymentMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500']" @click="paymentMethod = m">{{ m }}</button>
            </div>
          </div>
          <!-- Amount (only for Tunai) -->
          <div v-if="paymentMethod === 'Tunai'">
            <p class="text-xs font-semibold text-slate-600 mb-1.5">Jumlah Bayar</p>
            <input v-model.number="amountPaid" type="number" class="w-full h-10 px-4 text-lg font-mono font-bold text-center border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
            <div class="grid grid-cols-4 gap-1.5 mt-2">
              <button v-for="n in [1000,2000,5000,10000,20000,50000,100000]" :key="n" class="h-7 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-50" @click="amountPaid += n">{{ (n/1000) + 'K' }}</button>
              <button class="h-7 rounded-lg border-2 border-blue-200 text-[10px] font-semibold text-blue-600 hover:bg-blue-50" @click="amountPaid = grandTotal">Uang Pas</button>
            </div>
            <button class="text-[10px] text-slate-400 mt-0.5 hover:text-slate-600" @click="amountPaid = 0">Reset</button>
          </div>
          <!-- QRIS: show placeholder QR -->
          <div v-if="paymentMethod === 'QRIS'" class="text-center py-3">
            <div class="w-40 h-40 mx-auto bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-2">
              <QrCodeIcon class="w-12 h-12 text-slate-300" />
            </div>
            <p class="text-xs text-slate-500">Tunjukkan QR ke pelanggan untuk scan</p>
            <p class="text-[10px] text-slate-400 mt-1">Admin perlu upload gambar QRIS di Pengaturan</p>
          </div>
          <!-- Hutang: info + mandatory fields -->
          <div v-if="paymentMethod === 'Hutang'" class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <p class="text-xs font-semibold text-amber-700">Seluruh transaksi {{ formatRupiah(grandTotal) }} akan dicatat sebagai hutang.</p>
            <p class="text-[10px] text-amber-600">Nama & No HP pelanggan <strong>wajib</strong> diisi.</p>
          </div>
          <!-- Partial hutang detection (Tunai, paid < total) -->
          <div v-if="paymentMethod === 'Tunai' && amountPaid > 0 && amountPaid < grandTotal" class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <p class="text-xs text-amber-700">Kurang <strong>{{ formatRupiah(grandTotal - amountPaid) }}</strong></p>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="createDebtForRemainder" type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span class="text-xs text-amber-800 font-medium">Catat sisa sebagai hutang?</span>
            </label>
            <p v-if="createDebtForRemainder" class="text-[10px] text-amber-600">Nama & No HP pelanggan <strong>wajib</strong> diisi.</p>
          </div>
          <!-- Customer info (shared state with cart panel) -->
          <div class="grid grid-cols-2 gap-2">
            <input v-model="customerName" type="text" placeholder="Nama (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
            <input v-model="customerPhone" type="text" placeholder="No HP (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          </div>
          <input v-model="customerNote" type="text" placeholder="Catatan tambahan (opsional)" class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
          <!-- Kembalian (only Tunai & change > 0) -->
          <div v-if="paymentMethod === 'Tunai' && change > 0" class="flex justify-between items-center bg-emerald-50 rounded-xl px-4 py-2">
            <span class="text-sm font-medium text-emerald-700">Kembalian</span>
            <span class="text-lg font-bold font-mono text-emerald-600">{{ formatRupiah(change) }}</span>
          </div>
          <!-- Error -->
          <div v-if="checkoutError" class="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{{ checkoutError }}</div>
          <!-- Confirm -->
          <button :disabled="!canCheckout || checking" class="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40" style="background-color: #2563eb;" @click="handleCheckout">
            <Loader2Icon v-if="checking" class="w-5 h-5 animate-spin" />
            <template v-else>
              <CheckIcon class="w-5 h-5" />
              {{ paymentMethod === 'Hutang' ? 'Konfirmasi — Catat Hutang' : paymentMethod === 'QRIS' ? 'Pelanggan Sudah Membayar' : 'Konfirmasi Transaksi' }}
            </template>
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Scan Barcode Modal -->
    <Teleport to="body">
      <div v-if="showScanModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeScanModal"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-base font-bold text-slate-800 text-center">Scan / Ketik SKU</h3>
          <!-- Camera viewfinder -->
          <div class="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
            <video ref="scanVideoRef" class="w-full h-full object-cover" autoplay playsinline muted></video>
            <div v-if="!cameraActive" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
              <ScanBarcodeIcon class="w-12 h-12 text-slate-300 mb-2" />
              <p class="text-xs text-slate-500">Kamera tidak tersedia</p>
            </div>
            <!-- Scan overlay -->
            <div v-if="cameraActive" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-3/4 h-1/3 border-2 border-white/60 rounded-lg"></div>
            </div>
          </div>
          <p class="text-xs text-slate-500 text-center">{{ cameraActive ? 'Arahkan barcode ke area kotak' : 'Atau ketik SKU manual:' }}</p>
          <form @submit.prevent="handleBarcodeScan(scanInput); scanInput = ''" class="flex gap-2">
            <input v-model="scanInput" type="text" placeholder="Ketik SKU lalu Enter..." autofocus class="flex-1 h-10 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none" />
            <button type="submit" class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Cari</button>
          </form>
          <button class="w-full h-10 bg-slate-100 text-slate-700 font-semibold rounded-lg" @click="closeScanModal">Tutup</button>
        </div>
      </div>
    </Teleport>

    <!-- Open Bill Modal (loads from localStorage) -->
    <Teleport to="body">
      <div v-if="showOpenBill" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showOpenBill = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-800">Bill Tersimpan</h3>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="showOpenBill = false"><XIcon class="w-5 h-5 text-slate-500" /></button>
          </div>
          <div v-if="savedBills.length === 0" class="py-8 text-center">
            <ClipboardListIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-500">Belum ada bill tersimpan</p>
          </div>
          <div v-else class="space-y-2 max-h-60 overflow-y-auto">
            <div v-for="bill in savedBills" :key="bill.id" class="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ bill.id }}</p>
                <p class="text-[10px] text-slate-500">{{ bill.items.length }} item · {{ formatRupiah(bill.items.reduce((s: number, i: any) => s + (i.subtotal || 0), 0)) }}</p>
                <p v-if="bill.customerName" class="text-[10px] text-slate-400">{{ bill.customerName }}</p>
              </div>
              <div class="flex gap-1">
                <button class="h-7 px-2 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100" @click="loadBill(bill)">Buka</button>
                <button class="h-7 px-2 text-[10px] font-semibold bg-red-50 text-red-500 rounded hover:bg-red-100" @click="deleteBill(bill.id)">Hapus</button>
              </div>
            </div>
          </div>
          <button class="w-full h-10 bg-slate-100 text-slate-700 font-semibold rounded-lg" @click="showOpenBill = false">Tutup</button>
        </div>
      </div>
    </Teleport>

    <!-- === RECEIPT MODAL (popup struk setelah bayar) === -->
    <Teleport to="body">
      <div v-if="showReceiptModal && receiptData" class="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <!-- Success toast bar -->
          <div class="bg-emerald-500 px-4 py-2.5 flex items-center gap-2 text-white text-sm font-medium">
            <CheckIcon class="w-4 h-4" />
            <span>Transaksi berhasil! {{ receiptData.trxNumber }}</span>
          </div>
          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 class="text-base font-bold text-slate-800">Struk Transaksi</h3>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="closeReceipt"><XIcon class="w-5 h-5 text-slate-500" /></button>
          </div>
          <!-- Receipt content -->
          <div class="px-5 pb-4" id="receipt-content">
            <div class="border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
              <!-- Shop name -->
              <p class="text-center font-bold text-slate-800">{{ receiptData.shopName }}</p>
              <div class="border-t border-dashed border-slate-200"></div>
              <!-- Meta -->
              <div class="flex justify-between text-[11px] text-slate-500">
                <span>No: {{ receiptData.trxNumber }}</span>
                <span>{{ receiptData.method }}</span>
              </div>
              <div class="flex justify-between text-[11px] text-slate-500">
                <span>{{ receiptData.date }}</span>
                <span>Kasir: {{ receiptData.cashierName }}</span>
              </div>
              <div class="border-t border-dashed border-slate-200"></div>
              <!-- Items -->
              <div class="space-y-1.5">
                <div v-for="(item, idx) in receiptData.items" :key="idx" class="flex justify-between text-xs">
                  <div>
                    <p class="text-slate-800">{{ item.name }}</p>
                    <p class="text-slate-500">{{ item.qty }} x {{ formatRupiah(item.price) }}</p>
                  </div>
                  <span class="font-mono text-slate-700 shrink-0">{{ formatRupiah(item.subtotal) }}</span>
                </div>
              </div>
              <div class="border-t border-dashed border-slate-200"></div>
              <!-- Totals -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span class="font-mono">{{ formatRupiah(receiptData.total) }}</span>
                </div>
                <div class="flex justify-between text-sm font-bold text-slate-900">
                  <span>TOTAL</span>
                  <span class="font-mono">{{ formatRupiah(receiptData.total) }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-600">
                  <span>Bayar</span>
                  <span class="font-mono">{{ formatRupiah(receiptData.paid) }}</span>
                </div>
                <div v-if="receiptData.change > 0" class="flex justify-between text-xs text-slate-600">
                  <span>Kembali</span>
                  <span class="font-mono">{{ formatRupiah(receiptData.change) }}</span>
                </div>
              </div>
              <div class="border-t border-dashed border-slate-200"></div>
              <p class="text-center text-[10px] text-slate-400">Terima kasih atas kunjungan Anda!</p>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="px-5 pb-5 space-y-2">
            <div class="grid grid-cols-3 gap-2">
              <button class="h-10 flex flex-col items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" @click="handleDownloadReceipt">
                <DownloadIcon class="w-4 h-4 text-slate-600" />
                <span class="text-[9px] text-slate-500 mt-0.5">Unduh</span>
              </button>
              <button class="h-10 flex flex-col items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" @click="handleShareReceipt">
                <Share2Icon class="w-4 h-4 text-slate-600" />
                <span class="text-[9px] text-slate-500 mt-0.5">Bagikan</span>
              </button>
              <button class="h-10 flex flex-col items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" @click="handlePrintReceipt">
                <PrinterIcon class="w-4 h-4 text-slate-600" />
                <span class="text-[9px] text-slate-500 mt-0.5">Cetak</span>
              </button>
            </div>
            <button class="w-full h-10 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors" @click="closeReceipt">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- === SHIFT GUARD (block POS if no open shift) === -->
    <Teleport to="body">
      <div v-if="showShiftGuard" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70">
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
          <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangleIcon class="w-8 h-8 text-amber-500" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">Shift Belum Dibuka</h3>
          <p class="text-sm text-slate-600">Anda harus membuka shift terlebih dahulu sebelum bisa melakukan transaksi di kasir.</p>
          <button class="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style="background-color: #2563eb;" @click="router.push({ name: 'webapp-retail-shift' })">
            <PlayIcon class="w-5 h-5" /> Buka Shift Sekarang
          </button>
          <button class="w-full h-10 text-sm text-slate-500 hover:text-slate-700" @click="router.push({ name: 'webapp-dashboard' })">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </Teleport>

  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search as SearchIcon, ScanBarcode as ScanBarcodeIcon, Camera as CameraIcon, LayoutGrid as LayoutGridIcon,
  List as ListIcon, Package as PackageIcon, PlusCircle as PlusCircleIcon,
  ShoppingCart as ShoppingCartIcon, Loader2 as Loader2Icon,
  X as XIcon, Minus as MinusIcon, Plus as PlusIcon,
  Tag as TagIcon, Edit3 as EditIcon, User as UserIcon, Phone as PhoneIcon,
  Save as SaveIcon, CreditCard as CreditCardIcon, Check as CheckIcon,
  ClipboardList as ClipboardListIcon, Download as DownloadIcon,
  Share2 as Share2Icon, Printer as PrinterIcon, AlertTriangle as AlertTriangleIcon,
  Play as PlayIcon, QrCode as QrCodeIcon,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import { useShopStore } from '@/shared/stores/shop.store';
import posService, { type POSProductDto, type CartItem, createCartItem, recalcCartItem } from '@/shared/services/pos.service';

const router = useRouter();
const authStore = useAuthStore();
const shiftStore = useShiftStore();
const shopStore = useShopStore();

// Product state
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const selectedCategory = ref('Semua');
const categories = ref(['Semua']);
const products = ref<POSProductDto[]>([]);
const productsLoading = ref(false);

// Cart state
const cart = ref<(CartItem & { showNote?: boolean; showDiscount?: boolean; note?: string })[]>([]);
const customerName = ref('');
const customerPhone = ref('');
const customerNote = ref('');
const trxDiscount = ref(0);
const showTrxDiscount = ref(false);

// Toast/notification state
const toast = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// UI state
const showScanModal = ref(false);
const showMobileCart = ref(false);
const showPaymentModal = ref(false);
const showReceiptModal = ref(false);
const showOpenBill = ref(false);
const showShiftGuard = ref(false);
const scanInput = ref('');
const savedBills = ref<any[]>([]);
const scanVideoRef = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
let cameraStream: MediaStream | null = null;
let barcodeInterval: ReturnType<typeof setInterval> | null = null;

// Receipt data (after successful checkout)
const receiptData = ref<{
  trxNumber: string;
  items: any[];
  total: number;
  paid: number;
  change: number;
  method: string;
  customerName: string;
  cashierName: string;
  shopName: string;
  date: string;
} | null>(null);

// Payment state
const paymentMethod = ref('Tunai');
const amountPaid = ref(0);
const checking = ref(false);
const checkoutError = ref<string | null>(null);
const selectedKas = ref('default');
const kasOptions = ref([{ id: 'default', label: 'Kas Retail' }]);
const createDebtForRemainder = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'Semua') return products.value;
  return products.value.filter(p => (p as any).category === selectedCategory.value);
});

const totalItems = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0));
const totalPrice = computed(() => cart.value.reduce((sum, i) => sum + i.subtotal, 0));
const grandTotal = computed(() => Math.max(0, totalPrice.value - trxDiscount.value));
const change = computed(() => Math.max(0, (amountPaid.value || 0) - grandTotal.value));
const canCheckout = computed(() => {
  if (cart.value.length === 0) return false;
  if (paymentMethod.value === 'Tunai') {
    if (amountPaid.value < grandTotal.value && !createDebtForRemainder.value) return false;
  }
  // Hutang requires customer name
  if (paymentMethod.value === 'Hutang' && !customerName.value.trim()) return false;
  // Partial debt requires customer name
  if (createDebtForRemainder.value && !customerName.value.trim()) return false;
  return true;
});

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }
function selectCategory(cat: string) { selectedCategory.value = cat; }

async function fetchProducts() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  productsLoading.value = true;
  try {
    products.value = await posService.searchProducts(shopId, searchQuery.value || undefined);
    const cats = new Set(products.value.map((p: any) => p.category).filter(Boolean));
    categories.value = ['Semua', ...Array.from(cats)];
  } catch { products.value = []; }
  finally { productsLoading.value = false; }
}

function debouncedSearch() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(fetchProducts, 300); }

function addToCart(product: POSProductDto) {
  const existing = cart.value.find(i => i.productId === product.id);
  if (existing) { if (existing.quantity < existing.maxStock) { existing.quantity += 1; Object.assign(existing, recalcCartItem(existing)); } }
  else { cart.value.push(createCartItem(product, 1)); }
}

function updateQty(productId: string, qty: number) {
  const item = cart.value.find(i => i.productId === productId);
  if (!item) return;
  if (qty <= 0) { cart.value = cart.value.filter(i => i.productId !== productId); return; }
  item.quantity = Math.min(qty, item.maxStock);
  Object.assign(item, recalcCartItem(item));
}

function promptDiscount(item: CartItem) {
  const input = prompt(`Diskon untuk ${item.name} (Rp):`, String(item.discount || 0));
  if (input === null) return;
  const val = Math.min(Number(input) || 0, item.price * item.quantity);
  item.discount = val;
  Object.assign(item, recalcCartItem(item));
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast.value = { message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 3000);
}

function handleBarcodeScan(sku: string) {
  const product = products.value.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  if (product) {
    addToCart(product);
    showToast(`${product.name} (${product.sku}) ditambahkan ke keranjang`, 'success');
  } else {
    showToast(`SKU "${sku}" tidak ditemukan di produk terdaftar`, 'error');
  }
  showScanModal.value = false;
}

function handleSaveBill() {
  if (cart.value.length === 0) return;
  const billId = 'BILL-' + Date.now().toString(36).toUpperCase();
  const bills = JSON.parse(localStorage.getItem('ngalir_saved_bills') || '[]');
  bills.push({
    id: billId,
    items: cart.value.map(i => ({ ...i })),
    customerName: customerName.value,
    customerPhone: customerPhone.value,
    trxDiscount: trxDiscount.value,
    savedAt: new Date().toISOString(),
  });
  localStorage.setItem('ngalir_saved_bills', JSON.stringify(bills));
  showToast(`Bill ${billId} berhasil disimpan`, 'success');
  cart.value = [];
  customerName.value = '';
  customerPhone.value = '';
  trxDiscount.value = 0;
}

function refreshSavedBills() {
  savedBills.value = JSON.parse(localStorage.getItem('ngalir_saved_bills') || '[]');
}

function loadBill(bill: any) {
  cart.value = bill.items.map((i: any) => ({ ...i }));
  customerName.value = bill.customerName || '';
  customerPhone.value = bill.customerPhone || '';
  trxDiscount.value = bill.trxDiscount || 0;
  // Remove from saved bills
  deleteBill(bill.id);
  showOpenBill.value = false;
  showToast(`Bill ${bill.id} dimuat ke keranjang`, 'info');
}

function deleteBill(billId: string) {
  const bills = JSON.parse(localStorage.getItem('ngalir_saved_bills') || '[]');
  const filtered = bills.filter((b: any) => b.id !== billId);
  localStorage.setItem('ngalir_saved_bills', JSON.stringify(filtered));
  savedBills.value = filtered;
}

// Camera barcode scanning
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    if (scanVideoRef.value) {
      scanVideoRef.value.srcObject = cameraStream;
      cameraActive.value = true;
    }
    // Try BarcodeDetector API (Chrome/Edge/Android)
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a'] });
      barcodeInterval = setInterval(async () => {
        if (!scanVideoRef.value || !cameraActive.value) return;
        try {
          const barcodes = await detector.detect(scanVideoRef.value);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            handleBarcodeScan(code);
          }
        } catch { /* detection failed, continue */ }
      }, 500);
    }
  } catch {
    cameraActive.value = false;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (barcodeInterval) { clearInterval(barcodeInterval); barcodeInterval = null; }
  cameraActive.value = false;
}

function closeScanModal() {
  stopCamera();
  showScanModal.value = false;
}


async function handleCheckout() {
  checking.value = true;
  checkoutError.value = null;

  const methodMap: Record<string, string> = { 'Tunai': 'CASH', 'Transfer': 'TRANSFER', 'QRIS': 'QRIS', 'Hutang': 'HUTANG' };
  const idempotencyKey = crypto.randomUUID();
  const payload = {
    items: cart.value.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      discount: i.discount > 0 ? i.discount : undefined,
    })),
    paymentMethod: methodMap[paymentMethod.value] || 'CASH',
    amountPaid: paymentMethod.value === 'Tunai' ? amountPaid.value || grandTotal.value : grandTotal.value,
    customerName: customerName.value || undefined,
    customerPhone: customerPhone.value || undefined,
    createDebtForRemainder: createDebtForRemainder.value || undefined,
    idempotencyKey,
    clientCreatedAt: new Date().toISOString(),
  };

  try {
    const response = await posService.createTransaction(payload);
    // Build receipt data
    receiptData.value = {
      trxNumber: response.summary?.transactionNumber || 'TX' + Date.now(),
      items: cart.value.map(i => ({ name: i.name, qty: i.quantity, price: i.price, subtotal: i.subtotal })),
      total: grandTotal.value,
      paid: paymentMethod.value === 'Tunai' ? (amountPaid.value || grandTotal.value) : grandTotal.value,
      change: paymentMethod.value === 'Tunai' ? change.value : 0,
      method: paymentMethod.value,
      customerName: customerName.value,
      cashierName: authStore.user?.username || 'Kasir',
      shopName: shopStore.currentShopName || 'Toko',
      date: new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    // Reset state & show receipt
    cart.value = [];
    showPaymentModal.value = false;
    showReceiptModal.value = true;
    customerName.value = '';
    customerPhone.value = '';
    customerNote.value = '';
    amountPaid.value = 0;
    trxDiscount.value = 0;
    showTrxDiscount.value = false;
  } catch (err: any) {
    checkoutError.value = err?.response?.data?.message || err?.message || 'Gagal memproses pembayaran.';
  } finally {
    checking.value = false;
  }
}

function closeReceipt() {
  showReceiptModal.value = false;
  receiptData.value = null;
}

function handleDownloadReceipt() {
  // Dynamic import html2canvas for receipt download
  import('html2canvas').then(({ default: html2canvas }) => {
    const receiptEl = document.getElementById('receipt-content');
    if (!receiptEl) { showToast('Gagal mengunduh struk', 'error'); return; }
    html2canvas(receiptEl, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `struk-${receiptData.value?.trxNumber || 'trx'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Struk berhasil diunduh', 'success');
    });
  }).catch(() => {
    showToast('Install html2canvas: npm i html2canvas', 'error');
  });
}

function handleShareReceipt() {
  if (navigator.share && receiptData.value) {
    navigator.share({
      title: `Struk ${receiptData.value.trxNumber}`,
      text: `Transaksi ${receiptData.value.trxNumber} - Total ${formatRupiah(receiptData.value.total)} (${receiptData.value.method})`,
    }).catch(() => {});
  } else {
    showToast('Share tidak tersedia di browser ini', 'info');
  }
}

function handlePrintReceipt() {
  window.print();
}

onMounted(async () => {
  // Shift guard: check if shift is open
  try {
    await shiftStore.fetchCurrentShift();
    if (!shiftStore.hasOpenShift) {
      showShiftGuard.value = true;
    }
  } catch {
    showShiftGuard.value = true;
  }
  fetchProducts();
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.cart-float-enter-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.cart-float-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.cart-float-enter-from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
.cart-float-leave-to { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translate(-50%, -10px); }
.toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }
</style>
