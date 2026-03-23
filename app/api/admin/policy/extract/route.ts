import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  if (mimeType === 'application/pdf') {
    try {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      return result.text
    } catch (err) {
      logger.error('PDF parse failed', err instanceof Error ? err : undefined)
      throw new Error('Could not parse PDF file')
    }
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (err) {
      logger.error('DOCX parse failed', err instanceof Error ? err : undefined)
      throw new Error('Could not parse DOCX file')
    }
  }

  throw new Error('Unsupported file type')
}

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: { buffer?: string; type?: string; filename?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  if (!body.buffer || !body.type) {
    return errorResponse('buffer and type required', 'MISSING_FIELDS')
  }

  const fileBuffer = Buffer.from(body.buffer, 'base64')

  let docText: string
  try {
    docText = await extractTextFromFile(fileBuffer, body.type)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 422 },
    )
  }

  // Truncate to ~40k chars to stay within Claude's context budget
  const truncated = docText.slice(0, 40000)

  const anthropic = new Anthropic()

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system:
        'You are analysing a UK domiciliary care policy document. Return only valid JSON, no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Analyse this care policy document and return a JSON object:
{
  "preferredTerminology": {
    "clientTerm": "service user OR client OR resident OR individual",
    "medicationTerm": "medication OR medicine OR tablets",
    "carePlanTerm": "support plan OR care plan OR person-centred plan"
  },
  "keyPolicies": ["array of key policy points in plain English, max 10 items"],
  "safeguardingProcedures": ["array of key safeguarding steps, max 5 items"],
  "customInstructions": "Additional prompt instructions derived from this policy, max 200 chars"
}

Document:
${truncated}`,
        },
      ],
    })

    const rawText = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    const extract = JSON.parse(rawText)
    return NextResponse.json({ extract })
  } catch (err) {
    logger.error('Policy extraction AI failed', err instanceof Error ? err : undefined)
    return errorResponse('AI extraction failed', 'AI_EXTRACTION_FAILED', 500)
  }
}
