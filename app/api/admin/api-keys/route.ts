import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { generateApiKey, hashApiKey } from '@/lib/api-keys'

export const dynamic = 'force-dynamic'

const VALID_SCOPES = ['reports:read', 'clients:read', 'clients:write']

export async function GET() {
  const user = await requireAuth('ADMIN')
  if (isNextResponse(user)) return user

  const keys = await db.apiKey.findMany({
    where: { agencyId: user.agencyId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth('ADMIN')
  if (isNextResponse(user)) return user

  let body: { name?: string; scopes?: string[] }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_BODY', 400)
  }

  if (!body.name || typeof body.name !== 'string') {
    return errorResponse('name is required', 'VALIDATION_ERROR', 400)
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return errorResponse('scopes must be a non-empty array', 'VALIDATION_ERROR', 400)
  }

  const invalidScopes = body.scopes.filter((s) => !VALID_SCOPES.includes(s))
  if (invalidScopes.length > 0) {
    return errorResponse(
      `Invalid scopes: ${invalidScopes.join(', ')}. Valid scopes: ${VALID_SCOPES.join(', ')}`,
      'VALIDATION_ERROR',
      400,
    )
  }

  const agency = await db.agency.findUnique({
    where: { id: user.agencyId },
    select: { code: true },
  })

  if (!agency) {
    return errorResponse('Agency not found', 'NOT_FOUND', 404)
  }

  const { key, prefix } = generateApiKey(agency.code)
  const keyHash = await hashApiKey(key)

  const created = await db.apiKey.create({
    data: {
      agencyId: user.agencyId,
      name: body.name,
      keyHash,
      keyPrefix: prefix,
      scopes: body.scopes,
    },
  })

  return NextResponse.json(
    { key, id: created.id, name: created.name, prefix, scopes: created.scopes },
    { status: 201 },
  )
}
