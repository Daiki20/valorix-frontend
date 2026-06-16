import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (['react', 'react-dom', 'react-router-dom'].some(p => id.includes(`/node_modules/${p}/`) || id.includes(`\\node_modules\\${p}\\`))) return 'vendor-react'
            if (['lucide-react', 'react-helmet-async'].some(p => id.includes(`/node_modules/${p}/`) || id.includes(`\\node_modules\\${p}\\`))) return 'vendor-ui'
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) return 'vendor-markdown'
          }
        }
      }
    }
  },
})
