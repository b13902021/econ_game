import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 💡 1. 引入 Tailwind v4 的 Vite 外掛

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 💡 2. 告訴 Vite 要編譯你的 index.css
  ],
  server: {
    // 這是我們之前為了本地雙開設定的 API 代理 (保留不動)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
