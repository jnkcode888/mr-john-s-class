import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015',
    minify: true,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion', '@supabase/supabase-js'],
  },
}) 