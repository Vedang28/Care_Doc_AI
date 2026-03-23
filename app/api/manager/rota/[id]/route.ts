import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  visitType: z.enum(['standard', 'complex', 'social', 'medication_only']).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
})

interface RouteParams { params: { id: string } }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try { body = await request.json() } catch { return errorResponse('Invalid JSON', 'INVALID_JSON') }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    // Verify assignment belongs to this agency
    const existing = await db.rotaAssignment.findFirst({
      where: { id: params.id, agencyId: userOrError.agencyId },
    })
    if (!existing) return errorResponse('Assignment not found', 'NOT_FOUND', 404)

    const updated = await db.rotaAssignment.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        client: { select: { id: true, name: true } },
        caregiver: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse('Failed to update assignment', 'UPDATE_ERROR', 500, error)
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const existing = await db.rotaAssignment.findFirst({
      where: { id: params.id, agencyId: userOrError.agencyId },
    })
    if (!existing) return errorResponse('Assignment not found', 'NOT_FOUND', 404)

    await db.rotaAssignment.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return errorResponse('Failed to delete assignment', 'DELETE_ERROR', 500, error)
  }
}
