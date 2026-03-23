import { Resend } from 'resend'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyAdminsOfCriticalIncident({
  agencyId,
  incidentId,
  title,
  description,
  clientName,
  caregiverName,
  severity,
  safeguardingCategory,
}: {
  agencyId: string
  incidentId: string
  title: string
  description: string
  clientName: string
  caregiverName: string
  severity: string
  safeguardingCategory?: string
}) {
  const adminUsers = await db.user.findMany({
    where: { agencyId, role: 'ADMIN' },
    select: { email: true, name: true },
  })

  if (adminUsers.length === 0) return

  const recipients = adminUsers.map((u) => u.email)
  const safeguardingLine = safeguardingCategory
    ? `\nSafeguarding Category: ${safeguardingCategory}`
    : ''

  try {
    await resend.emails.send({
      from: 'CareDoc AI <alerts@caredocai.com>',
      to: recipients,
      subject: `🚨 ${severity} INCIDENT: ${title}`,
      text: `A ${severity} severity incident has been raised and requires your immediate attention.\n\nTitle: ${title}\nClient: ${clientName}\nCaregiver: ${caregiverName}${safeguardingLine}\n\nDescription:\n${description}\n\nPlease log into CareDoc AI immediately to review and take action.\n\nIncident ID: ${incidentId}`,
    })
  } catch (err) {
    logger.error(
      'Failed to send critical incident email',
      err instanceof Error ? err : undefined,
      { incidentId }
    )
  }
}
