<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
    <!-- Mobile Topbar -->
    <header
      class="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Toggle menu"
          @click="sidebarOpen = !sidebarOpen"
        >
          <component :is="MenuIcon" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <component :is="StoreIcon" class="w-4 h-4 text-white" />
          </div>
          <div class="min-w-0">
            <h1 class="text-sm font-bold text-slate-950 dark:text-slate-100 leading-tight truncate">{{ currentShopName || 'Posify' }}</h1>
            <p class="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">{{ todayLabel }}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <!-- Theme toggle (mobile) -->
        <button
          type="button"
          class="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          :aria-label="`Switch to ${themeResolved === 'dark' ? 'light' : 'dark'} mode`"
          @click="toggleTheme"
        >
          <component :is="themeResolved === 'dark' ? SunIcon : MoonIcon" class="w-4 h-4" />
        </button>
        <!-- Notification Bell (mobile) -->
        <button
          type="button"
          class="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Notifikasi"
          @click="notifOpen = !notifOpen"
        >
          <BellIcon class="w-4 h-4" />
          <span
            v-if="alertCount > 0"
            class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-slate-900"
          />
        </button>

        <button
          type="button"
          class="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Logout"
          @click="handleLogout"
        >
          <component :is="LogOutIcon" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Sidebar overlay (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar (always dark) -->
    <aside
      class="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 px-5 flex items-center border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <component :is="StoreIcon" class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold leading-tight">Posify</p>
            <p class="text-[11px] text-slate-400 leading-tight">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <!-- Top-level items (Home, Dashboard Retail) -->
        <div class="space-y-0.5 mb-3">
          <RouterLink
            v-for="item in topItems"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ isActive, href, navigate }"
          >
            <a
              :href="href"
              :class="[
                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ]"
              @click="(e) => onNavClick(e, navigate)"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </a>
          </RouterLink>
        </div>

        <!-- Grouped items -->
        <div v-for="group in navGroups" :key="group.title" class="mb-3">
          <div class="px-3 mb-1.5">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {{ group.title }}
            </p>
          </div>

          <div class="space-y-0.5">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              custom
              v-slot="{ isActive, href, navigate }"
            >
              <a
                :href="href"
                :class="[
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ]"
                @click="(e) => onNavClick(e, navigate)"
              >
                <component :is="item.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ item.label }}</span>
                <span
                  v-if="badgeCounts[item.to]?.count"
                  :class="[
                    'ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                    badgeCounts[item.to]?.color || 'bg-amber-500 text-white',
                  ]"
                >
                  {{ badgeCounts[item.to].count }}
                </span>
              </a>
            </RouterLink>
          </div>
        </div>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-slate-800 p-3 space-y-0.5 shrink-0">
        <RouterLink
          v-for="item in bottomNav"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, href, navigate }"
        >
          <a
            :href="href"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors',
              isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            ]"
            @click="(e) => onNavClick(e, navigate)"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span>{{ item.label }}</span>
          </a>
        </RouterLink>

        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-slate-300 hover:bg-red-600/20 hover:text-red-300"
          @click="handleLogout"
        >
          <component :is="LogOutIcon" class="w-4 h-4 shrink-0" />
          Logout
        </button>

        <!-- User info -->
        <div class="mt-2 pt-3 border-t border-slate-800 flex items-center gap-2 px-2">
          <div
            class="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-300"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-white truncate">{{ displayName }}</p>
            <p class="text-[11px] text-slate-400 truncate">{{ displayUsername || roleLabel }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="lg:ml-64 min-h-screen">
      <!-- Desktop + Tablet topbar -->
      <header
        class="hidden md:flex sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 items-center justify-between transition-colors"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-950 dark:text-slate-100">{{ pageTitle }}</h2>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            {{ todayLabel }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Theme toggle (desktop) -->
          <button
            type="button"
            class="h-9 w-9 flex items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            :aria-label="themeAriaLabel"
            :title="themeAriaLabel"
            @click="toggleTheme"
          >
            <component :is="themeIcon" class="w-4 h-4" />
          </button>

          <!-- Notification Bell -->
          <div class="relative" ref="notifRef">
            <button
              type="button"
              :class="[
                'relative h-9 w-9 flex items-center justify-center rounded-md border transition-colors',
                notifOpen
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              ]"
              title="Notifikasi"
              @click="notifOpen = !notifOpen"
            >
              <BellIcon class="w-4 h-4" :class="alertCount > 0 && !notifOpen ? 'animate-[wiggle_1s_ease-in-out]' : ''" />
              <span
                v-if="alertCount > 0"
                class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-red-500 border-2 border-white dark:border-slate-900 leading-none shadow-sm"
              >
                {{ alertCount > 99 ? '99+' : alertCount }}
              </span>
            </button>

            <!-- Notification Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="notifOpen"
                class="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                  <div class="flex items-center gap-2">
                    <BellIcon class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-100">Notifikasi</p>
                    <span v-if="alertCount > 0" class="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">{{ alertCount }}</span>
                  </div>
                  <button
                    v-if="alertCount > 0"
                    type="button"
                    class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    @click="markAllRead"
                  >
                    Tandai semua dibaca
                  </button>
                </div>

                <!-- Body -->
                <div class="max-h-[320px] overflow-y-auto">
                  <div v-if="alertsLoading" class="py-10 flex flex-col items-center gap-2">
                    <Loader2Icon class="w-5 h-5 animate-spin text-slate-300 dark:text-slate-600" />
                    <p class="text-[11px] text-slate-400 dark:text-slate-500">Memuat notifikasi...</p>
                  </div>
                  <div v-else-if="alertItems.length === 0" class="py-10 flex flex-col items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BellIcon class="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Semua aman!</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500">Tidak ada alert aktif saat ini.</p>
                  </div>
                  <div v-else class="divide-y divide-slate-50 dark:divide-slate-800">
                    <button
                      v-for="alert in alertItems.slice(0, 15)"
                      :key="alert.id"
                      type="button"
                      class="w-full px-4 py-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors text-left group"
                      @click="handleAlertClick(alert)"
                    >
                      <div class="flex items-start gap-3">
                        <!-- Severity dot with ring -->
                        <div :class="['mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 dark:ring-offset-slate-900',
                          alert.severity === 'critical' ? 'bg-red-500 ring-red-200 dark:ring-red-900' :
                          alert.severity === 'warning'  ? 'bg-amber-500 ring-amber-200 dark:ring-amber-900' :
                                                          'bg-blue-400 ring-blue-200 dark:ring-blue-900'
                        ]" />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-0.5">
                            <p class="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{{ alert.title }}</p>
                            <span :class="['shrink-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md', alertTypeBadge(alert.type)]">{{ alertTypeShort(alert.type) }}</span>
                          </div>
                          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ alert.shopName }}</p>
                          <p class="text-[10px] text-slate-400 dark:text-slate-500 truncate">{{ alert.description }}</p>
                        </div>
                        <ChevronRightIcon class="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 mt-1 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
                  <p class="text-[9px] text-slate-400 dark:text-slate-500">Diperbarui setiap 60 detik</p>
                  <button
                    type="button"
                    class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                    @click="fetchAlerts"
                  >
                    <RefreshCwIcon class="w-2.5 h-2.5" /> Refresh
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <span class="text-xs text-slate-500 dark:text-slate-400 hidden xl:inline">
            {{ todayLabel }}
          </span>
          <!-- WebSocket indicator (md+ only, mobile uses banner dot) -->
          <span v-if="wsConnected" class="hidden md:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title="Real-time aktif">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
          <span v-else class="hidden md:inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 dark:text-amber-400" title="Mode offline — data tersimpan lokal">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Offline
            <span v-if="offlinePendingCount > 0" class="ml-0.5 px-1 py-0 text-[9px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">{{ offlinePendingCount }} pending</span>
          </span>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300"
            >
              {{ userInitials }}
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ displayUsername || roleLabel }}</p>
            </div>
          </div>
        </div>
      </header>



      <!-- Branch Context Banner -->
      <div class="sticky top-16 z-10 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 dark:from-blue-900 dark:via-blue-900 dark:to-blue-950 px-4 lg:px-6 py-2 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3 min-w-0">
          <div :class="['w-2 h-2 rounded-full shrink-0', wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400']" :title="wsConnected ? 'Online' : 'Offline'"></div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate">{{ currentShopName || 'Belum dipilih' }}</p>
            <p class="text-[10px] text-blue-200 dark:text-blue-300 truncate">{{ currentShopAddress }}</p>
          </div>
        </div>
        <button
          v-if="canSwitchShop"
          type="button"
          class="shrink-0 h-7 px-3 text-[10px] font-semibold text-blue-100 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-colors"
          @click="openSwitchModal"
        >
          Ganti Cabang
        </button>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
        <RouterView />
      </div>
    </main>

    <!-- ============================================ -->
    <!-- Branch Picker Modal (Full list)              -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showBranchPickerModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showBranchPickerModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div class="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Ganti Cabang Aktif</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih cabang yang ingin dikelola. Semua data akan mengikuti konteks cabang terpilih.</p>
          </div>
          <div class="max-h-80 overflow-y-auto p-3 space-y-2">
            <button
              v-for="shop in availableShops"
              :key="shop.id"
              type="button"
              :disabled="switchingShop"
              :class="[
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                currentShopId === shop.id
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800',
              ]"
              @click="handleSwitchShop(shop.id)"
            >
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', currentShopId === shop.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400']">
                <component :is="currentShopId === shop.id ? CheckIcon : StoreIcon" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p :class="['text-sm font-semibold truncate', currentShopId === shop.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100']">{{ shop.name }}</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ shop.address }}</p>
              </div>
              <span v-if="currentShopId === shop.id" class="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full shrink-0">Aktif</span>
            </button>
          </div>
          <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button type="button" class="w-full h-9 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200" @click="showBranchPickerModal = false">Batal</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Switch Branch Confirmation Modal             -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showSwitchConfirmation" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="cancelSwitchShop"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Building2Icon class="w-5 h-5 text-amber-600" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                Ganti Cabang Aktif?
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Anda akan beralih dari <strong class="text-slate-700 dark:text-slate-200">{{ currentShopName || '—' }}</strong> ke
                <strong class="text-blue-700 dark:text-blue-400">{{ pendingSwitchShopName }}</strong>.
              </p>
            </div>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1.5">
            <p class="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
              ⚠️ Yang akan berubah:
            </p>
            <ul class="text-[11px] text-amber-700 dark:text-amber-300 space-y-0.5 ml-1">
              <li>• Data produk &amp; stok yang ditampilkan</li>
              <li>• Pengaturan sistem (toggle ON/OFF)</li>
              <li>• Transaksi, hutang, kas, dan laporan</li>
              <li>• Semua perubahan disimpan ke cabang yang aktif</li>
            </ul>
          </div>

          <p v-if="switchError" class="text-xs text-red-600 dark:text-red-400">{{ switchError }}</p>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              :disabled="switchingShop"
              class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              @click="cancelSwitchShop"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="switchingShop"
              class="h-9 px-5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              @click="confirmSwitchShop"
            >
              <Loader2Icon v-if="switchingShop" class="w-3.5 h-3.5 animate-spin" />
              {{ switchingShop ? 'Memuat...' : 'Ya, Pindah ke ' + pendingSwitchShopName }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- Global UI: Confirm + Toast -->
    <!-- Full-Screen Loading Overlay (Branch Switch) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showSwitchOverlay"
          class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm"
        >
          <div class="text-center space-y-4">
            <!-- Animated icon -->
            <div class="relative mx-auto w-16 h-16">
              <div class="absolute inset-0 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
              <div class="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div class="absolute inset-3 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
            </div>
            <!-- Text -->
            <div>
              <p class="text-lg font-bold text-slate-900 dark:text-slate-100">Pindah Cabang</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Memuat data <strong class="text-blue-600">{{ switchOverlayShopName }}</strong>...
              </p>
            </div>
            <!-- Progress dots -->
            <div class="flex items-center justify-center gap-1.5">
              <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0s"></span>
              <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
              <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <GlobalConfirm />
    <GlobalToast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, type Component } from 'vue';
