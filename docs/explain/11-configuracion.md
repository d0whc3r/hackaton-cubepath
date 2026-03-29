# Configuración — SLM Router

## Variables de entorno

Definidas en `.env` (o `.env.local` para desarrollo):

```env
# URL base de Ollama (accesible desde el servidor Node)
PUBLIC_OLLAMA_BASE_URL=http://localhost:11434

# Servidor
HOST=0.0.0.0
PORT=4321

# Logging
LOG_LEVEL=info
PUBLIC_LOG_LEVEL=info

# Sentry (opcional)
PUBLIC_SENTRY_DSN=
PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0

# Axiom (logging cloud, opcional)
AXIOM_TOKEN=
AXIOM_DATASET=slm-router
```

Las variables con prefijo `PUBLIC_` son accesibles en el cliente (browser).

---

## TypeScript

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- **Strict mode** activo: `strictNullChecks`, `noImplicitAny`, etc.
- **Path alias** `@/*` → `src/*` para imports limpios.
- **JSX**: `react-jsx` (no necesita importar React en cada fichero).

### `tsconfig.app.json`

Extiende `tsconfig.base.json` con configuración específica de Astro.

---

## Astro (`astro.config.ts`)

```typescript
export default defineConfig({
  output: 'server', // SSR (no static)
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(), // soporte React islands
    tailwind(), // Tailwind CSS 4
  ],
  vite: {
    plugins: [tsconfigPaths()], // resolución de @/* aliases
  },
})
```

---

## Configuración de modelos (UI)

La configuración de modelos se gestiona en la página `/settings`:

### Runtimes disponibles

| Runtime | Descripción                     | Uso recomendado                 |
| ------- | ------------------------------- | ------------------------------- |
| `small` | Modelos 0.5b–1.5b               | Hardware muy limitado (4GB RAM) |
| `local` | Modelos 3b–7b                   | Hardware estándar (8–16GB RAM)  |
| `cloud` | APIs cloud (OpenAI, Anthropic…) | Sin Ollama, máxima calidad      |

### Modelos por defecto (runtime `local`)

| Tarea              | Modelo por defecto |
| ------------------ | ------------------ |
| `explain`          | `qwen2.5:7b`       |
| `test`             | `qwen2.5:7b`       |
| `refactor`         | `qwen2.5:7b`       |
| `commit`           | `qwen2.5:1.5b`     |
| `docstring`        | `qwen2.5:3b`       |
| `type-hints`       | `qwen2.5:3b`       |
| `error-explain`    | `qwen2.5:7b`       |
| `performance-hint` | `qwen2.5:7b`       |
| `naming-helper`    | `qwen2.5:1.5b`     |
| `dead-code`        | `qwen2.5:3b`       |
| `analyst`          | `qwen2.5:0.5b`     |

### Persistencia de configuración

- Se guarda en `localStorage` (key: `slm-router-model-config`) y IndexedDB.
- Solo se almacenan los valores que difieren del default (diff-based).
- Se puede resetear a defaults desde la UI de Settings.

---

## Linting y formato

### oxlint

Linter rápido (Rust):

```json
// .oxlintrc.json
{
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "eqeqeq": "error"
  }
}
```

### oxfmt

Formateador de código (Rust):

```json
// .oxfmtrc.json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "all"
}
```

### Pre-commit hooks (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["oxlint --fix", "oxfmt --write"]
  }
}
```

Se ejecutan automáticamente en cada `git commit`.

---

## Knip — Detección de código muerto

```json
// knip.json
{
  "entry": ["src/pages/**/*.astro", "src/pages/**/*.ts"],
  "ignore": ["src/__tests__/**"],
  "ignoreDependencies": ["@types/*"]
}
```

Detecta:

- Exports no usados
- Ficheros no importados
- Dependencias en `package.json` no utilizadas

Ejecutar con: `npx knip`

---

## Docker

### `Dockerfile`

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
ENV HOST=0.0.0.0 PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - '4321:4321'
    environment:
      - PUBLIC_OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama
    ports:
      - '11434:11434'
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

Con Docker Compose, Ollama y la app se levantan juntos y se comunican en la red interna de Docker.

---

## Scripts disponibles (`package.json`)

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "oxlint src/",
    "format": "oxfmt src/",
    "check": "astro check",
    "knip": "knip"
  }
}
```

El comando que usa CI/CD es `npm test && npm run lint` (definido en CLAUDE.md).
