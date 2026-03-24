/**
 * Grafana Faro Web SDK — browser Real User Monitoring (RUM).
 *
 * Captures automatically:
 *   - JavaScript errors and unhandled promise rejections
 *   - Web Vitals (LCP, FID, CLS, FCP, TTFB)
 *   - Fetch / XHR request timings
 *   - Console log forwarding
 *   - User session tracking
 *
 * Required env var:
 *   PUBLIC_GRAFANA_FARO_URL — collector URL from Grafana Cloud →
 *     Frontend Observability → Create App → copy the "Web URL"
 *     Format: https://faro-collector-prod-us-west-0.grafana.net/collect/{api-key}
 */
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

const isBrowser = globalThis.window !== undefined

if (isBrowser) {
  const faroUrl = import.meta.env.PUBLIC_GRAFANA_FARO_URL
  if (faroUrl) {
    initializeFaro({
      app: {
        environment: import.meta.env.PUBLIC_APP_ENV ?? import.meta.env.MODE ?? 'production',
        name: 'cubepath',
        version: '1.0.0',
      },
      instrumentations: [...getWebInstrumentations({ captureConsole: true }), new TracingInstrumentation()],
      url: faroUrl,
    })
  }
}
