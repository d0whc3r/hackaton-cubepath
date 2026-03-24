import node from '@astrojs/node'
import react from '@astrojs/react'
import faroRollupPlugin from '@grafana/faro-rollup-plugin'
// Import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react({ babel: { plugins: [['babel-plugin-react-compiler']] } })],
  output: 'server',
  vite: {
    plugins: [
      tailwindcss() as any,
      faroRollupPlugin({
        apiKey: process.env.PUBLIC_GRAFANA_FARO_API_KEY ?? '',
        appName: 'cubepath',
        appVersion: '1.0.0',
        bundleId: `${process.env.npm_package_version ?? '1.0.0'}-${Date.now()}`,
        endpoint: process.env.PUBLIC_GRAFANA_FARO_URL ?? '',
        keepSourcemaps: true,
        outputPath: './dist',
        stackId: process.env.PUBLIC_GRAFANA_FARO_STACK_ID ?? '',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
  },
})
