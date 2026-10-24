import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 5182 keeps the dev server clear of the API server on 5000.
    port: 5174,
    strictPort: true,
    // The browser talks to the Express judge through /api, same origin.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
