import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/api-helpers'
import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are assisting a UK domiciliary caregiver with documentation.
The caregiver is filling in a visit note. Based on what they've written,
suggest ONE brief addition that would improve documentation quality.

Rules:
- Maximum 1 sentence
- Frame as a gentle question or prompt, not a command
- Be specific to the context (client's conditions + field type)
- If the note is already complete and specific, respond with: null
- Never invent clinical facts

Response format: plain text string, or the word "null" if no suggestion needed.`

const FIELD_PROMPTS: Record<string, string> = {
  care: "Consider whether you've mentioned: specific personal care tasks, use of equipment, any adaptations needed",
  condition:
    "Consider whether you've noted: comparison to baseline, any physical symptoms, mental state, skin condition",
  incident:
    "Consider whether you've documented: time of incident, immediate response, who was informed, any injuries",
  response:
    "Consider whether you've captured: the client's mood, engagement level, any verbal responses, preferences expressed",
}

interface SuggestBody {
  fieldKey: string
  currentValue: string
  clientContext: {
    name: string
    conditions: string[]
  }
}

export async function POST(request: NextRequest) {
  // Auth — minimum CAREGIVER role (allows all roles above too)
  const userOrError = await requireAuth('CAREGIVER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  // Bail early if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ suggestion: null })
  }

  // Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ suggestion: null })
  }

  const { fieldKey, currentValue, clientContext } = body as SuggestBody

  if (!fieldKey || typeof currentValue !== 'string' || !clientContext) {
    return NextResponse.json({ suggestion: null })
  }

  // Rate limiting via Upstash Redis — gracefully skip if not configured
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? ''
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

    // Only attempt rate limiting if credentials look real (not placeholders)
    if (redisUrl && !redisUrl.includes('your_') && !redisUrl.includes('[FILL]')) {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      const hourKey = Math.floor(Date.now() / 3600000)
      const rateLimitKey = `suggest:ratelimit:${user.id}:${hourKey}`
      const calls = await redis.incr(rateLimitKey)
      if (calls === 1) await redis.expire(rateLimitKey, 3600)
      if (calls > 30) {
        return NextResponse.json({ suggestion: null })
      }
    }
  } catch {
    // Redis unavailable — proceed without rate limiting
  }

  // Build user message
  const fieldSpecificPrompt =
    FIELD_PROMPTS[fieldKey] ??
    "Consider whether you've included all relevant details for this field"

  const userMessage = `Client: ${clientContext.name}
Conditions: ${clientContext.conditions.join(', ') || 'None recorded'}
Field: ${fieldKey}
Current note: ${currentValue}

${fieldSpecificPrompt}`

  // Call Claude Haiku
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Extract text from response
    const firstBlock = message.content[0]
    const rawText =
      firstBlock?.type === 'text' ? firstBlock.text.trim() : ''

    // Return null if AI explicitly says "null" or response is empty
    if (!rawText || rawText.toLowerCase() === 'null') {
      return NextResponse.json({ suggestion: null })
    }

    return NextResponse.json({ suggestion: rawText })
  } catch {
    return NextResponse.json({ suggestion: null })
  }
}
