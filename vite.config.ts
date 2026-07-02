import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 💡 只有在本地開發 npm run dev 時會生效的設定
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 將 API 請求轉發給你的 Express 後端
        changeOrigin: true,
      }
    }
  }
})
