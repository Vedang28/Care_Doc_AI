import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const clients = await db.client.findMany({
      where: { agencyId: userOrError.agencyId, active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(clients)
  } catch (error) {
    return errorResponse('Failed to fetch clients', 'FETCH_ERROR', 500, error)
  }
}
