import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.scopes.includes('clients:read')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  const clients = await db.client.findMany({
    where: { agencyId: ctx.agencyId, active: true },
    select: {
      id: true,
      name: true,
      dob: true,
      address: true,
      conditions: true,
      carePlan: true,
      active: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ clients, total: clients.length })
}
