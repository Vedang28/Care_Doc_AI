import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserMessage } from './prompts'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const client = new Anthropic()

interface PolicyExtract {
  preferredTerminology?: {
    clientTerm?: string
    medicationTerm?: string
    carePlanTerm?: string
  }
  keyPolicies?: string[]
  customInstructions?: string
}

const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  riskAwareness: z.number().min(0).max(100),
  feedback: z.string(),
})

const ReportResponseSchema = z.object({
  report: z.string().min(1),
  flags: z.array(z.string()),
  transformations: z.array(z.string()),
  qualityScore: QualityScoreSchema.optional(),
})

export type QualityScore = z.infer<typeof QualityScoreSchema>
export type ReportResponse = z.infer<typeof ReportResponseSchema>

export interface GenerateReportInput {
  clientName: string
  clientAge?: number
  conditions: string[]
  carePlan: string
  visitDate: string
  checkInTime: string
  checkOutTime: string
  completedTasks: Array<{ taskLabel: string; category: string; note?: string }>
  freeNotes: {
    care: string
    condition: string
    incident: string
    response: string
  }
  agencyPromptOverride?: string
  promptVersion?: string
  policyExtract?: PolicyExtract
}

export async function generateVisitReport(input: GenerateReportInput): Promise<ReportResponse> {
  const systemPrompt = buildSystemPrompt(input.agencyPromptOverride, input.policyExtract)
  const userMessage = buildUserMessage(input)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    const parsed = JSON.parse(rawText)
    return ReportResponseSchema.parse(parsed)
  } catch (error) {
    logger.error('AI report generation failed', error instanceof Error ? error : undefined, {
      clientName: input.clientName,
    })

    // Fallback: preserve raw notes, flag for manual review
    const rawNotes = [
      input.freeNotes.care && `Care provided: ${input.freeNotes.care}`,
      input.freeNotes.condition && `Condition changes: ${input.freeNotes.condition}`,
      input.freeNotes.incident && `Incidents/concerns: ${input.freeNotes.incident}`,
      input.freeNotes.response && `Client response: ${input.freeNotes.response}`,
    ]
      .filter(Boolean)
      .join('\n')

    const taskSummary = input.completedTasks
      .map((t) => `• ${t.taskLabel}${t.note ? ` — ${t.note}` : ''}`)
      .join('\n')

    return {
      report: `Visit report for ${input.clientName} — ${input.visitDate}\n\nTasks completed:\n${taskSummary || 'None recorded'}\n\nCaregiver notes:\n${rawNotes || 'No notes provided'}\n\n[Note: AI processing was unavailable. This report requires manual review and formatting.]`,
      flags: ['AI processing failed — manual review required'],
      transformations: [],
    }
  }
}
