import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  try {
    const [notifications, unreadCount] = await db.$transaction([
      db.notification.findMany({
        where: { userId: userOrError.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.notification.count({
        where: { userId: userOrError.id, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return errorResponse('Failed to fetch notifications', 'FETCH_ERROR', 500, error)
  }
}
