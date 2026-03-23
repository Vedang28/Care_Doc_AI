import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { generateVisitReport } from '@/lib/ai/generate-report'
import { formatDate, formatTime } from '@/lib/utils'
import { z } from 'zod'

const syncVisitSchema = z.object({
  localId: z.string(),
  clientId: z.string().uuid(),
  checkInTime: z.string().datetime(),
  checkOutAt: z.string().datetime().optional(),
  tasks: z.array(z.object({
    taskId: z.string(),
    taskLabel: z.string(),
    category: z.string(),
    note: z.string().optional(),
  })),
  notes: z.object({
    care: z.string().default(''),
    condition: z.string().default(''),
    incident: z.string().default(''),
    response: z.string().default(''),
  }),
})

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try { body = await request.json() } catch { return errorResponse('Invalid JSON', 'INVALID_JSON') }

  const parsed = syncVisitSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { clientId, checkInTime, checkOutAt, tasks, notes } = parsed.data

  try {
    const client = await db.client.findFirst({
      where: { id: clientId, agencyId: userOrError.agencyId, active: true },
    })
    if (!client) return errorResponse('Client not found', 'NOT_FOUND', 404)

    const checkIn = new Date(checkInTime)
    const checkOut = checkOutAt ? new Date(checkOutAt) : new Date()

    // Create visit + tasks + notes in one transaction
    const visit = await db.visit.create({
      data: {
        clientId,
        caregiverId: userOrError.id,
        agencyId: userOrError.agencyId,
        checkInAt: checkIn,
        checkOutAt: checkOut,
        status: 'PENDING_REVIEW',
      },
    })

    await db.$transaction([
      db.visitTask.createMany({
        data: tasks.map((t) => ({
          visitId: visit.id,
          taskId: t.taskId,
          taskLabel: t.taskLabel,
          category: t.category,
          completed: true,
          note: t.note,
        })),
      }),
      db.visitNotes.create({
        data: {
          visitId: visit.id,
          careText: notes.care,
          conditionText: notes.condition,
          incidentText: notes.incident,
          responseText: notes.response,
        },
      }),
    ])

    // Get active prompt version
    const promptVersion = await db.promptVersion.findFirst({
      where: { agencyId: userOrError.agencyId, active: true },
      orderBy: { createdAt: 'desc' },
    })

    // Generate AI report
    const result = await generateVisitReport({
      clientName: client.name,
      conditions: client.conditions,
      carePlan: client.carePlan,
      visitDate: formatDate(checkIn),
      checkInTime: formatTime(checkIn),
      checkOutTime: formatTime(checkOut),
      completedTasks: tasks.map((t) => ({ taskLabel: t.taskLabel, category: t.category, note: t.note })),
      freeNotes: { care: notes.care, condition: notes.condition, incident: notes.incident, response: notes.response },
      agencyPromptOverride: promptVersion?.systemPrompt,
      promptVersion: promptVersion?.version ?? '1.0',
    })

    const report = await db.report.create({
      data: {
        visitId: visit.id,
        agencyId: userOrError.agencyId,
        reportText: result.report,
        flags: result.flags,
        transformations: result.transformations,
        aiModel: 'claude-sonnet-4-20250514',
        promptVersion: promptVersion?.version ?? '1.0',
        status: result.flags.length > 0 ? 'FLAGGED' : 'PENDING',
      },
    })

    return NextResponse.json({ visitId: visit.id, reportId: report.id }, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to sync visit', 'SYNC_ERROR', 500, error)
  }
}
