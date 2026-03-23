import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { notifyAdminsOfCriticalIncident } from '@/lib/incidents'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CreateIncidentSchema = z.object({
  reportId: z.string().uuid(),
  clientId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  actionsTaken: z.string().optional(),
  followUpDate: z.string().datetime({ offset: true }).optional().nullable(),
  safeguardingCategory: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const { searchParams } = request.nextUrl
  const filter = searchParams.get('filter') ?? 'all' // all | open | resolved | escalated

  const where: Record<string, unknown> = { agencyId: userOrError.agencyId }
  if (filter === 'open') where.resolvedAt = null
  if (filter === 'resolved') where.resolvedAt = { not: null }
  if (filter === 'escalated') where.escalated = true

  try {
    const incidents = await db.incident.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        caregiver: { select: { id: true, name: true } },
        report: { select: { id: true, flags: true } },
      },
      orderBy: [
        { resolvedAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'desc' },
      ],
    })

    const now = new Date()

    return NextResponse.json(
      incidents.map((i) => ({
        id: i.id,
        reportId: i.reportId,
        severity: i.severity,
        title: i.title,
        description: i.description,
        actionsTaken: i.actionsTaken,
        followUpDate: i.followUpDate,
        resolvedAt: i.resolvedAt,
        resolvedBy: i.resolvedBy,
        escalated: i.escalated,
        escalatedAt: i.escalatedAt,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        client: i.client,
        caregiver: i.caregiver,
        reportFlags: i.report.flags,
        isOverdue:
          !i.resolvedAt &&
          i.followUpDate !== null &&
          i.followUpDate !== undefined &&
          i.followUpDate < now,
      }))
    )
  } catch (error) {
    return errorResponse('Failed to fetch incidents', 'FETCH_ERROR', 500, error)
  }
}

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON', 400)
  }

  const parsed = CreateIncidentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const {
    reportId,
    clientId,
    caregiverId,
    severity,
    title,
    description,
    actionsTaken,
    followUpDate,
    safeguardingCategory,
  } = parsed.data

  try {
    // Verify all entities belong to this agency
    const [report, client, caregiver] = await Promise.all([
      db.report.findFirst({ where: { id: reportId, agencyId: userOrError.agencyId } }),
      db.client.findFirst({ where: { id: clientId, agencyId: userOrError.agencyId } }),
      db.user.findFirst({ where: { id: caregiverId, agencyId: userOrError.agencyId } }),
    ])

    if (!report) return errorResponse('Report not found or access denied', 'NOT_FOUND', 404)
    if (!client) return errorResponse('Client not found or access denied', 'NOT_FOUND', 404)
    if (!caregiver) return errorResponse('Caregiver not found or access denied', 'NOT_FOUND', 404)

    const incident = await db.incident.create({
      data: {
        reportId,
        agencyId: userOrError.agencyId,
        clientId,
        caregiverId,
        severity,
        title,
        description,
        actionsTaken,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: {
        client: { select: { name: true } },
        caregiver: { select: { name: true } },
      },
    })

    await db.auditLog.create({
      data: {
        agencyId: userOrError.agencyId,
        userId: userOrError.id,
        action: 'INCIDENT_CREATED',
        entityType: 'Incident',
        entityId: incident.id,
        after: { severity, title, clientId },
      },
    })

    // Notify admins immediately for HIGH/CRITICAL severity
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      notifyAdminsOfCriticalIncident({
        agencyId: userOrError.agencyId,
        incidentId: incident.id,
        title,
        description,
        clientName: client.name,
        caregiverName: caregiver.name,
        severity,
        safeguardingCategory,
      }).catch(console.error)
    }

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to create incident', 'CREATE_ERROR', 500, error)
  }
}
