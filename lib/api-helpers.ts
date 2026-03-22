import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Role } from '@prisma/client'
import type { SessionUser } from '@/types'

export function errorResponse(error: string, code: string, status = 400, details?: unknown) {
  return NextResponse.json({ error, code, details }, { status })
}

export async function requireAuth(minRole?: Role): Promise<SessionUser | NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return errorResponse('Unauthorised', 'UNAUTHORISED', 401)
  }

  const user = session.user as unknown as SessionUser

  if (minRole) {
    const roleOrder: Role[] = ['CAREGIVER', 'SENIOR_CARER', 'MANAGER', 'ADMIN']
    const userLevel = roleOrder.indexOf(user.role)
    const requiredLevel = roleOrder.indexOf(minRole)
    if (userLevel < requiredLevel) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }
  }

  return user
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
