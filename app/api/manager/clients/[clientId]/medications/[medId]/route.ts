import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { clientId: string; medId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const medication = await db.medication.findFirst({
      where: {
        id: params.medId,
        clientId: params.clientId,
        agencyId: userOrError.agencyId,
      },
      include: { _count: { select: { marEntries: true } } },
    })

    if (!medication) {
      return errorResponse('Medication not found or access denied', 'NOT_FOUND', 404)
    }

    return NextResponse.json({ medication })
  } catch (error) {
    return errorResponse('Failed to fetch medication', 'FETCH_ERROR', 500, error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string; medId: string } }
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
    active,
  } = body as {
    name?: string
    dose?: string
    frequency?: string
    route?: string
    prescribedBy?: string
    startDate?: string
    endDate?: string
    notes?: string
    active?: boolean
  }

  try {
    // Verify medication belongs to this agency before updating
    const existing = await db.medication.findFirst({
      where: {
        id: params.medId,
        clientId: params.clientId,
        agencyId: userOrError.agencyId,
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('Medication not found or access denied', 'NOT_FOUND', 404)
    }

    // Build partial update — only include fields present in body
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (dose !== undefined) data.dose = dose
    if (frequency !== undefined) data.frequency = frequency
    if (route !== undefined) data.route = route
    if (prescribedBy !== undefined) data.prescribedBy = prescribedBy
    if (startDate !== undefined) data.startDate = new Date(startDate)
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (notes !== undefined) data.notes = notes
    if (active !== undefined) data.active = active

    const medication = await db.medication.update({
      where: { id: params.medId },
      data,
    })

    return NextResponse.json({ medication })
  } catch (error) {
    return errorResponse('Failed to update medication', 'UPDATE_ERROR', 500, error)
  }
}
