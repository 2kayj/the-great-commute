import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 앱인토스 전용 빌드 설정
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __PLATFORM__: JSON.stringify('toss'),
  },
  build: {
    outDir: 'dist-toss',
  },
})
