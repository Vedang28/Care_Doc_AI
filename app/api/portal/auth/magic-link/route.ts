import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json() as { email?: string }
  if (!body.email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const contact = await db.familyContact.findFirst({
    where: { email: body.email, active: true },
    include: { client: { select: { portalSlug: true, name: true } } },
  })

  // Always return success to prevent email enumeration
  if (!contact) {
    return NextResponse.json({ success: true, message: 'If this email is registered, a link has been sent.' })
  }

  // Generate token
  const token = Buffer.from(contact.id).toString('base64')
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${contact.client.portalSlug ?? contact.clientId}?token=${token}`

  // Send magic link via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && resendKey !== 'placeholder') {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'CareDoc AI <noreply@caredocai.com>',
        to: body.email,
        subject: `Your secure link to ${contact.client.name}'s care updates`,
        html: `<p>Hello,</p>
<p>Click the link below to view care updates for ${contact.client.name}.</p>
<p><a href="${portalUrl}" style="background:#2D6A4F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Care Updates</a></p>
<p>This link grants immediate access. Keep it private.</p>
<p style="color:#64748b;font-size:12px;">If you didn't request this, you can ignore this email.</p>`,
      })
    } catch (err) {
      console.error('[portal/magic-link] Resend error:', err)
    }
  } else {
    console.warn('[portal/magic-link] Resend not configured — link would be:', portalUrl)
  }

  return NextResponse.json({ success: true, message: 'If this email is registered, a link has been sent.' })
}
