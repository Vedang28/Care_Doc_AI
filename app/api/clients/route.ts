import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get clients assigned to this caregiver today via RotaAssignment
    const assignments = await db.rotaAssignment.findMany({
      where: {
        caregiverId: userOrError.id,
        scheduledDate: { gte: today, lt: tomorrow },
        status: 'scheduled',
        client: { agencyId: userOrError.agencyId },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            address: true,
            conditions: true,
            carePlan: true,
            risks: true,
            visits: {
              where: { status: 'SUBMITTED' },
              orderBy: { checkInAt: 'desc' },
              take: 1,
              select: { checkInAt: true },
            },
          },
        },
      },
    })

    const clients = assignments.map((a) => ({
      id: a.client.id,
      name: a.client.name,
      address: a.client.address,
      conditions: a.client.conditions,
      carePlan: a.client.carePlan,
      risks: a.client.risks,
      lastVisitAt: a.client.visits[0]?.checkInAt?.toISOString() ?? null,
    }))

    return NextResponse.json(clients)
  } catch (error) {
    return errorResponse('Failed to fetch clients', 'FETCH_ERROR', 500, error)
  }
}
