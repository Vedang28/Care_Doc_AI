import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-keys/authenticate'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await authenticateApiKey(request)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.scopes.includes('reports:read')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  // Verify the report belongs to this agency
  const report = await db.report.findFirst({
    where: { id: params.id, agencyId: ctx.agencyId },
    select: { id: true },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const pdfWorkerUrl = process.env.PDF_WORKER_URL

  if (pdfWorkerUrl) {
    return NextResponse.json({ url: `${pdfWorkerUrl}/reports/${params.id}` })
  }

  return NextResponse.json(
    { url: null, message: 'PDF generation not configured' },
    { status: 200 },
  )
}
