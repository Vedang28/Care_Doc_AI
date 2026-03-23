import { NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { clientId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const client = await db.client.findFirst({
    where: { id: params.clientId, agencyId: userOrError.agencyId },
    include: {
      visits: {
        orderBy: { checkInAt: 'desc' },
        take: 50,
        include: {
          caregiver: { select: { name: true } },
          tasks: { select: { id: true } },
          report: { select: { id: true, flags: true, status: true } },
        },
      },
    },
  })

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(client)
}
