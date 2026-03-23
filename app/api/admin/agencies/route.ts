import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
import { hash } from 'bcryptjs'

const createAgencySchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with hyphens'),
  subdomain: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/).optional(),
  contactEmail: z.string().email(),
  timezone: z.string().default('Europe/London'),
  // First manager credentials
  managerName: z.string().min(2),
  managerEmail: z.string().email(),
  managerPassword: z.string().min(8),
})

export async function GET() {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  try {
    const agencies = await db.agency.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        subdomain: true,
        plan: true,
        active: true,
        createdAt: true,
        _count: { select: { users: true, visits: true } },
        settings: { select: { notifyOnFlags: true, timezone: true } },
      },
    })

    return NextResponse.json(agencies)
  } catch (error) {
    return errorResponse('Failed to fetch agencies', 'FETCH_ERROR', 500, error)
  }
}

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = createAgencySchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { name, code, subdomain, contactEmail, timezone, managerName, managerEmail, managerPassword } = parsed.data

  try {
    // Check uniqueness
    const existing = await db.agency.findFirst({
      where: { OR: [{ code }, ...(subdomain ? [{ subdomain }] : [])] },
    })
    if (existing) {
      return errorResponse('Agency code or subdomain already in use', 'DUPLICATE', 409)
    }

    const passwordHash = await hash(managerPassword, 12)

    const agency = await db.$transaction(async (tx) => {
      const newAgency = await tx.agency.create({
        data: { name, code, subdomain, plan: 'starter', active: true },
      })

      await tx.agencySettings.create({
        data: {
          agencyId: newAgency.id,
          notifyEmail: contactEmail,
          timezone,
        },
      })

      await tx.user.create({
        data: {
          agencyId: newAgency.id,
          name: managerName,
          email: managerEmail,
          passwordHash,
          role: 'MANAGER',
        },
      })

      return newAgency
    })

    return NextResponse.json({ agencyId: agency.id, code: agency.code }, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to create agency', 'CREATE_ERROR', 500, error)
  }
}
