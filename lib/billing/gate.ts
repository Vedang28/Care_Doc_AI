import { db } from '@/lib/db'
import { PLANS, type FeatureKey } from './plans'

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public feature: FeatureKey,
    public requiredPlan: string,
  ) {
    super(message)
    this.name = 'PlanLimitError'
  }
}

export async function checkFeatureGate(
  agencyId: string,
  feature: FeatureKey,
): Promise<boolean> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { plan: true },
  })
  const planKey = (agency?.plan?.toUpperCase() ?? 'STARTER') as keyof typeof PLANS
  const plan = PLANS[planKey] ?? PLANS.STARTER
  const allowed = plan.limits[feature]
  if (!allowed) {
    // Find which plan first enables this feature
    const requiredPlan =
      Object.entries(PLANS).find(([, p]) => p.limits[feature])?.at(1) as { name: string } | undefined
    throw new PlanLimitError(
      `${String(feature)} requires ${requiredPlan?.name ?? 'a higher'} plan`,
      feature,
      requiredPlan?.name ?? 'Growth',
    )
  }
  return true
}
