import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { clientId: string } }) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const client = await db.client.findFirst({
    where: { id: params.clientId, agencyId: user.agencyId },
    select: { id: true },
  })
  if (!client) return errorResponse('Client not found', 'NOT_FOUND', 404)

  const contacts = await db.familyContact.findMany({
    where: { clientId: params.clientId, agencyId: user.agencyId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { pushSubscriptions: true } } },
  })

  return NextResponse.json({ contacts })
}

export async function POST(request: NextRequest, { params }: { params: { clientId: string } }) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const client = await db.client.findFirst({
    where: { id: params.clientId, agencyId: user.agencyId },
  })
  if (!client) return errorResponse('Client not found', 'NOT_FOUND', 404)

  const body = await request.json() as {
    name?: string
    email?: string
    relationship?: string
    notifyOnVisit?: boolean
    notifyOnFlag?: boolean
  }

  if (!body.name || !body.email || !body.relationship) {
    return errorResponse('name, email, and relationship are required', 'VALIDATION_ERROR')
  }

  // Auto-generate portalSlug for the client if not set
  if (!client.portalSlug) {
    const slug = client.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    await db.client.update({ where: { id: params.clientId }, data: { portalSlug: slug } })
  }

  const created = await db.familyContact.create({
    data: {
      clientId: params.clientId,
      agencyId: user.agencyId,
      name: body.name,
      email: body.email,
      relationship: body.relationship,
      notifyOnVisit: body.notifyOnVisit ?? false,
      notifyOnFlag: body.notifyOnFlag ?? true,
    },
  })

  // Send consent email if Resend is configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && resendKey !== 'placeholder') {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      const consentToken = Buffer.from(created.id).toString('base64')
      await resend.emails.send({
        from: 'CareDoc AI <noreply@caredocai.com>',
        to: body.email,
        subject: `${client.name}'s care updates — please confirm your consent`,
        html: `<p>Hello ${body.name},</p>
<p>You have been added as a family contact for ${client.name} on CareDoc AI.</p>
<p>To receive visit updates, please <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/consent/${consentToken}">click here to confirm your consent</a>.</p>
<p>You can withdraw consent at any time by contacting us.</p>`,
      })
    } catch (err) {
      console.warn('[family] Failed to send consent email:', err)
    }
  } else {
    console.warn('[family] Resend not configured — consent email skipped')
  }

  return NextResponse.json({ contact: created }, { status: 201 })
}
