import { db } from '@/lib/db'
import { sendPushToContact } from './send'

export async function notifyFamilyOnVisit(visitId: string): Promise<void> {
  try {
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        client: { select: { name: true } },
        report: { select: { flags: true } },
      },
    })
    if (!visit) return

    const contacts = await db.familyContact.findMany({
      where: {
        clientId: visit.clientId,
        active: true,
        consentGiven: true,
      },
    })

    for (const contact of contacts) {
      const hasFlags = (visit.report?.flags?.length ?? 0) > 0
      const firstName = visit.client.name.split(' ')[0] ?? visit.client.name

      if (contact.notifyOnFlag && hasFlags) {
        await sendPushToContact(contact.id, {
          title: 'CareDoc AI',
          body: `A concern was noted during ${firstName}'s visit today. Please check the portal.`,
        }).catch(() => null)
      } else if (contact.notifyOnVisit) {
        await sendPushToContact(contact.id, {
          title: 'CareDoc AI',
          body: `${firstName}'s visit has been completed today. All went well.`,
        }).catch(() => null)
      }
    }
  } catch (err) {
    console.error('[notify-family] Error:', err)
  }
}
