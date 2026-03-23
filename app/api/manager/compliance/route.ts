import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { calculateComplianceScore, getClientRiskOverview } from '@/lib/compliance/score'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const { searchParams } = request.nextUrl
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30', 10)))

  try {
    const [{ score, history }, clientRisk, caregivers] = await Promise.all([
      calculateComplianceScore(userOrError.agencyId, days),
      getClientRiskOverview(userOrError.agencyId, days),
      // Caregiver performance summary
      db.user.findMany({
        where: { agencyId: userOrError.agencyId, role: { in: ['CAREGIVER', 'SENIOR_CARER'] } },
        select: {
          id: true,
          name: true,
          visits: {
            where: {
              checkInAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
              status: { in: ['SUBMITTED', 'PENDING_REVIEW'] },
            },
            select: {
              id: true,
              report: {
                select: {
                  qualityScoreOverall: true,
                  flags: true,
                  incidents: { select: { id: true } },
                },
              },
            },
          },
          _count: { select: { visits: true } },
        },
      }),
    ])

    const caregiverSummary = caregivers.map((cg) => {
      const submittedVisits = cg.visits
      const reportsWithScore = submittedVisits.filter((v) => v.report?.qualityScoreOverall != null)
      const avgQuality = reportsWithScore.length > 0
        ? Math.round(reportsWithScore.reduce((s, v) => s + (v.report?.qualityScoreOverall ?? 0), 0) / reportsWithScore.length)
        : null
      const totalFlags = submittedVisits.reduce((s, v) => s + (v.report?.flags.length ?? 0), 0)

      return {
        id: cg.id,
        name: cg.name,
        reportsSubmitted: submittedVisits.length,
        avgQualityScore: avgQuality,
        flagsRaised: totalFlags,
        lastActive: cg.visits[0] ? 'Recent' : 'No visits',
      }
    })

    return NextResponse.json({
      score,
      history,
      clientRisk,
      caregiverSummary,
    })
  } catch (error) {
    return errorResponse('Failed to calculate compliance score', 'COMPLIANCE_ERROR', 500, error)
  }
}
