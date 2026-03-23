import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const updateAgencySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  active: z.boolean().optional(),
  plan: z.string().optional(),
})

interface RouteParams {
  params: { agencyId: string }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const agency = await db.agency.findUnique({
      where: { id: params.agencyId },
      include: {
        settings: true,
        _count: { select: { users: true, clients: true, visits: true, reports: true } },
      },
    })

    if (!agency) return errorResponse('Agency not found', 'NOT_FOUND', 404)

    return NextResponse.json(agency)
  } catch (error) {
    return errorResponse('Failed to fetch agency', 'FETCH_ERROR', 500, error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = updateAgencySchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  try {
    const agency = await db.agency.update({
      where: { id: params.agencyId },
      data: parsed.data,
    })
    return NextResponse.json(agency)
  } catch (error) {
    return errorResponse('Failed to update agency', 'UPDATE_ERROR', 500, error)
  }
}
