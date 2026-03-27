import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react({ babel: { plugins: [['babel-plugin-react-compiler']] } })],
  test: {
    coverage: {
      exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**'],
    },
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/msw/setup.ts', 'src/__tests__/setup.ts'],
    watch: false,
  },
})
