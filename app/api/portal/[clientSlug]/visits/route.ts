import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientSlug: string } },
) {
  // Family portal auth: token = base64-encoded contactId
  // TODO: Replace with NextAuth Email provider session in production
  const token = request.nextUrl.searchParams.get('token')
  let contactId: string | null = null
  if (token) {
    try {
      contactId = Buffer.from(token, 'base64').toString('utf8')
    } catch {
      /* ignore */
    }
  }

  const contact = contactId
    ? await db.familyContact.findFirst({
        where: { id: contactId, active: true, consentGiven: true },
        include: { client: { select: { id: true, name: true, portalSlug: true } } },
      })
    : null

  if (!contact) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (contact.client.portalSlug !== params.clientSlug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const visits = await db.visit.findMany({
    where: { clientId: contact.clientId, status: 'SUBMITTED' },
    orderBy: { checkInAt: 'desc' },
    take: 20,
    include: {
      report: { select: { id: true, flags: true, familySummary: true, createdAt: true } },
      tasks: { select: { category: true, completed: true } },
    },
  })

  const familyVisits = visits.map((v) => ({
    id: v.id,
    checkInAt: v.checkInAt,
    checkOutAt: v.checkOutAt,
    durationMinutes: v.checkOutAt
      ? Math.round((v.checkOutAt.getTime() - v.checkInAt.getTime()) / 60000)
      : null,
    familySummary: v.report?.familySummary ?? null,
    hasFlags: (v.report?.flags?.length ?? 0) > 0,
    flagCount: v.report?.flags?.length ?? 0,
    taskCategories: Array.from(new Set(v.tasks.filter((t) => t.completed).map((t) => t.category))),
    wellbeing:
      !v.report
        ? 'neutral'
        : v.report.flags.length === 0
          ? 'good'
          : v.report.flags.length <= 2
            ? 'neutral'
            : 'concerns',
    reportId: v.report?.id ?? null,
  }))

  return NextResponse.json({ client: contact.client, visits: familyVisits })
}
