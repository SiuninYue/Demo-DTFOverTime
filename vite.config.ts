import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI and animation
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Form validation
          'vendor-form': ['zod'],
        },
      },
    },
  },
})
