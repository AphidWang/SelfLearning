/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    deps: {
      inline: ['@asamuzakjp/css-color', 'cssstyle']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/client/src'),
    },
  },
})
