import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { checkMarDiscrepancies } from '@/lib/mar/discrepancy-check'
import type { MarOutcome } from '@prisma/client'

export const dynamic = 'force-dynamic'

const VALID_OUTCOMES: MarOutcome[] = [
  'ADMINISTERED',
  'PROMPTED',
  'REFUSED',
  'MISSED',
  'NOT_DUE',
  'STOCK_OUT',
]

export async function POST(request: NextRequest, { params }: { params: { visitId: string } }) {
  const userOrError = await requireAuth('CAREGIVER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const visit = await db.visit.findFirst({
    where: { id: params.visitId, agencyId: user.agencyId },
    select: { id: true, clientId: true, caregiverId: true, status: true },
  })
  if (!visit) return errorResponse('Visit not found', 'NOT_FOUND', 404)
  if (visit.status === 'SUBMITTED') return errorResponse('Visit already submitted', 'ALREADY_SUBMITTED')

  const body = await request.json() as {
    entries: Array<{
      medicationId: string
      outcome: string
      refusalReason?: string
      missedReason?: string
      stockBefore?: number
      stockAfter?: number
      notes?: string
      scheduledTime?: string
    }>
  }

  if (!Array.isArray(body.entries)) {
    return errorResponse('Invalid entries', 'INVALID_BODY')
  }

  for (const entry of body.entries) {
    if (!VALID_OUTCOMES.includes(entry.outcome as MarOutcome)) {
      return errorResponse(`Invalid outcome: ${entry.outcome}`, 'INVALID_OUTCOME')
    }
  }

  // Delete existing entries then recreate (idempotent)
  await db.marEntry.deleteMany({ where: { visitId: params.visitId } })
  await db.marEntry.createMany({
    data: body.entries.map((entry) => ({
      medicationId: entry.medicationId,
      visitId: params.visitId,
      caregiverId: user.id,
      agencyId: user.agencyId,
      outcome: entry.outcome as MarOutcome,
      administeredAt: entry.outcome === 'ADMINISTERED' ? new Date() : null,
      refusalReason: entry.refusalReason ?? null,
      missedReason: entry.missedReason ?? null,
      stockBefore: entry.stockBefore ?? null,
      stockAfter: entry.stockAfter ?? null,
      notes: entry.notes ?? null,
      scheduledTime: entry.scheduledTime ?? null,
    })),
  })

  const { flags, autoIncidentTriggered } = await checkMarDiscrepancies(
    params.visitId,
    user.agencyId,
  ).catch(() => ({ flags: [] as string[], autoIncidentTriggered: false }))

  return NextResponse.json({ success: true, flags, autoIncidentTriggered })
}
