import type { ExternalToast } from 'sonner'
import { toast } from 'sonner'

interface NotifyOptions extends ExternalToast {
  description?: string | null
}

const DEFAULT_DURATION = 5000
const ERROR_DURATION = 7000

function withDefaults(options: NotifyOptions | undefined, duration = DEFAULT_DURATION): ExternalToast {
  return {
    closeButton: true,
    duration,
    ...options,
    description: options?.description ?? undefined,
  }
}

export const notify = {
  error(title: string, options?: NotifyOptions) {
    return toast.error(title, withDefaults(options, ERROR_DURATION))
  },
  info(title: string, options?: NotifyOptions) {
    return toast.info(title, withDefaults(options))
  },
  success(title: string, options?: NotifyOptions) {
    return toast.success(title, withDefaults(options))
  },
  warning(title: string, options?: NotifyOptions) {
    return toast.warning(title, withDefaults(options))
  },
}

export async function copyNotificationDetails(text: string, successTitle = 'Details copied'): Promise<void> {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    notify.success(successTitle)
  } catch {
    notify.error('Unable to copy details')
  }
}
