import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.scopes.includes('reports:read')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  const report = await db.report.findFirst({
    where: { id: params.id, agencyId: ctx.agencyId },
    select: {
      id: true,
      visitId: true,
      agencyId: true,
      reportText: true,
      flags: true,
      transformations: true,
      aiModel: true,
      promptVersion: true,
      status: true,
      qualityScoreOverall: true,
      qualityCompleteness: true,
      qualitySpecificity: true,
      qualityRiskAwareness: true,
      qualityFeedback: true,
      familySummary: true,
      createdAt: true,
      updatedAt: true,
      visit: {
        select: {
          checkInAt: true,
          checkOutAt: true,
          client: {
            select: { name: true },
          },
        },
      },
    },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json({ report })
}
