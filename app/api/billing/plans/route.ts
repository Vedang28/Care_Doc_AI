import { requireAuth, isNextResponse } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/billing/plans'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  const agency = await db.agency.findUnique({
    where: { id: user.agencyId },
    select: { plan: true, subscriptionStatus: true, subscriptionId: true },
  })

  return NextResponse.json({
    plans: PLANS,
    currentPlan: agency?.plan ?? 'starter',
    subscriptionStatus: agency?.subscriptionStatus ?? 'inactive',
  })
}
