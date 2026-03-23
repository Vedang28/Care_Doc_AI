import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const settingsSchema = z.object({
  brandColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().nullable().optional(),
  notifyOnFlags: z.boolean().optional(),
  notifyEmail: z.string().email().nullable().optional(),
  timezone: z.string().optional(),
})

interface RouteParams {
  params: { agencyId: string }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const settings = await db.agencySettings.findUnique({
      where: { agencyId: params.agencyId },
    })

    if (!settings) return errorResponse('Settings not found', 'NOT_FOUND', 404)

    return NextResponse.json(settings)
  } catch (error) {
    return errorResponse('Failed to fetch settings', 'FETCH_ERROR', 500, error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    const settings = await db.agencySettings.upsert({
      where: { agencyId: params.agencyId },
      create: { agencyId: params.agencyId, ...parsed.data },
      update: parsed.data,
    })
    return NextResponse.json(settings)
  } catch (error) {
    return errorResponse('Failed to update settings', 'UPDATE_ERROR', 500, error)
  }
}
