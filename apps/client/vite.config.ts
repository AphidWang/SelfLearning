import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false  // 禁用錯誤覆蓋層
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5200',
        changeOrigin: true,
      },
    }
  },
  build: {
    sourcemap: false, // 關掉 sourcemap 避免 framer-motion 錯誤
    rollupOptions: {
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'], // 把 framer-motion 單獨打包
        }
      }
    }
  },
});