import api from '@/shared/services/api';
import GlobalConfirm from '@/shared/components/GlobalConfirm.vue';
import GlobalToast from '@/shared/components/GlobalToast.vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useTheme } from '@/shared/composables/useTheme';
import { useRealtimeUpdates } from '@/shared/composables/useRealtimeUpdates';
import { useOfflineQueue } from '@/shared/composables/useOfflineQueue';
import { usePermissionsStore } from '@/shared/stores/permissions.store';
import {
  Menu as MenuIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  LayoutDashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Package as PackageIcon,
  HandCoins as DebtIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  BarChart3 as ReportIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Building2 as Building2Icon,
  ChevronDown as ChevronDownIcon,
  Check as CheckIcon,
  Loader2 as Loader2Icon,
  // BRILink
  Landmark as LandmarkIcon,
  ArrowRightLeft as TransferIcon,
  Percent as PercentIcon,
  ClipboardList as ClipboardListIcon,
  Tag as TagIcon,
  // Shifts & Profile
  Clock as ShiftIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  // Theme
  Sun as SunIcon,
  Moon as MoonIcon,
  Monitor as MonitorIcon,
  Bell as BellIcon,
  ChevronRight as ChevronRightIcon,
  RefreshCw as RefreshCwIcon,
} from 'lucide-vue-next';
import { useNotifSound } from '@/shared/composables/useNotifSound';

