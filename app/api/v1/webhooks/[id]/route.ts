import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const webhook = await db.webhook.findFirst({
    where: { id: params.id, agencyId: ctx.agencyId },
    select: { id: true, active: true },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // Soft delete
  await db.webhook.update({
    where: { id: params.id },
    data: { active: false },
  })

  return NextResponse.json({ success: true, id: params.id })
}
