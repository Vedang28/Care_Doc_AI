import { db } from '@/lib/db'

export interface ComplianceSubScore {
  label: string
  score: number
  weight: number
  description: string
}

export interface ComplianceScore {
  overall: number
  completionRate: number
  flagResolutionRate: number
  documentationQuality: number
  caregiverSignOffRate: number
  trend: 'improving' | 'stable' | 'declining'
  breakdown: ComplianceSubScore[]
}

export interface DailyScore {
  date: string  // YYYY-MM-DD
  score: number
}

export async function calculateComplianceScore(
  agencyId: string,
  days = 30
): Promise<{ score: ComplianceScore; history: DailyScore[] }> {
  const now = new Date()
  const fromDate = new Date(now)
  fromDate.setDate(fromDate.getDate() - days)
  const prevFromDate = new Date(fromDate)
  prevFromDate.setDate(prevFromDate.getDate() - days)

  // Fetch all needed data in parallel
  const [visits, reports, signatures, incidents] = await Promise.all([
    // All completed visits in window
    db.visit.findMany({
      where: {
        agencyId,
        status: { in: ['SUBMITTED', 'PENDING_REVIEW'] },
        checkInAt: { gte: fromDate },
      },
      select: { id: true, checkInAt: true },
    }),
    // All reports in window
    db.report.findMany({
      where: {
        agencyId,
        createdAt: { gte: fromDate },
      },
      select: {
        id: true,
        qualityScoreOverall: true,
        status: true,
        createdAt: true,
        visitId: true,
      },
    }),
    // Signatures in window
    db.signature.findMany({
      where: {
        report: { agencyId, createdAt: { gte: fromDate } },
      },
      select: { reportId: true },
    }),
    // Incidents in window
    db.incident.findMany({
      where: {
        agencyId,
        createdAt: { gte: fromDate },
      },
      select: { id: true, createdAt: true, resolvedAt: true },
    }),
  ])

  // 1. Completion Rate: submitted reports / completed visits
  const completionRate = visits.length === 0
    ? 100
    : Math.round((reports.length / visits.length) * 100)

  // 2. Flag Resolution Rate: incidents resolved within 72h / total
  const flagResolutionRate = incidents.length === 0
    ? 100
    : Math.round(
        (incidents.filter((i) => {
          if (!i.resolvedAt) return false
          const hoursToResolve = (i.resolvedAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60)
          return hoursToResolve <= 72
        }).length / incidents.length) * 100
      )

  // 3. Documentation Quality: average qualityScoreOverall
  const scoredReports = reports.filter((r) => r.qualityScoreOverall !== null)
  const documentationQuality = scoredReports.length === 0
    ? 75  // default until enough data
    : Math.round(
        scoredReports.reduce((sum, r) => sum + (r.qualityScoreOverall ?? 0), 0) / scoredReports.length
      )

  // 4. Caregiver Sign-off Rate
  const signedReportIds = new Set(signatures.map((s) => s.reportId))
  const caregiverSignOffRate = reports.length === 0
    ? 100
    : Math.round((signedReportIds.size / reports.length) * 100)

  // Weighted overall
  const overall = Math.round(
    completionRate * 0.35 +
    documentationQuality * 0.30 +
    caregiverSignOffRate * 0.20 +
    flagResolutionRate * 0.15
  )

  // Previous period for trend
  const prevReports = await db.report.findMany({
    where: {
      agencyId,
      createdAt: { gte: prevFromDate, lt: fromDate },
    },
    select: { qualityScoreOverall: true },
  })
  const prevVisits = await db.visit.count({
    where: {
      agencyId,
      status: { in: ['SUBMITTED', 'PENDING_REVIEW'] },
      checkInAt: { gte: prevFromDate, lt: fromDate },
    },
  })
  const prevSigs = await db.signature.count({
    where: { report: { agencyId, createdAt: { gte: prevFromDate, lt: fromDate } } },
  })
  const prevCompletionRate = prevVisits === 0 ? 100 : Math.round((prevReports.length / prevVisits) * 100)
  const prevScoredReports = prevReports.filter(r => r.qualityScoreOverall !== null)
  const prevQuality = prevScoredReports.length === 0
    ? 75
    : Math.round(prevScoredReports.reduce((s, r) => s + (r.qualityScoreOverall ?? 0), 0) / prevScoredReports.length)
  const prevSignOff = prevReports.length === 0 ? 100 : Math.round((prevSigs / prevReports.length) * 100)
  const prevOverall = Math.round(prevCompletionRate * 0.35 + prevQuality * 0.30 + prevSignOff * 0.20 + 100 * 0.15)

  const trend: ComplianceScore['trend'] =
    overall > prevOverall + 3 ? 'improving' :
    overall < prevOverall - 3 ? 'declining' : 'stable'

  const score: ComplianceScore = {
    overall: Math.min(100, Math.max(0, overall)),
    completionRate: Math.min(100, completionRate),
    flagResolutionRate: Math.min(100, flagResolutionRate),
    documentationQuality: Math.min(100, documentationQuality),
    caregiverSignOffRate: Math.min(100, caregiverSignOffRate),
    trend,
    breakdown: [
      { label: 'Completion Rate', score: completionRate, weight: 35, description: 'Reports submitted vs visits completed' },
      { label: 'Documentation Quality', score: documentationQuality, weight: 30, description: 'Average AI quality score' },
      { label: 'Caregiver Sign-off', score: caregiverSignOffRate, weight: 20, description: 'Reports with digital signature' },
      { label: 'Flag Resolution', score: flagResolutionRate, weight: 15, description: 'Flags resolved within 72 hours' },
    ],
  }

  // Daily history for chart: group reports by day
  const history: DailyScore[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    const dayStr = day.toISOString().split('T')[0]
    const dayStart = new Date(dayStr)
    const dayEnd = new Date(dayStr)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayReports = reports.filter(
      (r) => r.createdAt >= dayStart && r.createdAt < dayEnd
    )
    if (dayReports.length === 0) {
      // Use rolling score for empty days
      history.push({ date: dayStr, score: history.length > 0 ? history[history.length - 1].score : overall })
    } else {
      const dayQuality = dayReports.filter(r => r.qualityScoreOverall !== null).length > 0
        ? Math.round(dayReports.reduce((s, r) => s + (r.qualityScoreOverall ?? 75), 0) / dayReports.length)
        : 75
      history.push({ date: dayStr, score: Math.min(100, dayQuality) })
    }
  }

  return { score, history }
}

