import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const UpdateIncidentSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  actionsTaken: z.string().optional(),
  followUpDate: z.string().datetime({ offset: true }).optional().nullable(),
  resolvedAt: z.string().datetime({ offset: true }).optional().nullable(),
  resolutionSummary: z.string().optional(),
  escalated: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const incident = await db.incident.findFirst({
      where: { id: params.id, agencyId: userOrError.agencyId },
      include: {
        client: { select: { id: true, name: true, address: true } },
        caregiver: { select: { id: true, name: true } },
        report: { select: { id: true, flags: true, reportText: true } },
      },
    })

    if (!incident) return errorResponse('Incident not found', 'NOT_FOUND', 404)

    return NextResponse.json(incident)
  } catch (error) {
    return errorResponse('Failed to fetch incident', 'FETCH_ERROR', 500, error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON', 400)
  }

  const parsed = UpdateIncidentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    const incident = await db.incident.findFirst({
      where: { id: params.id, agencyId: userOrError.agencyId },
    })
    if (!incident) return errorResponse('Incident not found', 'NOT_FOUND', 404)

    const { resolvedAt, resolutionSummary, escalated, followUpDate, ...rest } = parsed.data

    const updateData: Record<string, unknown> = { ...rest }

    if (resolvedAt !== undefined) {
      updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : null
      if (resolvedAt && resolutionSummary) {
        updateData.actionsTaken = resolutionSummary
      }
      if (resolvedAt) {
        updateData.resolvedBy = userOrError.id
      }
    }

    if (escalated !== undefined) {
      updateData.escalated = escalated
      if (escalated && !incident.escalatedAt) {
        updateData.escalatedAt = new Date()
      }
    }

    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null
    }

    const updated = await db.incident.update({
      where: { id: params.id },
      data: updateData,
    })

    await db.auditLog.create({
      data: {
        agencyId: userOrError.agencyId,
        userId: userOrError.id,
        action: resolvedAt ? 'INCIDENT_RESOLVED' : 'INCIDENT_UPDATED',
        entityType: 'Incident',
        entityId: incident.id,
        before: { severity: incident.severity, resolvedAt: incident.resolvedAt?.toISOString() ?? null },
        after: updateData as Record<string, string | number | boolean | null>,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse('Failed to update incident', 'UPDATE_ERROR', 500, error)
  }
}
