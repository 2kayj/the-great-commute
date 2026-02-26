import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const isCapacitor = process.env.BUILD_TARGET === 'capacitor';

export default defineConfig({
  plugins: [react()],
  base: isCapacitor ? '/' : '/the-great-commute/',
})
