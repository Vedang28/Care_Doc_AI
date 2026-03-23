import crypto from 'crypto'
import { db } from '@/lib/db'

export interface WebhookPayload {
  event: 'report.submitted'
  agencyId: string
  reportId: string
  visitId: string
  clientId: string
  submittedAt: string
  hasFlags: boolean
  flagCount: number
}

export async function deliverWebhooks(payload: WebhookPayload): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: { agencyId: payload.agencyId, active: true },
  })

  if (webhooks.length === 0) return

  const payloadString = JSON.stringify(payload)

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex')

      // Attempt delivery with 3 retries
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CareDoc-Signature': `sha256=${signature}`,
              'X-CareDoc-Event': payload.event,
            },
            body: payloadString,
            signal: AbortSignal.timeout(10000),
          })
          if (res.ok) break
          if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000))
        } catch {
          if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000))
        }
      }
    }),
  )
}