export async function getClientRiskOverview(agencyId: string, days = 30) {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const clients = await db.client.findMany({
    where: { agencyId, active: true },
    select: {
      id: true,
      name: true,
      visitFrequencyDays: true,
      visits: {
        where: { checkInAt: { gte: fromDate } },
        select: {
          id: true,
          checkInAt: true,
          report: {
            select: {
              flags: true,
              incidents: { select: { resolvedAt: true, severity: true } }, // relation added in schema chunk 1
            },
          },
        },
        orderBy: { checkInAt: 'desc' },
      },
    },
  })

  const now = new Date()

  return clients.map((client) => {
    const lastVisit = client.visits[0]?.checkInAt ?? null
    const daysSinceVisit = lastVisit
      ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const flagCount = client.visits.reduce(
      (sum, v) => sum + (v.report?.flags.length ?? 0), 0
    )
    const hasUnresolvedCritical = client.visits.some((v) =>
      v.report?.incidents.some(
        (i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && !i.resolvedAt
      )
    )

    const isOverdue = daysSinceVisit > (client.visitFrequencyDays ?? 1)

    const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
      flagCount >= 3 || hasUnresolvedCritical ? 'HIGH' :
      flagCount >= 1 || daysSinceVisit > 7 ? 'MEDIUM' : 'LOW'

    return {
      id: client.id,
      name: client.name,
      lastVisitAt: lastVisit,
      flagCount,
      riskLevel,
      isOverdue,
    }
  })
}
