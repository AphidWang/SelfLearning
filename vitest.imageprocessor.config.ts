/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // 不使用任何 setup 文件
    setupFiles: [],
    include: [
      'tests/test-image-processor.test.ts'
    ],
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