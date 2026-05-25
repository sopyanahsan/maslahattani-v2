<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <!-- Mobile Topbar -->
    <div class="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-2">
        <button
          class="p-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          @click="toggleSidebar"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
        <h1 class="text-base font-bold text-slate-950 dark:text-white">Maslahat Tani</h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Dark Mode Toggle (Mobile) -->
        <button
          class="p-2 text-slate-600 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
          @click="toggle"
          :title="isDark ? 'Light Mode' : 'Dark Mode'"
        >
          <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">Option A</span>
      </div>
    </div>

    <!-- Sidebar Overlay (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="toggleSidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      class="bg-sidebar-dark h-full w-64 fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="p-6 border-b border-slate-800">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-bold text-white">Maslahat Tani</h1>
            <p class="text-slate-400 text-xs mt-0.5">Design System Showcase</p>
          </div>
          <!-- Dark Mode Toggle (Desktop Sidebar) -->
          <button
            class="hidden lg:flex p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-md transition"
            @click="toggle"
            :title="isDark ? 'Light Mode' : 'Dark Mode'"
          >
            <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
          </button>
        </div>
      </div>
      <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <a
          v-for="(item, idx) in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition"
          :class="
            idx === 0
              ? 'bg-blue-600 text-white font-medium'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          "
          @click="closeSidebarOnMobile"
        >
          <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
          {{ item.label }}
        </a>
      </nav>
      <div class="p-4 border-t border-slate-800">
        <RouterLink to="/" class="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">arrow_back</span>
          Kembali ke Home
        </RouterLink>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 p-4 sm:p-6 lg:p-8">
      <header class="mb-8 sm:mb-12">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-950 dark:text-white">
          Design System Showcase
        </h1>
        <p class="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
          Visual identity dan UI components untuk Maslahat Tani v2 — POS + BRILink Agent System
        </p>
        <!-- Dark Mode Status Badge -->
        <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="isDark ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'bg-blue-50 text-blue-700 border border-blue-200'"
        >
          <span class="material-symbols-outlined text-[16px]">{{ isDark ? 'dark_mode' : 'light_mode' }}</span>
          {{ isDark ? 'Dark Mode Active' : 'Light Mode Active' }}
        </div>
      </header>

      <div class="space-y-12 sm:space-y-16">
        <!-- 1. COLOR PALETTE -->
        <section id="section-color">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            1. Color Palette
          </h2>

          <h3 class="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Brand</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div v-for="c in brandColors" :key="c.hex" class="space-y-2">
              <div :class="`h-16 w-full ${c.bg} rounded-lg shadow-sm ${c.border ?? ''}`"></div>
              <p class="text-xs font-semibold">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-slate-500">{{ c.hex }}</p>
            </div>
          </div>

          <h3 class="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Semantic</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div v-for="c in semanticColors" :key="c.hex" class="space-y-2">
              <div :class="`h-16 w-full ${c.bg} rounded-lg shadow-sm`"></div>
              <p class="text-xs font-semibold">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-slate-500">{{ c.hex }}</p>
            </div>
          </div>

          <h3 class="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Neutral</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            <div v-for="c in neutralColors" :key="c.hex" class="space-y-2">
              <div :class="`h-16 w-full ${c.bg} rounded-lg shadow-sm ${c.border ?? ''}`"></div>
              <p class="text-xs font-semibold">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-slate-500">{{ c.hex }}</p>
            </div>
          </div>
        </section>

        <!-- 2. TYPOGRAPHY -->
        <section id="section-typography">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            2. Typography
          </h2>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 rounded-lg space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4 gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-24 shrink-0">H1</span>
              <h1 class="text-2xl sm:text-3xl lg:text-[32px] font-bold text-slate-950 flex-1">Dashboard Admin</h1>
              <span class="text-xs font-mono text-blue-600">Inter Bold / 32px</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4 gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-24 shrink-0">H2</span>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-950 flex-1">Ringkasan Hari Ini</h2>
              <span class="text-xs font-mono text-blue-600">Inter Bold / 24px</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4 gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-24 shrink-0">H3</span>
              <h3 class="text-lg sm:text-xl font-semibold text-slate-900 flex-1">Transaksi Terakhir</h3>
              <span class="text-xs font-mono text-blue-600">Inter Semibold / 20px</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4 gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-24 shrink-0">Body</span>
              <p class="text-sm text-slate-800 flex-1">Menampilkan data penjualan hari ini dari semua transaksi yang tercatat.</p>
              <span class="text-xs font-mono text-blue-600">Inter Regular / 14px</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-24 shrink-0">Mono</span>
              <p class="text-sm font-mono font-medium text-slate-950 flex-1 bg-slate-50 px-3 py-2 rounded">Rp 2.500.000</p>
              <span class="text-xs font-mono text-blue-600">JetBrains Mono / 14px</span>
            </div>
          </div>
        </section>

        <!-- 3. BUTTONS -->
        <section id="section-buttons">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            3. Buttons
          </h2>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg space-y-6">
            <div>
              <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Variants</p>
              <div class="flex flex-wrap gap-2 sm:gap-3">
                <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition shadow-sm">Primary</button>
                <button class="h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition">Secondary</button>
                <button class="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition shadow-sm">Danger</button>
                <button class="h-10 px-4 bg-red-50 text-red-600 text-sm font-semibold rounded-md border border-red-200 hover:bg-red-100 transition">Danger Outline</button>
                <button class="h-10 px-4 bg-transparent text-blue-600 text-sm font-semibold rounded-md border border-blue-200 hover:bg-blue-50 transition">Ghost</button>
                <button class="h-10 px-4 bg-slate-200 text-slate-400 text-sm font-semibold rounded-md cursor-not-allowed opacity-60" disabled>Disabled</button>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Sizes</p>
              <div class="flex flex-wrap items-end gap-2 sm:gap-3">
                <button class="h-8 px-3 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition">Small</button>
                <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition">Medium</button>
                <button class="h-12 px-6 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition">Large</button>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">With Icons & Loading</p>
              <div class="flex flex-wrap gap-2 sm:gap-3">
                <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition inline-flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">add</span> Tambah Produk
                </button>
                <button class="h-10 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition inline-flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">check</span> Simpan
                </button>
                <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md opacity-80 cursor-wait inline-flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Menyimpan...
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. STAT CARDS -->
        <section id="section-cards">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            4. Stat Cards
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
              <div class="flex justify-between items-start mb-3">
                <span class="p-2 bg-blue-100 rounded-lg">
                  <span class="material-symbols-outlined text-blue-600 text-[20px]">payments</span>
                </span>
                <span class="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">trending_up</span>12%
                </span>
              </div>
              <p class="text-xs text-slate-600 mb-1">Omzet Hari Ini</p>
              <p class="text-xl sm:text-2xl font-bold font-mono text-slate-950">Rp 2.500.000</p>
            </div>
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
              <div class="flex justify-between items-start mb-3">
                <span class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <span class="material-symbols-outlined text-indigo-600 text-[20px]">receipt_long</span>
                </span>
              </div>
              <p class="text-xs text-slate-600 mb-1">Total Transaksi</p>
              <p class="text-xl sm:text-2xl font-bold font-mono text-slate-950">47 Trx</p>
            </div>
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
              <div class="flex justify-between items-start mb-3">
                <span class="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <span class="material-symbols-outlined text-amber-600 text-[20px]">event_busy</span>
                </span>
              </div>
              <p class="text-xs text-slate-600 mb-1">Hutang Jatuh Tempo</p>
              <p class="text-xl sm:text-2xl font-bold font-mono text-slate-950">Rp 850.000</p>
              <p class="text-xs text-amber-600 mt-1.5 font-medium">3 pelanggan</p>
            </div>
            <div class="bg-slate-900 p-4 sm:p-6 rounded-lg text-white">
              <div class="flex justify-between items-start mb-3">
                <span class="p-2 bg-white/10 rounded-lg">
                  <span class="material-symbols-outlined text-amber-400 text-[20px]">inventory_2</span>
                </span>
              </div>
              <p class="text-xs text-slate-400 mb-1">Stok Habis</p>
              <p class="text-xl sm:text-2xl font-bold font-mono">5 Produk</p>
              <p class="text-xs text-slate-400 mt-1.5">Perlu restok</p>
            </div>
          </div>
        </section>

        <!-- 5. FORMS -->
        <section id="section-forms">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            5. Form Inputs
          </h2>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Nama Produk</label>
                <input type="text" placeholder="Masukkan nama produk" class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Kategori</label>
                <select class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition">
                  <option>Pilih kategori...</option>
                  <option>Makanan</option>
                  <option>Minuman</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Pencarian</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
                  <input type="text" placeholder="Cari produk..." class="w-full h-10 pl-10 pr-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Harga Jual</label>
                <input type="text" value="Rp 15.000" class="w-full h-10 px-3 text-sm font-mono border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Email (Error)</label>
                <input type="email" value="invalid-email" class="w-full h-10 px-3 text-sm border border-red-500 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-100" />
                <p class="mt-1 text-xs text-red-600">Email tidak valid</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Username (Disabled)</label>
                <input type="text" value="admin" disabled class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-500 opacity-60 cursor-not-allowed" />
              </div>
            </div>
          </div>
        </section>

        <!-- 6. TABLE -->
        <section id="section-table">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            6. Table
          </h2>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[600px]">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wide">No Trx</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wide">Petugas</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wide">Total</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Metode</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Status</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="row in tableData" :key="row.id" class="hover:bg-slate-50 transition">
                    <td class="px-4 py-2.5 text-sm font-mono">{{ row.id }}</td>
                    <td class="px-4 py-2.5 text-sm">{{ row.petugas }}</td>
                    <td class="px-4 py-2.5 text-sm font-mono font-medium text-right">{{ row.total }}</td>
                    <td class="px-4 py-2.5 text-center">
                      <span :class="`px-2 py-0.5 rounded text-xs font-medium ${row.metodeBadge}`">{{ row.metode }}</span>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.statusBadge}`">{{ row.status }}</span>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <button class="text-blue-600 hover:text-blue-700 text-xs font-semibold">Detail</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 7. BADGES -->
        <section id="section-badges">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            7. Badges & Status
          </h2>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg">
            <div class="flex flex-wrap gap-2 sm:gap-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Lunas</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Jatuh Tempo</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Overdue</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Aktif</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Nonaktif</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Info</span>
            </div>
          </div>
        </section>

        <!-- 8. MODAL -->
        <section id="section-modal">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            8. Modal / Dialog
          </h2>
          <div class="bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-4 sm:p-8 flex items-center justify-center min-h-[300px] border border-dashed border-slate-300 dark:border-slate-700">
            <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div class="p-5 sm:p-6">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                  <h3 class="text-lg font-bold text-slate-950">Konfirmasi Pembatalan</h3>
                </div>
                <p class="text-sm text-slate-600 mb-6 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan transaksi
                  <strong class="text-slate-900">TRX-20260525-001</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <button class="h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition w-full sm:w-auto">Batal</button>
                  <button class="h-10 px-6 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition w-full sm:w-auto">Hapus Transaksi</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 9. EMPTY & LOADING STATES -->
        <section id="section-states">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            9. Empty & Loading States
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-64 flex flex-col items-center justify-center text-center p-6">
              <span class="text-4xl sm:text-5xl mb-3 opacity-50">📭</span>
              <p class="text-base font-semibold text-slate-900 mb-1">Belum Ada Transaksi</p>
              <p class="text-sm text-slate-600 max-w-[260px] mb-4">Mulai dengan membuat transaksi baru atau import data</p>
              <button class="h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition inline-flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">add</span> Buat Transaksi
              </button>
            </div>
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-64 flex flex-col items-center justify-center">
              <div class="relative w-12 h-12">
                <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p class="mt-4 text-sm text-slate-600 animate-pulse">Memuat data...</p>
            </div>
          </div>
        </section>

        <!-- 10. TOAST -->
        <section id="section-toast">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            10. Toast / Notifications
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div class="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-lg shadow-lg border-l-4 border-emerald-500">
              <span class="material-symbols-outlined text-emerald-500">check_circle</span>
              <div class="flex-1">
                <p class="text-sm font-semibold">Transaksi Berhasil!</p>
                <p class="text-xs text-slate-400">Struk sudah dikirim ke WhatsApp pembeli.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-lg shadow-lg border-l-4 border-red-500">
              <span class="material-symbols-outlined text-red-500">error</span>
              <div class="flex-1">
                <p class="text-sm font-semibold">Saldo Tidak Cukup</p>
                <p class="text-xs text-slate-400">Cek saldo BRI Anda sebelum transaksi.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-lg shadow-lg border-l-4 border-amber-500">
              <span class="material-symbols-outlined text-amber-500">warning</span>
              <div class="flex-1">
                <p class="text-sm font-semibold">Peringatan Stok</p>
                <p class="text-xs text-slate-400">Stok Beras 5kg tersisa 3 buah.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <footer class="mt-16 border-t border-slate-200 dark:border-slate-800 pt-8 pb-6 text-center">
        <div class="flex items-center justify-center gap-2 mb-3">
          <div class="h-2 w-10 bg-blue-600 rounded-full"></div>
          <div class="h-2 w-2 bg-blue-200 rounded-full"></div>
          <div class="h-2 w-2 bg-blue-200 rounded-full"></div>
        </div>
        <p class="text-sm text-slate-600">Maslahat Tani • Design System v1.0</p>
        <p class="text-xs text-slate-500 mt-1">© 2026 — Vue 3 + Vite + Tailwind</p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDarkMode } from '@/composables/useDarkMode';

const { isDark, toggle } = useDarkMode();

const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024) sidebarOpen.value = false;
};

const navItems = [
  { id: 'section-color', label: 'Color Palette', icon: 'palette' },
  { id: 'section-typography', label: 'Typography', icon: 'format_size' },
  { id: 'section-buttons', label: 'Buttons', icon: 'smart_button' },
  { id: 'section-cards', label: 'Stat Cards', icon: 'dashboard' },
  { id: 'section-forms', label: 'Forms', icon: 'edit_note' },
  { id: 'section-table', label: 'Tables', icon: 'table_chart' },
  { id: 'section-badges', label: 'Badges', icon: 'label' },
  { id: 'section-modal', label: 'Modal', icon: 'web_asset' },
  { id: 'section-states', label: 'States', icon: 'hourglass_empty' },
  { id: 'section-toast', label: 'Toast', icon: 'notifications' },
];

const brandColors = [
  { name: 'Primary', hex: '#2563EB', bg: 'bg-blue-600' },
  { name: 'Primary Dark', hex: '#1E40AF', bg: 'bg-blue-800' },
  { name: 'Primary Light', hex: '#DBEAFE', bg: 'bg-blue-100', border: 'border border-slate-200' },
];

const semanticColors = [
  { name: 'Success', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Warning', hex: '#D97706', bg: 'bg-amber-600' },
  { name: 'Danger', hex: '#DC2626', bg: 'bg-red-600' },
  { name: 'Info', hex: '#6366F1', bg: 'bg-indigo-500' },
];

const neutralColors = [
  { name: 'Background', hex: '#F8FAFC', bg: 'bg-slate-50', border: 'border border-slate-200' },
  { name: 'Border', hex: '#E2E8F0', bg: 'bg-slate-200' },
  { name: 'Text Primary', hex: '#0F172A', bg: 'bg-slate-950' },
  { name: 'Text Secondary', hex: '#64748B', bg: 'bg-slate-500' },
];

const tableData = [
  {
    id: 'TRX-20260525-001',
    petugas: 'Budi Santoso',
    total: 'Rp 250.000',
    metode: 'CASH',
    metodeBadge: 'bg-slate-100 text-slate-700',
    status: 'Lunas',
    statusBadge: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'TRX-20260525-002',
    petugas: 'Siti Aminah',
    total: 'Rp 125.000',
    metode: 'QRIS',
    metodeBadge: 'bg-blue-100 text-blue-700',
    status: 'Pending',
    statusBadge: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'TRX-20260525-003',
    petugas: 'Andi Wijaya',
    total: 'Rp 500.000',
    metode: 'CASH',
    metodeBadge: 'bg-slate-100 text-slate-700',
    status: 'Void',
    statusBadge: 'bg-red-100 text-red-700',
  },
];
</script>
