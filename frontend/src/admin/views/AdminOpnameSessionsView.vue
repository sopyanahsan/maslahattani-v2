<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Stock Opname</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Verifikasi stok fisik vs sistem. Buat sesi, hitung, dan sesuaikan.
        </p>
      </div>
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
               hover:bg-blue-700 transition-colors flex items-center gap-2"
        @click="handleCreate"
        :disabled="creating"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ creating ? 'Membuat...' : 'Mulai Opname' }}
      </button>
    </div>

    <!-- Rekap Opname Bulan Ini -->
    <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200">Rekap Opname Bulan Ini</h2>
        <span class="text-xs text-slate-500 dark:text-slate-400">{{ currentMonthYear }}</span>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <p class="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Kerugian</p>
          <p class="text-lg font-bold text-red-600 mt-1">{{ monthlyStats.totalLoss }} item</p>
          <p class="text-[10px] text-slate-400 mt-0.5">produk kurang (defisit)</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <p class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Akurasi Stok</p>
          <p class="text-lg font-bold text-slate-900 mt-1">
            {{ monthlyStats.totalItems > 0 ? Math.round((monthlyStats.matched / monthlyStats.totalItems) * 100) + '%' : '—' }}
          </p>
          <p class="text-[10px] text-slate-400 mt-0.5">item cocok / dihitung</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <p class="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Jumlah Sesi</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ monthlyStats.totalSessions }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">sesi bulan ini</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Opname Terakhir</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ monthlyStats.lastOpnameDate || '—' }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ monthlyStats.lastOpnameDate ? '' : 'belum ada' }}</p>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex gap-3">
      <select
        v-model="filterStatus"
        class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        @change="resetAndFetch"
      >
        <option value="">Semua Status</option>
        <option value="IN_PROGRESS">Sedang Berjalan</option>
        <option value="COMPLETED">Selesai</option>
        <option value="CANCELLED">Dibatalkan</option>
      </select>
    </div>

    <!-- Sessions List -->
    <div v-if="loading" class="text-center py-10 text-slate-500 text-sm">Memuat...</div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <div v-else-if="sessions.length === 0" class="text-center py-10 text-slate-400 text-sm">
      Belum ada sesi opname. Klik "Mulai Opname" untuk memulai.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
        @click="openDetail(session)"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ session.sessionNumber }}</span>
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', statusBadge(session.status)]">
                {{ statusLabel(session.status) }}
              </span>
              <!-- Passcode badge for active sessions -->
              <span
                v-if="session.status === 'IN_PROGRESS'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold font-mono tracking-wider"
                :title="'Kode untuk join: ' + session.passcode"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                {{ session.passcode }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Oleh {{ session.conductorName }} &middot; {{ formatDate(session.createdAt) }}
            </p>
            <p v-if="session.participantCount && session.participantCount > 0" class="text-[10px] text-slate-400 mt-0.5">
              {{ session.participantCount }} petugas bergabung
              <span v-if="session.allCounted" class="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Siap Review
              </span>
            </p>
          </div>
          <div class="text-right text-xs text-slate-600 dark:text-slate-400">
            <p>{{ session.totalProducts }} produk</p>
            <p v-if="session.status === 'COMPLETED'" class="mt-0.5">
              <span class="text-emerald-600">{{ session.totalMatched }} cocok</span> &middot;
              <span class="text-amber-600">{{ session.totalSurplus }} surplus</span> &middot;
              <span class="text-red-600">{{ session.totalDeficit }} kurang</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="flex justify-center gap-2 pt-3">
        <button
          v-for="p in meta.totalPages"
          :key="p"
          type="button"
          :class="[
            'h-8 w-8 rounded text-xs font-semibold transition-colors',
            currentPage === p
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          ]"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Create Opname Modal (with rack selection)    -->
    <!-- ============================================ -->
    <teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showCreateModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Mulai Stock Opname
          </h2>

          <!-- Mode selection -->
          <div class="space-y-2">
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Cakupan Opname</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :class="[
                  'p-3 rounded-lg border-2 text-left transition-all',
                  createMode === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                ]"
                @click="createMode = 'all'; selectedRackIds = []"
              >
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Semua Produk</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Hitung seluruh produk cabang ini</p>
              </button>
              <button
                type="button"
                :class="[
                  'p-3 rounded-lg border-2 text-left transition-all',
                  createMode === 'by-rack'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                ]"
                @click="createMode = 'by-rack'"
              >
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Per Rak</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Pilih rak tertentu saja</p>
              </button>
            </div>
          </div>

          <!-- Rack selection (only if by-rack mode) -->
          <div v-if="createMode === 'by-rack'" class="space-y-2">
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Rak
              <span v-if="selectedRackIds.length > 0" class="text-blue-600">({{ selectedRackIds.length }} dipilih)</span>
            </p>

            <div v-if="loadingRacks" class="text-center py-4 text-xs text-slate-400">Memuat rak...</div>

            <div v-else-if="availableRacks.length === 0" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-xs text-amber-700">Belum ada rak di cabang ini. Buat rak dulu di menu "Label Rak".</p>
            </div>

            <div v-else class="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
              <label
                v-for="rack in availableRacks"
                :key="rack.id"
                :class="[
                  'flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors',
                  selectedRackIds.includes(rack.id) ? 'bg-violet-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="selectedRackIds.includes(rack.id)"
                  class="w-4 h-4 text-violet-600 border-slate-300 rounded"
                  @change="toggleRackSelection(rack.id)"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ rack.code }} <span v-if="rack.name" class="font-normal text-slate-500 dark:text-slate-400">— {{ rack.name }}</span></p>
                  <p class="text-[10px] text-slate-400">{{ rack.zoneName }} · {{ rack.productCount }} produk</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg
                     hover:bg-slate-200 transition-colors"
              @click="showCreateModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="creating || (createMode === 'by-rack' && selectedRackIds.length === 0)"
              class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
                     hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-1.5"
              @click="confirmCreateOpname"
            >
              <svg v-if="creating" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              {{ creating ? 'Membuat...' : 'Mulai Opname' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Passcode Modal (after creating session)      -->
    <!-- ============================================ -->
    <teleport to="body">
      <div
        v-if="showPasscodeModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showPasscodeModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
          <!-- Success icon -->
          <div class="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">Sesi Opname Dibuat!</h2>
            <p class="text-xs text-slate-500 mt-1">
              Berikan kode ini ke petugas untuk mulai menghitung stok di webapp.
            </p>
          </div>

          <!-- Passcode display -->
          <div class="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-5 px-4">
            <p class="text-[10px] text-slate-500 uppercase font-semibold tracking-wide mb-1">Kode Opname</p>
            <p class="text-3xl font-black font-mono text-slate-900 tracking-[0.3em]">
              {{ createdPasscode }}
            </p>
          </div>

          <!-- Info -->
          <div class="text-left bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p class="text-[11px] text-blue-800 font-semibold">Cara pakai:</p>
            <ol class="text-[11px] text-blue-700 list-decimal list-inside space-y-0.5">
              <li>Petugas buka webapp di HP/tablet</li>
              <li>Masukkan kode <strong>{{ createdPasscode }}</strong></li>
              <li>Isi nama petugas, lalu mulai hitung</li>
            </ol>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg
                     hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              @click="copyPasscode"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              {{ copied ? 'Tersalin!' : 'Salin Kode' }}
            </button>
            <button
              type="button"
              class="flex-1 h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
                     hover:bg-blue-700 transition-colors"
              @click="showPasscodeModal = false"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ============================================ -->
    <!-- Detail Modal                                  -->
    <!-- ============================================ -->
    <teleport to="body">
      <div
        v-if="showDetail"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDetail = false"
      >
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">{{ detail?.sessionNumber }}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ detail?.conductorName }} &middot; {{ detail ? formatDate(detail.createdAt) : '' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Passcode in detail header -->
              <span
                v-if="detail && detail.status === 'IN_PROGRESS'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold font-mono tracking-wider cursor-pointer"
                :title="'Klik untuk salin kode'"
                @click="copyToClipboard(detail.passcode)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                {{ detail.passcode }}
              </span>
              <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', detail ? statusBadge(detail.status) : '']">
                {{ detail ? statusLabel(detail.status) : '' }}
              </span>
              <button @click="showDetail = false" class="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div v-if="detailLoading" class="text-center py-10 text-slate-500 text-sm">Memuat detail...</div>
            <div v-else-if="detail">
              <!-- Participants section (for active sessions) -->
              <div v-if="detail.participants && detail.participants.length > 0" class="mb-5">
                <h3 class="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Petugas ({{ detail.participants.length }})
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="p in detail.participants"
                    :key="p.id"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] text-slate-700"
                  >
                    <span class="w-4 h-4 bg-blue-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                      {{ p.name.charAt(0).toUpperCase() }}
                    </span>
                    {{ p.name }}
                    <span class="text-slate-400 text-[9px]">{{ formatTime(p.joinedAt) }}</span>
                  </span>
                </div>
              </div>

              <div v-else-if="detail.status === 'IN_PROGRESS'" class="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p class="text-xs text-amber-700">
                  Belum ada petugas yang bergabung. Bagikan kode
                  <strong class="font-mono">{{ detail.passcode }}</strong>
                  ke petugas untuk mulai menghitung.
                </p>
              </div>

              <!-- Summary Cards (for completed) -->
              <div v-if="detail.status === 'COMPLETED'" class="grid grid-cols-3 gap-3 mb-5">
                <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-emerald-700">{{ detail.totalMatched }}</p>
                  <p class="text-[10px] text-emerald-600 uppercase font-semibold">Cocok</p>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-amber-700">{{ detail.totalSurplus }}</p>
                  <p class="text-[10px] text-amber-600 uppercase font-semibold">Surplus</p>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p class="text-lg font-bold text-red-700">{{ detail.totalDeficit }}</p>
                  <p class="text-[10px] text-red-600 uppercase font-semibold">Kurang</p>
                </div>
              </div>

              <!-- Items Table -->
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                    <th class="pb-2 pr-3">Produk</th>
                    <th class="pb-2 pr-3 text-right">Sistem</th>
                    <th class="pb-2 pr-3 text-right">Fisik</th>
                    <th class="pb-2 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in detail.items"
                    :key="item.id"
                    class="border-b border-slate-100 last:border-0"
                  >
                    <td class="py-2.5 pr-3">
                      <p class="text-xs font-medium text-slate-900 dark:text-slate-100">{{ item.productName }}</p>
                      <p class="text-[10px] text-slate-400">{{ item.productSku }}</p>
                    </td>
                    <td class="py-2.5 pr-3 text-right text-xs text-slate-700 dark:text-slate-300">{{ item.systemQty }}</td>
                    <td class="py-2.5 pr-3 text-right">
                      <template v-if="detail.status === 'IN_PROGRESS'">
                        <input
                          type="number"
                          :value="item.actualQty ?? ''"
                          min="0"
                          class="w-16 h-7 px-2 text-xs text-right border border-slate-300 rounded
                                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          @change="(e) => handleUpdateItem(item.id, parseInt((e.target as HTMLInputElement).value), item.systemQty)"
                        />
                      </template>
                      <template v-else>
                        <span class="text-xs text-slate-700 dark:text-slate-300">{{ item.actualQty ?? '-' }}</span>
                      </template>
                    </td>
                    <td class="py-2.5 text-right">
                      <span
                        v-if="item.variance !== null"
                        :class="[
                          'text-xs font-semibold',
                          item.variance === 0 ? 'text-slate-400' :
                          item.variance > 0 ? 'text-amber-600' : 'text-red-600'
                        ]"
                      >
                        {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
                      </span>
                      <span v-else class="text-xs text-slate-300">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer -->
          <div v-if="detail && detail.status === 'IN_PROGRESS'" class="px-6 py-4 border-t border-slate-200 flex justify-between">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-lg
                     hover:bg-red-50 transition-colors"
              @click="handleCancel"
              :disabled="completing"
            >
              Batalkan
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                class="h-9 px-4 text-xs font-semibold text-slate-700 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg
                       hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                @click="handleComplete(false)"
                :disabled="completing"
              >
                Selesai (Tanpa Adjustment)
              </button>
              <button
                type="button"
                class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
                       hover:bg-blue-700 transition-colors"
                @click="handleComplete(true)"
                :disabled="completing"
              >
                {{ completing ? 'Menyimpan...' : 'Selesai & Update Stok' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Custom Confirm Modal -->
    <teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="handleConfirmNo"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <div class="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">{{ confirmTitle }}</h3>
            <p class="text-sm text-slate-500 mt-1.5">{{ confirmMessage }}</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-9 text-xs font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg
                     hover:bg-slate-200 transition-colors"
              @click="handleConfirmNo"
            >
              Batal
            </button>
            <button
              type="button"
              :class="['flex-1 h-9 text-xs font-semibold text-white rounded-lg transition-colors', confirmBtnClass]"
              @click="handleConfirmYes"
            >
              {{ confirmBtnText }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Custom Alert Modal -->
    <teleport to="body">
      <div
        v-if="showAlertModal"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showAlertModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <div
              :class="[
                'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3',
                alertType === 'error' ? 'bg-red-100' : alertType === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
              ]"
            >
              <svg
                :class="[
                  'w-6 h-6',
                  alertType === 'error' ? 'text-red-600' : alertType === 'warning' ? 'text-amber-600' : 'text-blue-600'
                ]"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path v-if="alertType === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">{{ alertTitle }}</h3>
            <p class="text-sm text-slate-500 mt-1.5">{{ alertMessage }}</p>
          </div>
          <button
            type="button"
            class="w-full h-9 text-xs font-semibold text-white bg-slate-700 rounded-lg
                   hover:bg-slate-800 transition-colors"
            @click="showAlertModal = false"
          >
            OK
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import opnameService, {
  type OpnameSessionDto,
  type OpnameSessionDetailDto,
  type OpnameListResponse,
  type OpnameStatus,
} from '@/shared/services/opname.service';
import rackService, { type RackDto } from '@/shared/services/rack.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

// ============================================
// State
// ============================================
const sessions = ref<OpnameSessionDto[]>([]);
const meta = ref<OpnameListResponse['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const creating = ref(false);
const filterStatus = ref<string>('');
const currentPage = ref(1);

// Monthly stats
const monthlyStats = ref({
  totalLoss: 0,
  totalItems: 0,
  matched: 0,
  totalSessions: 0,
  lastOpnameDate: '',
});

const currentMonthYear = computed(() => {
  return new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
});

// Detail modal
const showDetail = ref(false);
const detail = ref<OpnameSessionDetailDto | null>(null);
const detailLoading = ref(false);
const completing = ref(false);

// Passcode modal (shown after creating)
const showPasscodeModal = ref(false);
const createdPasscode = ref('');
const copied = ref(false);

// Custom confirm/alert modal
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmAction = ref<(() => void) | null>(null);
const confirmBtnText = ref('Ya');
const confirmBtnClass = ref('bg-blue-600 hover:bg-blue-700');
const showAlertModal = ref(false);
const alertTitle = ref('');
const alertMessage = ref('');
const alertType = ref<'error' | 'warning' | 'info'>('info');

// Create opname modal (with rack selection)
const showCreateModal = ref(false);
const availableRacks = ref<RackDto[]>([]);
const selectedRackIds = ref<string[]>([]);
const createMode = ref<'all' | 'by-rack'>('all');
const loadingRacks = ref(false);

// ============================================
// Helpers
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? undefined;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status: OpnameStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    case 'DRAFT': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: OpnameStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'Berjalan';
    case 'COMPLETED': return 'Selesai';
    case 'CANCELLED': return 'Dibatalkan';
    case 'DRAFT': return 'Draft';
    default: return status;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

async function copyPasscode() {
  await copyToClipboard(createdPasscode.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

// ============================================
// Methods
// ============================================

async function fetchSessions() {
  loading.value = true;
  error.value = null;
  try {
    const shopId = getShopId();
    const response = await opnameService.listSessions({
      shopId,
      status: (filterStatus.value as OpnameStatus) || undefined,
      page: currentPage.value,
      limit: 20,
    });
    sessions.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat sesi opname.';
  } finally {
    loading.value = false;
  }
}

/** Fetch stats separately — all sessions this month (no pagination/filter) */
async function fetchMonthlyStats() {
  try {
    const shopId = getShopId();
    const response = await opnameService.listSessions({
      shopId,
      page: 1,
      limit: 100, // Get all sessions this month
    });

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const completedThisMonth = response.data.filter((s) => {
      if (s.status !== 'COMPLETED' || !s.completedAt) return false;
      const d = new Date(s.completedAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const allThisMonth = response.data.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const totalMatched = completedThisMonth.reduce((sum, s) => sum + s.totalMatched, 0);
    const totalItems = completedThisMonth.reduce((sum, s) => sum + s.totalProducts, 0);
    const totalDeficit = completedThisMonth.reduce((sum, s) => sum + s.totalDeficit, 0);

    const lastCompleted = completedThisMonth.length > 0
      ? new Date(completedThisMonth[0].completedAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : '';

    monthlyStats.value = {
      totalLoss: totalDeficit, // jumlah item kurang (nanti bisa dikalikan harga rata-rata)
      totalItems,
      matched: totalMatched,
      totalSessions: allThisMonth.length,
      lastOpnameDate: lastCompleted,
    };
  } catch {
    // Stats gagal tidak blocking
  }
}

function resetAndFetch() {
  currentPage.value = 1;
  fetchSessions();
}

function goPage(page: number) {
  currentPage.value = page;
  fetchSessions();
}

async function handleCreate() {
  const shopId = getShopId();
  if (!shopId) return;

  // Open create modal with rack options
  showCreateModal.value = true;
  createMode.value = 'all';
  selectedRackIds.value = [];

  // Fetch racks for this shop
  loadingRacks.value = true;
  try {
    availableRacks.value = await rackService.listRacks(shopId);
  } catch {
    availableRacks.value = [];
  } finally {
    loadingRacks.value = false;
  }
}

async function confirmCreateOpname() {
  const shopId = getShopId();
  if (!shopId) return;

  creating.value = true;
  try {
    const payload: any = { shopId };
    if (createMode.value === 'by-rack' && selectedRackIds.value.length > 0) {
      payload.rackIds = selectedRackIds.value;
    }
    const result = await opnameService.createSession(payload);
    showCreateModal.value = false;
    createdPasscode.value = result.passcode;
    showPasscodeModal.value = true;
    copied.value = false;
    await fetchSessions();
  } catch (err: any) {
    showAlert('Gagal', err.response?.data?.message ?? 'Gagal membuat sesi opname.', 'error');
  } finally {
    creating.value = false;
  }
}

function toggleRackSelection(rackId: string) {
  const idx = selectedRackIds.value.indexOf(rackId);
  if (idx === -1) {
    selectedRackIds.value.push(rackId);
  } else {
    selectedRackIds.value.splice(idx, 1);
  }
}

async function openDetail(session: OpnameSessionDto) {
  showDetail.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await opnameService.getSession(session.id);
  } catch {
    detail.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function handleUpdateItem(itemId: string, actualQty: number, _systemQty: number) {
  if (isNaN(actualQty) || actualQty < 0) return;
  try {
    const updated = await opnameService.updateItem(itemId, { actualQty });
    // Update local state
    if (detail.value) {
      const idx = detail.value.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        detail.value.items[idx].actualQty = updated.actualQty;
        detail.value.items[idx].variance = updated.variance;
      }
    }
  } catch {
    // silent
  }
}

async function handleComplete(applyAdjustments: boolean) {
  if (!detail.value) return;

  const uncounted = detail.value.items.filter((i) => i.actualQty === null).length;
  if (uncounted > 0) {
    showAlert('Belum Lengkap', `Masih ada ${uncounted} produk yang belum dihitung.`, 'warning');
    return;
  }

  const msg = applyAdjustments
    ? 'Selesaikan opname DAN update stok sesuai hasil hitung fisik?'
    : 'Selesaikan opname TANPA mengubah stok?';

  showConfirm(
    applyAdjustments ? 'Selesai & Update Stok?' : 'Selesaikan Opname?',
    msg,
    async () => {
      completing.value = true;
      try {
        await opnameService.completeSession(detail.value!.id, applyAdjustments);
        showDetail.value = false;
        await fetchSessions();
      } catch (err: any) {
        showAlert('Gagal', err.response?.data?.message ?? 'Gagal menyelesaikan opname.', 'error');
      } finally {
        completing.value = false;
      }
    },
    applyAdjustments ? 'Ya, Update Stok' : 'Ya, Selesaikan',
    applyAdjustments ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800',
  );
}

async function handleCancel() {
  if (!detail.value) return;
  showConfirm(
    'Batalkan Opname?',
    'Sesi opname ini akan dibatalkan. Data hitung yang sudah ada tidak akan disimpan.',
    async () => {
      try {
        await opnameService.cancelSession(detail.value!.id);
        showDetail.value = false;
        await fetchSessions();
      } catch (err: any) {
        showAlert('Gagal', err.response?.data?.message ?? 'Gagal membatalkan opname.', 'error');
      }
    },
    'Ya, Batalkan',
    'bg-red-600 hover:bg-red-700',
  );
}

// ============================================
// Custom Modal Helpers
// ============================================

function showConfirm(
  title: string,
  message: string,
  action: () => void,
  btnText: string = 'Ya',
  btnClass: string = 'bg-blue-600 hover:bg-blue-700',
) {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction.value = action;
  confirmBtnText.value = btnText;
  confirmBtnClass.value = btnClass;
  showConfirmModal.value = true;
}

function handleConfirmYes() {
  showConfirmModal.value = false;
  if (confirmAction.value) confirmAction.value();
}

function handleConfirmNo() {
  showConfirmModal.value = false;
  confirmAction.value = null;
}

function showAlert(title: string, message: string, type: 'error' | 'warning' | 'info' = 'info') {
  alertTitle.value = title;
  alertMessage.value = message;
  alertType.value = type;
  showAlertModal.value = true;
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchSessions();
  fetchMonthlyStats();
});
</script>
