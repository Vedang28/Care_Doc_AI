import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse, getClientIp } from '@/lib/api-helpers'
import { submitReportSchema } from '@/lib/validations/visit'

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  const { visitId } = params

  const visit = await db.visit.findFirst({
    where: { id: visitId, caregiverId: userOrError.id },
    include: { report: true },
  })

  if (!visit) {
    return errorResponse('Visit not found or access denied', 'NOT_FOUND', 404)
  }
  if (!visit.report) {
    return errorResponse('No report generated yet', 'NO_REPORT', 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = submitReportSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const submittedAt = new Date()

  try {
    await db.$transaction([
      db.report.update({
        where: { id: visit.report.id },
        data: {
          reportText: parsed.data.reportText,
          status: 'APPROVED',
        },
      }),
      db.visit.update({
        where: { id: visitId },
        data: { status: 'SUBMITTED' },
      }),
      db.signature.create({
        data: {
          reportId: visit.report.id,
          userId: userOrError.id,
          signedAt: submittedAt,
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      }),
    ])

    await db.auditLog.create({
      data: {
        agencyId: userOrError.agencyId,
        userId: userOrError.id,
        action: 'REPORT_SUBMITTED',
        entityType: 'Report',
        entityId: visit.report.id,
        ipAddress: getClientIp(request),
        after: { submittedAt: submittedAt.toISOString() },
      },
    })

    return NextResponse.json({
      reportId: visit.report.id,
      submittedAt: submittedAt.toISOString(),
    })
  } catch (error) {
    return errorResponse('Failed to submit report', 'SUBMIT_ERROR', 500, error)
  }
}
