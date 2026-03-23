import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import { DailyDigestEmail } from '@/emails/DailyDigestEmail'
import React from 'react'
import type { IncidentSeverity } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  // Protect with cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const endOfYesterday = new Date(yesterday)
  endOfYesterday.setHours(23, 59, 59, 999)

  try {
    const agencies = await db.agency.findMany({
      where: { active: true, settings: { notifyOnFlags: true } },
      include: {
        settings: true,
        users: {
          where: { role: { in: ['MANAGER', 'ADMIN'] } },
          select: { email: true },
        },
      },
    })

    for (const agency of agencies) {
      const managerEmails = agency.users.map((u) => u.email)
      const notifyEmail = agency.settings?.notifyEmail
      const recipients = notifyEmail ? [notifyEmail] : managerEmails
      if (recipients.length === 0) continue

      const [visitsCompleted, flagsRaised, flagsResolved, incompleteVisits] = await Promise.all([
        db.visit.count({
          where: { agencyId: agency.id, status: 'SUBMITTED', updatedAt: { gte: yesterday, lte: endOfYesterday } },
        }),
        db.report.count({
          where: { agencyId: agency.id, NOT: { flags: { isEmpty: true } }, createdAt: { gte: yesterday, lte: endOfYesterday } },
        }),
        db.report.count({
          where: { agencyId: agency.id, status: 'APPROVED', NOT: { flags: { isEmpty: true } }, updatedAt: { gte: yesterday, lte: endOfYesterday } },
        }),
        db.visit.count({
          where: { agencyId: agency.id, status: { in: ['CANCELLED', 'IN_PROGRESS'] }, updatedAt: { gte: yesterday, lte: endOfYesterday } },
        }),
      ])

      await resend.emails.send({
        from: 'CareDoc AI <digest@caredocai.com>',
        to: recipients,
        subject: `Daily digest — ${agency.name} — ${yesterday.toLocaleDateString('en-GB')}`,
        react: React.createElement(DailyDigestEmail, {
          agencyName: agency.name,
          visitsCompleted,
          flagsRaised,
          flagsResolved,
          incompleteVisits,
          date: yesterday,
        }),
      })
    }

    // Overdue incident reminders
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    for (const agency of agencies) {
      const managerEmails = agency.users.map((u) => u.email)
      const notifyEmail = agency.settings?.notifyEmail
      const recipients = notifyEmail ? [notifyEmail] : managerEmails
      if (recipients.length === 0) continue

      const overdueIncidents = await db.incident.findMany({
        where: {
          agencyId: agency.id,
          resolvedAt: null,
          followUpDate: { lte: tomorrow },
          severity: { in: ['HIGH', 'CRITICAL'] as IncidentSeverity[] },
        },
        include: {
          client: { select: { name: true } },
          caregiver: { select: { name: true } },
        },
      })

      if (overdueIncidents.length > 0) {
        const overdueList = overdueIncidents
          .map(
            (i) =>
              `• [${i.severity}] ${i.title} — ${i.client.name} (follow-up: ${i.followUpDate?.toLocaleDateString('en-GB') ?? 'N/A'})`
          )
          .join('\n')

        await resend.emails.send({
          from: 'CareDoc AI <alerts@caredocai.com>',
          to: recipients,
          subject: `⚠ ${overdueIncidents.length} overdue incident(s) — ${agency.name}`,
          text: `The following HIGH/CRITICAL incidents require immediate attention:\n\n${overdueList}\n\nPlease log into CareDoc AI to resolve or escalate.\n\nThis is an automated reminder from CareDoc AI.`,
        })
      }
    }

    return NextResponse.json({ success: true, processed: agencies.length })
  } catch (error) {
    console.error('[cron/daily-digest]', error)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
