import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { buildReportHtml } from '@/lib/pdf/report-template'

interface RouteParams { params: { reportId: string } }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const report = await db.report.findFirst({
      where: { id: params.reportId, agencyId: userOrError.agencyId },
      include: {
        agency: { select: { name: true, settings: { select: { logoUrl: true } } } },
        visit: {
          include: {
            client: { select: { name: true } },
            caregiver: { select: { name: true } },
            _count: { select: { tasks: true } },
          },
        },
        signature: { include: { user: { select: { name: true } } } },
      },
    })

    if (!report) return errorResponse('Report not found', 'NOT_FOUND', 404)

    const html = buildReportHtml({
      reportId: report.id,
      agencyName: report.agency.name,
      agencyLogoUrl: report.agency.settings?.logoUrl,
      clientName: report.visit.client.name,
      caregiverName: report.visit.caregiver.name,
      checkInAt: report.visit.checkInAt,
      checkOutAt: report.visit.checkOutAt,
      taskCount: report.visit._count.tasks,
      flags: report.flags,
      reportText: report.reportText,
      signedByName: report.signature?.user.name ?? report.visit.caregiver.name,
      signedAt: report.signature?.signedAt ?? report.createdAt,
    })

    const pdfWorkerUrl = process.env.PDF_WORKER_URL
    const pdfWorkerSecret = process.env.PDF_WORKER_SECRET

    if (!pdfWorkerUrl) {
      // No worker configured — return HTML for client-side print
      return NextResponse.json({ html, mode: 'html' })
    }

    // Delegate to Cloudflare Worker
    const workerRes = await fetch(`${pdfWorkerUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pdfWorkerSecret}`,
      },
      body: JSON.stringify({ html, reportId: report.id }),
    })

    if (!workerRes.ok) {
      return errorResponse('PDF generation failed', 'PDF_ERROR', 502)
    }

    const { url } = await workerRes.json() as { url: string }
    return NextResponse.json({ url, mode: 'pdf' })
  } catch (error) {
    return errorResponse('Failed to export PDF', 'EXPORT_ERROR', 500, error)
  }
}
