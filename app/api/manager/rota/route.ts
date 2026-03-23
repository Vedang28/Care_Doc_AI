import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const createAssignmentSchema = z.object({
  clientId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitType: z.enum(['standard', 'complex', 'social', 'medication_only']).default('standard'),
  scheduledTime: z.string().optional(), // 'morning' | 'afternoon' | 'evening' | 'HH:MM'
})

export async function GET(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const weekStart = request.nextUrl.searchParams.get('weekStart')
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return errorResponse('weekStart query param required (YYYY-MM-DD)', 'VALIDATION_ERROR', 400)
  }

  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  try {
    const assignments = await db.rotaAssignment.findMany({
      where: {
        agencyId: userOrError.agencyId,
        scheduledDate: { gte: start, lt: end },
      },
      include: {
        client: { select: { id: true, name: true, address: true } },
        caregiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
    })

    // Also return caregivers for the sidebar
    const caregivers = await db.user.findMany({
      where: {
        agencyId: userOrError.agencyId,
        role: { in: ['CAREGIVER', 'SENIOR_CARER'] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ assignments, caregivers })
  } catch (error) {
    return errorResponse('Failed to fetch rota', 'FETCH_ERROR', 500, error)
  }
}

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try { body = await request.json() } catch { return errorResponse('Invalid JSON', 'INVALID_JSON') }

  const parsed = createAssignmentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { clientId, caregiverId, scheduledDate, visitType } = parsed.data

  try {
    // Verify client and caregiver belong to this agency
    const [client, caregiver] = await Promise.all([
      db.client.findFirst({ where: { id: clientId, agencyId: userOrError.agencyId, active: true } }),
      db.user.findFirst({ where: { id: caregiverId, agencyId: userOrError.agencyId } }),
    ])
    if (!client) return errorResponse('Client not found', 'NOT_FOUND', 404)
    if (!caregiver) return errorResponse('Caregiver not found', 'NOT_FOUND', 404)

    const date = new Date(scheduledDate)
    date.setHours(0, 0, 0, 0)

    const assignment = await db.rotaAssignment.create({
      data: {
        clientId,
        caregiverId,
        agencyId: userOrError.agencyId,
        scheduledDate: date,
        visitType,
        status: 'scheduled',
      },
      include: {
        client: { select: { id: true, name: true } },
        caregiver: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to create assignment', 'CREATE_ERROR', 500, error)
  }
}
