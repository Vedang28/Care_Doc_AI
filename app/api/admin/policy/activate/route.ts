import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import type { PolicyExtract } from '@/lib/ai/prompts'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  let body: { extract: PolicyExtract; filename?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  if (!body.extract) return errorResponse('extract required', 'MISSING_FIELDS')

  // Build the custom system prompt from the policy extract
  const customPrompt = buildSystemPrompt(undefined, body.extract)

  // Get current highest version number for this agency
  const lastVersion = await db.promptVersion.findFirst({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  })

  const nextVersionNum = lastVersion ? parseFloat(lastVersion.version) + 0.1 : 1.0
  const versionStr = nextVersionNum.toFixed(1)

  // Deactivate existing versions, create new active one, and save extract — all in one transaction
  await db.$transaction([
    db.promptVersion.updateMany({
      where: { agencyId: user.agencyId, active: true },
      data: { active: false },
    }),
    db.promptVersion.create({
      data: {
        agencyId: user.agencyId,
        systemPrompt: customPrompt,
        version: versionStr,
        active: true,
      },
    }),
    db.agencySettings.update({
      where: { agencyId: user.agencyId },
      data: { policyExtract: body.extract as unknown as Prisma.InputJsonValue },
    }),
  ])

  await db.auditLog.create({
    data: {
      agencyId: user.agencyId,
      userId: user.id,
      action: 'POLICY_ACTIVATED',
      entityType: 'AgencySettings',
      after: { version: versionStr, filename: body.filename ?? null },
    },
  })

  return NextResponse.json({ success: true, version: versionStr })
}
