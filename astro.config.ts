import node from '@astrojs/node'
import react from '@astrojs/react'
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
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
  },
})
