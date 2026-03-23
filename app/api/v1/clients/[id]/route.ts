import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.scopes.includes('clients:read')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  const client = await db.client.findFirst({
    where: { id: params.id, agencyId: ctx.agencyId },
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
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({ client })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.scopes.includes('clients:write')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  const existing = await db.client.findFirst({
    where: { id: params.id, agencyId: ctx.agencyId },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  let body: { conditions?: string[]; carePlan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data: { conditions?: string[]; carePlan?: string } = {}
  if (Array.isArray(body.conditions)) data.conditions = body.conditions
  if (typeof body.carePlan === 'string') data.carePlan = body.carePlan

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'No updatable fields provided. Allowed: conditions, carePlan' },
      { status: 400 },
    )
  }

  const updated = await db.client.update({
    where: { id: params.id },
    data,
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
  })

  return NextResponse.json({ client: updated })
}
