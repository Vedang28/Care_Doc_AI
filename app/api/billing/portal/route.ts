import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'placeholder') {
    return errorResponse('Stripe not configured', 'STRIPE_NOT_CONFIGURED')
  }

  const agency = await db.agency.findUnique({ where: { id: user.agencyId } })
  if (!agency?.stripeCustomerId) {
    return errorResponse('No billing account found', 'NO_BILLING_ACCOUNT')
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const session = await stripe.billingPortal.sessions.create({
    customer: agency.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing`,
  })

  return NextResponse.json({ url: session.url })
}
