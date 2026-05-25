<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Responsive Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14 sm:h-16">
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-slate-950">UI Showcase</h1>
            <p class="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Design System — Maslahat Tani v2</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] sm:text-xs font-medium">Option A</span>
            <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] sm:text-xs font-medium hidden sm:inline">Clean Professional</span>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-10 sm:space-y-12 lg:space-y-16">


      <!-- ═══════════════════════════════════════════ -->
      <!-- 1. COLOR PALETTE -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">1. Color Palette</h2>

        <h3 class="text-sm font-semibold text-slate-700 mb-3">Brand</h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-blue-600 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#2563EB</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Primary</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-blue-800 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#1E40AF</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Primary Dark</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-blue-100 rounded-lg shadow-sm border border-slate-200"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#DBEAFE</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Primary Light</p>
          </div>
        </div>

        <h3 class="text-sm font-semibold text-slate-700 mb-3">Semantic</h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-emerald-600 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#059669</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Success</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-amber-600 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#D97706</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Warning</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-red-600 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#DC2626</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Danger</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-indigo-500 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#6366F1</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Info</p>
          </div>
        </div>

        <h3 class="text-sm font-semibold text-slate-700 mb-3">Neutral</h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-slate-50 rounded-lg shadow-sm border border-slate-200"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#F8FAFC</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Background</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-slate-200 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#E2E8F0</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Border</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-slate-950 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#0F172A</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Text</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-slate-500 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#64748B</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Secondary</p>
          </div>
          <div class="flex flex-col">
            <div class="w-full aspect-square sm:h-20 bg-slate-900 rounded-lg shadow-sm"></div>
            <p class="text-[10px] sm:text-xs font-mono text-slate-600 mt-1.5">#0F172A</p>
            <p class="text-[10px] sm:text-xs text-slate-500">Sidebar</p>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 2. TYPOGRAPHY -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">2. Typography</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
          <div>
            <p class="text-[32px] leading-tight font-bold text-slate-950">Heading 1 — Dashboard Admin</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">32px / Bold / slate-950</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-950">Heading 2 — Ringkasan Hari Ini</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">24px / Bold / slate-950</p>
          </div>
          <div>
            <p class="text-xl font-semibold text-slate-900">Heading 3 — Transaksi Terakhir</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">20px / Semibold / slate-900</p>
          </div>
          <div>
            <p class="text-base font-semibold text-slate-900">Heading 4 — Judul Kartu</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">16px / Semibold / slate-900</p>
          </div>
          <div>
            <p class="text-sm text-slate-800">Body — Menampilkan data penjualan hari ini dari semua transaksi yang tercatat.</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">14px / Regular / slate-800</p>
          </div>
          <div>
            <p class="text-xs text-slate-600">Caption — Terakhir diperbarui 5 menit lalu</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">12px / Regular / slate-600</p>
          </div>
          <div>
            <p class="text-[28px] font-bold font-mono text-slate-950">Rp 2.500.000</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">28px / Bold / Mono — Nominal besar</p>
          </div>
          <div>
            <p class="text-sm font-mono font-medium text-slate-950">Rp 125.000</p>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1">14px / Medium / Mono — Nominal tabel</p>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 3. BUTTONS -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">3. Buttons</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <!-- Variants -->
          <div>
            <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Variants</p>
            <div class="flex flex-wrap gap-2 sm:gap-3">
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm">Primary</button>
              <button class="h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors">Secondary</button>
              <button class="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm">Danger</button>
              <button class="h-10 px-4 bg-red-50 text-red-600 text-sm font-semibold rounded-md border border-red-200 hover:bg-red-100 transition-colors">Danger Outline</button>
              <button class="h-10 px-4 bg-transparent text-blue-600 text-sm font-semibold rounded-md border border-blue-200 hover:bg-blue-50 transition-colors">Ghost</button>
              <button class="h-10 px-4 bg-slate-200 text-slate-400 text-sm font-semibold rounded-md cursor-not-allowed opacity-50">Disabled</button>
            </div>
          </div>
          <!-- Sizes -->
          <div>
            <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Sizes</p>
            <div class="flex flex-wrap items-end gap-2 sm:gap-3">
              <button class="h-8 px-3 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors">Small</button>
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">Medium</button>
              <button class="h-12 px-6 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors">Large</button>
            </div>
          </div>
          <!-- With Icons -->
          <div>
            <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">With Icons & Loading</p>
            <div class="flex flex-wrap gap-2 sm:gap-3">
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <span class="text-base">+</span> Tambah Produk
              </button>
              <button class="h-10 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
                <span class="text-base">&#10003;</span> Simpan
              </button>
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md opacity-80 cursor-wait inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Menyimpan...
              </button>
            </div>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 4. STAT CARDS -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">4. Stat Cards</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
            <p class="text-xs text-slate-600 mb-1.5">Omzet Hari Ini</p>
            <p class="text-xl sm:text-[28px] font-bold font-mono text-slate-950">Rp 2.500.000</p>
            <p class="text-xs text-emerald-600 mt-1.5 font-medium">&#8593; 12% dari kemarin</p>
          </div>
          <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
            <p class="text-xs text-slate-600 mb-1.5">Total Transaksi</p>
            <p class="text-xl sm:text-[28px] font-bold font-mono text-slate-950">47 Trx</p>
            <p class="text-xs text-red-600 mt-1.5 font-medium">&#8595; 3% dari kemarin</p>
          </div>
          <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
            <p class="text-xs text-slate-600 mb-1.5">Hutang Jatuh Tempo</p>
            <p class="text-xl sm:text-[28px] font-bold font-mono text-slate-950">Rp 850.000</p>
            <p class="text-xs text-amber-600 mt-1.5 font-medium">3 pelanggan</p>
          </div>
          <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
            <p class="text-xs text-slate-600 mb-1.5">Stok Habis</p>
            <p class="text-xl sm:text-[28px] font-bold font-mono text-slate-950">5 Produk</p>
            <p class="text-xs text-red-600 mt-1.5 font-medium">Perlu restok segera</p>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════ -->
      <!-- 5. BADGES & STATUS PILLS -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">5. Badges & Status</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
          <div class="flex flex-wrap gap-2 sm:gap-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Lunas</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Jatuh Tempo</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Overdue</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Aktif</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Nonaktif</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Info</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Void</span>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 6. FORM INPUTS -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">6. Form Inputs</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <!-- Text Input -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Nama Produk</label>
              <input type="text" placeholder="Masukkan nama produk" class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <!-- Select -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Kategori</label>
              <select class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                <option value="">Pilih kategori...</option>
                <option>Makanan</option>
                <option>Minuman</option>
                <option>Aksesoris</option>
              </select>
            </div>
            <!-- Search -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Pencarian</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#128269;</span>
                <input type="text" placeholder="Cari produk..." class="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <!-- Number Input -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Harga Jual</label>
              <input type="text" value="Rp 15.000" class="w-full h-10 px-3 text-sm font-mono border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <!-- Error State -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Email (Error)</label>
              <input type="email" value="invalid-email" class="w-full h-10 px-3 text-sm border border-red-500 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100" />
              <p class="mt-1 text-xs text-red-600">Email tidak valid</p>
            </div>
            <!-- Disabled -->
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Username (Disabled)</label>
              <input type="text" value="admin" disabled class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-500 opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <!-- Checkbox & Toggle -->
          <div class="mt-5 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="chk1" checked class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100" />
              <label for="chk1" class="text-sm text-slate-900">Produk aktif</label>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="chk2" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100" />
              <label for="chk2" class="text-sm text-slate-900">Tampilkan stok kosong</label>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                <div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
              </div>
              <span class="text-sm text-slate-900">Notifikasi</span>
            </div>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 7. TABLE -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">7. Table</h2>
        <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wide">No Trx</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wide">Petugas</th>
                  <th class="px-4 py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wide">Total</th>
                  <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Metode</th>
                  <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Status</th>
                  <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-2.5 text-sm text-slate-900 font-mono">TRX-20260525-001</td>
                  <td class="px-4 py-2.5 text-sm text-slate-900">Budi Santoso</td>
                  <td class="px-4 py-2.5 text-sm font-mono text-slate-950 text-right">Rp 250.000</td>
                  <td class="px-4 py-2.5 text-center"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">CASH</span></td>
                  <td class="px-4 py-2.5 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Lunas</span></td>
                  <td class="px-4 py-2.5 text-center"><button class="text-blue-600 hover:text-blue-700 text-xs font-semibold">Lihat</button></td>
                </tr>
                <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-2.5 text-sm text-slate-900 font-mono">TRX-20260525-002</td>
                  <td class="px-4 py-2.5 text-sm text-slate-900">Siti Aminah</td>
                  <td class="px-4 py-2.5 text-sm font-mono text-slate-950 text-right">Rp 125.000</td>
                  <td class="px-4 py-2.5 text-center"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">QRIS</span></td>
                  <td class="px-4 py-2.5 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span></td>
                  <td class="px-4 py-2.5 text-center"><button class="text-blue-600 hover:text-blue-700 text-xs font-semibold">Lihat</button></td>
                </tr>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-2.5 text-sm text-slate-900 font-mono">TRX-20260525-003</td>
                  <td class="px-4 py-2.5 text-sm text-slate-900">Andi Wijaya</td>
                  <td class="px-4 py-2.5 text-sm font-mono text-slate-950 text-right">Rp 500.000</td>
                  <td class="px-4 py-2.5 text-center"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">CASH</span></td>
                  <td class="px-4 py-2.5 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Void</span></td>
                  <td class="px-4 py-2.5 text-center"><button class="text-blue-600 hover:text-blue-700 text-xs font-semibold">Lihat</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 8. SIDEBAR NAVIGATION -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">8. Sidebar Navigation</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Sidebar Preview -->
          <div class="w-full max-w-[260px] bg-slate-900 rounded-lg overflow-hidden shadow-lg">
            <div class="h-14 px-5 flex items-center border-b border-slate-800">
              <span class="text-white font-bold text-sm">&#127978; Maslahat Tani</span>
            </div>
            <nav class="py-3 px-2 space-y-1">
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-md font-medium">
                &#128202; Dashboard
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#128722; Transaksi
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#128230; Produk & Stok
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#128176; Hutang Pembeli
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#128200; Laporan
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#128100; Kasir
              </a>
              <div class="my-2 border-t border-slate-800"></div>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                &#9881; Pengaturan
              </a>
              <a class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 rounded-md hover:bg-slate-800 hover:text-red-300 transition-colors cursor-pointer">
                &#128682; Logout
              </a>
            </nav>
          </div>
          <!-- Sidebar Specs -->
          <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 class="text-sm font-semibold text-slate-900 mb-3">Sidebar Specs</h3>
            <ul class="text-xs text-slate-700 space-y-2">
              <li><strong>Width:</strong> 256px (w-64)</li>
              <li><strong>Background:</strong> slate-900 (#0F172A)</li>
              <li><strong>Item Active:</strong> blue-600 bg, white text, rounded-md</li>
              <li><strong>Item Normal:</strong> slate-400 text</li>
              <li><strong>Item Hover:</strong> slate-800 bg, white text</li>
              <li><strong>Divider:</strong> border-t border-slate-800</li>
              <li><strong>Logo Area:</strong> h-14, border-b slate-800</li>
              <li><strong>Responsive:</strong> Hidden &lt;1024px, hamburger toggle</li>
            </ul>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 9. MODAL / DIALOG -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">9. Modal / Dialog</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-600 mb-4">Static preview (not a real overlay):</p>
          <!-- Fake modal container -->
          <div class="bg-slate-900/10 rounded-xl p-4 sm:p-8 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
              <!-- Header -->
              <div class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200">
                <h3 class="text-base sm:text-lg font-bold text-slate-950">Konfirmasi Pembatalan</h3>
                <button class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">&#10005;</button>
              </div>
              <!-- Body -->
              <div class="px-5 sm:px-6 py-5">
                <p class="text-sm text-slate-600 leading-relaxed">Apakah Anda yakin ingin membatalkan transaksi <strong class="text-slate-900">TRX-20260525-001</strong>? Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <!-- Footer -->
              <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <button class="h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors w-full sm:w-auto">Batal</button>
                <button class="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto">Hapus Transaksi</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════ -->
      <!-- 10. TOAST / NOTIFICATIONS -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">10. Toast / Notifications</h2>
        <div class="space-y-3 max-w-lg">
          <div class="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg px-4 py-3 shadow-sm">
            <p class="text-sm font-medium text-emerald-900">&#10003; Transaksi berhasil disimpan</p>
          </div>
          <div class="bg-red-50 border-l-4 border-red-500 rounded-r-lg px-4 py-3 shadow-sm">
            <p class="text-sm font-medium text-red-900">&#10007; Gagal menyimpan data. Coba lagi.</p>
          </div>
          <div class="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg px-4 py-3 shadow-sm">
            <p class="text-sm font-medium text-amber-900">&#9888; Stok "Beras 5kg" hampir habis (sisa 3)</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg px-4 py-3 shadow-sm">
            <p class="text-sm font-medium text-blue-900">&#8505; Data berhasil diperbarui dari server</p>
          </div>
        </div>
      </section>


      <!-- ═══════════════════════════════════════════ -->
      <!-- 11. EMPTY & LOADING STATES -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">11. Empty & Loading States</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Empty State -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div class="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div class="text-4xl sm:text-5xl mb-4">&#128237;</div>
              <p class="text-base font-semibold text-slate-900 mb-1">Tidak ada data</p>
              <p class="text-sm text-slate-600 mb-6 text-center">Mulai dengan membuat transaksi baru atau import data</p>
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <span>+</span> Buat Transaksi
              </button>
            </div>
          </div>
          <!-- Loading States -->
          <div class="space-y-4">
            <!-- Spinner Loading -->
            <div class="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div class="flex flex-col items-center justify-center py-10 px-4">
                <div class="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p class="text-sm text-slate-600">Memuat data...</p>
              </div>
            </div>
            <!-- Skeleton Loading -->
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p class="text-xs font-semibold text-slate-700 mb-3">Skeleton Loading</p>
              <div class="animate-pulse space-y-3">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="h-10 bg-slate-200 rounded w-full"></div>
                <div class="flex gap-3">
                  <div class="h-8 bg-slate-200 rounded flex-1"></div>
                  <div class="h-8 bg-slate-200 rounded flex-1"></div>
                  <div class="h-8 bg-slate-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════ -->
      <!-- 12. RESPONSIVE BREAKPOINTS INFO -->
      <!-- ═══════════════════════════════════════════ -->
      <section>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-4 sm:mb-6">12. Responsive Breakpoints</h2>
        <div class="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table class="w-full min-w-[400px]">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="px-3 py-2 text-left text-xs font-bold text-slate-900">Breakpoint</th>
                <th class="px-3 py-2 text-left text-xs font-bold text-slate-900">Min Width</th>
                <th class="px-3 py-2 text-left text-xs font-bold text-slate-900">Target</th>
                <th class="px-3 py-2 text-left text-xs font-bold text-slate-900">Layout</th>
              </tr>
            </thead>
            <tbody class="text-sm text-slate-700">
              <tr class="border-b border-slate-100">
                <td class="px-3 py-2 font-mono text-xs">default</td>
                <td class="px-3 py-2">0px</td>
                <td class="px-3 py-2">Mobile</td>
                <td class="px-3 py-2">1 col, no sidebar, bottom nav</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="px-3 py-2 font-mono text-xs">sm:</td>
                <td class="px-3 py-2">640px</td>
                <td class="px-3 py-2">Mobile Landscape</td>
                <td class="px-3 py-2">2 cols for cards</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="px-3 py-2 font-mono text-xs">md:</td>
                <td class="px-3 py-2">768px</td>
                <td class="px-3 py-2">Tablet</td>
                <td class="px-3 py-2">2 cols forms, wider content</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="px-3 py-2 font-mono text-xs">lg:</td>
                <td class="px-3 py-2">1024px</td>
                <td class="px-3 py-2">Desktop</td>
                <td class="px-3 py-2">Sidebar visible, 4 col stats</td>
              </tr>
              <tr>
                <td class="px-3 py-2 font-mono text-xs">xl:</td>
                <td class="px-3 py-2">1280px</td>
                <td class="px-3 py-2">Wide Desktop</td>
                <td class="px-3 py-2">Max-width container, spacious</td>
              </tr>
            </tbody>
          </table>
          <!-- Live Indicator -->
          <div class="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
            <p class="text-xs text-slate-600 mb-2 font-semibold">Current viewport:</p>
            <p class="text-sm font-mono font-bold">
              <span class="sm:hidden text-red-600">MOBILE (&lt;640px)</span>
              <span class="hidden sm:inline md:hidden text-amber-600">SM (640-767px)</span>
              <span class="hidden md:inline lg:hidden text-blue-600">MD / TABLET (768-1023px)</span>
              <span class="hidden lg:inline xl:hidden text-emerald-600">LG / DESKTOP (1024-1279px)</span>
              <span class="hidden xl:inline text-indigo-600">XL / WIDE (1280px+)</span>
            </p>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white mt-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-xs text-slate-500">
          Maslahat Tani v2 — UI Design System Showcase — Option A: Clean Professional
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
useHead({
  title: 'UI Showcase — Maslahat Tani v2'
})
</script>
