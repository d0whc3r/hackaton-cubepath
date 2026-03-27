import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
// oxlint-disable-next-line import/default
import sentry from '@sentry/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'

// Vite's compilation workers (esbuild, @tailwindcss/vite) and Sentry's
// Instrumentation hooks attach more than 10 listeners to spawned ChildProcess
// Objects. Raise the default to prevent false MaxListenersExceededWarning.
EventEmitter.defaultMaxListeners = 30

export default defineConfig({
  adapter: cloudflare({
    // Use compile-time image processing — no Cloudflare Images binding needed.
    imageService: 'compile',
  }),
  integrations: [
    react({ babel: { plugins: [['babel-plugin-react-compiler']] } }),
    sentry({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Disable server-side SDK injection — Cloudflare Workers resolves @sentry/astro to the
      // Browser bundle (no `node` export condition), causing BrowserClient to run server-side
      // And fail with "addEventListener(): useCapture must be false". Server instrumentation is
      // Handled instead by @sentry/cloudflare's wrapRequestHandler in src/middleware.ts.
      enabled: { client: true, server: false },
      org: 'slm-router',
      project: 'javascript-astro',
      sourceMapsUploadOptions: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  output: 'server',
  vite: {
    optimizeDeps: {
      // React/compiler-runtime must share the same React instance as react-dom.
      // Without this, Vite's dev server can load it unbundled, giving it a
      // Separate require("react") resolution and leaving H (the dispatcher)
      // Permanently null — causing "Cannot read properties of null (reading
      // 'useMemoCache')" whenever a compiler-optimised component renders.
      include: ['react/compiler-runtime'],
    },
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    ssr: {
      // Keep compiler-runtime out of the SSR bundle — components compiled with
      // Babel-plugin-react-compiler call useMemoCache which requires a live
      // Client dispatcher (H).  On the server H is always null, so any
      // Server-side invocation would throw.  client:only islands never render
      // Server-side, but bundling the runtime into the SSR chunk can still
      // Cause the wrong React instance to be captured at import time.
      noExternal: ['react/compiler-runtime'],
    },
  },
})
