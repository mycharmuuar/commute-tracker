// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  runtimeConfig: {
    public: {
      googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NUXT_PUBLIC_GOOGLE_MAPS_KEY || '',
      backendUrl: process.env.VITE_BACKEND_URL || process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      companyLat: process.env.VITE_COMPANY_LAT || '13.7226',
      companyLng: process.env.VITE_COMPANY_LNG || '100.5284',
      companyName: process.env.VITE_COMPANY_NAME || 'อาคารสาทรสแควร์ (Sathorn Square)',
    }
  },
  app: {
    head: {
      title: 'Commute Tracker | ระบบแสดงเส้นทางไปบริษัทแบบ Real-time',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ระบบคำนวณและแสดงเส้นทางจากตำแหน่งปัจจุบันไปยังบริษัท พร้อมสภาพการจราจรแบบ Real-time' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
