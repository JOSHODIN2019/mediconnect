import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
            return 'vendor-react'
          }
          if (id.includes('/node_modules/react-router') || id.includes('/node_modules/@remix-run/')) {
            return 'vendor-router'
          }
          if (id.includes('/node_modules/socket.io') || id.includes('/node_modules/engine.io') || id.includes('/node_modules/socket.io-parser')) {
            return 'vendor-socket'
          }
          if (id.includes('/node_modules/agora-rtc-sdk-ng')) {
            return 'vendor-agora'
          }
          if (id.includes('/node_modules/react-hook-form')) {
            return 'vendor-forms'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
