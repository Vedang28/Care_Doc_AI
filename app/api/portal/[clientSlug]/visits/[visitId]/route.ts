import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientSlug: string; visitId: string } },
) {
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

  const visit = await db.visit.findFirst({
    where: { id: params.visitId, clientId: contact.clientId, status: 'SUBMITTED' },
    include: {
      report: {
        select: { id: true, flags: true, familySummary: true, createdAt: true },
      },
      tasks: { select: { category: true, completed: true } },
    },
  })

  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Family-safe format — no raw report text, no caregiver names, no medication details
  return NextResponse.json({
    id: visit.id,
    checkInAt: visit.checkInAt,
    checkOutAt: visit.checkOutAt,
    durationMinutes: visit.checkOutAt
      ? Math.round((visit.checkOutAt.getTime() - visit.checkInAt.getTime()) / 60000)
      : null,
    familySummary: visit.report?.familySummary ?? null,
    hasFlags: (visit.report?.flags?.length ?? 0) > 0,
    flagCount: visit.report?.flags?.length ?? 0,
    taskCategories: Array.from(new Set(visit.tasks.filter((t) => t.completed).map((t) => t.category))),
    wellbeing:
      !visit.report
        ? 'neutral'
        : visit.report.flags.length === 0
          ? 'good'
          : visit.report.flags.length <= 2
            ? 'neutral'
            : 'concerns',
    clientName: contact.client.name,
  })
}
