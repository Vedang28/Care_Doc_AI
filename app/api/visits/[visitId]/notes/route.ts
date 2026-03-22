import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { saveNotesSchema } from '@/lib/validations/visit'

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  const { visitId } = params

  const visit = await db.visit.findFirst({
    where: { id: visitId, caregiverId: userOrError.id },
  })
  if (!visit) {
    return errorResponse('Visit not found or access denied', 'NOT_FOUND', 404)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = saveNotesSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    await db.visitNotes.upsert({
      where: { visitId },
      create: {
        visitId,
        careText: parsed.data.care,
        conditionText: parsed.data.condition,
        incidentText: parsed.data.incident,
        responseText: parsed.data.response,
      },
      update: {
        careText: parsed.data.care,
        conditionText: parsed.data.condition,
        incidentText: parsed.data.incident,
        responseText: parsed.data.response,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('Failed to save notes', 'SAVE_ERROR', 500, error)
  }
}
