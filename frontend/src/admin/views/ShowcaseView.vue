<template>
  <div class="min-h-screen bg-[#121414] text-[#e3e2e2] font-hanken">
    <!-- Mobile Topbar -->
    <div class="lg:hidden bg-[#121414] border-b border-[#3d4948] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-2">
        <button class="p-2 -ml-2 text-[#bcc9c7] hover:bg-[#1e2020] rounded-md" @click="sidebarOpen = !sidebarOpen">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <h1 class="text-base font-bold text-[#5fd9d2]">Posify</h1>
      </div>
      <span class="px-2 py-1 bg-[#5fd9d2]/10 text-[#5fd9d2] rounded text-[10px] font-bold uppercase tracking-wider border border-[#5fd9d2]/20">UI Kit v2.0</span>
    </div>

    <!-- Sidebar Overlay (mobile) -->
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/60 z-40 lg:hidden" @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-screen w-[280px] bg-[#0d0e0f] border-r border-[#3d4948] flex flex-col py-6 z-50 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="px-4 mb-8">
        <h1 class="text-2xl font-bold text-[#5fd9d2] tracking-tight">Posify</h1>
        <p class="text-[11px] uppercase tracking-[0.1em] text-[#bcc9c7] font-medium mt-1">Design System v2.0</p>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-2 custom-scrollbar">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-lg"
          :class="activeSection === item.id
            ? 'bg-[#333535] text-[#5fd9d2] border-l-4 border-[#5fd9d2] pl-3'
            : 'text-[#bcc9c7] hover:bg-[#1e2020] hover:text-[#e3e2e2]'"
          @click="closeSidebarOnMobile"
        >
          <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
          <span class="text-[13px] font-medium">{{ item.label }}</span>
        </a>
      </nav>
      <div class="mt-auto px-4 pt-6 border-t border-[#3d4948]">
        <div class="flex items-center gap-3 bg-[#1e2020] p-3 rounded-xl">
          <div class="w-9 h-9 rounded-full bg-[#03a29c]/20 border border-[#5fd9d2]/30 flex items-center justify-center text-xs font-bold text-[#5fd9d2]">P</div>
          <div>
            <p class="text-xs font-bold text-[#e3e2e2]">Design System</p>
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#5fd9d2]">Core Library</p>
          </div>
        </div>
        <RouterLink to="/" class="mt-3 text-[11px] text-[#bcc9c7] hover:text-[#5fd9d2] flex items-center gap-1 transition-colors">
          <span class="material-symbols-outlined text-[14px]">arrow_back</span>
          Kembali ke Home
        </RouterLink>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-[280px]">
      <!-- Top Navigation Bar -->
      <header class="sticky top-0 h-16 bg-[#121414]/80 backdrop-blur-md border-b border-[#3d4948] z-20 hidden lg:flex items-center justify-between px-8">
        <div class="relative w-full max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9c7] text-[20px]">search</span>
          <input
            class="w-full bg-[#1e2020] border border-[#3d4948] rounded-lg pl-10 pr-4 py-2 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] focus:ring-1 focus:ring-[#5fd9d2]/20 transition-colors placeholder:text-[#bcc9c7]"
            placeholder="Search components..."
            type="text"
          />
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 text-[#bcc9c7] hover:bg-[#1e2020] rounded-lg transition-colors">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button class="p-2 text-[#bcc9c7] hover:bg-[#1e2020] rounded-lg transition-colors">
            <span class="material-symbols-outlined text-[22px]">settings</span>
          </button>
          <div class="w-8 h-8 rounded-full bg-[#03a29c]/20 border border-[#5fd9d2]/30 flex items-center justify-center text-xs font-bold text-[#5fd9d2]">A</div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-12 lg:space-y-16">
        <!-- Page Header -->
        <section>
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#5fd9d2]/10 border border-[#5fd9d2]/20 rounded-full mb-4">
            <span class="w-2 h-2 rounded-full bg-[#5fd9d2]"></span>
            <span class="text-[11px] font-bold text-[#5fd9d2] uppercase tracking-widest">Posify UI Kit v2.0</span>
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e3e2e2] tracking-tight">Design System Showcase</h1>
          <p class="text-base sm:text-lg text-[#bcc9c7] mt-3 max-w-3xl">
            Visual identity & UI components untuk Posify — menggunakan <span class="text-white font-semibold">Hanken Grotesk</span>, dark-mode first, optimized untuk POS environments.
          </p>
        </section>

        <!-- 1. COLOR PALETTE -->
        <section id="section-color">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Color Palette</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Tonal dark palette dengan primary teal accent, optimized untuk high-contrast dark mode.</p>

          <h3 class="text-xs font-bold text-[#bcc9c7] uppercase tracking-widest mb-3">Primary & Brand</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            <div v-for="c in primaryColors" :key="c.name" class="group">
              <div :style="`background-color: ${c.hex}`" class="h-16 w-full rounded-lg border border-[#3d4948] group-hover:ring-2 ring-[#5fd9d2]/40 transition-all"></div>
              <p class="text-[11px] font-semibold mt-2 text-[#e3e2e2]">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-[#bcc9c7]">{{ c.hex }}</p>
            </div>
          </div>

          <h3 class="text-xs font-bold text-[#bcc9c7] uppercase tracking-widest mb-3">Surface Hierarchy</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            <div v-for="c in surfaceColors" :key="c.name" class="group">
              <div :style="`background-color: ${c.hex}`" class="h-16 w-full rounded-lg border border-[#3d4948] group-hover:ring-2 ring-[#5fd9d2]/40 transition-all"></div>
              <p class="text-[10px] font-semibold mt-2 text-[#e3e2e2]">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-[#bcc9c7]">{{ c.hex }}</p>
            </div>
          </div>

          <h3 class="text-xs font-bold text-[#bcc9c7] uppercase tracking-widest mb-3">Semantic</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="c in semanticColors" :key="c.name" class="group">
              <div :style="`background-color: ${c.hex}`" class="h-16 w-full rounded-lg border border-[#3d4948] group-hover:ring-2 ring-[#5fd9d2]/40 transition-all"></div>
              <p class="text-[11px] font-semibold mt-2 text-[#e3e2e2]">{{ c.name }}</p>
              <p class="text-[10px] font-mono text-[#bcc9c7]">{{ c.hex }}</p>
            </div>
          </div>
        </section>

        <!-- 2. TYPOGRAPHY -->
        <section id="section-typography">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Typography System</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Hanken Grotesk — high-performance variable sans-serif optimized untuk data density dan legibility.</p>

          <div class="space-y-4">
            <div v-for="spec in typeSpecs" :key="spec.token" class="bg-[#0d0e0f] border border-[#3d4948] rounded-xl p-6 hover:border-[#5fd9d2] transition-colors">
              <div class="flex flex-col lg:flex-row justify-between gap-4">
                <div class="space-y-3 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-[#5fd9d2]/20 text-[#5fd9d2] text-[10px] font-bold rounded uppercase tracking-tighter">Token</span>
                    <span class="text-sm font-bold text-[#5fd9d2]">{{ spec.token }}</span>
                  </div>
                  <p :style="spec.style" class="text-white">{{ spec.sample }}</p>
                  <p class="text-xs text-[#bcc9c7] italic">{{ spec.usage }}</p>
                </div>
                <div class="flex flex-wrap lg:flex-col gap-x-6 gap-y-1 lg:text-right text-xs min-w-[160px]">
                  <div class="flex lg:justify-end gap-3"><span class="text-[#bcc9c7]">Size:</span> <span class="font-mono text-white">{{ spec.size }}</span></div>
                  <div class="flex lg:justify-end gap-3"><span class="text-[#bcc9c7]">Weight:</span> <span class="font-mono text-white">{{ spec.weight }}</span></div>
                  <div class="flex lg:justify-end gap-3"><span class="text-[#bcc9c7]">Line Height:</span> <span class="font-mono text-white">{{ spec.lineHeight }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. BUTTONS & CONTROLS -->
        <section id="section-buttons">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Buttons & Controls</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Functional core yang dioptimasi untuk high-visibility dan tactile responsiveness.</p>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Standard Buttons -->
            <div class="bg-[#1a1a1a] border border-[#3d4948] p-6 rounded-xl space-y-6">
              <h3 class="text-base font-semibold text-[#e3e2e2] border-b border-[#3d4948] pb-3">Standard Buttons</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Primary</span>
                  <button class="bg-[#03a29c] text-white px-4 py-2 rounded-lg text-xs font-medium hover:brightness-110 active:scale-95 transition-all">NORMAL</button>
                  <button class="bg-[#03a29c] text-white px-4 py-2 rounded-lg text-xs font-medium brightness-110 shadow-[0_0_15px_rgba(0,161,155,0.3)]">HOVER</button>
                  <button class="bg-[#03a29c]/50 text-white/50 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">DISABLED</button>
                </div>
                <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Secondary</span>
                  <button class="border border-[#3d4948] bg-transparent text-[#e3e2e2] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#333535] transition-all">NORMAL</button>
                  <button class="border border-[#3d4948] bg-[#333535] text-[#e3e2e2] px-4 py-2 rounded-lg text-xs font-medium">HOVER</button>
                  <button class="border border-[#3d4948]/30 text-[#bcc9c7]/30 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">DISABLED</button>
                </div>
                <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Ghost</span>
                  <button class="bg-transparent text-[#5fd9d2] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#5fd9d2]/10 transition-all">NORMAL</button>
                  <button class="bg-[#5fd9d2]/10 text-[#5fd9d2] px-4 py-2 rounded-lg text-xs font-medium">HOVER</button>
                  <button class="bg-transparent text-[#5fd9d2]/30 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">DISABLED</button>
                </div>
                <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-bold text-[#ffb4ab] uppercase tracking-wider">Danger</span>
                  <button class="bg-[#93000a] text-[#ffdad6] px-4 py-2 rounded-lg text-xs font-medium hover:brightness-110 transition-all">NORMAL</button>
                  <button class="bg-[#ffb4ab] text-[#690005] px-4 py-2 rounded-lg text-xs font-medium">HOVER</button>
                  <button class="bg-[#93000a]/30 text-[#ffdad6]/30 px-4 py-2 rounded-lg text-xs font-medium cursor-not-allowed">DISABLED</button>
                </div>
              </div>
            </div>

            <!-- Sizes & Icon Buttons -->
            <div class="bg-[#1a1a1a] border border-[#3d4948] p-6 rounded-xl space-y-6">
              <h3 class="text-base font-semibold text-[#e3e2e2] border-b border-[#3d4948] pb-3">Sizes & Icon Buttons</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <button class="bg-[#03a29c] text-white px-6 py-3 rounded-lg text-lg font-semibold flex-1">LARGE</button>
                  <span class="text-[11px] text-[#bcc9c7]">48px</span>
                </div>
                <div class="flex items-center gap-3">
                  <button class="bg-[#03a29c] text-white px-4 py-2 rounded-lg text-xs font-medium flex-1">MEDIUM</button>
                  <span class="text-[11px] text-[#bcc9c7]">40px</span>
                </div>
                <div class="flex items-center gap-3">
                  <button class="bg-[#03a29c] text-white px-3 py-1.5 rounded text-xs font-medium flex-1">SMALL</button>
                  <span class="text-[11px] text-[#bcc9c7]">32px</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-4 items-center pt-4 border-t border-[#3d4948]">
                <button class="w-12 h-12 flex items-center justify-center bg-[#03a29c] text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[#03a29c]/20">
                  <span class="material-symbols-outlined">add</span>
                </button>
                <button class="w-12 h-12 flex items-center justify-center bg-[#333535] border border-[#3d4948] text-[#e3e2e2] rounded-lg hover:border-[#5fd9d2] transition-colors">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="w-12 h-12 flex items-center justify-center border border-[#ffb4ab] text-[#ffb4ab] rounded-full hover:bg-[#ffb4ab]/10 transition-colors">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Selection Controls -->
          <div class="bg-[#1a1a1a] border border-[#3d4948] p-6 rounded-xl mt-6">
            <h3 class="text-base font-semibold text-[#e3e2e2] mb-6 border-b border-[#3d4948] pb-3">Selection Controls</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-4">
                <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Toggle Switches</span>
                <div class="flex items-center justify-between p-3 bg-black/40 border border-[#3d4948] rounded-lg">
                  <span class="text-sm">Real-time Sync</span>
                  <div class="relative w-12 h-6 bg-[#03a29c] rounded-full cursor-pointer" @click="toggleSync = !toggleSync">
                    <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" :class="toggleSync ? 'left-7' : 'left-1'"></div>
                  </div>
                </div>
                <div class="flex items-center justify-between p-3 bg-black/40 border border-[#3d4948] rounded-lg">
                  <span class="text-sm">Cloud Backup</span>
                  <div class="relative w-12 h-6 bg-[#3d4948] rounded-full cursor-pointer" @click="toggleBackup = !toggleBackup">
                    <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" :class="toggleBackup ? 'left-7' : 'left-1'"></div>
                  </div>
                </div>
              </div>
              <div class="space-y-4">
                <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Checkboxes</span>
                <label class="flex items-center gap-3 group cursor-pointer">
                  <div class="w-5 h-5 border-2 border-[#5fd9d2] bg-[#5fd9d2] rounded flex items-center justify-center">
                    <span class="material-symbols-outlined text-[14px] text-white font-bold">check</span>
                  </div>
                  <span class="text-sm group-hover:text-[#5fd9d2] transition-colors">Inventory Alerts</span>
                </label>
                <label class="flex items-center gap-3 group cursor-pointer">
                  <div class="w-5 h-5 border-2 border-[#3d4948] bg-transparent rounded group-hover:border-[#5fd9d2] transition-colors"></div>
                  <span class="text-sm group-hover:text-[#5fd9d2] transition-colors">Auto-print Receipts</span>
                </label>
              </div>
              <div class="space-y-4">
                <span class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-wider">Radio Options</span>
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="w-5 h-5 border-2 border-[#5fd9d2] rounded-full flex items-center justify-center">
                    <div class="w-2.5 h-2.5 bg-[#5fd9d2] rounded-full"></div>
                  </div>
                  <span class="text-sm">Standard Terminal</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="w-5 h-5 border-2 border-[#3d4948] rounded-full flex items-center justify-center hover:border-[#5fd9d2] transition-colors"></div>
                  <span class="text-sm">Handheld POS</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. STAT CARDS -->
        <section id="section-cards">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Cards & Stat Widgets</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">High-density data visualization components untuk POS dan admin interfaces.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-[#1e2020] border border-[#3d4948] p-4 rounded-lg hover:border-[#5fd9d2] transition-colors cursor-pointer group">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold text-[#bcc9c7] uppercase">Total Revenue</span>
                <span class="material-symbols-outlined text-[#5fd9d2] text-[20px]">payments</span>
              </div>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-2xl font-bold">$124,592</span>
                <span class="text-xs font-bold text-[#5fd9d2] flex items-center"><span class="material-symbols-outlined text-[14px]">trending_up</span> 12.5%</span>
              </div>
              <div class="h-8 bg-[#292a2a] rounded overflow-hidden">
                <div class="h-full w-3/4 bg-gradient-to-r from-[#03a29c]/40 to-[#5fd9d2]/40 rounded"></div>
              </div>
            </div>
            <div class="bg-[#1e2020] border border-[#3d4948] p-4 rounded-lg hover:border-green-400 transition-colors cursor-pointer">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold text-[#bcc9c7] uppercase">Profit Margin</span>
                <span class="material-symbols-outlined text-green-400 text-[20px]">account_balance_wallet</span>
              </div>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-2xl font-bold">32.4%</span>
                <span class="text-xs font-bold text-green-400 flex items-center"><span class="material-symbols-outlined text-[14px]">trending_up</span> 1.2%</span>
              </div>
              <div class="h-8 bg-[#292a2a] rounded overflow-hidden">
                <div class="h-full w-2/3 bg-gradient-to-r from-green-500/30 to-green-400/30 rounded"></div>
              </div>
            </div>
            <div class="bg-[#1e2020] border border-[#3d4948] p-4 rounded-lg hover:border-blue-400 transition-colors cursor-pointer">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold text-[#bcc9c7] uppercase">BRILink Balance</span>
                <span class="material-symbols-outlined text-blue-400 text-[20px]">account_balance</span>
              </div>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-2xl font-bold">Rp 42.5M</span>
                <span class="text-xs font-bold text-[#bcc9c7]">Daily Limit</span>
              </div>
              <div class="w-full h-1.5 bg-[#292a2a] rounded-full overflow-hidden">
                <div class="h-full bg-blue-400 w-3/4 rounded-full"></div>
              </div>
              <p class="text-[10px] text-[#bcc9c7] mt-2">Last synced: 2 mins ago</p>
            </div>
            <div class="bg-[#1e2020] border border-[#3d4948] p-4 rounded-lg hover:border-[#5fd9d2] transition-colors cursor-pointer">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold text-[#bcc9c7] uppercase">Transactions</span>
                <span class="material-symbols-outlined text-[#5fd9d2] text-[20px]">receipt_long</span>
              </div>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-2xl font-bold">1,482</span>
                <span class="text-xs font-bold text-[#ffb4ab] flex items-center"><span class="material-symbols-outlined text-[14px]">trending_down</span> 2.4%</span>
              </div>
              <div class="h-8 bg-[#292a2a] rounded overflow-hidden">
                <div class="h-full w-1/2 bg-gradient-to-r from-[#ffb4ab]/30 to-[#ffb4ab]/10 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Quick Action Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button v-for="action in quickActions" :key="action.label" class="flex flex-col items-center justify-center p-4 bg-[#1e2020] border border-[#3d4948] rounded-lg hover:border-[#5fd9d2] hover:bg-[#5fd9d2]/5 transition-all group">
              <div class="w-10 h-10 rounded-full bg-[#5fd9d2]/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[#5fd9d2] text-[22px]">{{ action.icon }}</span>
              </div>
              <span class="text-[11px] font-bold text-[#e3e2e2]">{{ action.label }}</span>
            </button>
          </div>
        </section>

        <!-- 5. FORMS -->
        <section id="section-forms">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Form Components</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Input fields, selectors, dan validation states untuk high-speed retail environments.</p>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Form Foundations -->
            <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-6 space-y-5">
              <h3 class="text-sm font-bold text-[#e3e2e2] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#5fd9d2] text-[18px]">text_fields</span>
                Form Foundations
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] mb-1 block">Text Input</label>
                  <input class="w-full bg-[#1a1c1c] border border-[#38393a] rounded-lg px-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all placeholder:text-[#bcc9c7]/50" placeholder="Enter product name..." type="text" />
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] mb-1 block">Currency Input</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9c7] text-sm">Rp</span>
                    <input class="w-full bg-[#1a1c1c] border border-[#38393a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all" placeholder="0" type="text" />
                  </div>
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] mb-1 block">Search Input</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9c7] text-[18px]">search</span>
                    <input class="w-full bg-[#1a1c1c] border border-[#38393a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] focus:shadow-[0_0_0_2px_rgba(95,217,210,0.2)] transition-all" placeholder="Search catalog..." type="text" />
                  </div>
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] mb-1 block">Select Dropdown</label>
                  <select class="w-full bg-[#1a1c1c] border border-[#38393a] rounded-lg px-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] transition-all appearance-none">
                    <option>Standard Option</option>
                    <option>Beverages</option>
                    <option>Bakery Items</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Validation States -->
            <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-6 space-y-5">
              <h3 class="text-sm font-bold text-[#e3e2e2] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#5fd9d2] text-[18px]">rule</span>
                Validation & States
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] mb-1 block">Required Field <span class="text-[#ffb4ab]">*</span></label>
                  <input class="w-full bg-[#1a1c1c] border border-[#38393a] rounded-lg px-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#5fd9d2] transition-all" placeholder="Must fill this out" type="text" />
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#ffb4ab] mb-1 block">Error State</label>
                  <input class="w-full bg-[#93000a]/10 border border-[#ffb4ab] rounded-lg px-4 py-2.5 text-sm text-[#ffb4ab] focus:outline-none" type="text" value="invalid-email@" />
                  <span class="text-[11px] text-[#ffb4ab] flex items-center gap-1 mt-1">
                    <span class="material-symbols-outlined text-[12px]">error</span>
                    Please enter a valid email address.
                  </span>
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#5fd9d2] mb-1 block">Success/Valid State</label>
                  <div class="relative">
                    <input class="w-full bg-[#03a29c]/10 border border-[#5fd9d2] rounded-lg px-4 py-2.5 text-sm text-[#e3e2e2] focus:outline-none" type="text" value="verified_admin" />
                    <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5fd9d2] text-[18px]">check_circle</span>
                  </div>
                  <span class="text-[11px] text-[#5fd9d2] mt-1 block">Username is available.</span>
                </div>
                <div>
                  <label class="text-[11px] font-medium text-[#bcc9c7] opacity-60 mb-1 block">Disabled State</label>
                  <input class="w-full bg-[#1e2020] border border-[#3d4948] rounded-lg px-4 py-2.5 text-sm text-[#bcc9c7] opacity-50 cursor-not-allowed" disabled type="text" value="System ID: POS-8892-X" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. TABLES & FILTERS -->
        <section id="section-table">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Tables & Filters</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Primary table pattern with robust filtering dan action capabilities.</p>

          <!-- Table Toolbar -->
          <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-4 mb-4">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9c7] text-[18px]">search</span>
                <input class="w-full bg-[#121414] border border-[#3d4948] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#5fd9d2] focus:ring-1 focus:ring-[#5fd9d2]/20 outline-none text-[#e3e2e2]" placeholder="Search by ID, customer, or SKU..." type="text" />
              </div>
              <button class="flex items-center gap-2 px-3 py-2 bg-[#121414] border border-[#3d4948] rounded-lg text-sm text-[#e3e2e2] hover:bg-[#292a2a] transition-colors">
                Status: <span class="text-[#5fd9d2] font-medium">All</span>
                <span class="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
              <button class="flex items-center gap-2 px-3 py-2 bg-[#03a29c] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <span class="material-symbols-outlined text-[18px]">add</span>
                New Entry
              </button>
            </div>
          </div>

          <!-- Data Table -->
          <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[700px]">
                <thead class="bg-[#292a2a] border-b border-[#3d4948]">
                  <tr>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Transaction ID</th>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Customer</th>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Type</th>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Amount</th>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Status</th>
                    <th class="py-3 px-4 text-[11px] font-bold text-[#bcc9c7] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3d4948]">
                  <tr v-for="row in tableData" :key="row.id" class="hover:bg-[#1e2020] transition-colors">
                    <td class="py-3 px-4 text-sm font-medium text-[#5fd9d2]">{{ row.id }}</td>
                    <td class="py-3 px-4 text-sm text-[#e3e2e2]">{{ row.customer }}</td>
                    <td class="py-3 px-4 text-sm text-[#bcc9c7]">{{ row.type }}</td>
                    <td class="py-3 px-4 text-sm text-[#e3e2e2]">{{ row.amount }}</td>
                    <td class="py-3 px-4">
                      <span :class="row.statusClass" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border">
                        <span class="w-1.5 h-1.5 rounded-full" :class="row.dotClass"></span>
                        {{ row.status }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-sm text-[#bcc9c7]">{{ row.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination -->
            <div class="bg-[#1e2020] px-4 py-3 flex items-center justify-between border-t border-[#3d4948]">
              <p class="text-[11px] text-[#bcc9c7]">Showing 1-10 of 420 results</p>
              <div class="flex items-center gap-1">
                <button class="w-7 h-7 flex items-center justify-center rounded border border-[#3d4948] text-[#bcc9c7] hover:border-[#5fd9d2] hover:text-[#5fd9d2] transition-colors">
                  <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button class="w-7 h-7 rounded bg-[#5fd9d2] text-[#003735] text-[11px] font-bold">1</button>
                <button class="w-7 h-7 rounded text-[11px] text-[#bcc9c7] hover:border hover:border-[#3d4948] transition-colors">2</button>
                <button class="w-7 h-7 rounded text-[11px] text-[#bcc9c7] hover:border hover:border-[#3d4948] transition-colors">3</button>
                <span class="text-[#bcc9c7] text-[11px] px-1">...</span>
                <button class="w-7 h-7 rounded text-[11px] text-[#bcc9c7] hover:border hover:border-[#3d4948] transition-colors">42</button>
                <button class="w-7 h-7 flex items-center justify-center rounded border border-[#3d4948] text-[#bcc9c7] hover:border-[#5fd9d2] hover:text-[#5fd9d2] transition-colors">
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. BADGES & STATES -->
        <section id="section-badges">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Badges & States</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Status indicators, badge variants, dan visual interface states.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Pill Badges -->
            <div class="bg-[#1e2020] border border-[#3d4948] p-6 rounded-xl space-y-4">
              <h3 class="text-sm font-semibold text-[#e3e2e2] border-b border-[#3d4948] pb-2">Pill Variant</h3>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full bg-[#5fd9d2]/10 border border-[#5fd9d2]/20 text-[#5fd9d2] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="w-2 h-2 rounded-full bg-[#5fd9d2]"></span> Success
                </span>
                <span class="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> Warning
                </span>
                <span class="px-3 py-1 rounded-full bg-[#ffb4ab]/10 border border-[#93000a]/20 text-[#ffb4ab] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="w-2 h-2 rounded-full bg-[#ffb4ab]"></span> Danger
                </span>
                <span class="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span> Info
                </span>
                <span class="px-3 py-1 rounded-full bg-[#333535]/30 border border-[#3d4948] text-[#bcc9c7] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="w-2 h-2 rounded-full bg-[#869392]"></span> Neutral
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 rounded-full bg-[#5fd9d2] text-[#003735] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="material-symbols-outlined text-[12px]">check_circle</span> Paid
                </span>
                <span class="px-3 py-1 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="material-symbols-outlined text-[12px]">cancel</span> Unpaid
                </span>
              </div>
            </div>
            <!-- Square Badges -->
            <div class="bg-[#1e2020] border border-[#3d4948] p-6 rounded-xl space-y-4">
              <h3 class="text-sm font-semibold text-[#e3e2e2] border-b border-[#3d4948] pb-2">Square Variant</h3>
              <div class="flex flex-wrap gap-2">
                <span class="px-2.5 py-0.5 rounded bg-[#5fd9d2]/10 border border-[#5fd9d2]/20 text-[#5fd9d2] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="material-symbols-outlined text-[14px]">bolt</span> Active
                </span>
                <span class="px-2.5 py-0.5 rounded bg-[#333535]/30 border border-[#3d4948] text-[#bcc9c7] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="material-symbols-outlined text-[14px]">block</span> Inactive
                </span>
                <span class="px-2.5 py-0.5 rounded bg-[#929090]/10 border border-[#929090]/20 text-[#c8c6c5] flex items-center gap-1.5 text-[11px] font-medium">
                  <span class="material-symbols-outlined text-[14px]">history</span> Non Shift
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="flex items-center gap-2 p-2 rounded bg-[#292a2a] border border-[#3d4948]">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#5fd9d2] shadow-[0_0_8px_rgba(95,217,210,0.6)]"></span>
                  <span class="text-[11px] font-medium text-[#e3e2e2]">Terminal 01 - Online</span>
                </div>
                <div class="flex items-center gap-2 p-2 rounded bg-[#292a2a] border border-[#3d4948] opacity-60">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#869392]"></span>
                  <span class="text-[11px] font-medium text-[#e3e2e2]">Terminal 02 - Offline</span>
                </div>
              </div>
            </div>
          </div>

          <!-- UI States -->
          <h3 class="text-sm font-bold text-[#bcc9c7] uppercase tracking-widest mb-4">System UI States</h3>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Empty State -->
            <div class="bg-[#1e2020] border border-[#3d4948] rounded-xl p-8 flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-full bg-[#333535]/20 flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-[40px] text-[#bcc9c7]">folder_off</span>
              </div>
              <h4 class="text-base font-semibold text-[#e3e2e2] mb-2">No data found</h4>
              <p class="text-xs text-[#bcc9c7] mb-6">It looks like we don't have any records yet.</p>
              <button class="bg-[#03a29c] text-white px-4 py-2 rounded-lg text-xs font-medium hover:brightness-110 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">add</span>
                Create New Entry
              </button>
            </div>
            <!-- Loading State -->
            <div class="bg-[#1e2020] border border-[#3d4948] rounded-xl p-8 space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#292a2a] animate-pulse"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-3/4 bg-[#292a2a] rounded animate-pulse"></div>
                  <div class="h-2 w-1/2 bg-[#292a2a] rounded animate-pulse"></div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="h-8 w-full bg-[#292a2a] rounded-lg animate-pulse"></div>
                <div class="h-8 w-full bg-[#292a2a] rounded-lg animate-pulse"></div>
                <div class="h-8 w-full bg-[#292a2a] rounded-lg animate-pulse"></div>
              </div>
              <p class="text-[11px] text-[#bcc9c7] text-center italic">Simulating data fetch...</p>
            </div>
            <!-- Success State -->
            <div class="bg-[#1e2020] border border-[#3d4948] rounded-xl p-8 flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-full bg-[#5fd9d2]/20 border border-[#5fd9d2]/30 flex items-center justify-center mb-4 text-[#5fd9d2]">
                <span class="material-symbols-outlined text-[40px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              </div>
              <h4 class="text-base font-semibold text-[#e3e2e2] mb-2">Transaction Complete</h4>
              <p class="text-xs text-[#bcc9c7] mb-6">Payment received successfully.</p>
              <button class="border border-[#3d4948] text-[#e3e2e2] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#292a2a] transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">print</span>
                Print Receipt
              </button>
            </div>
          </div>
        </section>

        <!-- 8. MODAL & TOAST -->
        <section id="section-modal">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Modal & Notifications</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Transactional feedback components, overlays, dan system alerts.</p>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Toast Variants -->
            <div class="space-y-3">
              <p class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-widest mb-3">Toast Notification Variants</p>
              <div class="bg-[#292a2a] border border-[#3d4948] rounded-lg p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-[#5fd9d2]">check_circle</span>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-[#e3e2e2]">Transaction Successful</p>
                  <p class="text-[11px] text-[#bcc9c7]">Order #9921 has been processed.</p>
                </div>
                <span class="material-symbols-outlined text-[#bcc9c7] cursor-pointer text-[18px]">close</span>
              </div>
              <div class="bg-[#292a2a] border border-[#3d4948] rounded-lg p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-[#ffb4ab]">error</span>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-[#e3e2e2]">Payment Declined</p>
                  <p class="text-[11px] text-[#bcc9c7]">Insufficient funds on the card.</p>
                </div>
                <span class="material-symbols-outlined text-[#bcc9c7] cursor-pointer text-[18px]">close</span>
              </div>
              <div class="bg-[#292a2a] border border-[#3d4948] rounded-lg p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-amber-400">warning</span>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-[#e3e2e2]">Low Stock Alert</p>
                  <p class="text-[11px] text-[#bcc9c7]">Only 3 units left for RTX 4090.</p>
                </div>
                <span class="material-symbols-outlined text-[#bcc9c7] cursor-pointer text-[18px]">close</span>
              </div>
              <div class="bg-[#292a2a] border border-[#3d4948] border-l-4 border-l-[#5fd9d2] rounded-lg p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-[#5fd9d2]">info</span>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-[#e3e2e2]">Update Available</p>
                  <p class="text-[11px] text-[#bcc9c7]">Version 2.0 is ready to install.</p>
                </div>
                <span class="material-symbols-outlined text-[#bcc9c7] cursor-pointer text-[18px]">close</span>
              </div>
            </div>

            <!-- Modal Preview -->
            <div class="space-y-3">
              <p class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-widest mb-3">Standard Modal Layout</p>
              <div class="bg-[#1e2020] border border-[#3d4948] rounded-xl overflow-hidden shadow-xl">
                <div class="p-4 border-b border-[#3d4948] flex justify-between items-center bg-[#292a2a]">
                  <h4 class="text-base font-semibold text-[#e3e2e2]">Confirmation Modal</h4>
                  <span class="material-symbols-outlined text-[#bcc9c7]">close</span>
                </div>
                <div class="p-4">
                  <p class="text-sm text-[#bcc9c7]">Are you sure you want to finalize this transaction? This action cannot be undone once the receipt is generated.</p>
                </div>
                <div class="p-4 bg-[#1a1c1c] flex justify-end gap-3">
                  <button class="px-4 py-2 text-sm text-[#e3e2e2] border border-[#3d4948] rounded-lg hover:bg-[#1e2020] transition-colors">Cancel</button>
                  <button class="px-4 py-2 text-sm bg-[#03a29c] text-white rounded-lg hover:brightness-110 transition-all">Finalize</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 9. POS & TRANSACTION -->
        <section id="section-pos">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">POS & Transaction</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Point-of-sale transaction flow components — cart, payment methods, dan checkout.</p>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Payment Methods -->
            <div class="lg:col-span-2 space-y-4">
              <p class="text-[10px] font-bold text-[#bcc9c7] uppercase tracking-widest">Select Payment Method</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button class="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-[#5fd9d2] bg-[#5fd9d2]/5 rounded-xl transition-all">
                  <span class="material-symbols-outlined text-3xl text-[#5fd9d2]" style="font-variation-settings: 'FILL' 1;">payments</span>
                  <span class="text-[11px] font-bold text-[#5fd9d2]">Cash</span>
                </button>
                <button class="aspect-square flex flex-col items-center justify-center gap-2 border border-[#3d4948] hover:border-[#5fd9d2]/50 bg-[#1a1c1c] rounded-xl transition-all">
                  <span class="material-symbols-outlined text-3xl text-[#bcc9c7]">credit_card</span>
                  <span class="text-[11px] text-[#bcc9c7]">Card</span>
                </button>
                <button class="aspect-square flex flex-col items-center justify-center gap-2 border border-[#3d4948] hover:border-[#5fd9d2]/50 bg-[#1a1c1c] rounded-xl transition-all">
                  <span class="material-symbols-outlined text-3xl text-[#bcc9c7]">account_balance</span>
                  <span class="text-[11px] text-[#bcc9c7]">E-Wallet</span>
                </button>
                <button class="aspect-square flex flex-col items-center justify-center gap-2 border border-[#3d4948] hover:border-[#5fd9d2]/50 bg-[#1a1c1c] rounded-xl transition-all">
                  <span class="material-symbols-outlined text-3xl text-[#bcc9c7]">person_search</span>
                  <span class="text-[11px] text-[#bcc9c7]">Debt</span>
                </button>
              </div>

              <!-- Order Summary -->
              <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-4 mt-4">
                <h4 class="text-sm font-bold text-[#e3e2e2] mb-3">Current Order</h4>
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2 border-b border-[#3d4948]/30">
                    <div>
                      <p class="text-sm text-[#e3e2e2]">Swift Pro Runner</p>
                      <p class="text-[11px] text-[#5fd9d2]">$189.00 × 1</p>
                    </div>
                    <span class="text-sm font-bold text-[#e3e2e2]">$189.00</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-[#3d4948]/30">
                    <div>
                      <p class="text-sm text-[#e3e2e2]">Chrono Classic Silver</p>
                      <p class="text-[11px] text-[#5fd9d2]">$320.00 × 2</p>
                    </div>
                    <span class="text-sm font-bold text-[#e3e2e2]">$640.00</span>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-[#3d4948] space-y-2">
                  <div class="flex justify-between text-sm"><span class="text-[#bcc9c7]">Subtotal</span><span class="font-semibold">$829.00</span></div>
                  <div class="flex justify-between text-sm"><span class="text-[#bcc9c7]">Tax (8%)</span><span class="font-semibold">$66.32</span></div>
                  <div class="flex justify-between text-lg font-bold border-t border-[#3d4948] pt-2 mt-2"><span>Total</span><span class="text-[#5fd9d2]">$895.32</span></div>
                </div>
              </div>
            </div>

            <!-- Checkout Action -->
            <div class="space-y-4">
              <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-4">
                <div class="flex items-center gap-3 bg-[#1e2020] rounded-lg p-3 border-l-4 border-[#5fd9d2] mb-4">
                  <span class="material-symbols-outlined text-[#5fd9d2] text-3xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                  <div>
                    <div class="text-sm font-bold text-[#e3e2e2]">Transaction Success</div>
                    <div class="text-[11px] text-[#bcc9c7]">Order #POS-8829-01</div>
                  </div>
                </div>
                <button class="w-full bg-[#03a29c] text-white py-4 rounded-xl text-lg font-bold shadow-lg shadow-[#03a29c]/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Complete Checkout
                </button>
                <div class="flex gap-3 mt-3">
                  <button class="flex-1 border border-[#3d4948] py-2.5 rounded-lg text-xs font-medium hover:bg-[#1e2020] transition-colors flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">cancel</span> Void
                  </button>
                  <button class="flex-1 border border-[#3d4948] py-2.5 rounded-lg text-xs font-medium hover:bg-[#1e2020] transition-colors flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">pause</span> Hold
                  </button>
                </div>
              </div>

              <!-- Debt Block -->
              <div class="bg-[#1a1c1c] border border-[#3d4948] rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] font-bold text-[#bcc9c7] uppercase">Customer Debt</span>
                  <span class="material-symbols-outlined text-[#ffb4ab]">warning</span>
                </div>
                <div class="text-xl font-bold text-[#ffb4ab] mb-3">$1,240.00</div>
                <button class="w-full bg-[#03a29c] text-white py-2 rounded-lg text-xs font-medium hover:brightness-110 transition-all">Settle Debt</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 10. LAYOUT & NAVIGATION -->
        <section id="section-layout">
          <h2 class="text-2xl font-semibold text-[#e3e2e2] mb-2">Layout & Navigation</h2>
          <p class="text-sm text-[#bcc9c7] mb-6">Reusable layout patterns — sidebar states, topbar, breadcrumbs, dan responsive patterns.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Shell Architecture -->
            <div class="bg-[#1e2020] border border-[#3d4948] p-6 rounded-xl">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-sm font-semibold text-[#e3e2e2]">Shell Architecture</h3>
                <span class="px-2 py-0.5 bg-[#5fd9d2]/10 text-[#5fd9d2] text-[9px] rounded uppercase font-bold tracking-widest border border-[#5fd9d2]/20">Core Pattern</span>
              </div>
              <div class="flex gap-4">
                <div class="w-20 h-28 bg-[#121414] border border-[#3d4948] rounded-lg p-1 flex flex-col">
                  <div class="w-full h-2 bg-[#292a2a] rounded mb-1"></div>
                  <div class="flex-1 space-y-1">
                    <div class="w-full h-1.5 bg-[#5fd9d2]/20 rounded"></div>
                    <div class="w-full h-1.5 bg-[#292a2a] rounded"></div>
                    <div class="w-full h-1.5 bg-[#292a2a] rounded"></div>
                  </div>
                  <p class="text-[7px] text-center text-[#bcc9c7]">EXPANDED</p>
                </div>
                <div class="w-8 h-28 bg-[#121414] border border-[#3d4948] rounded-lg p-1 flex flex-col items-center">
                  <div class="w-5 h-2 bg-[#292a2a] rounded mb-1"></div>
                  <div class="w-4 h-4 bg-[#5fd9d2]/20 rounded-full mb-1"></div>
                  <div class="w-4 h-4 bg-[#292a2a] rounded-full"></div>
                  <p class="text-[7px] text-center text-[#bcc9c7] mt-auto">MINI</p>
                </div>
                <div class="flex-1 bg-[#121414] border border-[#3d4948] rounded-lg p-2">
                  <div class="w-full h-4 bg-[#292a2a] rounded flex items-center px-1 justify-between mb-2">
                    <div class="w-12 h-1 bg-[#333535] rounded"></div>
                    <div class="flex gap-0.5">
                      <div class="w-2 h-2 bg-[#333535] rounded-full"></div>
                      <div class="w-2 h-2 bg-[#333535] rounded-full"></div>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="w-full h-1 bg-[#292a2a] rounded"></div>
                    <div class="w-3/4 h-1 bg-[#292a2a] rounded"></div>
                    <div class="w-1/2 h-1 bg-[#292a2a] rounded"></div>
                  </div>
                  <p class="text-[7px] text-center text-[#bcc9c7] mt-3">MAIN CANVAS</p>
                </div>
              </div>
            </div>

            <!-- Responsive Patterns -->
            <div class="bg-[#1e2020] border border-[#3d4948] p-6 rounded-xl">
              <h3 class="text-sm font-semibold text-[#e3e2e2] mb-4">Responsive Breakpoints</h3>
              <div class="space-y-3 text-[11px]">
                <div class="flex items-center justify-between p-2 bg-[#121414] border border-[#3d4948] rounded-lg">
                  <span class="text-[#bcc9c7]">Desktop</span>
                  <span class="font-mono text-[#5fd9d2]">1440px+ (12 col, 32px margins)</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-[#121414] border border-[#3d4948] rounded-lg">
                  <span class="text-[#bcc9c7]">Tablet</span>
                  <span class="font-mono text-[#5fd9d2]">768px - 1439px (8 col, 24px)</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-[#121414] border border-[#3d4948] rounded-lg">
                  <span class="text-[#bcc9c7]">Mobile</span>
                  <span class="font-mono text-[#5fd9d2]">&lt;767px (4 col, 16px)</span>
                </div>
              </div>
              <div class="mt-4 p-3 bg-[#121414] border border-[#3d4948] rounded-lg">
                <p class="text-[10px] font-mono text-[#5fd9d2]">
                  Grid: 4px unit · 8px radius · 16px padding<br>
                  Sidebar: 280px expanded / 72px mini
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="border-t border-[#3d4948] pt-8 pb-6 text-center">
          <div class="flex items-center justify-center gap-2 mb-3">
            <div class="h-2 w-10 bg-[#5fd9d2] rounded-full"></div>
            <div class="h-2 w-2 bg-[#3d4948] rounded-full"></div>
            <div class="h-2 w-2 bg-[#3d4948] rounded-full"></div>
          </div>
          <p class="text-sm text-[#bcc9c7]">Posify • Design System v2.0</p>
          <p class="text-xs text-[#869392] mt-1">© 2026 — Vue 3 + Vite + Tailwind · Hanken Grotesk · Dark-mode First</p>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const sidebarOpen = ref(false);
const activeSection = ref('section-color');
const toggleSync = ref(true);
const toggleBackup = ref(false);

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024) sidebarOpen.value = false;
};

const navItems = [
  { id: 'section-color', label: 'Color Palette', icon: 'palette' },
  { id: 'section-typography', label: 'Typography', icon: 'font_download' },
  { id: 'section-buttons', label: 'Buttons & Controls', icon: 'smart_button' },
  { id: 'section-cards', label: 'Cards & Widgets', icon: 'widgets' },
  { id: 'section-forms', label: 'Forms', icon: 'input' },
  { id: 'section-table', label: 'Tables & Filters', icon: 'table_chart' },
  { id: 'section-badges', label: 'Badges & States', icon: 'label' },
  { id: 'section-modal', label: 'Modal & Toast', icon: 'ad_units' },
  { id: 'section-pos', label: 'POS & Transaction', icon: 'point_of_sale' },
  { id: 'section-layout', label: 'Layout & Navigation', icon: 'dashboard' },
];

// Color Data
const primaryColors = [
  { name: 'Primary', hex: '#5fd9d2' },
  { name: 'Primary Container', hex: '#03a29c' },
  { name: 'On Primary', hex: '#003735' },
  { name: 'Primary Fixed', hex: '#7ef6ee' },
  { name: 'Inverse Primary', hex: '#006a66' },
];

const surfaceColors = [
  { name: 'Surface', hex: '#121414' },
  { name: 'Container Lowest', hex: '#0d0e0f' },
  { name: 'Container Low', hex: '#1a1c1c' },
  { name: 'Container', hex: '#1e2020' },
  { name: 'Container High', hex: '#292a2a' },
  { name: 'Container Highest', hex: '#333535' },
];

const semanticColors = [
  { name: 'Error', hex: '#ffb4ab' },
  { name: 'Error Container', hex: '#93000a' },
  { name: 'On Surface', hex: '#e3e2e2' },
  { name: 'Outline Variant', hex: '#3d4948' },
];

// Typography Specs
const typeSpecs = [
  { token: 'Display Large', sample: 'Precision Dashboard', style: 'font-size: 48px; font-weight: 700; line-height: 56px; letter-spacing: -0.02em;', size: '48px', weight: 'Bold (700)', lineHeight: '56px', usage: 'High-impact hero numbers and main statistics.' },
  { token: 'Headline Large', sample: 'Total Revenue Analytics', style: 'font-size: 32px; font-weight: 600; line-height: 40px; letter-spacing: -0.01em;', size: '32px', weight: 'Semi-Bold (600)', lineHeight: '40px', usage: 'Primary page titles and large module headers.' },
  { token: 'Headline Medium', sample: 'Monthly Transaction Overview', style: 'font-size: 24px; font-weight: 600; line-height: 32px;', size: '24px', weight: 'Semi-Bold (600)', lineHeight: '32px', usage: 'Section titles within pages or large modal headers.' },
  { token: 'Title Large', sample: 'Recent Inventory Update', style: 'font-size: 20px; font-weight: 500; line-height: 28px;', size: '20px', weight: 'Medium (500)', lineHeight: '28px', usage: 'Standard card headers and list titles.' },
  { token: 'Body Large', sample: 'This is the primary reading style for multi-line content and documentation.', style: 'font-size: 16px; font-weight: 400; line-height: 24px;', size: '16px', weight: 'Regular (400)', lineHeight: '24px', usage: 'Long-form reading and descriptive blocks.' },
  { token: 'Body Medium', sample: 'Standard interface text for tables, forms, and sidebar items.', style: 'font-size: 14px; font-weight: 400; line-height: 20px;', size: '14px', weight: 'Regular (400)', lineHeight: '20px', usage: 'Default UI text in most contexts.' },
  { token: 'Label Medium', sample: 'PRIMARY CTA ACTION', style: 'font-size: 12px; font-weight: 500; line-height: 16px; letter-spacing: 0.02em;', size: '12px', weight: 'Medium (500)', lineHeight: '16px', usage: 'Buttons, category headers, table headers.' },
];

// Table Data
const tableData = [
  { id: '#TRX-9042', customer: 'Marcus Sterling', type: 'Cash In', amount: '$1,250.00', status: 'Completed', statusClass: 'bg-[#5fd9d2]/10 text-[#5fd9d2] border-[#5fd9d2]/20', dotClass: 'bg-[#5fd9d2]', date: 'Oct 24, 2023' },
  { id: '#TRX-9041', customer: 'Elena Rodriguez', type: 'Payment', amount: '$45.00', status: 'Pending', statusClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20', dotClass: 'bg-orange-500', date: 'Oct 23, 2023' },
  { id: '#TRX-9040', customer: 'James Dalton', type: 'Refund', amount: '$230.50', status: 'Failed', statusClass: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20', dotClass: 'bg-[#ffb4ab]', date: 'Oct 22, 2023' },
  { id: '#TRX-9039', customer: 'Sarah Chen', type: 'Transfer', amount: '$800.00', status: 'Completed', statusClass: 'bg-[#5fd9d2]/10 text-[#5fd9d2] border-[#5fd9d2]/20', dotClass: 'bg-[#5fd9d2]', date: 'Oct 21, 2023' },
];

// Quick Actions
const quickActions = [
  { icon: 'add_shopping_cart', label: 'New Sale' },
  { icon: 'add_box', label: 'Add Product' },
  { icon: 'assignment_return', label: 'Refund' },
  { icon: 'inventory', label: 'Inventory' },
  { icon: 'assessment', label: 'End of Day' },
  { icon: 'help_center', label: 'Support' },
];
</script>

<style scoped>
.font-hanken {
  font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #0d0e0f;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3d4948;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #5fd9d2;
}
</style>
