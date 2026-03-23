import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse, getClientIp } from '@/lib/api-helpers'
import { generateVisitReport } from '@/lib/ai/generate-report'
import { formatDate, formatTime } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  const { visitId } = params

  // Fetch full visit with all related data
  const visit = await db.visit.findFirst({
    where: { id: visitId, caregiverId: userOrError.id },
    include: {
      client: true,
      tasks: true,
      notes: true,
    },
  })

  if (!visit) {
    return errorResponse('Visit not found or access denied', 'NOT_FOUND', 404)
  }

  // Get active prompt version for agency
  const promptVersion = await db.promptVersion.findFirst({
    where: { agencyId: userOrError.agencyId, active: true },
    orderBy: { createdAt: 'desc' },
  })

  const checkOutTime = new Date()

  try {
    const result = await generateVisitReport({
      clientName: visit.client.name,
      conditions: visit.client.conditions,
      carePlan: visit.client.carePlan,
      visitDate: formatDate(visit.checkInAt),
      checkInTime: formatTime(visit.checkInAt),
      checkOutTime: formatTime(checkOutTime),
      completedTasks: visit.tasks.map((t) => ({
        taskLabel: t.taskLabel,
        category: t.category,
        note: t.note ?? undefined,
      })),
      freeNotes: {
        care: visit.notes?.careText ?? '',
        condition: visit.notes?.conditionText ?? '',
        incident: visit.notes?.incidentText ?? '',
        response: visit.notes?.responseText ?? '',
      },
      agencyPromptOverride: promptVersion?.systemPrompt,
      promptVersion: promptVersion?.version ?? '1.0',
    })

    // Store report and update visit status atomically
    const [report] = await db.$transaction([
      db.report.create({
        data: {
          visitId,
          agencyId: userOrError.agencyId,
          reportText: result.report,
          flags: result.flags,
          transformations: result.transformations,
          aiModel: 'claude-sonnet-4-20250514',
          promptVersion: promptVersion?.version ?? '1.0',
          status: result.flags.includes('AI processing failed — manual review required')
            ? 'FLAGGED'
            : 'PENDING',
          // Quality scoring (may be null if AI didn't return it)
          qualityScoreOverall: result.qualityScore?.overall ?? null,
          qualityCompleteness: result.qualityScore?.completeness ?? null,
          qualitySpecificity: result.qualityScore?.specificity ?? null,
          qualityRiskAwareness: result.qualityScore?.riskAwareness ?? null,
          qualityFeedback: result.qualityScore?.feedback ?? null,
        },
      }),
      db.visit.update({
        where: { id: visitId },
        data: { status: 'PENDING_REVIEW', checkOutAt: checkOutTime },
      }),
    ])

    await db.auditLog.create({
      data: {
        agencyId: userOrError.agencyId,
        userId: userOrError.id,
        action: 'REPORT_GENERATED',
        entityType: 'Report',
        entityId: report.id,
        ipAddress: getClientIp(request),
        after: { flags: result.flags.length, model: 'claude-sonnet-4-20250514' },
      },
    })

    return NextResponse.json({
      reportId: report.id,
      report: result.report,
      flags: result.flags,
      transformations: result.transformations,
      qualityScore: result.qualityScore ?? null,
    })
  } catch (error) {
    return errorResponse('Report generation failed', 'AI_ERROR', 500, error)
  }
}
