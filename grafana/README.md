# Grafana Dashboards — Cubepath

Dashboards para observar el stack completo de cubepath: logs (Loki), métricas (Prometheus/Mimir) y trazas (Tempo).

## Dashboards

| Archivo                      | UID                  | Descripción                                                                            |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `01-overview.json`           | `cubepath-overview`  | Vista general: KPIs, latencia P50/P95, logs recientes y trazas                         |
| `02-api-requests.json`       | `cubepath-api`       | Ciclo de vida de requests: start/end, errores, validación, logs reenviados del browser |
| `03-streaming-ai.json`       | `cubepath-streaming` | Métricas de streaming AI: duración, chars input/output, uso por modelo                 |
| `04-security-railguard.json` | `cubepath-security`  | Bloqueos del railguard, errores de validación Zod, logs WARN/ERROR                     |
| `05-frontend-rum.json`       | `cubepath-faro`      | Web Vitals (Grafana Faro): LCP, FID, CLS, FCP, TTFB + errores JS                       |
| `06-http-clients.json`       | `cubepath-http`      | Trazabilidad de app-client y ollama-client, correlación por `x-request-id`             |

## Cómo importar los dashboards

### Opción A — Importar manualmente en Grafana UI

1. Abre Grafana → **Dashboards** → **Import**
2. Pulsa **Upload dashboard JSON file**
3. Selecciona el `.json` correspondiente
4. Asigna los datasources (Loki, Prometheus, Tempo) cuando se te pida
5. Pulsa **Import**

Repite para cada uno de los 6 dashboards.

### Opción B — Provisioning automático (docker-compose / k8s)

Copia los ficheros a las rutas de provisioning de Grafana:

```bash
# Datasources
cp grafana/provisioning/datasources.yaml /etc/grafana/provisioning/datasources/cubepath.yaml

# Dashboard provider
cp grafana/provisioning/dashboards.yaml /etc/grafana/provisioning/dashboards/cubepath.yaml

# Dashboard JSONs
cp grafana/dashboards/*.json /etc/grafana/dashboards/
```

O con docker-compose, monta los volúmenes:

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./grafana/provisioning/datasources.yaml:/etc/grafana/provisioning/datasources/cubepath.yaml
      - ./grafana/provisioning/dashboards.yaml:/etc/grafana/provisioning/dashboards/cubepath.yaml
      - ./grafana/dashboards:/etc/grafana/dashboards
    environment:
      - GRAFANA_INSTANCE_ID=${GRAFANA_INSTANCE_ID}
      - GRAFANA_CLOUD_TOKEN=${GRAFANA_CLOUD_TOKEN}
      - LOKI_URL=${GRAFANA_OTLP_ENDPOINT}
      - PROMETHEUS_URL=${GRAFANA_OTLP_ENDPOINT}
      - TEMPO_URL=${GRAFANA_OTLP_ENDPOINT}
```

## Variables de entorno necesarias

Las mismas que usa la app (ver `.env.example`):

```
GRAFANA_INSTANCE_ID=<numeric-id>
GRAFANA_CLOUD_TOKEN=<api-token>
GRAFANA_OTLP_ENDPOINT=https://otlp-gateway-prod-us-west-0.grafana.net/otlp
PUBLIC_GRAFANA_FARO_URL=https://faro-collector-prod-us-west-0.grafana.net/collect/{api-key}
```

## Datasources requeridos

| Datasource   | Tipo             | Qué contiene                                                                     |
| ------------ | ---------------- | -------------------------------------------------------------------------------- |
| `Loki`       | Loki             | Todos los logs estructurados del servicio. Label: `service_name="cubepath"`      |
| `Prometheus` | Prometheus/Mimir | Métricas de la app: `cubepath_route_*`, `cubepath_stream_*`, `faro_web_vitals_*` |
| `Tempo`      | Tempo            | Trazas distribuidas. Service: `cubepath`. Correlación con Loki por `requestId`.  |

## Métricas Prometheus disponibles

| Métrica                                 | Tipo      | Labels               | Descripción                          |
| --------------------------------------- | --------- | -------------------- | ------------------------------------ |
| `cubepath_route_requests_total`         | Counter   | `task_type`          | Requests aceptados por /api/route    |
| `cubepath_route_blocked_total`          | Counter   | `task_type`          | Requests bloqueados por el railguard |
| `cubepath_stream_duration_milliseconds` | Histogram | `model_id`, `status` | Duración de respuestas en streaming  |
| `cubepath_stream_input_chars`           | Histogram | `model_id`           | Chars de entrada enviados al modelo  |
| `cubepath_stream_output_chars`          | Histogram | `model_id`           | Chars generados por el modelo        |

## Eventos de log clave (Loki)

Todos los logs usan `| json` para parsear el payload estructurado.

| `message`                     | Nivel     | Dónde se emite           | Campos clave                             |
| ----------------------------- | --------- | ------------------------ | ---------------------------------------- |
| `api.request.start`           | info      | `withApiLogging`         | `method`, `path`, `requestId`, `routeId` |
| `api.request.end`             | info/warn | `withApiLogging`         | `durationMs`, `status`, `requestId`      |
| `api.request.unhandled_error` | error     | `withApiLogging`         | `error`, `stack`, `requestId`            |
| `route.accepted`              | info      | `/api/route`             | `taskType`, `requestId`                  |
| `route.blocked_by_railguard`  | warn      | `/api/route`             | `blockReason`, `taskType`, `requestId`   |
| `route.validation_error`      | warn      | `/api/route`             | `errors`, `requestId`                    |
| `route.invalid_json`          | warn      | `/api/route`             | `requestId`                              |
| `route.stream.failed`         | error     | `/api/route`             | `taskType`, `error`                      |
| `stream.specialist.start`     | info      | `stream-runner`          | `modelId`, `inputSize`, `autoContinue`   |
| `stream.specialist.done`      | info      | `stream-runner`          | `modelId`, `durationMs`, `outputSize`    |
| `stream.specialist.aborted`   | warn      | `stream-runner`          | `modelId`, `durationMs`                  |
| `stream.specialist.error`     | error     | `stream-runner`          | `modelId`, `error`                       |
| `api.client.request.start`    | info      | `app-client` (browser)   | `method`, `path`, `requestId`            |
| `api.client.request.end`      | info/warn | `app-client` (browser)   | `durationMs`, `status`                   |
| `api.client.request.error`    | error     | `app-client` (browser)   | `error`                                  |
| `ollama.request.start`        | info      | `ollama-client` (server) | `method`, `url`, `requestId`             |
| `ollama.request.end`          | info/warn | `ollama-client` (server) | `durationMs`, `status`                   |
| `ollama.request.error`        | error     | `ollama-client` (server) | `error`                                  |

## Correlación de trazas

Cada request lleva un `x-request-id` header generado en `withApiLogging` y propagado por todos los middlewares.

Para seguir el ciclo de vida completo de un request:

1. Abre el dashboard **HTTP Clients**
2. Introduce el `requestId` en la variable de template
3. El panel "Correlación por Request ID" muestra todos los logs del lifecycle
4. El panel "Trazas por Request ID — Tempo" busca la traza asociada