const { play: playNotifSound } = useNotifSound();

// ============================================
// GLOBAL REAL-TIME WEBSOCKET LISTENER
// ============================================
// Listens to DATA_CHANGED event from backend.
// Provides `realtimeSignal` ref to child pages via provide/inject.
// Pages watch this signal to re-fetch data WITHOUT unmounting (data stays visible).
const realtimeSignal = ref(0);
let realtimeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Provide to all child components
provide('realtimeSignal', realtimeSignal);

const { isConnected: wsConnected } = useRealtimeUpdates({
  events: {
    onDataChanged() {
      // Only trigger refresh if we're online (can actually fetch)
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
        fetchBadgeCounts();
        fetchAlerts();
        // Also sync offline queue if any
        if (offlinePendingCount.value > 0) syncOfflineQueue();
      }, 500);
    },
    onBrilinkTransactionCreated() {
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
      }, 500);
    },
    onAccountBalanceChanged() {
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
      }, 500);
    },
    onCashFlowCreated() {
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
      }, 500);
    },
    onCashBoxUpdated() {
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
      }, 500);
    },
    onDashboardRefresh() {
      if (!navigator.onLine) return;
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        realtimeSignal.value++;
      }, 500);
    },
  },
});

// ============================================
// OFFLINE QUEUE (auto-sync saat online kembali)
// ============================================
const { pendingCount: offlinePendingCount, syncNow: syncOfflineQueue } = useOfflineQueue();

