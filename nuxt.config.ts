import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-11-01',

  devtools: { enabled: true },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Base URL of your existing backend (e.g. Firebase Cloud Function)
      // Mapped from BACKEND_URL in .env so it is available client-side.
      backendUrl: process.env.BACKEND_URL || '',
    },
  },
})
