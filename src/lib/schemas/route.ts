import { z } from 'zod'

export const TaskTypeSchema = z.enum(['explain', 'test', 'refactor', 'commit'])
export type TaskType = z.infer<typeof TaskTypeSchema>

export const RoutingStepNameSchema = z.enum([
  'detecting_language',
  'analyzing_task',
  'selecting_specialist',
  'generating_response',
])
export type RoutingStepName = z.infer<typeof RoutingStepNameSchema>

export const RoutingStepStatusSchema = z.enum(['pending', 'active', 'done', 'error'])
export type RoutingStepStatus = z.infer<typeof RoutingStepStatusSchema>

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
export type ProviderComparison = z.infer<typeof ProviderComparisonSchema>

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

export const RouteRequestSchema = z.object({
  analystModel: z.string().optional(),
  commitModel: z.string().optional(),
  explainModel: z.string().optional(),
  input: z.string().min(1).max(8000),
  ollamaBaseUrl: z.string().optional(),
  refactorModel: z.string().optional(),
  taskType: TaskTypeSchema,
  testModel: z.string().optional(),
})
export type RouteRequest = z.infer<typeof RouteRequestSchema>

export interface AssistantMessage {
  content: string
  routingSteps: RoutingStep[]
  specialist: SpecialistInfo | null
  cost: CostEstimate | null
  status: 'streaming' | 'done' | 'error' | 'interrupted'
  error: string | null
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
