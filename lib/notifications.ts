import { db } from '@/lib/db'
import { Resend } from 'resend'
import { FlaggedReportEmail } from '@/emails/FlaggedReportEmail'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function createNotification({
  userId,
  agencyId,
  title,
  body,
  link,
}: {
  userId: string
  agencyId: string
  title: string
  body: string
  link?: string
}) {
  return db.notification.create({
    data: { userId, agencyId, title, body, link },
  })
}

export async function notifyManagersOfFlaggedReport({
  agencyId,
  reportId,
  clientName,
  caregiverName,
  flags,
  visitDate,
}: {
  agencyId: string
  reportId: string
  clientName: string
  caregiverName: string
  flags: string[]
  visitDate: Date
}) {
  const [settings, managers] = await Promise.all([
    db.agencySettings.findUnique({ where: { agencyId } }),
    db.user.findMany({
      where: { agencyId, role: { in: ['MANAGER', 'SENIOR_CARER'] } },
      select: { id: true, email: true, name: true },
    }),
  ])

  if (!settings?.notifyOnFlags || managers.length === 0) return

  const notifyEmail = settings.notifyEmail

  // Create in-app notifications for all managers
  await Promise.all(
    managers.map((m) =>
      createNotification({
        userId: m.id,
        agencyId,
        title: `Flagged report — ${clientName}`,
        body: `${flags.length} concern${flags.length > 1 ? 's' : ''} flagged by ${caregiverName}`,
        link: `/manager/reports/${reportId}`,
      })
    )
  )

  // Send email if configured
  if (notifyEmail || managers[0]?.email) {
    const recipient = notifyEmail ?? managers.map((m) => m.email)
    await resend.emails.send({
      from: 'CareDoc AI <alerts@caredocai.com>',
      to: Array.isArray(recipient) ? recipient : [recipient],
      subject: `⚠️ Flagged visit report — ${clientName} — ${visitDate.toLocaleDateString('en-GB')}`,
      react: React.createElement(FlaggedReportEmail, {
        clientName,
        caregiverName,
        flags,
        visitDate,
        reportId,
      }),
    })
  }
}
