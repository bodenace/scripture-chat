import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize for production (esbuild is default and faster than terser)
    minify: 'esbuild'
  },
  // Optimize for Edge browser compatibility and remove console.log in production
  esbuild: {
    target: 'es2020',
    drop: ['console', 'debugger']
  }
});
