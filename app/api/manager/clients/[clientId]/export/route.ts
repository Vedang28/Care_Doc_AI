import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse } from '@/lib/api-helpers'
import { buildAuditPackHtml } from '@/lib/pdf/audit-template'
import { formatDate, formatTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const MAX_DATE_RANGE_DAYS = 365

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const client = await db.client.findFirst({
    where: { id: params.clientId, agencyId: userOrError.agencyId },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const dateFrom = body.dateFrom
    ? new Date(body.dateFrom as string)
    : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d })()
  const dateTo = body.dateTo ? new Date(body.dateTo as string) : new Date()
  const format = (body.format as string) === 'csv' ? 'csv' : 'pdf'

  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > MAX_DATE_RANGE_DAYS || daysDiff < 0) {
    return NextResponse.json(
      { error: 'Date range must be between 1 and 365 days' },
      { status: 400 }
    )
  }

  const options = {
    includeRawNotes: body.includeRawNotes !== false,
    includeFlags: body.includeFlags !== false,
    includeTasks: body.includeTasks !== false,
    includeSignatures: body.includeSignatures !== false,
    includeAuditLog: body.includeAuditLog !== false,
    anonymiseCaregivers: body.anonymiseCaregivers === true,
    redactedLabel: 'Caregiver [Anonymised]',
  }

  // Fetch all data in parallel
  const [visits, auditLogs, agency, marEntries] = await Promise.all([
    db.visit.findMany({
      where: {
        clientId: params.clientId,
        agencyId: userOrError.agencyId,
        checkInAt: { gte: dateFrom, lte: dateTo },
      },
      include: {
        caregiver: { select: { name: true } },
        tasks: { select: { taskLabel: true, category: true, note: true } },
        notes: true,
        report: {
          include: {
            signature: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { checkInAt: 'asc' },
    }),
    db.auditLog.findMany({
      where: {
        agencyId: userOrError.agencyId,
        entityId: params.clientId,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    db.agency.findUnique({
      where: { id: userOrError.agencyId },
      select: { name: true },
    }),
    db.marEntry.findMany({
      where: {
        agencyId: userOrError.agencyId,
        visit: {
          clientId: params.clientId,
          checkInAt: { gte: dateFrom, lte: dateTo },
        },
      },
      include: {
        medication: { select: { name: true, dose: true, route: true, frequency: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (format === 'csv') {
    return buildCsvExport(client, visits, auditLogs, options, dateFrom, dateTo)
  }

  // Build visit summary rows
  const visitRows = visits.map((v) => ({
    id: v.id,
    checkInAt: v.checkInAt,
    checkOutAt: v.checkOutAt,
    caregiverName: options.anonymiseCaregivers ? options.redactedLabel : v.caregiver.name,
    taskCount: v.tasks.length,
    flagCount: v.report?.flags.length ?? 0,
    status: v.status,
  }))

  // Build report rows + collect flags
  const allFlags: Array<{
    date: Date
    flag: string
    clientName: string
    caregiverName: string
    reportId: string
  }> = []

  const reportRows = visits
    .filter((v) => v.report !== null)
    .map((v) => {
      const caregiverName = options.anonymiseCaregivers ? options.redactedLabel : v.caregiver.name
      v.report!.flags.forEach((f) =>
        allFlags.push({
          date: v.checkInAt,
          flag: f,
          clientName: client.name,
          caregiverName,
          reportId: v.report!.id,
        })
      )
      return {
        id: v.report!.id,
        visitDate: v.checkInAt,
        caregiverName,
        reportText: v.report!.reportText,
        flags: v.report!.flags,
        signedAt: v.report!.signature?.signedAt ?? null,
        signedByName: options.anonymiseCaregivers
          ? null
          : (v.report!.signature?.user.name ?? null),
        checkInAt: v.checkInAt,
        checkOutAt: v.checkOutAt,
        taskCount: v.tasks.length,
        rawNotes: v.notes
          ? {
              care: v.notes.careText,
              condition: v.notes.conditionText,
              incident: v.notes.incidentText,
              response: v.notes.responseText,
            }
          : null,
        includeRawNotes: options.includeRawNotes,
      }
    })

  const html = buildAuditPackHtml({
    client: {
      name: client.name,
      dob: client.dob,
      address: client.address,
      conditions: client.conditions,
      carePlan: client.carePlan,
    },
    agencyName: agency?.name ?? 'Unknown Agency',
    dateFrom,
    dateTo,
    exportDate: new Date(),
    visits: visitRows,
    reports: reportRows,
    flags: allFlags,
    auditLogs: auditLogs.map((l) => ({
      createdAt: l.createdAt,
      action: l.action,
      userName: options.anonymiseCaregivers ? null : (l.user?.name ?? null),
    })),
    options,
    marEntries,
  })

  // Try Cloudflare Worker PDF generation
  const workerUrl = process.env.PDF_WORKER_URL
  const workerSecret = process.env.PDF_WORKER_SECRET

  if (workerUrl && workerUrl !== 'placeholder') {
    try {
      const workerRes = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': workerSecret ?? '',
        },
        body: JSON.stringify({
          html,
          filename: `inspection-pack-${client.name.replace(/\s/g, '-')}-${formatDate(dateFrom)}.pdf`,
        }),
      })
      if (workerRes.ok) {
        const { url } = (await workerRes.json()) as { url: string }
        await db.auditLog.create({
          data: {
            agencyId: userOrError.agencyId,
            userId: userOrError.id,
            action: 'INSPECTION_PACK_EXPORTED',
            entityType: 'Client',
            entityId: params.clientId,
            after: {
              format: 'pdf',
              dateFrom: dateFrom.toISOString(),
              dateTo: dateTo.toISOString(),
            },
          },
        })
        return NextResponse.json({ mode: 'pdf', url })
      }
    } catch {
      // fall through to HTML fallback
    }
  }

  // Fallback: return HTML for browser print
  await db.auditLog.create({
    data: {
      agencyId: userOrError.agencyId,
      userId: userOrError.id,
      action: 'INSPECTION_PACK_EXPORTED',
      entityType: 'Client',
      entityId: params.clientId,
      after: {
        format: 'html',
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
    },
  })
  return NextResponse.json({ mode: 'html', html })
}

function buildCsvExport(
  client: { name: string; id: string },
  visits: Awaited<ReturnType<typeof db.visit.findMany>>,
  auditLogs: Awaited<ReturnType<typeof db.auditLog.findMany>>,
  options: { anonymiseCaregivers: boolean; redactedLabel: string },
  dateFrom: Date,
  dateTo: Date
): NextResponse {
  // visits.csv
  const visitsCsv = [
    'visit_id,date,caregiver,check_in,check_out,tasks_completed,flags,status',
    ...visits.map((v) => {
      const cg = options.anonymiseCaregivers
        ? options.redactedLabel
        : (v as { caregiver?: { name: string } }).caregiver?.name ?? ''
      return [
        `"${v.id}"`,
        `"${formatDate(v.checkInAt)}"`,
        `"${cg}"`,
        `"${formatTime(v.checkInAt)}"`,
        `"${v.checkOutAt ? formatTime(v.checkOutAt) : ''}"`,
        `"${(v as { tasks?: unknown[] }).tasks?.length ?? 0}"`,
        `"${(v as { report?: { flags: string[] } | null }).report?.flags?.length ?? 0}"`,
        `"${v.status}"`,
      ].join(',')
    }),
  ].join('\n')

  // reports.csv
  const reportsCsv = [
    'report_id,visit_date,caregiver,report_text,flags,signed',
    ...visits
      .filter((v) => (v as { report?: unknown }).report)
      .map((v) => {
        const cg = options.anonymiseCaregivers
          ? options.redactedLabel
          : (v as { caregiver?: { name: string } }).caregiver?.name ?? ''
        const r = (v as unknown as { report: { id: string; reportText: string; flags: string[]; signature?: unknown } }).report
        return [
          `"${r.id}"`,
          `"${formatDate(v.checkInAt)}"`,
          `"${cg}"`,
          `"${r.reportText.replace(/"/g, '""')}"`,
          `"${r.flags.join('; ')}"`,
          `"${r.signature ? 'Yes' : 'No'}"`,
        ].join(',')
      }),
  ].join('\n')

  // flags.csv
  const flagsCsv = [
    'date,caregiver,flag_text,report_id',
    ...visits.flatMap((v) => {
      const cg = options.anonymiseCaregivers
        ? options.redactedLabel
        : (v as { caregiver?: { name: string } }).caregiver?.name ?? ''
      const report = (v as { report?: { id: string; flags: string[] } | null }).report
      return (report?.flags ?? []).map(
        (f: string) =>
          `"${formatDate(v.checkInAt)}","${cg}","${f.replace(/"/g, '""')}","${report?.id ?? ''}"`
      )
    }),
  ].join('\n')

  // audit_log.csv
  const auditCsv = [
    'timestamp,user,action',
    ...auditLogs.map((l) => {
      const user = options.anonymiseCaregivers
        ? '[Anonymised]'
        : ((l as { user?: { name: string } | null }).user?.name ?? 'System')
      return `"${l.createdAt.toISOString()}","${user}","${l.action}"`
    }),
  ].join('\n')

  return NextResponse.json({
    mode: 'csv',
    files: {
      'visits.csv': visitsCsv,
      'reports.csv': reportsCsv,
      'flags.csv': flagsCsv,
      'audit_log.csv': auditCsv,
    },
    meta: {
      client: client.name,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    },
  })
}