// Provide offline queue info to child pages
provide('offlinePendingCount', offlinePendingCount);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const shopStore = useShopStore();
const { resolved: themeResolved, mode: themeMode, toggle: cycleTheme } = useTheme();

const sidebarOpen = ref(false);
const shopMenuOpen = ref(false);
const showBranchPickerModal = ref(false);
const switchingShop = ref(false);
const switchError = ref('');

// Badge counts for sidebar items (reactive, updated by fetchBadgeCounts)
const badgeCounts = ref<Record<string, { count: number; color: string }>>({});

// Confirmation modal state for switching active branch
const showSwitchConfirmation = ref(false);
const pendingSwitchShopId = ref<string | null>(null);
const pendingSwitchShopName = ref('');

// Full-screen loading overlay (shown after branch switch confirmed)
const showSwitchOverlay = ref(false);
const switchOverlayShopName = ref('');

// === Theme ===
const themeIcon = computed<Component>(() => {
  if (themeMode.value === 'system') return MonitorIcon;
  return themeResolved.value === 'dark' ? MoonIcon : SunIcon;
});
const themeAriaLabel = computed(() => {
  if (themeMode.value === 'light') return 'Switch to Dark mode';
  if (themeMode.value === 'dark') return 'Switch to System default';
  return 'Switch to Light mode';
});
function toggleTheme() {
  cycleTheme();
}

