import { db } from '@/lib/db'

export interface DiscrepancyResult {
  flags: string[]
  autoIncidentTriggered: boolean
}

export async function checkMarDiscrepancies(
  visitId: string,
  agencyId: string,
): Promise<DiscrepancyResult> {
  const flags: string[] = []
  let autoIncidentTriggered = false

  const entries = await db.marEntry.findMany({
    where: { visitId, agencyId },
    include: {
      medication: { select: { name: true, id: true } },
      visit: { select: { clientId: true, caregiverId: true } },
    },
  })

  for (const entry of entries) {
    // Check 1: Stock level plausibility
    if (
      entry.outcome === 'ADMINISTERED' &&
      entry.stockBefore !== null &&
      entry.stockAfter !== null &&
      entry.stockAfter < entry.stockBefore - 1
    ) {
      flags.push(
        `Possible stock discrepancy for ${entry.medication.name} — stock reduced by more than expected`,
      )
      await db.marDiscrepancy
        .create({
          data: {
            medicationId: entry.medicationId,
            clientId: entry.visit.clientId,
            agencyId,
            type: 'stock_discrepancy',
            description: `Stock before: ${entry.stockBefore}, after: ${entry.stockAfter}`,
          },
        })
        .catch(() => null)
    }

    // Check 2: Consecutive refusals (3+ in a row)
    if (entry.outcome === 'REFUSED') {
      const recentRefusals = await db.marEntry.findMany({
        where: { medicationId: entry.medicationId, agencyId, outcome: 'REFUSED' },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })

      if (recentRefusals.length >= 3) {
        const flag = `Repeated medication refusal for ${entry.medication.name} — GP notification may be required`
        if (!flags.includes(flag)) {
          flags.push(flag)
          autoIncidentTriggered = true

          const existingReport = await db.report.findFirst({ where: { visitId } })
          if (existingReport) {
            await db.incident
              .create({
                data: {
                  reportId: existingReport.id,
                  agencyId,
                  clientId: entry.visit.clientId,
                  caregiverId: entry.visit.caregiverId,
                  severity: 'HIGH',
                  title: `Repeated medication refusal — ${entry.medication.name}`,
                  description: `Client has refused ${entry.medication.name} 3 or more consecutive times. GP notification may be required.`,
                  followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
              })
              .catch(() => null)
          }

          await db.marDiscrepancy
            .create({
              data: {
                medicationId: entry.medicationId,
                clientId: entry.visit.clientId,
                agencyId,
                type: 'repeated_refusal',
                description: `3+ consecutive refusals recorded`,
              },
            })
            .catch(() => null)
        }
      }
    }

    // Check 3: Consecutive misses (2+ in a row)
    if (entry.outcome === 'MISSED') {
      const recentMisses = await db.marEntry.findMany({
        where: { medicationId: entry.medicationId, agencyId, outcome: 'MISSED' },
        orderBy: { createdAt: 'desc' },
        take: 2,
      })

      if (recentMisses.length >= 2) {
        const flag = `Repeated missed administration for ${entry.medication.name} — review scheduling`
        if (!flags.includes(flag)) {
          flags.push(flag)
          await db.marDiscrepancy
            .create({
              data: {
                medicationId: entry.medicationId,
                clientId: entry.visit.clientId,
                agencyId,
                type: 'repeated_miss',
                description: `2+ consecutive misses recorded`,
              },
            })
            .catch(() => null)
        }
      }
    }
  }

  return { flags, autoIncidentTriggered }
}
