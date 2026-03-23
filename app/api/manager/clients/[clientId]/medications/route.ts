import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    // Verify client belongs to this agency
    const client = await db.client.findFirst({
      where: { id: params.clientId, agencyId: userOrError.agencyId },
      select: { id: true },
    })
    if (!client) {
      return errorResponse('Client not found or access denied', 'NOT_FOUND', 404)
    }

    const medications = await db.medication.findMany({
      where: { clientId: params.clientId, agencyId: userOrError.agencyId },
      orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { marEntries: true } } },
    })

    return NextResponse.json({ medications })
  } catch (error) {
    return errorResponse('Failed to fetch medications', 'FETCH_ERROR', 500, error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON', 400)
  }

  const {
    name,
    dose,
    frequency,
    route,
    prescribedBy,
    startDate,
    endDate,
    notes,
  } = body as {
    name?: string
    dose?: string
    frequency?: string
    route?: string
    prescribedBy?: string
    startDate?: string
    endDate?: string
    notes?: string
  }

  if (!name || !dose || !frequency || !route || !startDate) {
    return errorResponse(
      'Missing required fields: name, dose, frequency, route, startDate',
      'VALIDATION_ERROR',
      400
    )
  }

  try {
    // Verify client belongs to this agency
    const client = await db.client.findFirst({
      where: { id: params.clientId, agencyId: userOrError.agencyId },
      select: { id: true },
    })
    if (!client) {
      return errorResponse('Client not found or access denied', 'NOT_FOUND', 404)
    }

    const medication = await db.medication.create({
      data: {
        clientId: params.clientId,
        agencyId: userOrError.agencyId,
        name,
        dose,
        frequency,
        route,
        prescribedBy: prescribedBy ?? null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ medication }, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to create medication', 'CREATE_ERROR', 500, error)
  }
}
