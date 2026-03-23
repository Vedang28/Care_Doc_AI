import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string
    endpoint?: string
  }

  // Auth: token = base64-encoded contactId
  let contactId: string | null = null
  if (body.token) {
    try {
      contactId = Buffer.from(body.token, 'base64').toString('utf8')
    } catch {
      /* ignore */
    }
  }

  const contact = contactId
    ? await db.familyContact.findFirst({
        where: { id: contactId, active: true, consentGiven: true },
      })
    : null

  if (!contact) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!body.endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
  }

  // Delete only subscriptions belonging to this contact to prevent cross-contact deletion
  await db.familyPushSubscription.deleteMany({
    where: {
      endpoint: body.endpoint,
      familyContactId: contact.id,
    },
  })

  return NextResponse.json({ success: true })
}
