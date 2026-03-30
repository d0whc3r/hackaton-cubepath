import { z } from 'zod'

export const TaskTypeSchema = z.enum([
  'explain',
  'test',
  'refactor',
  'commit',
  'docstring',
  'type-hints',
  'error-explain',
  'performance-hint',
  'naming-helper',
  'dead-code',
])
export type TaskType = z.infer<typeof TaskTypeSchema>

export const RoutingStepNameSchema = z.enum([
  'detecting_language',
  'analyzing_task',
  'selecting_specialist',
  'generating_response',
])
export type RoutingStepName = z.infer<typeof RoutingStepNameSchema>

export const RoutingStepStatusSchema = z.enum(['pending', 'active', 'done', 'error'])

export const RoutingStepSchema = z.object({
  detail: z.string().optional(),
  label: z.string(),
  status: RoutingStepStatusSchema,
  step: RoutingStepNameSchema,
})
export type RoutingStep = z.infer<typeof RoutingStepSchema>

export const ProviderComparisonSchema = z.object({
  costUsd: z.number(),
  modelId: z.string(),
  modelLabel: z.string(),
  providerId: z.string(),
  providerLabel: z.string(),
})

export const CostEstimateSchema = z.object({
  inputTokens: z.number(),
  largeModelCostUsd: z.number(),
  outputTokens: z.number(),
  providerComparisons: z.array(ProviderComparisonSchema).optional(),
  savingsPct: z.number(),
  specialistCostUsd: z.number(),
})
export type CostEstimate = z.infer<typeof CostEstimateSchema>

export const SpecialistInfoSchema = z.object({
  displayName: z.string(),
  language: z.string(),
  modelId: z.string().optional(),
  reason: z.string().optional(),
  specialistId: z.string(),
})
export type SpecialistInfo = z.infer<typeof SpecialistInfoSchema>

/** Validates a model ID: alphanumeric, dots, dashes, colons, slashes, at-signs. Max 100 chars. */
const ModelIdSchema = z
  .string()
  .regex(/^\w[\w.\-:/@]{0,99}$/, 'Invalid model ID format')
  .optional()

export const RouteRequestSchema = z.object({
  analystModel: ModelIdSchema,
  commitModel: ModelIdSchema,
  deadCodeModel: ModelIdSchema,
  docstringModel: ModelIdSchema,
  errorExplainModel: ModelIdSchema,
  explainModel: ModelIdSchema,
  input: z.string().min(1).max(15_000),
  namingHelperModel: ModelIdSchema,
  ollamaBaseUrl: z.url().optional(),
  performanceHintModel: ModelIdSchema,
  refactorModel: ModelIdSchema,
  taskType: TaskTypeSchema,
  testModel: ModelIdSchema,
  typeHintsModel: ModelIdSchema,
})
export type RouteRequest = z.infer<typeof RouteRequestSchema>

export interface AssistantMessage {
  blockReason: string | null
  content: string
  cost: CostEstimate | null
  error: string | null
  errorCode: string | null
  routingSteps: RoutingStep[]
  specialist: SpecialistInfo | null
  status: 'streaming' | 'done' | 'error' | 'interrupted' | 'blocked'
}

export interface UserMessage {
  content: string
  taskType: TaskType
  fileName?: string
  timestamp: Date
}

export interface ConversationEntry {
  id: string
  userMessage: UserMessage
  assistantMessage: AssistantMessage
}
