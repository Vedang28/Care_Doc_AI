import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string
    subscription?: {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }
    userAgent?: string
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

  const { endpoint, keys } = body.subscription ?? {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  // Upsert subscription — endpoint is unique across contacts
  await db.familyPushSubscription.upsert({
    where: { endpoint },
    create: {
      familyContactId: contact.id,
      endpoint,
      p256dhKey: keys.p256dh,
      authKey: keys.auth,
      userAgent: body.userAgent ?? null,
    },
    update: {
      p256dhKey: keys.p256dh,
      authKey: keys.auth,
      familyContactId: contact.id,
    },
  })

  return NextResponse.json({ success: true })
}
