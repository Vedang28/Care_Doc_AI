import { db } from '@/lib/db'

export interface AiCallParams {
  agencyId: string
  model: string
  inputTokens: number
  outputTokens: number
  endpoint: string
  latencyMs: number
}

// Approximate cost per token in USD
const COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.00000025, output: 0.00000125 },
  'claude-sonnet-4-6':         { input: 0.000003,   output: 0.000015 },
  'claude-opus-4-6':           { input: 0.000015,   output: 0.000075 },
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_TOKEN[model] ?? COST_PER_TOKEN['claude-haiku-4-5-20251001']!
  return rates.input * inputTokens + rates.output * outputTokens
}

export async function logAiCall(params: AiCallParams): Promise<void> {
  try {
    await db.aiUsageLog.create({ data: params })
  } catch (err) {
    // Non-blocking — never crash the main flow
    console.error('[cost-tracker] Failed to log AI call:', err)
  }
}

export async function getMonthlyUsage(agencyId: string): Promise<{
  totalCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  estimatedCostUsd: number
}> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const logs = await db.aiUsageLog.findMany({
    where: {
      agencyId,
      createdAt: { gte: startOfMonth },
    },
    select: { model: true, inputTokens: true, outputTokens: true },
  })

  const totalInputTokens = logs.reduce((sum, l) => sum + l.inputTokens, 0)
  const totalOutputTokens = logs.reduce((sum, l) => sum + l.outputTokens, 0)
  const estimatedCostUsd = logs.reduce(
    (sum, l) => sum + estimateCost(l.model, l.inputTokens, l.outputTokens),
    0,
  )

  return {
    totalCalls: logs.length,
    totalInputTokens,
    totalOutputTokens,
    estimatedCostUsd,
  }
}
