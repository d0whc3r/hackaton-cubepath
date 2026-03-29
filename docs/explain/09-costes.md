# Cálculo de Costes — SLM Router

## Objetivo

Mostrar al usuario cuánto costaría la misma petición si usara un modelo cloud grande (GPT-4, Claude 3.5, etc.) frente al SLM local, cuantificando el ahorro.

---

## `estimateCost()` — Calculadora

`src/lib/cost/calculator.ts`

```typescript
interface CostEstimate {
  inputTokens: number
  outputTokens: number
  specialistCostUsd: number // coste del SLM local
  largeModelCostUsd: number // coste del modelo cloud más caro comparable
  savingsPct: number // ahorro porcentual
  providerComparisons: ProviderComparison[]
}

interface ProviderComparison {
  provider: string // 'OpenAI GPT-4o', 'Claude 3.5 Sonnet', etc.
  costUsd: number
  inputCostUsd: number
  outputCostUsd: number
}

export function estimateCost(inputChars: number, outputChars: number): CostEstimate
```

---

## Algoritmo de estimación

### 1. Conversión de caracteres a tokens

```typescript
function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4) // heurística: ~4 chars por token
}
```

Esta es la estimación estándar de la industria para inglés/código (varía entre 3–5 chars/token según el tokenizador).

### 2. Coste del SLM local

```typescript
// ~$1 por millón de tokens (estimación para hardware local)
const LOCAL_COST_PER_TOKEN = 0.000_001

const specialistCostUsd = inputTokens * LOCAL_COST_PER_TOKEN + outputTokens * LOCAL_COST_PER_TOKEN
```

El coste local representa el coste de oportunidad del hardware (electricidad, amortización), no un pago real.

### 3. Coste de proveedores cloud

Para cada proveedor definido en `pricing.ts`:

```typescript
const providerCost =
  inputTokens * provider.inputCostPerToken + outputTokens * provider.outputCostPerToken
```

### 4. Ahorro calculado

```typescript
const largeModelCostUsd = Math.max(...providerComparisons.map((p) => p.costUsd))

const savingsPct = Math.round((1 - specialistCostUsd / largeModelCostUsd) * 100)
```

Se usa el **modelo más caro** como referencia para maximizar el ahorro visible.

---

## Datos de precios (`pricing.ts`)

```typescript
interface ProviderPricing {
  provider: string
  model: string
  inputCostPerToken: number // USD por token de input
  outputCostPerToken: number // USD por token de output
}

export const PROVIDER_PRICING: ProviderPricing[] = [
  {
    provider: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    inputCostPerToken: 0.000_005, // $5 / 1M tokens
    outputCostPerToken: 0.000_015, // $15 / 1M tokens
  },
  {
    provider: 'Claude 3.5 Sonnet',
    model: 'claude-3-5-sonnet',
    inputCostPerToken: 0.000_003, // $3 / 1M tokens
    outputCostPerToken: 0.000_015, // $15 / 1M tokens
  },
  // ... más proveedores
]
```

---

## Cuándo se calcula el coste

El coste se calcula al **final del streaming**, cuando ya se conoce la longitud total de input y output:

```typescript
// En runStream(), al terminar:
const cost = estimateCost(
  systemPrompt.length + input.length, // input chars
  accumulatedOutput.length, // output chars
)

emit({ event: 'cost', data: cost })
```

El frontend recibe el evento `cost` SSE y lo añade a la entrada del asistente en el `chat-store`.

---

## `CostBadge` — Componente de UI

`src/components/cost/CostBadge.tsx`

Muestra el ahorro estimado en la burbuja de respuesta del asistente:

```
╔════════════════════════════╗
║  Saved ~98% vs GPT-4o      ║
║  Local: $0.0008             ║
║  Cloud: $0.048              ║
╚════════════════════════════╝
```

- Se muestra solo cuando hay datos de coste disponibles.
- Colapsable para no ocupar espacio innecesario.
- Desglose por proveedor al expandir.

---

## Limitaciones

| Limitación                  | Detalle                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| **Heurística de tokens**    | 4 chars/token es una aproximación; el tokenizador real varía por modelo   |
| **Coste local estimado**    | $1/M tokens es arbitrario; el coste real depende del hardware             |
| **Precios desactualizados** | Los precios de cloud cambian; hay que actualizar `pricing.ts` manualmente |
| **No incluye latencia**     | El ahorro en tiempo de espuesta no se cuantifica                          |

El objetivo del cálculo es **ilustrativo**, no una facturación precisa.