// === Shop selector ===
const currentShopId = computed(() => shopStore.currentShopId);
const currentShopName = computed(() => {
  // Prefer store name, fallback to matching from availableShops list
  if (shopStore.currentShopName) return shopStore.currentShopName;
  const shop = availableShops.value.find(s => s.id === currentShopId.value);
  return shop?.name || '';
});
const currentShopAddress = computed(() => {
  const shop = availableShops.value.find(s => s.id === currentShopId.value);
  return shop?.address || '';
});
const availableShops = computed(() => shopStore.availableShops);

const canSwitchShop = computed(
  () => authStore.isSuperAdmin && availableShops.value.length > 1,
);

async function handleSwitchShop(shopId: string) {
  if (shopId === currentShopId.value) {
    shopMenuOpen.value = false;
    showBranchPickerModal.value = false;
    return;
  }
  pendingSwitchShopId.value = shopId;
  pendingSwitchShopName.value =
    availableShops.value.find((s) => s.id === shopId)?.name ?? 'cabang ini';
  shopMenuOpen.value = false;
  showBranchPickerModal.value = false;
  showSwitchConfirmation.value = true;
}

function openSwitchModal() {
  showBranchPickerModal.value = true;
}

async function confirmSwitchShop() {
  if (!pendingSwitchShopId.value) return;
  switchingShop.value = true;
  switchError.value = '';
  try {
    await shopStore.selectShop(pendingSwitchShopId.value);
    await authStore.fetchUser();
    showSwitchConfirmation.value = false;
    showBranchPickerModal.value = false;

    // Show loading overlay while page reloads data
    showSwitchOverlay.value = true;
    switchOverlayShopName.value = pendingSwitchShopName.value;

    pendingSwitchShopId.value = null;
    pendingSwitchShopName.value = '';

    // Trigger all pages to re-fetch data for new shop
    realtimeSignal.value++;
    // Also refresh badges & alerts for new shop
    fetchBadgeCounts();
    fetchAlerts();

    // Hide overlay after data has time to reload
    setTimeout(() => {
      showSwitchOverlay.value = false;
      switchOverlayShopName.value = '';
    }, 1200);
  } catch (err: any) {
    switchError.value = err?.message ?? 'Gagal ganti cabang.';
    showSwitchOverlay.value = false;
  } finally {
    switchingShop.value = false;
  }
}

function cancelSwitchShop() {
  showSwitchConfirmation.value = false;
  pendingSwitchShopId.value = null;
  pendingSwitchShopName.value = '';
}

/**
 * Fetch pending counts and set badges on nav items.
 * Uses individual API calls until a dedicated badge-counts endpoint exists.
 */
