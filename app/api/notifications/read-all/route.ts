import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function PATCH() {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  try {
    await db.notification.updateMany({
      where: { userId: userOrError.id, read: false },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('Failed to mark all read', 'UPDATE_ERROR', 500, error)
  }
}
