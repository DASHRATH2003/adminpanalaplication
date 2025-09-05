import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['xlsx']
    }
  },
  resolve: {
    alias: {
      'xlsx': resolve(__dirname, 'node_modules/xlsx')
    }
  }
})
