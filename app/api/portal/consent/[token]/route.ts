import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  let contactId: string | null = null
  try {
    contactId = Buffer.from(params.token, 'base64').toString('utf8')
  } catch {
    /* invalid base64 */
  }

  if (!contactId || contactId.trim().length < 5) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const contact = await db.familyContact.findUnique({
    where: { id: contactId },
  })

  if (!contact || !contact.active) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.familyContact.update({
    where: { id: contactId },
    data: {
      consentGiven: true,
      consentDate: new Date(),
    },
  })

  return NextResponse.json({ success: true, clientId: contact.clientId })
}
