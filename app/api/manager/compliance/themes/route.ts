import { NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Lazy-init Redis to avoid crash when env vars are placeholders
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || url === 'placeholder' || !token || token === 'placeholder') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis')
    return new Redis({ url, token })
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: { dateFrom?: string; dateTo?: string }
  try {
    body = await request.json() as { dateFrom?: string; dateTo?: string }
  } catch {
    body = {}
  }

  const dateTo = body.dateTo ? new Date(body.dateTo) : new Date()
  const dateFrom = body.dateFrom ? new Date(body.dateFrom) : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000)

  const cacheKey = `themes:${userOrError.agencyId}:${dateFrom.toISOString().split('T')[0]}:${dateTo.toISOString().split('T')[0]}`
  const redis = getRedis()

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached)
    } catch (err) {
      logger.error('Redis cache read failed', err instanceof Error ? err : undefined)
    }
  }

  try {
    // Fetch reports
    const reports = await db.report.findMany({
      where: {
        agencyId: userOrError.agencyId,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { reportText: true, flags: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (reports.length < 3) {
      return NextResponse.json({
        themes: [],
        topConcerns: [],
        positivePatterns: [],
        message: 'Not enough reports yet. Complete at least 3 visits to see themes.',
      })
    }

    const combinedText = reports
      .map((r, i) => `Report ${i + 1}:\n${r.reportText}\nFlags: ${r.flags.join(', ') || 'None'}`)
      .join('\n\n---\n\n')
      .slice(0, 60000) // Keep within token limits

    const anthropic = new Anthropic()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'You are analysing domiciliary care visit reports for a UK care agency. Return only valid JSON, no markdown.',
      messages: [{
        role: 'user',
        content: `Analyse these domiciliary care visit reports and return a JSON object:
{
  "themes": [
    { "theme": "string", "frequency": number, "sentiment": "concern|positive|neutral", "example": "brief quote max 80 chars" }
  ],
  "topConcerns": ["string", "string", "string"],
  "positivePatterns": ["string", "string"]
}

Limit to max 8 themes. Keep theme names short (2-4 words).

Reports to analyse:
${combinedText}`,
      }],
    })

    const rawText = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    const themes = JSON.parse(rawText)

    // Cache for 6 hours
    if (redis) {
      try {
        await redis.set(cacheKey, themes, { ex: 6 * 60 * 60 })
      } catch (err) {
        logger.error('Redis cache write failed', err instanceof Error ? err : undefined)
      }
    }

    return NextResponse.json(themes)
  } catch (err) {
    logger.error('Theme extraction failed', err instanceof Error ? err : undefined)
    return errorResponse('AI processing failed', 'THEME_EXTRACTION_ERROR', 500, err)
  }
}
