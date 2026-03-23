---
name: payments
description: Stripe payment integration template. Subscriptions or one-time payments, webhook handling, billing portal.
---

# Feature Template: Payments (Stripe)

## What This Creates

- Checkout session creation (one-time or subscription)
- Stripe webhook handler with signature verification
- Customer portal for billing management
- Track subscription status in DB

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_live_...  (or sk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...  (from Stripe dashboard)
STRIPE_PRICE_ID=price_...       (your product price ID)
```

## Files to Create

```
src/
├── routes/paymentRoutes.js
├── controllers/paymentController.js
├── services/paymentService.js
└── middleware/validateWebhook.js

prisma/schema.prisma  ← add Subscription model
tests/integration/payments.test.js
```

## Prisma Schema

```prisma
model Subscription {
  id                   String    @id @default(cuid())
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id])
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  status               String    @default("inactive")  // active, inactive, canceled, past_due
  currentPeriodEnd     DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([stripeCustomerId])
}
```

## Routes

```
POST   /api/v1/payments/checkout      → Create Stripe checkout session
POST   /api/v1/payments/webhook       → Stripe webhook (no auth — signed)
POST   /api/v1/payments/portal        → Create billing portal session
GET    /api/v1/payments/subscription  → Get current subscription status
```

## Critical: Webhook Signature Verification

```javascript
// NEVER process webhooks without verifying Stripe signature
// middleware/validateWebhook.js
export function validateStripeWebhook(req, res, next) {
  const signature = req.headers['stripe-signature'];
  try {
    // req.rawBody must be the raw buffer — configure before json() middleware
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    req.stripeEvent = event;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
}
```

## Webhook Events to Handle

```javascript
switch (event.type) {
  case 'checkout.session.completed':
    // Payment successful — activate subscription
    break;
  case 'customer.subscription.updated':
    // Plan changed or renewed
    break;
  case 'customer.subscription.deleted':
    // Subscription canceled
    break;
  case 'invoice.payment_failed':
    // Payment failed — notify user
    break;
}
```

## Security Notes

- Webhook endpoint must use raw body parser (not json parser) for signature verification
- Never trust payment status from the client — always verify via webhook or Stripe API
- Test in Stripe test mode with test cards before going live
- Log all webhook events for audit trail
- Idempotency: handle same event being received twice
