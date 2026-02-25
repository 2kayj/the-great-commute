import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor (Android/iOS) 전용 빌드 설정
// base를 './'로 설정해야 Capacitor WebView에서 에셋 경로가 올바르게 동작함
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
