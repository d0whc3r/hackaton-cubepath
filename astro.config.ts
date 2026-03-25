import node from '@astrojs/node'
import react from '@astrojs/react'
// oxlint-disable-next-line import/default
import sentry from '@sentry/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react({ babel: { plugins: [['babel-plugin-react-compiler']] } }),
    sentry({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      autoInstrument: {
        middleware: true,
        serverHandling: true,
      },
      org: 'slm-router',
      project: 'javascript-astro',
      sourceMapsUploadOptions: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
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
