<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-50 px-4">
    <div class="text-center">
      <p class="text-6xl sm:text-8xl font-bold text-slate-300 mb-4">404</p>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-950 mb-2">Halaman Tidak Ditemukan</h1>
      <p class="text-sm sm:text-base text-slate-600 mb-6">
        Halaman yang Anda cari tidak tersedia atau sudah dihapus.
      </p>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
      >
        <span class="material-symbols-outlined text-[18px]">home</span>
        Kembali ke Home
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Page
</script>
