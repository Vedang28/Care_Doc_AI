import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse, getClientIp } from '@/lib/api-helpers'
import { startVisitSchema } from '@/lib/validations/visit'

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = startVisitSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { clientId } = parsed.data

  try {
    // Verify client belongs to this agency
    const client = await db.client.findFirst({
      where: { id: clientId, agencyId: userOrError.agencyId, active: true },
    })
    if (!client) {
      return errorResponse('Client not found', 'NOT_FOUND', 404)
    }

    const visit = await db.visit.create({
      data: {
        clientId,
        caregiverId: userOrError.id,
        agencyId: userOrError.agencyId,
        checkInAt: new Date(),
        status: 'IN_PROGRESS',
      },
    })

    await db.auditLog.create({
      data: {
        agencyId: userOrError.agencyId,
        userId: userOrError.id,
        action: 'VISIT_STARTED',
        entityType: 'Visit',
        entityId: visit.id,
        ipAddress: getClientIp(request),
      },
    })

    return NextResponse.json({ visitId: visit.id }, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to start visit', 'CREATE_ERROR', 500, error)
  }
}
