import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Stripe sends raw body — must disable body parsing
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || stripeKey === 'placeholder' || !webhookSecret || webhookSecret === 'placeholder') {
    console.warn('[billing/webhook] Stripe not configured — ignoring webhook')
    return NextResponse.json({ received: true })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: import('stripe').Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session
        const agencyId = session.metadata?.agencyId
        const planKey = session.metadata?.planKey?.toLowerCase()
        if (agencyId && planKey) {
          await db.agency.update({
            where: { id: agencyId },
            data: {
              plan: planKey,
              subscriptionStatus: 'active',
              subscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
              planUpdatedAt: new Date(),
            },
          })
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        const agency = await db.agency.findFirst({ where: { subscriptionId: sub.id } })
        if (agency) {
          await db.agency.update({
            where: { id: agency.id },
            data: {
              subscriptionStatus: sub.status,
              planUpdatedAt: new Date(),
            },
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        const agency = await db.agency.findFirst({ where: { subscriptionId: sub.id } })
        if (agency) {
          await db.agency.update({
            where: { id: agency.id },
            data: {
              plan: 'starter',
              subscriptionStatus: 'inactive',
              subscriptionId: null,
              planUpdatedAt: new Date(),
            },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('[billing/webhook] Error processing event:', err)
    return new NextResponse('Webhook handler error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
