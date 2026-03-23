import webpush from 'web-push'

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@caredocai.com'
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToContact(
  familyContactId: string,
  payload: PushPayload,
): Promise<void> {
  const { db } = await import('@/lib/db')

  const subscriptions = await db.familyPushSubscription.findMany({
    where: { familyContactId },
  })

  if (subscriptions.length === 0) return

  try {
    ensureConfigured()
  } catch {
    console.warn('[push] VAPID not configured — skipping push notifications')
    return
  }

  const payloadString = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
        },
        payloadString,
      ),
    ),
  )

  // Remove expired/invalid subscriptions (410 Gone or 404 Not Found)
  const expiredIds: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        expiredIds.push(subscriptions[i]!.id)
      }
    }
  })

  if (expiredIds.length > 0) {
    await db.familyPushSubscription
      .deleteMany({ where: { id: { in: expiredIds } } })
      .catch(() => null)
  }
}
