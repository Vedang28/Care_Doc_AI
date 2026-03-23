import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { reportId: string } }) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const report = await db.report.findFirst({
    where: { id: params.reportId, agencyId: user.agencyId },
    select: { visitId: true },
  })
  if (!report) return errorResponse('Not found', 'NOT_FOUND', 404)

  const marEntries = await db.marEntry.findMany({
    where: { visitId: report.visitId, agencyId: user.agencyId },
    include: {
      medication: { select: { name: true, dose: true, route: true, frequency: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const discrepancies = await db.marDiscrepancy.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({ marEntries, discrepancies })
}