async function fetchBadgeCounts() {
  const shopId = shopStore.currentShopId ?? authStore.user?.shopId;
  if (!shopId) return;

  try {
    // Parallel: pending cash-out, overdue debts, pending transfers
    const [cashFlowRes, debtsRes, transfersRes, shiftsRes] = await Promise.allSettled([
      api.get('/cash-flows', { params: { shopId, status: 'PENDING', type: 'CASH_OUT', limit: 0 } }),
      api.get('/debts', { params: { shopId, status: 'OVERDUE', limit: 0 } }),
      api.get('/transfers', { params: { shopId, status: 'PENDING', limit: 0 } }),
      api.get('/shifts', { params: { shopId, status: 'CLOSED', limit: 0 } }),
    ]);

    const getCount = (res: PromiseSettledResult<any>): number => {
      if (res.status === 'fulfilled') {
        const d = res.value?.data;
        return d?.meta?.total ?? d?.total ?? (Array.isArray(d?.data) ? d.data.length : 0);
      }
      return 0;
    };

    const pendingCashOut = getCount(cashFlowRes);
    const overdueDebts = getCount(debtsRes);
    const pendingTransfers = getCount(transfersRes);
    const unfinalizedShifts = getCount(shiftsRes);

    // Set badges via separate reactive state
    badgeCounts.value = {
      '/admin/kas-retail': { count: pendingCashOut, color: 'bg-red-500 text-white' },
      '/admin/debts': { count: overdueDebts, color: 'bg-amber-500 text-white' },
      '/admin/transfers': { count: pendingTransfers, color: 'bg-blue-500 text-white' },
      '/admin/shifts': { count: unfinalizedShifts, color: 'bg-slate-500 text-white' },
    };
  } catch {
    /* silent — badges are optional enhancements */
  }
}

// ============================================
// NOTIFICATION SYSTEM (Bell icon + sound)
// ============================================
const notifOpen = ref(false);
const notifRef = ref<HTMLElement | null>(null);

function onDocClick(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
    notifOpen.value = false;
  }
}
const alertItems = ref<Array<{ id: string; type: string; severity: string; title: string; description: string; shopId: string; shopName: string }>>([]);
const alertCount = ref(0);
const alertsLoading = ref(false);
let prevAlertCount = 0;
let notifTimer: ReturnType<typeof setInterval> | null = null;

// Sound tones handled by useNotifSound composable

function alertDotColor(severity: string): string {
  if (severity === 'critical') return 'bg-red-500';
  if (severity === 'warning') return 'bg-amber-500';
  return 'bg-blue-400';
}
function alertTypeBadge(type: string): string {
  const m: Record<string, string> = { LOW_STOCK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', BRILINK_LOW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', NO_SHIFT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', DEBT_OVERDUE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
  return m[type] || 'bg-slate-100 text-slate-600';
}
function alertTypeShort(type: string): string {
  const m: Record<string, string> = { LOW_STOCK: 'Stok', BRILINK_LOW: 'BRI', NO_SHIFT: 'Shift', DEBT_OVERDUE: 'Hutang' };
  return m[type] || type;
}

async function fetchAlerts() {
  alertsLoading.value = alertItems.value.length === 0;
  try {
    const { data } = await api.get('/dashboard/retail/alerts/all');
    alertItems.value = data.alerts || [];
    alertCount.value = data.summary?.total || 0;

    // Play sound if new alerts appeared
    if (alertCount.value > prevAlertCount && prevAlertCount > 0) {
      playNotifSound();
    }
    prevAlertCount = alertCount.value;
  } catch {
    // Silent — non-super-admin might get 403
  } finally {
    alertsLoading.value = false;
  }
}

// playNotifSound is provided by useNotifSound composable above

function startNotifPolling() {
  fetchAlerts();
  notifTimer = setInterval(fetchAlerts, 60_000); // 60s
}
function stopNotifPolling() {
  if (notifTimer) { clearInterval(notifTimer); notifTimer = null; }
}

function handleAlertClick(alert: any) {
  notifOpen.value = false;
  // Navigate to relevant page based on alert type
  const routeMap: Record<string, string> = {
    LOW_STOCK: '/admin/products',
    BRILINK_LOW: '/admin/brilink',
    NO_SHIFT: '/admin/shifts',
    DEBT_OVERDUE: '/admin/debts',
  };
  const target = routeMap[alert.type] || '/admin/dashboard';
  router.push(target);
}

function markAllRead() {
  // Dismiss all alerts visually (reset badge to 0, clear items)
  alertItems.value = [];
  alertCount.value = 0;
  prevAlertCount = 0;
  notifOpen.value = false;
  // Persist dismissed state until next poll brings new ones
  localStorage.setItem('alerts_dismissed_at', new Date().toISOString());
}

onMounted(async () => {
  document.addEventListener('click', onDocClick, true);
  startNotifPolling();

  // Always fetch shops list if not loaded yet
  if (availableShops.value.length === 0) {
    try {
      await shopStore.fetchShops();
    } catch {
      /* silent */
    }
  }

  // Auto-select cabang aktif kalau belum ada di store
  if (!shopStore.hasCurrentShop && availableShops.value.length > 0) {
    // Coba match dari user.shopId (non-super-admin sudah punya shopId di token)
    const userShopId = authStore.user?.shopId;
    const matchedShop = userShopId
      ? availableShops.value.find((s) => s.id === userShopId)
      : null;

    if (matchedShop) {
      // Set langsung tanpa call selectShop API (user sudah punya akses)
      shopStore.setCurrentShop(matchedShop as any);
    } else if (authStore.isSuperAdmin) {
      // Super-admin: call selectShop API untuk re-issue JWT
      try {
        await shopStore.selectShop(availableShops.value[0].id);
        await authStore.fetchUser();
      } catch {
        // Fallback: set dari list tanpa API call
        shopStore.setCurrentShop(availableShops.value[0] as any);
      }
    } else {
      // Fallback: set dari first available shop
      shopStore.setCurrentShop(availableShops.value[0] as any);
    }
  }

  // Fetch badge counts for sidebar notifications
  await fetchBadgeCounts();
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick, true);
  stopNotifPolling();
});

