<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Supplier & PO</h1>
        <p class="text-xs text-slate-500 mt-0.5">Kelola supplier dan purchase order pembelian barang.</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Total Pembelian</p>
        <p class="text-lg font-bold text-slate-900 mt-1">{{ formatRupiah(stats.totalPurchaseThisMonth) }}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">bulan ini</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">PO Pending</p>
        <p class="text-lg font-bold text-amber-600 mt-1">{{ stats.poPending }}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">belum diterima</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Supplier Aktif</p>
        <p class="text-lg font-bold text-slate-900 mt-1">{{ stats.activeSuppliers }}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">dari {{ suppliers.length }} total</p>
      </div>
      <div class="bg-white border border-slate-200 rounded-lg p-4">
        <p class="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">PO Bulan Ini</p>
        <p class="text-lg font-bold text-slate-900 mt-1">{{ stats.poThisMonth }}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">{{ stats.poReceivedThisMonth }} sudah diterima</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Suppliers                                -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'suppliers'">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-500">{{ suppliers.length }} supplier</p>
        <button
          type="button"
          class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          @click="openSupplierModal(null)"
        >+ Tambah Supplier</button>
      </div>

      <div v-if="suppliersLoading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
      <div v-else-if="suppliers.length === 0" class="text-center py-10 text-slate-400 text-sm">Belum ada supplier.</div>
      <div v-else class="space-y-2">
        <div
          v-for="s in suppliers"
          :key="s.id"
          class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors"
        >
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ s.name }}</p>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ s.phone || '-' }} &middot; {{ s.address || 'Alamat belum diisi' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['text-[10px] font-bold uppercase px-2 py-0.5 rounded', s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
              {{ s.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
            <button @click="openSupplierModal(s)" class="text-xs text-blue-600 hover:underline">Edit</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- TAB: Purchase Orders                          -->
    <!-- ============================================ -->
    <template v-if="activeTab === 'po'">
      <div class="flex justify-between items-center">
        <select
          v-model="poFilterStatus"
          class="h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          @change="fetchPOs"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ORDERED">Ordered</option>
          <option value="RECEIVED">Diterima</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <button
          type="button"
          class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          @click="showCreatePO = true"
        >+ Buat PO</button>
      </div>

      <div v-if="posLoading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
      <div v-else-if="purchaseOrders.length === 0" class="text-center py-10 text-slate-400 text-sm">Belum ada Purchase Order.</div>
      <div v-else class="space-y-2">
        <div
          v-for="po in purchaseOrders"
          :key="po.id"
          class="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer"
          @click="openPODetail(po)"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-900">{{ po.orderNumber }}</span>
                <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', poStatusBadge(po.status)]">
                  {{ poStatusLabel(po.status) }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ po.supplierName }} &middot; {{ po.itemCount }} item &middot; {{ formatDate(po.createdAt) }}
              </p>
            </div>
            <p class="text-sm font-bold text-slate-900">{{ formatRupiah(po.totalAmount) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- Supplier Modal                                -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showSupplierModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showSupplierModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-base font-bold text-slate-900 mb-4">{{ editingSupplier ? 'Edit Supplier' : 'Tambah Supplier' }}</h2>
          <form @submit.prevent="handleSaveSupplier" class="space-y-3">
            <input v-model="supplierForm.name" placeholder="Nama supplier *" required class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
            <input v-model="supplierForm.phone" placeholder="No. HP" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
            <input v-model="supplierForm.address" placeholder="Alamat" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
            <textarea v-model="supplierForm.notes" placeholder="Catatan" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none resize-none"></textarea>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showSupplierModal = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
              <button type="submit" :disabled="savingSupplier" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                {{ savingSupplier ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- PO Detail Modal                               -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showPODetail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showPODetail = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 class="text-base font-bold text-slate-900">{{ poDetail?.orderNumber }}</h2>
              <p class="text-xs text-slate-500">{{ poDetail?.supplier.name }} &middot; {{ poDetail ? formatDate(poDetail.createdAt) : '' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="poDetail"
                type="button"
                class="h-7 px-2.5 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1"
                @click="handleSharePO"
                title="Salin teks PO untuk kirim ke supplier"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Share
              </button>
              <span v-if="poDetail" :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', poStatusBadge(poDetail.status)]">
                {{ poStatusLabel(poDetail.status) }}
              </span>
              <button @click="showPODetail = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div v-if="poDetailLoading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>
            <div v-else-if="poDetail">
              <table class="w-full text-sm mb-4">
                <thead>
                  <tr class="text-left text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-200">
                    <th class="pb-2 pr-3">Produk</th>
                    <th class="pb-2 pr-3 text-right">Qty Order</th>
                    <th class="pb-2 pr-3 text-right">Diterima</th>
                    <th class="pb-2 pr-3 text-right">Harga</th>
                    <th class="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in poDetail.items" :key="item.id" class="border-b border-slate-100 last:border-0">
                    <td class="py-2 pr-3">
                      <p class="text-xs font-medium text-slate-900">{{ item.productName }}</p>
                      <p class="text-[10px] text-slate-400">{{ item.productSku }}</p>
                    </td>
                    <td class="py-2 pr-3 text-right text-xs">{{ item.quantity }}</td>
                    <td class="py-2 pr-3 text-right text-xs">
                      <span :class="item.receivedQty >= item.quantity ? 'text-emerald-600 font-semibold' : item.receivedQty > 0 ? 'text-blue-600 font-semibold' : 'text-slate-400'">
                        {{ item.receivedQty }} / {{ item.quantity }}
                      </span>
                    </td>
                    <td class="py-2 pr-3 text-right text-xs">{{ formatRupiah(item.unitCost) }}</td>
                    <td class="py-2 text-right text-xs font-semibold">{{ formatRupiah(item.subtotal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t border-slate-200">
                    <td colspan="3" class="pt-2 text-right text-xs font-bold text-slate-700">Total</td>
                    <td class="pt-2 text-right text-sm font-bold text-slate-900">{{ formatRupiah(poDetail.totalAmount) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div v-if="poDetail && (poDetail.status === 'DRAFT' || poDetail.status === 'ORDERED' || poDetail.status === 'PARTIAL')" class="px-6 py-4 border-t border-slate-200 flex justify-between">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              @click="handleCancelPO"
            >Batalkan</button>
            <div class="flex gap-2">
              <button
                v-if="poDetail.status === 'DRAFT'"
                type="button"
                class="h-9 px-4 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600"
                @click="handleMarkOrdered"
              >Tandai Ordered</button>
              <button
                v-if="poDetail.status === 'ORDERED' || poDetail.status === 'PARTIAL'"
                type="button"
                class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                @click="openPartialReceive"
              >Terima Barang</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Create PO Modal (harga opsional)              -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showCreatePO" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreatePO = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
          <h2 class="text-base font-bold text-slate-900 mb-1">Buat Purchase Order</h2>
          <p class="text-xs text-slate-500 mb-4">Harga beli opsional — bisa diisi nanti saat terima barang dari nota supplier.</p>
          <form @submit.prevent="handleCreatePO" class="space-y-4">
            <div>
              <label class="text-[11px] font-bold text-slate-600 uppercase">Supplier *</label>
              <select v-model="poForm.supplierId" required class="mt-1 w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none">
                <option value="">Pilih supplier</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-600 uppercase">Item Pesanan</label>
              <div v-for="(item, idx) in poForm.items" :key="idx" class="mt-2 p-2.5 bg-slate-50 rounded-lg space-y-1.5">
                <div class="flex items-center gap-2">
                  <input v-model="item.productId" placeholder="Product ID / SKU" required class="flex-1 h-8 px-2 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500" />
                  <button type="button" @click="poForm.items.splice(idx, 1)" class="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-[9px] text-slate-500">Qty *</label>
                    <input v-model.number="item.quantity" type="number" min="1" placeholder="1" required class="w-full h-7 px-2 text-xs font-mono border border-slate-300 rounded-md outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label class="text-[9px] text-slate-500">Harga beli <span class="text-slate-400">(opsional)</span></label>
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">Rp</span>
                      <input v-model.number="item.unitCost" type="number" min="0" placeholder="Isi nanti" class="w-full h-7 pl-6 pr-2 text-xs font-mono text-right border border-slate-300 rounded-md outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" @click="poForm.items.push({ productId: '', quantity: 1, unitCost: 0 })" class="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Tambah item
              </button>
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-600 uppercase">Catatan</label>
              <textarea v-model="poForm.notes" placeholder="Catatan untuk supplier (opsional)" rows="2" class="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none resize-none focus:border-blue-500"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showCreatePO = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
              <button type="submit" :disabled="creatingPO" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {{ creatingPO ? 'Membuat...' : 'Buat PO' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
    <!-- ============================================ -->
    <!-- Partial Receive Modal (with actualCost)       -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showPartialReceive" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showPartialReceive = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
          <h2 class="text-base font-bold text-slate-900 mb-1">Terima Barang</h2>
          <p class="text-xs text-slate-500 mb-4">Masukkan qty diterima dan <strong>harga beli dari nota supplier</strong> per item.</p>
          <div class="space-y-3">
            <div v-for="item in partialReceiveItems" :key="item.itemId" class="p-3 bg-slate-50 rounded-lg space-y-2">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-slate-800 truncate">{{ item.productName }}</p>
                  <p class="text-[10px] text-slate-500">Sisa: {{ item.remaining }} dari {{ item.orderQty }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[9px] font-bold text-slate-500 uppercase">Qty Diterima</label>
                  <input
                    v-model.number="item.receivedQty"
                    type="number"
                    :min="0"
                    :max="item.remaining"
                    class="w-full h-8 px-2 text-sm font-mono text-center border border-slate-300 rounded-md focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label class="text-[9px] font-bold text-slate-500 uppercase">Harga Beli (Nota)</label>
                  <div class="relative">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Rp</span>
                    <input
                      v-model.number="item.actualCost"
                      type="number"
                      :min="0"
                      :placeholder="String(item.lastCost || 0)"
                      class="w-full h-8 pl-7 pr-2 text-sm font-mono text-right border border-slate-300 rounded-md focus:border-blue-500 outline-none"
                    />
                  </div>
                  <p v-if="item.lastCost" class="text-[9px] text-slate-400 mt-0.5">Terakhir: {{ formatRupiah(item.lastCost) }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4">
            <button type="button" @click="showPartialReceive = false" class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
            <button type="button" :disabled="receivingPartial" class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50" @click="handlePartialReceive">
              {{ receivingPartial ? 'Memproses...' : 'Konfirmasi Terima' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Price Review Modal (after receive)            -->
    <!-- ============================================ -->
    <teleport to="body">
      <div v-if="showPriceReviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showPriceReviewModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[85vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Harga Beli Berubah!</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ pendingPriceChanges.length }} produk dengan harga beli berbeda dari sebelumnya. Review dan update harga jual?
              </p>
            </div>
          </div>

          <!-- Items list -->
          <div class="flex-1 overflow-y-auto space-y-2 mb-4">
            <div
              v-for="(item, idx) in pendingPriceChanges"
              :key="item.productId"
              class="border border-slate-200 rounded-lg p-3 space-y-2"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-800">{{ item.productName }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ item.productSku }}</p>
                </div>
                <span
                  :class="[
                    'text-[10px] font-bold px-1.5 py-0.5 rounded',
                    item.newCost > item.oldCost ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  ]"
                >
                  {{ item.newCost > item.oldCost ? '↑' : '↓' }}
                  {{ Math.abs(Math.round(((item.newCost - item.oldCost) / item.oldCost) * 100)) }}%
                </span>
              </div>

              <!-- Cost change -->
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-slate-50 rounded-md p-1.5">
                  <p class="text-[9px] text-slate-500 uppercase">Modal Lama</p>
                  <p class="text-xs font-mono text-slate-600 line-through">{{ formatRupiah(item.oldCost) }}</p>
                </div>
                <div class="bg-amber-50 rounded-md p-1.5">
                  <p class="text-[9px] text-amber-600 uppercase font-bold">Modal Baru</p>
                  <p class="text-xs font-mono font-bold text-amber-700">{{ formatRupiah(item.newCost) }}</p>
                </div>
                <div class="bg-blue-50 rounded-md p-1.5">
                  <p class="text-[9px] text-blue-600 uppercase">Margin</p>
                  <p class="text-xs font-mono font-bold text-blue-700">{{ item.marginPercent }}%</p>
                </div>
              </div>

              <!-- Price suggestion -->
              <div class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                <div class="flex-1">
                  <p class="text-[9px] text-slate-500">Harga jual saat ini: <strong>{{ formatRupiah(item.currentPrice) }}</strong></p>
                  <p class="text-[9px] text-emerald-700 font-semibold">Saran harga baru (margin {{ item.marginPercent }}%):</p>
                </div>
                <input
                  v-model.number="priceReviewInputs[idx]"
                  type="number"
                  :min="item.newCost"
                  class="w-24 h-7 px-2 text-xs font-mono text-right border border-emerald-300 rounded focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              @click="handleSkipPriceReview"
            >
              Lewati (Harga Tetap)
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                class="h-9 px-4 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                @click="handleUpdateCostOnly"
              >
                Update Modal Saja
              </button>
              <button
                type="button"
                :disabled="applyingPrices"
                class="h-9 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                @click="handleUpdateCostAndPrice"
              >
                {{ applyingPrices ? 'Menyimpan...' : 'Update Modal + Jual' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import supplierService, {
  type SupplierDto,
  type PurchaseOrderDto,
  type PurchaseOrderDetailDto,
  type POStatus,
} from '@/shared/services/supplier.service';

const authStore = useAuthStore();
const { ask } = useConfirm();
const toast = useToast();

type TabKey = 'suppliers' | 'po';
const tabs = [
  { key: 'suppliers' as TabKey, label: 'Supplier' },
  { key: 'po' as TabKey, label: 'Purchase Order' },
];
const activeTab = ref<TabKey>('suppliers');

// ============================================
// State
// ============================================
const suppliers = ref<SupplierDto[]>([]);
const suppliersLoading = ref(false);
const purchaseOrders = ref<PurchaseOrderDto[]>([]);
const posLoading = ref(false);
const poFilterStatus = ref('');

// Stats
const stats = ref({
  totalPurchaseThisMonth: 0,
  poPending: 0,
  activeSuppliers: 0,
  poThisMonth: 0,
  poReceivedThisMonth: 0,
});

// Supplier modal
const showSupplierModal = ref(false);
const editingSupplier = ref<SupplierDto | null>(null);
const savingSupplier = ref(false);
const supplierForm = reactive({ name: '', phone: '', address: '', notes: '' });

// PO detail
const showPODetail = ref(false);
const poDetail = ref<PurchaseOrderDetailDto | null>(null);
const poDetailLoading = ref(false);

// Partial receive
const showPartialReceive = ref(false);
const receivingPartial = ref(false);
const partialReceiveItems = ref<Array<{
  itemId: string;
  productName: string;
  orderQty: number;
  remaining: number;
  receivedQty: number;
  actualCost: number;
  lastCost: number;
}>>([]);

// Create PO
const showCreatePO = ref(false);
const creatingPO = ref(false);
const poForm = reactive({
  supplierId: '',
  notes: '',
  items: [{ productId: '', quantity: 1, unitCost: 0 }] as { productId: string; quantity: number; unitCost: number }[],
});

// Price review (after receive detects price changes)
const showPriceReviewModal = ref(false);
const pendingPriceChanges = ref<Array<{
  productId: string;
  productName: string;
  productSku: string;
  oldCost: number;
  newCost: number;
  currentPrice: number;
  marginPercent: number;
  suggestedPrice: number;
}>>([]);
const priceReviewInputs = ref<number[]>([]);
const applyingPrices = ref(false);

// ============================================
// Helpers
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function poStatusBadge(status: POStatus): string {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-600';
    case 'ORDERED': return 'bg-amber-100 text-amber-700';
    case 'PARTIAL': return 'bg-blue-100 text-blue-700';
    case 'RECEIVED': return 'bg-emerald-100 text-emerald-700';
    case 'CANCELLED': return 'bg-red-100 text-red-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function poStatusLabel(status: POStatus): string {
  switch (status) {
    case 'DRAFT': return 'Draft';
    case 'ORDERED': return 'Ordered';
    case 'PARTIAL': return 'Sebagian';
    case 'RECEIVED': return 'Diterima';
    case 'CANCELLED': return 'Batal';
    default: return status;
  }
}

// ============================================
// Methods
// ============================================

async function fetchSuppliers() {
  suppliersLoading.value = true;
  try {
    const res = await supplierService.listSuppliers({ shopId: getShopId() });
    suppliers.value = res.data;
  } catch { suppliers.value = []; }
  finally { suppliersLoading.value = false; }
}

async function fetchPOs() {
  posLoading.value = true;
  try {
    const res = await supplierService.listPurchaseOrders({
      shopId: getShopId(),
      status: (poFilterStatus.value as POStatus) || undefined,
    });
    purchaseOrders.value = res.data;
  } catch { purchaseOrders.value = []; }
  finally { posLoading.value = false; }
}

async function fetchStats() {
  try {
    const shopId = getShopId();
    // Fetch all POs (no status filter, larger limit for stats)
    const allPOs = await supplierService.listPurchaseOrders({ shopId, limit: 200 });

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const posThisMonth = allPOs.data.filter((po) => {
      const d = new Date(po.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const receivedThisMonth = posThisMonth.filter((po) => po.status === 'RECEIVED');
    const pending = allPOs.data.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIAL' || po.status === 'DRAFT');
    const totalPurchase = receivedThisMonth.reduce((sum, po) => sum + po.totalAmount, 0);
    const activeSupplierCount = suppliers.value.filter((s) => s.isActive).length;

    stats.value = {
      totalPurchaseThisMonth: totalPurchase,
      poPending: pending.length,
      activeSuppliers: activeSupplierCount,
      poThisMonth: posThisMonth.length,
      poReceivedThisMonth: receivedThisMonth.length,
    };
  } catch {
    // Stats non-blocking
  }
}

function openSupplierModal(s: SupplierDto | null) {
  editingSupplier.value = s;
  supplierForm.name = s?.name || '';
  supplierForm.phone = s?.phone || '';
  supplierForm.address = s?.address || '';
  supplierForm.notes = s?.notes || '';
  showSupplierModal.value = true;
}

async function handleSaveSupplier() {
  const shopId = getShopId();
  if (!shopId) return;
  savingSupplier.value = true;
  try {
    if (editingSupplier.value) {
      await supplierService.updateSupplier(editingSupplier.value.id, {
        name: supplierForm.name,
        phone: supplierForm.phone || undefined,
        address: supplierForm.address || undefined,
        notes: supplierForm.notes || undefined,
      });
    } else {
      await supplierService.createSupplier({
        shopId,
        name: supplierForm.name,
        phone: supplierForm.phone || undefined,
        address: supplierForm.address || undefined,
        notes: supplierForm.notes || undefined,
      });
    }
    showSupplierModal.value = false;
    await fetchSuppliers();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal menyimpan supplier.');
  } finally { savingSupplier.value = false; }
}

async function openPODetail(po: PurchaseOrderDto) {
  showPODetail.value = true;
  poDetailLoading.value = true;
  poDetail.value = null;
  try {
    poDetail.value = await supplierService.getPurchaseOrder(po.id);
  } catch { poDetail.value = null; }
  finally { poDetailLoading.value = false; }
}

async function handleCreatePO() {
  const shopId = getShopId();
  if (!shopId || !poForm.supplierId || poForm.items.length === 0) return;
  creatingPO.value = true;
  try {
    await supplierService.createPurchaseOrder({
      shopId,
      supplierId: poForm.supplierId,
      notes: poForm.notes || undefined,
      items: poForm.items.filter((i) => i.productId),
    });
    showCreatePO.value = false;
    poForm.supplierId = '';
    poForm.notes = '';
    poForm.items = [{ productId: '', quantity: 1, unitCost: 0 }];
    await fetchPOs();
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal membuat PO.');
  } finally { creatingPO.value = false; }
}

async function handleMarkOrdered() {
  if (!poDetail.value) return;
  try {
    await supplierService.markOrdered(poDetail.value.id);
    showPODetail.value = false;
    await fetchPOs();
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal.'); }
}

async function handleMarkReceived() {
  if (!poDetail.value) return;
  // For full receive, also open the receive modal so admin can input actual costs
  openPartialReceive();
}

function openPartialReceive() {
  if (!poDetail.value) return;
  partialReceiveItems.value = poDetail.value.items
    .filter((item) => item.receivedQty < item.quantity)
    .map((item) => ({
      itemId: item.id,
      productName: item.productName,
      orderQty: item.quantity,
      remaining: item.quantity - item.receivedQty,
      receivedQty: item.quantity - item.receivedQty, // default: terima semua sisa
      actualCost: item.unitCost || 0, // pre-fill dari PO item (bisa 0 kalau belum diisi)
      lastCost: item.unitCost || 0, // harga terakhir dari PO/produk
    }));
  showPartialReceive.value = true;
}

async function handlePartialReceive() {
  if (!poDetail.value) return;
  const items = partialReceiveItems.value
    .filter((i) => i.receivedQty > 0)
    .map((i) => ({ itemId: i.itemId, receivedQty: i.receivedQty, actualCost: i.actualCost || undefined }));
  if (items.length === 0) { toast.warning('Tidak ada item yang diterima.'); return; }

  // Validate: harga beli harus diisi
  const missingCost = partialReceiveItems.value.filter((i) => i.receivedQty > 0 && (!i.actualCost || i.actualCost <= 0));
  if (missingCost.length > 0) {
    toast.warning(`Harga beli belum diisi untuk: ${missingCost.map(i => i.productName).join(', ')}`);
    return;
  }

  receivingPartial.value = true;
  try {
    const res = await supplierService.markReceived(poDetail.value.id, items);
    toast.success(res.message || 'Berhasil!');
    showPartialReceive.value = false;
    showPODetail.value = false;
    await fetchPOs();

    // Check for price changes → show review modal (Tahap 4)
    if (res.priceChanges && res.priceChanges.length > 0) {
      pendingPriceChanges.value = res.priceChanges;
      priceReviewInputs.value = res.priceChanges.map((p: any) => p.suggestedPrice);
      showPriceReviewModal.value = true;
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal menerima barang.');
  } finally { receivingPartial.value = false; }
}

async function handleCancelPO() {
  if (!poDetail.value) return;
  const confirmed = await ask({ title: 'Batalkan PO?', message: 'Batalkan PO ini?', confirmLabel: 'Batalkan', variant: 'danger' });
  if (!confirmed) return;
  try {
    await supplierService.cancelPO(poDetail.value.id);
    showPODetail.value = false;
    await fetchPOs();
  } catch (err: any) { toast.error(err.response?.data?.message ?? 'Gagal.'); }
}

// ============================================
// Share/Export PO
// ============================================

function handleSharePO() {
  if (!poDetail.value) return;
  const po = poDetail.value;
  const lines: string[] = [
    `📋 *PURCHASE ORDER*`,
    `No: ${po.orderNumber}`,
    `Tanggal: ${formatDate(po.createdAt)}`,
    `Supplier: ${po.supplier.name}`,
    po.supplier.phone ? `HP: ${po.supplier.phone}` : '',
    ``,
    `*Daftar Barang:*`,
  ];

  po.items.forEach((item, idx) => {
    const costStr = item.unitCost > 0 ? ` @ ${formatRupiah(item.unitCost)}` : '';
    lines.push(`${idx + 1}. ${item.productName} (${item.productSku}) — ${item.quantity} unit${costStr}`);
  });

  if (po.totalAmount > 0) {
    lines.push('');
    lines.push(`*Total: ${formatRupiah(po.totalAmount)}*`);
  }

  if (po.notes) {
    lines.push('');
    lines.push(`Catatan: ${po.notes}`);
  }

  lines.push('');
  lines.push(`— Maslahat Tani`);

  const text = lines.filter(Boolean).join('\n');

  // Try to copy to clipboard
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Teks PO tersalin! Tinggal paste ke WhatsApp.');
  }).catch(() => {
    // Fallback: open in new window
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    toast.success('Teks PO tersalin!');
  });
}

// ============================================
// Price Review Handlers
// ============================================

function handleSkipPriceReview() {
  showPriceReviewModal.value = false;
  pendingPriceChanges.value = [];
  priceReviewInputs.value = [];
  toast.info('Harga tidak diubah.');
}

async function handleUpdateCostOnly() {
  applyingPrices.value = true;
  try {
    const updates = pendingPriceChanges.value.map((item) => ({
      productId: item.productId,
      cost: item.newCost,
      price: item.currentPrice, // keep current price
    }));
    await supplierService.bulkUpdatePrices(updates);
    toast.success('Modal produk berhasil diupdate. Harga jual tetap.');
    showPriceReviewModal.value = false;
    pendingPriceChanges.value = [];
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal update harga.');
  } finally { applyingPrices.value = false; }
}

async function handleUpdateCostAndPrice() {
  applyingPrices.value = true;
  try {
    const updates = pendingPriceChanges.value.map((item, idx) => ({
      productId: item.productId,
      cost: item.newCost,
      price: priceReviewInputs.value[idx] || item.suggestedPrice,
    }));
    await supplierService.bulkUpdatePrices(updates);
    toast.success('Modal & harga jual produk berhasil diupdate!');
    showPriceReviewModal.value = false;
    pendingPriceChanges.value = [];
    priceReviewInputs.value = [];
  } catch (err: any) {
    toast.error(err.response?.data?.message ?? 'Gagal update harga.');
  } finally { applyingPrices.value = false; }
}

// ============================================
// Tab watcher
// ============================================
watch(activeTab, (tab) => {
  if (tab === 'suppliers') fetchSuppliers();
  else fetchPOs();
});

onMounted(() => {
  fetchSuppliers();
  fetchStats();
});

useAutoRefresh(fetchSuppliers);
</script>
