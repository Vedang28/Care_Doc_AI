import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { visitId: string } }) {
  const userOrError = await requireAuth('CAREGIVER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const visit = await db.visit.findFirst({
    where: { id: params.visitId, agencyId: user.agencyId },
    select: { clientId: true, caregiverId: true },
  })
  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const medications = await db.medication.findMany({
    where: { clientId: visit.clientId, agencyId: user.agencyId, active: true },
    orderBy: { name: 'asc' },
  })

  const existingEntries = await db.marEntry.findMany({
    where: { visitId: params.visitId },
    select: {
      id: true,
      medicationId: true,
      outcome: true,
      refusalReason: true,
      missedReason: true,
      stockBefore: true,
      stockAfter: true,
      notes: true,
    },
  })

  return NextResponse.json({ medications, existingEntries })
}