// ============================================
// SIDEBAR NAVIGATION
// ============================================

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { to: '/admin/home', label: 'Home', icon: HomeIcon },
];

// Role-aware navigation: certain groups/items only show for specific roles
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');
const isAdminOrAbove = computed(() => ['SUPER_ADMIN', 'ADMIN'].includes(authStore.user?.role || ''));

// Permission-based sidebar filtering
const permStore = usePermissionsStore();

const navGroups = computed<NavGroup[]>(() => {
  const can = (p: string) => permStore.can(p);

  const groups: NavGroup[] = [];

  // --- RETAIL ---
  const retailItems: NavItem[] = [
    { to: '/admin/dashboard', label: 'Dashboard Retail', icon: DashboardIcon },
  ];
  if (can('transactions.view')) retailItems.push({ to: '/admin/transactions', label: 'Transaksi', icon: ReceiptIcon });
  if (can('products.view')) retailItems.push({ to: '/admin/products', label: 'Produk & Stok', icon: PackageIcon });
  if (can('products.view')) retailItems.push({ to: '/admin/riwayat-stok', label: 'Riwayat Stok', icon: ClipboardListIcon });
  if (can('debts.view')) retailItems.push({ to: '/admin/debts', label: 'Hutang', icon: DebtIcon });
  retailItems.push({ to: '/admin/customers', label: 'Customer', icon: UsersIcon });
  retailItems.push({ to: '/admin/kas-retail', label: 'Kas Retail', icon: WalletIcon });
  if (can('reports.view')) retailItems.push({ to: '/admin/reports', label: 'Laporan Retail', icon: ReportIcon });
  groups.push({ title: 'Retail', items: retailItems });

  // --- BRILINK ---
  if (can('brilink.view')) {
    const brilinkItems: NavItem[] = [
      { to: '/admin/brilink', label: 'Dashboard BRILink', icon: DashboardIcon },
      { to: '/admin/brilink/transaksi', label: 'Transaksi BRILink', icon: ReceiptIcon },
      { to: '/admin/kas-rekening-brilink', label: 'Kas & Rekening', icon: LandmarkIcon },
    ];
    if (can('brilink.fee')) brilinkItems.push({ to: '/admin/brilink/fee', label: 'Pengaturan Fee', icon: PercentIcon });
    if (can('reports.view')) brilinkItems.push({ to: '/admin/brilink/laporan', label: 'Laporan BRILink', icon: ReportIcon });
    groups.push({ title: 'BRILink', items: brilinkItems });
  }

  // --- INVENTARIS ---
  const inventarisItems: NavItem[] = [];
  if (can('inventory.opname')) inventarisItems.push({ to: '/admin/opname-sessions', label: 'Stock Opname', icon: CheckIcon });
  if (can('inventory.suppliers')) inventarisItems.push({ to: '/admin/suppliers', label: 'Supplier & PO', icon: PackageIcon });
  if (can('inventory.transfers')) inventarisItems.push({ to: '/admin/transfers', label: 'Transfer Stok', icon: TransferIcon });
  if (can('products.view')) {
    inventarisItems.push({ to: '/admin/cetak-label', label: 'Cetak Label', icon: TagIcon });
    inventarisItems.push({ to: '/admin/racks', label: 'Label Rak', icon: TagIcon });
  }
  if (inventarisItems.length > 0) groups.push({ title: 'Inventaris', items: inventarisItems });

  // --- OPERASIONAL ---
  const operasionalItems: NavItem[] = [];
  if (can('shifts.view')) operasionalItems.push({ to: '/admin/shifts', label: 'Shift', icon: ShiftIcon });
  if (can('users.view')) operasionalItems.push({ to: '/admin/users', label: 'Multi-User', icon: UsersIcon });
  if (can('shops.view') || isSuperAdmin.value) operasionalItems.push({ to: '/admin/shops', label: 'Cabang', icon: Building2Icon });
  if (operasionalItems.length > 0) groups.push({ title: 'Operasional', items: operasionalItems });

  return groups;
});

