import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

const brandSchema = z.object({
  brandColour: z
    .string()
    .refine(isValidHex, { message: 'Must be a valid 6-digit hex colour (e.g. #2D6A4F)' })
    .optional(),
  logoUrl: z.string().url({ message: 'Must be a valid URL' }).nullable().optional(),
})

export async function PUT(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = brandSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { brandColour, logoUrl } = parsed.data

  try {
    const settings = await db.agencySettings.upsert({
      where: { agencyId: userOrError.agencyId },
      create: {
        agencyId: userOrError.agencyId,
        ...(brandColour !== undefined && { brandColour }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      update: {
        ...(brandColour !== undefined && { brandColour }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    return errorResponse('Failed to update brand settings', 'UPDATE_ERROR', 500, error)
  }
}
