<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="text-center max-w-2xl">
      <div class="mx-auto w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg">
        <span class="material-symbols-outlined text-white text-4xl">store</span>
      </div>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">Maslahat Tani v2</h1>
      <p class="text-base sm:text-lg text-slate-600 mb-8">Sistem POS &amp; BRILink untuk Agen Retail</p>

      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <RouterLink
          to="/admin/login"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          Admin Panel
        </RouterLink>
        <RouterLink
          to="/kasir/login"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
        >
          <span class="material-symbols-outlined text-[20px]">point_of_sale</span>
          Kasir Webapp
        </RouterLink>
        <RouterLink
          to="/showcase"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 text-sm sm:text-base font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-md"
        >
          <span class="material-symbols-outlined text-[20px]">palette</span>
          UI Showcase
        </RouterLink>
      </div>

      <p class="mt-8 text-xs text-slate-500">v2.0 • Vue 3 + Vite + Tailwind</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Home / Landing page
</script>
