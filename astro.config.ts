import node from '@astrojs/node'
import react from '@astrojs/react'
// Import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  output: 'server',
  vite: {
    plugins: [tailwindcss() as any],
  },
})
