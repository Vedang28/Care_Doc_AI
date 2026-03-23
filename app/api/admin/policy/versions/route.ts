import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const versions = await db.promptVersion.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, version: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const settings = await db.agencySettings.findUnique({
    where: { agencyId: user.agencyId },
    select: { policyExtract: true },
  })

  return NextResponse.json({ versions, currentExtract: settings?.policyExtract ?? null })
}

export async function POST(request: NextRequest) {
  // Restore a previous prompt version as the active version
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  let body: { versionId?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  if (!body.versionId) return errorResponse('versionId required', 'MISSING_FIELDS')

  const version = await db.promptVersion.findFirst({
    where: { id: body.versionId, agencyId: user.agencyId },
  })
  if (!version) return errorResponse('Version not found', 'NOT_FOUND', 404)

  await db.$transaction([
    db.promptVersion.updateMany({
      where: { agencyId: user.agencyId, active: true },
      data: { active: false },
    }),
    db.promptVersion.update({
      where: { id: body.versionId },
      data: { active: true },
    }),
  ])

  return NextResponse.json({ success: true, activated: version.version })
}
