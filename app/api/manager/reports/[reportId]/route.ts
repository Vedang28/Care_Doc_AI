import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const { reportId } = params

  try {
    const report = await db.report.findFirst({
      where: { id: reportId, agencyId: userOrError.agencyId },
      include: {
        visit: {
          include: {
            client: {
              select: { name: true, address: true, conditions: true, carePlan: true },
            },
            caregiver: {
              select: { name: true, email: true },
            },
            tasks: {
              select: { taskId: true, taskLabel: true, category: true, note: true },
            },
            notes: {
              select: {
                careText: true,
                conditionText: true,
                incidentText: true,
                responseText: true,
              },
            },
          },
        },
        signature: {
          select: { signedAt: true, userId: true },
        },
      },
    })

    if (!report) {
      return errorResponse('Report not found', 'NOT_FOUND', 404)
    }

    return NextResponse.json({
      id: report.id,
      visitId: report.visitId,
      reportText: report.reportText,
      flags: report.flags,
      transformations: report.transformations,
      aiModel: report.aiModel,
      promptVersion: report.promptVersion,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      client: report.visit.client,
      caregiver: report.visit.caregiver,
      visit: {
        checkInAt: report.visit.checkInAt.toISOString(),
        checkOutAt: report.visit.checkOutAt?.toISOString() ?? null,
        tasks: report.visit.tasks,
        notes: report.visit.notes,
      },
      signature: report.signature
        ? {
            signedAt: report.signature.signedAt.toISOString(),
            userId: report.signature.userId,
          }
        : null,
    })
  } catch (error) {
    return errorResponse('Failed to fetch report', 'FETCH_ERROR', 500, error)
  }
}
