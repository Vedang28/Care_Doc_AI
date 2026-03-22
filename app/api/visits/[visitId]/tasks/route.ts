import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { saveTasksSchema } from '@/lib/validations/visit'

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  const { visitId } = params

  const visit = await db.visit.findFirst({
    where: { id: visitId, caregiverId: userOrError.id },
  })
  if (!visit) {
    return errorResponse('Visit not found or access denied', 'NOT_FOUND', 404)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = saveTasksSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    // Delete existing tasks and insert new ones atomically
    await db.$transaction([
      db.visitTask.deleteMany({ where: { visitId } }),
      db.visitTask.createMany({
        data: parsed.data.tasks.map((t) => ({
          visitId,
          taskId: t.taskId,
          taskLabel: t.taskLabel,
          category: t.category,
          completed: true,
          note: t.note ?? null,
        })),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('Failed to save tasks', 'SAVE_ERROR', 500, error)
  }
}
