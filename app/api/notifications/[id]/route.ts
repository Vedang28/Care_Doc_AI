import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams { params: { id: string } }

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  try {
    const notification = await db.notification.findFirst({
      where: { id: params.id, userId: userOrError.id },
    })
    if (!notification) return errorResponse('Notification not found', 'NOT_FOUND', 404)

    const updated = await db.notification.update({
      where: { id: params.id },
      data: { read: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse('Failed to mark notification read', 'UPDATE_ERROR', 500, error)
  }
}
