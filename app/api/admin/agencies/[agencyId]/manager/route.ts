import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
import { hash } from 'bcryptjs'

const createManagerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
})

interface RouteParams {
  params: { agencyId: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 'INVALID_JSON')
  }

  const parsed = createManagerSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { name, email, temporaryPassword } = parsed.data

  try {
    // Verify agency exists
    const agency = await db.agency.findUnique({ where: { id: params.agencyId } })
    if (!agency) return errorResponse('Agency not found', 'NOT_FOUND', 404)

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) return errorResponse('Email already in use', 'DUPLICATE', 409)

    const passwordHash = await hash(temporaryPassword, 12)

    const manager = await db.user.create({
      data: {
        agencyId: params.agencyId,
        name,
        email,
        passwordHash,
        role: 'MANAGER',
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json(manager, { status: 201 })
  } catch (error) {
    return errorResponse('Failed to create manager', 'CREATE_ERROR', 500, error)
  }
}
