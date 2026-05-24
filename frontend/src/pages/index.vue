<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Maslahat Tani v2</h1>
      <p class="text-xl text-gray-600 mb-8">Sistem POS & BRILink untuk Agen Retail</p>
      <div class="flex gap-4 justify-center">
        <NuxtLink 
          to="/admin/login" 
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Admin Panel
        </NuxtLink>
        <NuxtLink 
          to="/kasir/login" 
          class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Kasir Webapp
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});
</script>
