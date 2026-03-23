import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string; contactId: string } },
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const contact = await db.familyContact.findFirst({
    where: { id: params.contactId, clientId: params.clientId, agencyId: user.agencyId },
  })
  if (!contact) return errorResponse('Contact not found', 'NOT_FOUND', 404)

  const body = await request.json() as {
    notifyOnVisit?: boolean
    notifyOnFlag?: boolean
    active?: boolean
    consentGiven?: boolean
  }

  const updated = await db.familyContact.update({
    where: { id: params.contactId },
    data: {
      ...(body.notifyOnVisit !== undefined && { notifyOnVisit: body.notifyOnVisit }),
      ...(body.notifyOnFlag !== undefined && { notifyOnFlag: body.notifyOnFlag }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.consentGiven !== undefined && {
        consentGiven: body.consentGiven,
        consentDate: body.consentGiven ? new Date() : null,
      }),
    },
  })

  return NextResponse.json({ contact: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clientId: string; contactId: string } },
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const contact = await db.familyContact.findFirst({
    where: { id: params.contactId, clientId: params.clientId, agencyId: user.agencyId },
  })
  if (!contact) return errorResponse('Contact not found', 'NOT_FOUND', 404)

  await db.familyContact.update({ where: { id: params.contactId }, data: { active: false } })

  return NextResponse.json({ success: true })
}
