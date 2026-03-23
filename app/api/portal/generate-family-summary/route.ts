import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('CAREGIVER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const body = await request.json() as { visitId?: string }
  if (!body.visitId) return errorResponse('visitId required', 'VALIDATION_ERROR')

  const visit = await db.visit.findFirst({
    where: { id: body.visitId, agencyId: user.agencyId },
    include: {
      notes: true,
      report: true,
      client: { select: { name: true } },
    },
  })
  if (!visit?.report) return errorResponse('Report not found', 'NOT_FOUND', 404)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ familySummary: null })

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey })

    const firstName = visit.client.name.split(' ')[0] ?? visit.client.name

    const prompt = `Write a 2-sentence, plain-English summary of this care visit for a family member.
Use warm, reassuring language. Do not include clinical terminology or medication names.
Refer to the client by their first name (${firstName}). Focus on what was done and how they were.

Visit notes:
${visit.notes?.careText ?? ''}
${visit.notes?.conditionText ?? ''}
${visit.notes?.responseText ?? ''}

Report flags: ${visit.report.flags.join(', ') || 'None'}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const familySummary =
      response.content[0]?.type === 'text' ? response.content[0].text : null

    if (familySummary) {
      await db.report.update({ where: { id: visit.report.id }, data: { familySummary } })
    }

    return NextResponse.json({ familySummary })
  } catch (err) {
    console.error('[generate-family-summary] Error:', err)
    return NextResponse.json({ familySummary: null })
  }
}
