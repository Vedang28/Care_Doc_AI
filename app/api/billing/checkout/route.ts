import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PLANS } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'placeholder') {
    return errorResponse('Stripe not configured', 'STRIPE_NOT_CONFIGURED')
  }

  const body = await request.json() as { planKey: string }
  const planKey = body.planKey?.toUpperCase() as keyof typeof PLANS
  const plan = PLANS[planKey]
  if (!plan) return errorResponse('Invalid plan', 'INVALID_PLAN')

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const agency = await db.agency.findUnique({ where: { id: user.agencyId } })
  if (!agency) return errorResponse('Agency not found', 'NOT_FOUND')

  // Create or get customer
  let customerId = agency.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: agency.name,
      metadata: { agencyId: user.agencyId },
    })
    customerId = customer.id
    await db.agency.update({
      where: { id: user.agencyId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing`,
    metadata: { agencyId: user.agencyId, planKey },
  })

  return NextResponse.json({ url: session.url })
}
