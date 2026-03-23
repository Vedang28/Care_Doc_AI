import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Validate URL format
  try {
    new URL(body.url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  const secret = crypto.randomBytes(32).toString('hex')

  const webhook = await db.webhook.create({
    data: {
      agencyId: ctx.agencyId,
      url: body.url,
      secret,
    },
    select: {
      id: true,
      url: true,
      createdAt: true,
    },
  })

  // Return secret once — not stored in plain text retrievable form again
  return NextResponse.json(
    { id: webhook.id, url: webhook.url, secret, createdAt: webhook.createdAt },
    { status: 201 },
  )
}
