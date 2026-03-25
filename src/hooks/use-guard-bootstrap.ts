import { useMemo, useState } from 'react'
import { DEFAULT_GUARD_MODEL } from '@/lib/railguard/guard-models'

type BootstrapStatus = 'checking' | 'pulling' | 'ready' | 'error'

export interface GuardBootstrapState {
  error?: string
  modelId: string
  progress?: string
  status: BootstrapStatus
}

const READY_COOKIE_NAME = 'slm_router_guard_ready'
const STATE_COOKIE_NAME = 'slm_router_guard_state'
const READY_CACHE_TTL_MS = 30 * 60 * 1000

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const match = document.cookie.match(new RegExp(`${name}=([^;]+)`))
  return match?.[1] ?? null
}

function hasFreshReadyCookie(): boolean {
  const raw = readCookie(READY_COOKIE_NAME)
  if (!raw) {
    return false
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { timestamp?: number }
    return typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < READY_CACHE_TTL_MS
  } catch {
    return false
  }
}

function initialState(): GuardBootstrapState {
  const modelId = DEFAULT_GUARD_MODEL
  const stateCookie = readCookie(STATE_COOKIE_NAME)

  if (hasFreshReadyCookie() || stateCookie === 'ready' || stateCookie === null) {
    return { modelId, status: 'ready' }
  }

  if (stateCookie === 'loading') {
    return { modelId, status: 'checking' }
  }

  return { error: 'Guard model is not ready.', modelId, status: 'error' }
}

export function useGuardBootstrap() {
  const [state] = useState<GuardBootstrapState>(initialState)
  const retry = useMemo(
    () => () => {
      globalThis.location.reload()
    },
    [],
  )

  return { retry, state }
}
