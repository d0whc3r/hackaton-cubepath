import type { RoutingDecision, SpecialistConfig, SpecialistTaskType } from './types'
import { fallbackAnalysis, runAnalyst } from './analyst'

export function route(
  taskType: SpecialistTaskType,
  input: string,
  specialists: Record<SpecialistTaskType, SpecialistConfig>,
): RoutingDecision {
  const codeContext = fallbackAnalysis(input)
  const specialist = specialists[taskType]
  const systemPrompt = specialist.buildSystemPrompt(codeContext, input)

  return {
    codeContext,
    detectedLanguage: { confidence: codeContext.confidence, language: codeContext.language },
    routingReason: `${taskType} → ${specialist.displayName}`,
    specialist,
    systemPrompt,
  }
}

export async function routeWithAnalyst(
  taskType: SpecialistTaskType,
  input: string,
  specialists: Record<SpecialistTaskType, SpecialistConfig>,
  analystModelId: string,
  baseUrl: string,
): Promise<RoutingDecision> {
  // oxlint-disable-next-line init-declarations
  let codeContext

  try {
    codeContext = await runAnalyst(input, taskType, analystModelId, baseUrl)
  } catch {
    // Analyst unavailable or timed out; regex fallback keeps routing working
    codeContext = fallbackAnalysis(input)
  }

  const specialist = specialists[taskType]
  const systemPrompt = specialist.buildSystemPrompt(codeContext, input)

  return {
    codeContext,
    detectedLanguage: { confidence: codeContext.confidence, language: codeContext.language },
    routingReason: `${taskType} → ${specialist.displayName}`,
    specialist,
    systemPrompt,
  }
}
