import { wrapRequestHandler } from '@sentry/cloudflare'
import { defineMiddleware, sequence } from 'astro:middleware'
import { DEFAULT_GUARD_MODEL } from '@/lib/railguard/guard-models'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const READY_COOKIE_NAME = 'slm_router_guard_ready'
const STATE_COOKIE_NAME = 'slm_router_guard_state'
const READY_CACHE_TTL_MS = 30 * 60 * 1000
const READY_COOKIE_MAX_AGE_SECONDS = READY_CACHE_TTL_MS / 1000
const CHECK_TIMEOUT_MS = 5000
const PULL_TIMEOUT_MS = 600_000

const inflightByKey = new Map<string, Promise<boolean>>()

interface OllamaTagsResponse {
  models?: { name: string }[]
}

function cacheKey(baseUrl: string, modelId: string): string {
  return `${baseUrl}::${modelId}`
}

function parseReadyCookie(raw: string | undefined): { key: string; timestamp: number } | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { key?: string; timestamp?: number }
    if (typeof parsed.key !== 'string' || typeof parsed.timestamp !== 'number') {
      return null
    }
    return { key: parsed.key, timestamp: parsed.timestamp }
  } catch {
    return null
  }
}

function isHtmlRequest(request: Request, pathname: string): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }
  if (pathname.startsWith('/api/')) {
    return false
  }
  if (pathname.startsWith('/_astro/')) {
    return false
  }
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return false
  }
  const accept = request.headers.get('accept') ?? ''
  return accept.includes('text/html') || accept.includes('*/*')
}

async function ensureGuardReady(baseUrl: string, modelId: string): Promise<boolean> {
  try {
    const tagsRes = await fetch(`${baseUrl}/api/tags`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    })
    if (!tagsRes.ok) {
      return false
    }
    const tags = (await tagsRes.json()) as OllamaTagsResponse
    const installed = (tags.models ?? []).some((model) => {
      const [base, tag] = model.name.split(':')
      const normalized = tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? model.name)
      return normalized === modelId
    })
    if (installed) {
      return true
    }

    const pullRes = await fetch(`${baseUrl}/api/pull`, {
      body: JSON.stringify({ name: modelId, stream: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(PULL_TIMEOUT_MS),
    })
    return pullRes.ok
  } catch {
    return false
  }
}

const sentryMiddleware = defineMiddleware(async (context, next) => {
  const dsn = import.meta.env.SENTRY_DSN as string | undefined
  if (!dsn) {
    return next()
  }
  return wrapRequestHandler(
    {
      context: context.locals.cfContext,
      options: {
        dsn,
        enableLogs: true,
        environment: import.meta.env.APP_ENV ?? import.meta.env.MODE,
        release: import.meta.env.APP_VERSION as string | undefined,
        sendDefaultPii: true,
        tracesSampleRate: Number(import.meta.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
      },
      request: context.request,
    },
    () => next(),
  )
})

const guardMiddleware = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  if (!isHtmlRequest(context.request, pathname)) {
    return next()
  }

  const modelId = DEFAULT_GUARD_MODEL
  const baseUrl = OLLAMA_BASE_URL_DEFAULT
  const key = cacheKey(baseUrl, modelId)
  const now = Date.now()

  const persisted = parseReadyCookie(context.cookies.get(READY_COOKIE_NAME)?.value)
  if (persisted && persisted.key === key && now - persisted.timestamp < READY_CACHE_TTL_MS) {
    context.cookies.set(STATE_COOKIE_NAME, 'ready', {
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
    })
    return next()
  }

  context.cookies.set(STATE_COOKIE_NAME, 'loading', {
    maxAge: READY_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  })

  let inflight = inflightByKey.get(key)
  if (!inflight) {
    inflight = ensureGuardReady(baseUrl, modelId).finally(() => {
      inflightByKey.delete(key)
    })
    inflightByKey.set(key, inflight)
  }

  const ready = await inflight
  if (ready) {
    context.cookies.set(READY_COOKIE_NAME, encodeURIComponent(JSON.stringify({ key, timestamp: Date.now() })), {
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
    })
    context.cookies.set(STATE_COOKIE_NAME, 'ready', {
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
    })
  } else {
    context.cookies.set(STATE_COOKIE_NAME, 'error', {
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
    })
  }

  return next()
})

export const onRequest = sequence(sentryMiddleware, guardMiddleware)
