import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**'],
      provider: 'v8',
      reportOnFailure: true,
    },
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/msw/setup.ts', 'src/__tests__/setup.ts'],
    watch: false,
  },
})
