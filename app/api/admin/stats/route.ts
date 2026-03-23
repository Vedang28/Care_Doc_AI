import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalAgencies,
      activeAgencies,
      reportsToday,
      activeVisits,
      flaggedReports,
    ] = await db.$transaction([
      db.agency.count(),
      db.agency.count({ where: { active: true } }),
      db.report.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      db.visit.count({ where: { status: 'IN_PROGRESS' } }),
      db.report.count({ where: { NOT: { flags: { isEmpty: true } }, status: 'FLAGGED' } }),
    ])

    return NextResponse.json({
      totalAgencies,
      activeAgencies,
      reportsToday,
      activeVisits,
      flaggedReports,
    })
  } catch (error) {
    return errorResponse('Failed to fetch stats', 'FETCH_ERROR', 500, error)
  }
}
