import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireAuth('ADMIN')
  if (isNextResponse(user)) return user

  // Verify key belongs to agency
  const key = await db.apiKey.findFirst({
    where: { id: params.id, agencyId: user.agencyId },
  })

  if (!key) return errorResponse('Not found', 'NOT_FOUND', 404)

  await db.apiKey.update({ where: { id: params.id }, data: { active: false } })

  return NextResponse.json({ success: true })
}
