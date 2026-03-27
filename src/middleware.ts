import { wrapRequestHandler } from '@sentry/cloudflare'
import { defineMiddleware, sequence } from 'astro:middleware'
import { parseReadyCookie } from '@/lib/guard/ready-cookie'
import { DEFAULT_GUARD_MODEL } from '@/lib/railguard/guard-models'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const READY_COOKIE_NAME = 'slm_router_guard_ready'
const STATE_COOKIE_NAME = 'slm_router_guard_state'
const READY_CACHE_TTL_MS = 30 * 60 * 1000
const READY_COOKIE_MAX_AGE_SECONDS = READY_CACHE_TTL_MS / 1000
const CHECK_TIMEOUT_MS = 5000
const PULL_TIMEOUT_MS = 600_000

/**
 * Deduplicates concurrent guard-model checks only within this Worker isolate.
 * Cloudflare may run multiple isolates, so cross-isolate deduplication is not guaranteed.
 * That trade-off is acceptable for the current single-user / low-scale bootstrap flow.
 */
const inflightByKey = new Map<string, Promise<boolean>>()

interface OllamaTagsResponse {
  models?: { name: string }[]
}

function cacheKey(baseUrl: string, modelId: string): string {
  return `${baseUrl}::${modelId}`
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
        sendDefaultPii: false,
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

  const secure = import.meta.env.PROD

  const persisted = parseReadyCookie(context.cookies.get(READY_COOKIE_NAME)?.value)
  if (persisted && persisted.key === key && now - persisted.timestamp < READY_CACHE_TTL_MS) {
    context.cookies.set(STATE_COOKIE_NAME, 'ready', {
      httpOnly: true,
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure,
    })
    return next()
  }

  context.cookies.set(STATE_COOKIE_NAME, 'loading', {
    httpOnly: true,
    maxAge: READY_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure,
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
      httpOnly: true,
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure,
    })
    context.cookies.set(STATE_COOKIE_NAME, 'ready', {
      httpOnly: true,
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure,
    })
  } else {
    context.cookies.set(STATE_COOKIE_NAME, 'error', {
      httpOnly: true,
      maxAge: READY_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure,
    })
  }

  return next()
})

export const onRequest = sequence(sentryMiddleware, guardMiddleware)