const bottomNav = computed<NavItem[]>(() => {
  const items: NavItem[] = [];
  if (permStore.can('settings.shop') || isSuperAdmin.value) {
    items.push({ to: '/admin/settings', label: 'Pengaturan', icon: SettingsIcon });
  }
  if (isSuperAdmin.value) {
    items.push({ to: '/admin/super-admin-settings', label: 'Super Admin', icon: ShieldIcon });
  }
  items.push({ to: '/admin/profil', label: 'Profil', icon: UserIcon });
  return items;
});

function onNavClick(e: MouseEvent, navigate: (e?: MouseEvent) => void) {
  navigate(e);
  sidebarOpen.value = false;
}

// ============================================
// USER INFO
// ============================================

const displayName = computed(() => {
  const u = authStore.user;
  if (!u) return 'Admin';
  return (u as any).fullName || u.username || u.email || 'Admin';
});

const displayUsername = computed(() => {
  const u = authStore.user;
  if (!u) return '';
  return u.username || '';
});

const userInitials = computed(() => {
  const name = displayName.value;
  const parts = name.split(/[@\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'A';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase().slice(0, 2);
});

const roleLabel = computed(() => {
  const r = authStore.user?.role;
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'CASHIER_SUPERVISOR') return 'Supervisor Kasir';
  if (r === 'KASIR') return 'Kasir';
  return '—';
});

// ============================================
// PAGE TITLES
// ============================================

const pageTitle = computed(() => {
  const meta = route.meta?.title as string | undefined;
  if (meta) {
    return meta.replace(/\s*[—-]\s*Posify.*$/i, '').trim() || meta;
  }
  return 'Admin';
});

const pageSubtitle = computed(() => {
  return (route.meta?.description as string | undefined) || '';
});

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'admin-login' });
}
</script>

<style scoped>
.dropdown-enter-active { transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { transition: all 0.12s ease; }
.dropdown-enter-from  { opacity: 0; transform: translateY(-6px) scale(0.97); }
.dropdown-leave-to    { opacity: 0; transform: translateY(-4px) scale(0.98); }

.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.4s ease 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  20%       { transform: rotate(-12deg); }
  40%       { transform: rotate(12deg); }
  60%       { transform: rotate(-8deg); }
  80%       { transform: rotate(8deg); }
}
</style>
