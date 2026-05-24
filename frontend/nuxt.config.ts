// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  app: {
    head: {
      title: 'Maslahat Tani v2',
      meta: [
        { name: 'description', content: 'Sistem POS & BRILink untuk Agen Retail' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/devtools',
  ],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    exposeConfig: true,
    viewer: false,
    config: {
      theme: {
        extend: {
          colors: {
            'brand': {
              '50': '#eff6ff',
              '100': '#dbeafe',
              '200': '#bfdbfe',
              '300': '#93c5fd',
              '400': '#60a5fa',
              '500': '#3b82f6',
              '600': '#2563eb',
              '700': '#1d4ed8',
              '800': '#1e40af',
              '900': '#1e3a8a',
            },
          },
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api',
    },
  },

  ssr: false, // Disable SSR for now (can enable later)

  build: {
    transpile: ['vee-validate/rules'],
  },

  typescript: {
    shim: false,
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml'],
    },
  },
});
