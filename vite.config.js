import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Разбивать chunks только если они > 500kb
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core отдельно — кешируется браузером надолго
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
