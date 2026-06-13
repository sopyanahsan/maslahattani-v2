<template>
  <div class="space-y-5">
    <!-- Action bar (no h1 — title already in topbar) -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-[#869392] font-medium tabular-nums">
        <span v-if="meta">{{ meta.total }} produk</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="h-9 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5 shrink-0"
          @click="showBulkModal = true"
        >
          <UploadIcon class="w-3.5 h-3.5" />
          Upload Excel
        </button>
        <button
          type="button"
          class="h-9 px-4 bg-[#03a29c] text-white text-xs font-semibold rounded-lg
                 hover:bg-[#028a85] transition-colors flex items-center gap-1.5 shrink-0"
          @click="openCreateModal"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Produk
        </button>
      </div>
    </div>

    <!-- Search, Category filter, Sort -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#869392]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau SKU produk..."
          class="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg
                 focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-[#869392]"
          @input="debouncedSearch"
        />
      </div>
      <!-- Category filter -->
      <select
        v-model="filterCategory"
        class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg
               focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none bg-white dark:bg-[#1e2020] transition-colors"
        @change="resetAndFetch"
      >
        <option value="">Semua Kategori</option>
        <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">
          {{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}
        </option>
      </select>
      <!-- Sort -->
      <select
        v-model="sortMode"
        class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg
               focus:border-[#03a29c] focus:ring-1 focus:ring-[#03a29c]/30 outline-none bg-white dark:bg-[#1e2020] transition-colors"
        @change="resetAndFetch"
      >
        <option value="name-asc">A-Z (Nama)</option>
        <option value="name-desc">Z-A (Nama)</option>
        <option value="stock-low">Stok Terendah</option>
        <option value="stock-high">Stok Tertinggi</option>
        <option value="price-high">Harga Tertinggi</option>
        <option value="price-low">Harga Terendah</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-[#03a29c]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-[#bcc9c7]">Memuat produk...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-5 flex items-start gap-3 shadow-sm"
    >
      <AlertCircleIcon class="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-bold text-red-800 dark:text-red-200">{{ error }}</p>
        <button class="text-xs text-red-600 dark:text-red-400 underline underline-offset-2 mt-1" @click="fetchProducts">Coba lagi</button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="products.length === 0"
      class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-300 dark:border-[#3d4948] rounded-xl p-12 text-center shadow-sm"
    >
      <PackageIcon class="w-12 h-12 text-slate-300 dark:text-[#3d4948] mx-auto mb-3" />
      <p class="text-sm font-bold text-slate-700 dark:text-[#e3e2e2]">Belum ada produk</p>
      <p class="text-xs text-slate-500 dark:text-[#bcc9c7] mt-1.5">
        {{ searchQuery ? 'Tidak ditemukan produk dengan kata kunci tersebut.' : 'Tambah produk pertama untuk mulai berjualan.' }}
      </p>
    </div>

    <!-- Product Table -->
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide w-12">Img</th>
              <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">SKU</th>
              <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Nama Barang</th>
              <th class="px-3 py-2.5 text-left text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Kategori</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Stok</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Satuan</th>
              <th class="px-3 py-2.5 text-right text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Harga Jual</th>
              <th class="px-3 py-2.5 text-right text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Harga Beli</th>
              <th class="px-3 py-2.5 text-right text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Margin</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-[#3d4948]">
            <tr
              v-for="product in products"
              :key="product.id"
              class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
            >
              <td class="px-3 py-2.5 text-center">
                <div class="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden mx-auto flex items-center justify-center">
                  <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
                  <PackageIcon v-else class="w-3.5 h-3.5 text-slate-300" />
                </div>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex flex-col gap-0.5">
                  <code class="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block w-fit">{{ product.sku }}</code>
                  <code v-if="product.barcode" class="text-[9px] font-mono text-slate-400 px-1 inline-flex items-center gap-1">
                    <ScanBarcodeIcon class="w-2.5 h-2.5" />{{ product.barcode }}
                  </code>
                </div>
              </td>
              <td class="px-3 py-2.5">
                <p class="text-sm font-medium text-slate-900 dark:text-[#e3e2e2]">{{ product.name }}</p>
              </td>
              <td class="px-3 py-2.5">
                <span v-if="getCategoryName(product.categoryId)" class="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{{ getCategoryName(product.categoryId) }}</span>
                <span v-else class="text-[10px] text-slate-400">—</span>
              </td>
              <td class="px-3 py-2.5 text-center">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', getTotalStock(product) === 0 ? 'bg-red-100 text-red-700' : getTotalStock(product) <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700']">{{ getTotalStock(product) }}</span>
              </td>
              <td class="px-3 py-2.5 text-center text-xs text-slate-500 dark:text-[#bcc9c7]">{{ product.unit || 'pcs' }}</td>
              <td class="px-3 py-2.5 text-right text-sm font-mono text-slate-900 dark:text-[#e3e2e2] tabular-nums">{{ formatRupiah(product.price) }}</td>
              <td class="px-3 py-2.5 text-right text-sm font-mono text-slate-600 dark:text-[#bcc9c7] tabular-nums">{{ formatRupiah(product.cost) }}</td>
              <td class="px-3 py-2.5 text-right">
                <span :class="['text-xs font-mono font-semibold', getMargin(product) > 0 ? 'text-emerald-600' : 'text-red-600']">{{ getMarginPercent(product) }}%</span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-[#3d4948] flex items-center justify-center
                           hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                    title="Riwayat Stok"
                    @click="openStockHistory(product)"
                  >
                    <HistoryIcon class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-[#3d4948] flex items-center justify-center
                           hover:bg-slate-100 dark:hover:bg-[#292a2a] transition-colors"
                    title="Edit"
                    @click="openEditModal(product)"
                  >
                    <PencilIcon class="w-3.5 h-3.5 text-slate-600 dark:text-[#bcc9c7]" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 dark:border-[#3d4948] flex items-center justify-center
                           hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    title="Hapus"
                    @click="confirmDelete(product)"
                  >
                    <Trash2Icon class="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="px-4 py-3 border-t border-slate-200 dark:border-[#3d4948] flex items-center justify-between"
      >
        <p class="text-xs text-slate-500 dark:text-[#869392] tabular-nums">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </p>
        <div class="flex items-center gap-1.5">
          <button
            :disabled="meta.page <= 1"
            class="h-7 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-md
                   hover:bg-slate-50 dark:hover:bg-[#292a2a] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-[#bcc9c7] transition-colors"
            @click="goPage(meta!.page - 1)"
          >
            Prev
          </button>
          <button
            :disabled="meta.page >= meta.totalPages"
            class="h-7 px-3 text-xs font-semibold border border-slate-200 dark:border-[#3d4948] rounded-md
                   hover:bg-slate-50 dark:hover:bg-[#292a2a] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-[#bcc9c7] transition-colors"
            @click="goPage(meta!.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Create / Edit Modal                          -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

        <!-- Modal -->
        <form
          class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          @submit.prevent="handleSubmitForm"
        >
          <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">
            {{ editingProduct ? 'Edit Produk' : 'Tambah Produk Baru' }}
          </h2>

          <!-- 1. Gambar Produk -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gambar Produk
            </label>
            <div class="flex items-start gap-3">
              <div
                class="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden
                       flex items-center justify-center shrink-0"
              >
                <img
                  v-if="imagePreviewUrl"
                  :src="imagePreviewUrl"
                  alt="Preview"
                  class="w-full h-full object-cover"
                />
                <ImageIcon v-else class="w-6 h-6 text-slate-300" />
              </div>
              <div class="flex-1 space-y-1.5">
                <label
                  class="block h-9 px-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-md
                         text-xs text-slate-600 font-medium cursor-pointer
                         hover:border-blue-400 hover:bg-blue-50/50 transition-colors
                         flex items-center justify-center gap-1.5"
                >
                  <UploadIcon class="w-3.5 h-3.5" />
                  {{ imageUploading ? 'Mengupload...' : 'Pilih Gambar' }}
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="imageUploading"
                    @change="handleImageUpload"
                  />
                </label>
                <p class="text-[10px] text-slate-400">
                  JPG/PNG, maks 2MB. Upload ke Cloudinary.
                </p>
                <button
                  v-if="form.imageUrl"
                  type="button"
                  class="text-[10px] text-red-500 hover:underline"
                  @click="removeImage"
                >
                  Hapus gambar
                </button>
              </div>
            </div>
            <!-- Image URL (auto-filled after upload) -->
            <div v-if="form.imageUrl" class="mt-2">
              <label class="block text-[10px] font-medium text-slate-500 mb-0.5">URL Gambar</label>
              <div class="flex items-center gap-1.5">
                <input
                  :value="form.imageUrl"
                  type="text"
                  readonly
                  class="flex-1 h-7 px-2 text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded select-all outline-none"
                  @focus="($event.target as HTMLInputElement).select()"
                />
                <button
                  type="button"
                  class="shrink-0 h-7 px-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                  @click="copyImageUrl"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- 2. SKU (auto-generated from nama + kategori) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              SKU <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="form.sku"
                type="text"
                required
                :disabled="!!editingProduct"
                placeholder="Otomatis dari nama & kategori"
                :class="[
                  'flex-1 h-9 px-3 text-sm font-mono border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none',
                  editingProduct ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : 'border-slate-300',
                ]"
              />
              <button
                v-if="!editingProduct"
                type="button"
                class="shrink-0 h-9 px-3 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                title="Generate ulang SKU"
                @click="generateSku"
              >
                Generate
              </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">
              {{ editingProduct ? 'SKU tidak bisa diubah setelah dibuat.' : 'Auto-generate saat nama & kategori diisi. Bisa diedit manual.' }}
            </p>
          </div>

          <!-- 3. Nama Produk -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Produk <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Beras 5kg Premium"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              @blur="autoGenerateSku"
            />
          </div>

          <!-- 3b. Barcode (optional, scannable) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Barcode <span class="text-[10px] font-normal text-slate-400">(optional, scan / ketik)</span>
            </label>
            <div class="relative">
              <ScanBarcodeIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.barcode"
                type="text"
                placeholder="8991042001234 (scan barcode pabrik)"
                class="w-full h-9 pl-9 pr-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Untuk produk dengan barcode pabrik (EAN/UPC). Akan dipakai untuk scan di POS.
            </p>
          </div>

          <!-- 4. Kategori (dropdown + inline add/delete) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <div class="flex items-center gap-2">
              <select
                v-model="form.categoryId"
                class="flex-1 h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800"
              >
                <option value="">— Tanpa Kategori —</option>
                <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">
                  {{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}
                </option>
              </select>
              <button
                type="button"
                class="shrink-0 w-9 h-9 rounded-md border border-blue-300 bg-blue-50 text-blue-600
                       flex items-center justify-center hover:bg-blue-100 transition-colors"
                title="Tambah kategori baru"
                @click="toggleCategoryInline"
              >
                <PlusIcon class="w-4 h-4" />
              </button>
              <button
                v-if="form.categoryId"
                type="button"
                class="shrink-0 w-9 h-9 rounded-md border border-red-200 bg-red-50 text-red-500
                       flex items-center justify-center hover:bg-red-100 transition-colors"
                title="Hapus kategori terpilih"
                @click="handleDeleteCategory"
              >
                <Trash2Icon class="w-3.5 h-3.5" />
              </button>
            </div>
            <!-- Inline add category -->
            <div v-if="showCategoryInline" class="mt-2 space-y-2">
              <div class="flex items-center gap-2">
                <input
                  v-model="newCategoryName"
                  type="text"
                  placeholder="Nama kategori baru"
                  class="flex-1 h-8 px-2.5 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                         focus:border-blue-500 outline-none"
                  @keydown.enter.prevent="handleAddCategory"
                />
                <button
                  type="button"
                  :disabled="!newCategoryName.trim() || categoryAdding"
                  class="h-8 px-3 text-xs font-semibold text-white bg-blue-600 rounded-md
                         hover:bg-blue-700 disabled:opacity-50"
                  @click="handleAddCategory"
                >
                  {{ categoryAdding ? '...' : 'Tambah' }}
                </button>
              </div>
              <div v-if="categoryError" class="bg-red-50 border border-red-200 rounded-md p-2 text-[11px] text-red-700">
                {{ categoryError }}
              </div>
            </div>
          </div>

          <!-- 5. Stok Awal / Unit -->
          <div v-if="!editingProduct">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stok Awal
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.initialStock"
                type="number"
                min="0"
                placeholder="0"
                class="flex-1 h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                v-model="form.unit"
                type="text"
                placeholder="pcs"
                class="w-20 h-9 px-2.5 text-sm text-center border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">Jumlah barang & satuan (pcs, kg, liter, dll)</p>
          </div>

          <!-- 6. Harga Jual & Modal -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Jual (Rp) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                required
                placeholder="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Modal (Rp) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.cost"
                type="number"
                min="0"
                required
                placeholder="0"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- 7. Deskripsi -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Keterangan produk (opsional)"
              class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>

          <!-- Error -->
          <div
            v-if="formError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ formError }}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-md
                     hover:bg-slate-200 transition-colors"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="submitting" class="w-3.5 h-3.5 animate-spin" />
              {{ editingProduct ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Delete Confirmation Modal                    -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showDeleteModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2Icon class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Hapus Produk?</h3>
              <p class="text-xs text-slate-600 mt-1">
                Produk <strong>{{ deletingProduct?.name }}</strong> akan dihapus (soft delete).
                Data historis tetap tersimpan.
              </p>
            </div>
          </div>
          <div
            v-if="deleteError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ deleteError }}
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-md
                     hover:bg-slate-200 transition-colors"
              @click="showDeleteModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="deleting"
              class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md
                     hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              @click="handleDelete"
            >
              <Loader2Icon v-if="deleting" class="w-3.5 h-3.5 animate-spin" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Stock History Modal (per produk)             -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showStockHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showStockHistoryModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Riwayat Stok — {{ stockHistoryProduct?.name }}</h3>
            <button type="button" class="text-slate-400 hover:text-slate-600" @click="showStockHistoryModal = false">✕</button>
          </div>

          <div v-if="stockHistoryLoading" class="flex items-center justify-center py-8">
            <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
          </div>
          <div v-else-if="stockHistoryData.length === 0" class="text-center py-8">
            <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada riwayat stok.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="h in stockHistoryData" :key="h.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                h.quantityChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                {{ h.quantityChange > 0 ? '↑' : '↓' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ sourceLabel(h.source) }}</span>
                  <span v-if="h.paymentMethod" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{{ paymentLabel(h.paymentMethod) }}</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-0.5">{{ formatDateTime(h.createdAt) }}<span v-if="h.notes"> · {{ h.notes }}</span></p>
              </div>
              <div class="text-right shrink-0">
                <p :class="['text-xs font-bold font-mono', h.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600']">
                  {{ h.quantityChange > 0 ? '+' : '' }}{{ h.quantityChange }}
                </p>
                <p class="text-[10px] text-slate-400 font-mono">{{ h.quantityBefore }} → {{ h.quantityAfter }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Bulk Upload Modal                            -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showBulkModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeBulkModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">Upload Massal Produk (Excel)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Upload file <strong>.xlsx</strong> atau <strong>.csv</strong> untuk menambah banyak produk sekaligus. Maksimal 500 produk per upload.
          </p>

          <!-- Download Template -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-blue-800">Download Template</p>
              <p class="text-[10px] text-blue-600 mt-0.5">Gunakan template ini agar format kolom sesuai.</p>
            </div>
            <button
              type="button"
              :disabled="downloadingTemplate"
              class="h-8 px-3 text-[10px] font-semibold text-blue-700 bg-white border border-blue-300 rounded-md
                     hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              @click="downloadTemplate"
            >
              <Loader2Icon v-if="downloadingTemplate" class="w-3 h-3 animate-spin" />
              <DownloadIcon v-else class="w-3 h-3" />
              {{ downloadingTemplate ? 'Loading...' : 'Download' }}
            </button>
          </div>

          <!-- File Input -->
          <div>
            <label
              class="block w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer
                     hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              :class="bulkFile ? 'border-emerald-400 bg-emerald-50/30' : ''"
            >
              <UploadIcon class="w-6 h-6 mx-auto mb-2" :class="bulkFile ? 'text-emerald-500' : 'text-slate-400'" />
              <p v-if="bulkFile" class="text-xs font-semibold text-emerald-700">{{ bulkFile.name }}</p>
              <p v-else class="text-xs text-slate-500 dark:text-slate-400">Klik atau drag file Excel (.xlsx, .csv) ke sini</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                class="hidden"
                @change="handleBulkFileSelect"
              />
            </label>
          </div>

          <!-- Upload Result -->
          <div v-if="bulkResult" class="rounded-lg p-3 text-xs space-y-1" :class="bulkResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'">
            <p class="font-semibold" :class="bulkResult.success ? 'text-emerald-800' : 'text-red-800'">{{ bulkResult.message }}</p>
            <p v-if="bulkResult.imported" class="text-emerald-700">{{ bulkResult.imported }} produk berhasil diimport</p>
            <p v-if="bulkResult.skipped" class="text-amber-700">{{ bulkResult.skipped }} dilewati</p>
            <div v-if="bulkResult.errors && bulkResult.errors.length > 0" class="mt-2 max-h-24 overflow-y-auto">
              <p v-for="(err, i) in bulkResult.errors.slice(0, 10)" :key="i" class="text-red-600 text-[10px]">{{ err }}</p>
              <p v-if="bulkResult.errors.length > 10" class="text-red-500 text-[10px] mt-1">...dan {{ bulkResult.errors.length - 10 }} error lainnya</p>
            </div>
          </div>

          <!-- Error -->
          <div v-if="bulkError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
            {{ bulkError }}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 transition-colors" @click="closeBulkModal">
              {{ bulkResult ? 'Tutup' : 'Batal' }}
            </button>
            <button
              v-if="!bulkResult"
              type="button"
              :disabled="!bulkFile || bulkUploading"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              @click="handleBulkUpload"
            >
              <Loader2Icon v-if="bulkUploading" class="w-3.5 h-3.5 animate-spin" />
              Upload & Import
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Package as PackageIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ScanBarcode as ScanBarcodeIcon,
  History as HistoryIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useConfirm } from '@/shared/composables/useConfirm';
import { uploadToCloudinary } from '@/shared/services/upload.service';
import api from '@/shared/services/api';
import productsService, {
  type ProductDto,
  type ProductListResponse,
} from '@/shared/services/products.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const { ask } = useConfirm();

// ============================================
// State
// ============================================
const products = ref<ProductDto[]>([]);
const meta = ref<ProductListResponse['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const currentPage = ref(1);
const filterCategory = ref('');
const sortMode = ref('name-asc');

// Modal state
const showModal = ref(false);
const editingProduct = ref<ProductDto | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);

const form = reactive({
  name: '',
  sku: '',
  barcode: '',
  price: 0,
  cost: 0,
  initialStock: 0,
  imageUrl: '' as string | null,
  categoryId: '' as string,
  unit: 'pcs',
  description: '',
});

// Image upload state
const imageUploading = ref(false);
const imagePreviewUrl = ref<string | null>(null);

// Category inline state
const categoryList = ref<Array<{ id: string; name: string; icon?: string }>>([]);
const showCategoryInline = ref(false);
const newCategoryName = ref('');
const categoryAdding = ref(false);
const categoryError = ref<string | null>(null);

// Delete state
const showDeleteModal = ref(false);
const deletingProduct = ref<ProductDto | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

// Bulk upload state
const showBulkModal = ref(false);
const bulkFile = ref<File | null>(null);
const bulkUploading = ref(false);
const bulkError = ref<string | null>(null);
const bulkResult = ref<{ success: boolean; message: string; imported?: number; skipped?: number; errors?: string[] } | null>(null);
const downloadingTemplate = ref(false);

// Stock history modal state
const showStockHistoryModal = ref(false);
const stockHistoryProduct = ref<ProductDto | null>(null);
const stockHistoryData = ref<any[]>([]);
const stockHistoryLoading = ref(false);

// Debounce timer
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Methods
// ============================================

async function fetchProducts() {
  // Only show loading on first load (prevent flicker on auto-refresh)
  if (products.value.length === 0) loading.value = true;
  error.value = null;
  try {
    const shopId = authStore.user?.shopId ?? shopStore.currentShopId ?? undefined;
    const response = await productsService.list({
      shopId: shopId || undefined,
      search: searchQuery.value || undefined,
      categoryId: filterCategory.value || undefined,
      sortBy: sortMode.value || undefined,
      page: currentPage.value,
      limit: 20,
    });

    products.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    // Keep existing data on error (don't blank out)
    if (products.value.length === 0) {
      error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat produk.';
    }
  } finally {
    loading.value = false;
  }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchProducts();
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchProducts();
  }, 400);
}

function goPage(page: number) {
  currentPage.value = page;
  fetchProducts();
}

function openCreateModal() {
  editingProduct.value = null;
  form.name = '';
  form.sku = '';
  form.barcode = '';
  form.price = 0;
  form.cost = 0;
  form.initialStock = 0;
  form.imageUrl = null;
  form.categoryId = '';
  form.unit = 'pcs';
  form.description = '';
  imagePreviewUrl.value = null;
  showCategoryInline.value = false;
  newCategoryName.value = '';
  categoryError.value = null;
  formError.value = null;
  // Refresh categories on modal open (in case other admin added categories)
  fetchCategories();
  showModal.value = true;
}

function openEditModal(product: ProductDto) {
  editingProduct.value = product;
  form.name = product.name;
  form.sku = product.sku;
  form.barcode = product.barcode || '';
  form.price = product.price;
  form.cost = product.cost;
  form.initialStock = 0;
  form.imageUrl = product.imageUrl || null;
  form.categoryId = product.categoryId || '';
  form.unit = product.unit || 'pcs';
  form.description = (product as any).description || '';
  imagePreviewUrl.value = product.imageUrl || null;
  showCategoryInline.value = false;
  newCategoryName.value = '';
  categoryError.value = null;
  formError.value = null;
  fetchCategories();
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingProduct.value = null;
}

async function handleSubmitForm() {
  submitting.value = true;
  formError.value = null;

  try {
    if (editingProduct.value) {
      await productsService.update(editingProduct.value.id, {
        name: form.name,
        price: form.price,
        cost: form.cost,
        imageUrl: form.imageUrl ?? undefined,
        categoryId: form.categoryId || undefined,
        unit: form.unit || undefined,
        barcode: form.barcode.trim() || undefined,
        description: form.description || undefined,
      });
    } else {
      const shopId = await ensureShopScoped();
      if (!shopId) {
        formError.value = 'Tidak ada cabang aktif. Pilih cabang dulu.';
        return;
      }
      await productsService.create({
        shopId,
        name: form.name,
        sku: form.sku,
        barcode: form.barcode.trim() || undefined,
        price: form.price,
        cost: form.cost,
        initialStock: form.initialStock || undefined,
        imageUrl: form.imageUrl ?? undefined,
        categoryId: form.categoryId || undefined,
        unit: form.unit || undefined,
        description: form.description || undefined,
      });
    }
    closeModal();
    await fetchProducts();
  } catch (err: any) {
    formError.value = err.response?.data?.message ?? err.message ?? 'Gagal menyimpan produk.';
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(product: ProductDto) {
  deletingProduct.value = product;
  deleteError.value = null;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingProduct.value) return;
  deleting.value = true;
  deleteError.value = null;

  try {
    await productsService.remove(deletingProduct.value.id);
    showDeleteModal.value = false;
    deletingProduct.value = null;
    await fetchProducts();
  } catch (err: any) {
    deleteError.value = err.response?.data?.message ?? err.message ?? 'Gagal menghapus produk.';
  } finally {
    deleting.value = false;
  }
}

// ============================================
// Stock History per Product
// ============================================

async function openStockHistory(product: ProductDto) {
  stockHistoryProduct.value = product;
  stockHistoryData.value = [];
  showStockHistoryModal.value = true;
  stockHistoryLoading.value = true;
  try {
    const detail = await productsService.getDetail(product.id);
    // Flatten all stock histories from all warehouses
    const histories: any[] = [];
    for (const stock of detail.stocks || []) {
      for (const h of stock.stockHistories || []) {
        histories.push(h);
      }
    }
    histories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    stockHistoryData.value = histories;
  } catch {
    stockHistoryData.value = [];
  } finally {
    stockHistoryLoading.value = false;
  }
}

function sourceLabel(source?: string | null): string {
  if (!source) return '—';
  const map: Record<string, string> = {
    INITIAL: 'Stok Awal', BULK_UPLOAD: 'Import Excel', SEED: 'Seed',
    STOCK_IN: 'Restock', SALE: 'Penjualan', SALE_VOID: 'Void',
    OPNAME_INLINE: 'Opname', OPNAME_SESSION: 'Opname Sesi',
    TRANSFER_OUT: 'Transfer Keluar', TRANSFER_IN: 'Transfer Masuk',
    PURCHASE_ORDER: 'PO Supplier', ADJUSTMENT: 'Penyesuaian',
  };
  return map[source] || source;
}

function paymentLabel(method?: string | null): string {
  if (!method) return '';
  const map: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', HUTANG: 'Hutang' };
  return map[method] || method;
}

// ============================================
// Bulk Upload Methods
// ============================================

function handleBulkFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  bulkFile.value = file;
  bulkError.value = null;
  bulkResult.value = null;
}

async function downloadTemplate() {
  downloadingTemplate.value = true;
  bulkError.value = null;
  try {
    const response = await api.get('/products/bulk-template', { responseType: 'blob' });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-produk.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    bulkError.value = err.response?.data?.message || err.message || 'Gagal download template.';
  } finally {
    downloadingTemplate.value = false;
  }
}

async function handleBulkUpload() {
  if (!bulkFile.value) return;
  const shopId = await ensureShopScoped();
  if (!shopId) {
    bulkError.value = 'Tidak ada cabang aktif. Pilih cabang dulu.';
    return;
  }

  bulkUploading.value = true;
  bulkError.value = null;
  bulkResult.value = null;

  try {
    const formData = new FormData();
    formData.append('file', bulkFile.value);
    formData.append('shopId', shopId);

    const { data } = await api.post('/products/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    bulkResult.value = data;
    // Refresh product list
    await fetchProducts();
    await fetchCategories();
  } catch (err: any) {
    bulkError.value = err.response?.data?.message ?? err.message ?? 'Gagal upload.';
  } finally {
    bulkUploading.value = false;
  }
}

function closeBulkModal() {
  showBulkModal.value = false;
  bulkFile.value = null;
  bulkError.value = null;
  bulkResult.value = null;
}

// ============================================
// SKU Auto-Generate
// ============================================

/**
 * Format SKU: KTG-NAMA-XXX
 * - KTG = 3 huruf pertama kategori (uppercase), atau "GEN" kalau tanpa kategori
 * - NAMA = singkatan nama produk (3 huruf pertama kata pertama + angka kalau ada)
 * - XXX = 3 digit random untuk keunikan
 *
 * Contoh:
 * - "Beras 5kg Premium" + kategori "Sembako" → SEM-BRS5K-482
 * - "Pupuk Urea 50kg" + kategori "Pupuk"    → PUP-PPKU5-731
 * - "Minyak Goreng 1L" + tanpa kategori     → GEN-MYNK1-159
 */
function generateSku() {
  const name = form.name.trim();
  if (!name) {
    form.sku = '';
    return;
  }

  // Category prefix (3 chars)
  const cat = categoryList.value.find(c => c.id === form.categoryId);
  const catPrefix = cat
    ? cat.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
    : 'GEN';

  // Name part: take consonants + numbers, max 5 chars
  const nameClean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Remove vowels to shorten, keep first 5
  const vowels = /[AIUEO]/g;
  let nameShort = nameClean.replace(vowels, '');
  if (nameShort.length < 3) nameShort = nameClean; // fallback if too short
  nameShort = nameShort.substring(0, 5);

  // Random 3-digit suffix
  const rand = String(Math.floor(Math.random() * 900) + 100);

  form.sku = `${catPrefix || 'GEN'}-${nameShort || 'PRD'}-${rand}`;
}

/**
 * Auto-generate SKU when name field loses focus (only if SKU is empty and creating new).
 */
function autoGenerateSku() {
  if (editingProduct.value) return;
  if (form.sku && form.sku.length > 0) return; // Don't overwrite manually typed SKU
  generateSku();
}

// ============================================
// Copy Image URL
// ============================================

function copyImageUrl() {
  if (!form.imageUrl) return;
  navigator.clipboard.writeText(form.imageUrl).catch(() => {});
}

// ============================================
// Category Management (inline in product form)
// ============================================

async function fetchCategories() {
  try {
    const { data } = await api.get('/product-categories');
    categoryList.value = (data.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '',
    }));
  } catch {
    categoryList.value = [];
  }
}

function toggleCategoryInline() {
  showCategoryInline.value = !showCategoryInline.value;
  newCategoryName.value = '';
  categoryError.value = null;
}

/**
 * Pastikan JWT ter-scope ke cabang aktif.
 *
 * Super-admin yang login hanya men-set currentShop secara lokal (tanpa
 * re-issue token), sehingga JWT belum punya shopId → backend menolak operasi
 * yang bergantung pada shop dari token (mis. tambah kategori) dengan pesan
 * "Tidak ada cabang aktif". Helper ini me-resolve cabang aktif dan, bila perlu,
 * memanggil selectShop untuk mendapatkan token yang sudah ter-scope.
 *
 * Mengembalikan shopId final (atau undefined kalau benar-benar tidak ada cabang).
 */
async function ensureShopScoped(): Promise<string | undefined> {
  // Token sudah ter-scope → langsung pakai.
  if (authStore.user?.shopId) return authStore.user.shopId;

  // Ada cabang aktif lokal tapi token belum ter-scope → re-issue token.
  let shopId = shopStore.currentShopId ?? undefined;
  if (shopId) {
    try {
      await shopStore.selectShop(shopId);
      return authStore.user?.shopId ?? shopStore.currentShopId ?? shopId;
    } catch {
      return shopId; // fallback: minimal kirim shopId yang ada
    }
  }

  // Belum ada cabang sama sekali → fetch & auto-select (kasus toko 1 cabang).
  try {
    const shops = shopStore.availableShops.length
      ? shopStore.availableShops
      : await shopStore.fetchShops();
    if (shops && shops.length > 0) {
      await shopStore.selectShop(shops[0].id);
      shopId = shopStore.currentShopId ?? undefined;
    }
  } catch {
    /* ignore */
  }
  return shopId;
}

async function handleAddCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  categoryAdding.value = true;
  categoryError.value = null;
  try {
    await ensureShopScoped();
    const { data } = await api.post('/product-categories', { name });
    // Backend returns { category: { id, name, ... } }
    const newCat = data?.category || data;
    await fetchCategories();
    // Auto-select newly created category
    const found = categoryList.value.find(c => c.name === name);
    if (found?.id) {
      form.categoryId = found.id;
    } else if (newCat?.id) {
      form.categoryId = newCat.id;
    }
    newCategoryName.value = '';
    showCategoryInline.value = false;
  } catch (err: any) {
    categoryError.value = err.response?.data?.message || err.message || 'Gagal menambah kategori.';
  } finally {
    categoryAdding.value = false;
  }
}

async function handleDeleteCategory() {
  if (!form.categoryId) return;
  const cat = categoryList.value.find(c => c.id === form.categoryId);
  const confirmed = await ask({ title: 'Hapus Kategori?', message: `Hapus kategori "${cat?.name || ''}"? Produk terkait akan menjadi tanpa kategori.`, confirmLabel: 'Hapus', variant: 'danger' });
  if (!confirmed) return;
  try {
    await api.delete(`/product-categories/${form.categoryId}`);
    form.categoryId = '';
    await fetchCategories();
  } catch (err: any) {
    formError.value = err.response?.data?.message || 'Gagal menghapus kategori.';
  }
}

// ============================================
// Image Upload
// ============================================

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'Ukuran gambar maksimal 2MB.';
    return;
  }

  // Show preview immediately
  imagePreviewUrl.value = URL.createObjectURL(file);
  imageUploading.value = true;
  formError.value = null;

  try {
    const result = await uploadToCloudinary(file, 'posify/products');
    form.imageUrl = result.url;
  } catch (err: any) {
    formError.value = err.message || 'Gagal upload gambar.';
    imagePreviewUrl.value = form.imageUrl || null;
  } finally {
    imageUploading.value = false;
    // Reset input so same file can be re-selected
    input.value = '';
  }
}

function removeImage() {
  form.imageUrl = null;
  imagePreviewUrl.value = null;
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

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function getTotalStock(product: ProductDto): number {
  if (!product.stocks) return 0;
  return product.stocks.reduce((sum, s) => sum + s.quantity, 0);
}

function getMargin(product: ProductDto): number {
  return product.price - product.cost;
}

function getMarginPercent(product: ProductDto): string {
  if (product.cost === 0) return '∞';
  const pct = ((product.price - product.cost) / product.cost) * 100;
  return pct.toFixed(1);
}

function getCategoryName(categoryId?: string | null): string {
  if (!categoryId) return '';
  const cat = categoryList.value.find(c => c.id === categoryId);
  return cat ? cat.name : '';
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchProducts();
  fetchCategories();
});

useAutoRefresh(fetchProducts);

// Auto-regenerate SKU when category changes (only on create mode, only if name filled)
watch(() => form.categoryId, () => {
  if (editingProduct.value) return;
  if (!form.name.trim()) return;
  generateSku();
});
</script>
