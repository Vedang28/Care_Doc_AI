export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
    limits: {
      caregivers: 10,
      clients: 20,
      reportsPerMonth: 500,
      aiSuggestionsEnabled: false,
      familyPortalEnabled: false,
      marEnabled: false,
      exportEnabled: false,
      whiteLabelEnabled: false,
      apiAccessEnabled: false,
    },
  },
  GROWTH: {
    name: 'Growth',
    price: 149,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? '',
    limits: {
      caregivers: -1,
      clients: -1,
      reportsPerMonth: -1,
      aiSuggestionsEnabled: true,
      familyPortalEnabled: true,
      marEnabled: true,
      exportEnabled: true,
      whiteLabelEnabled: false,
      apiAccessEnabled: false,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
    limits: {
      caregivers: -1,
      clients: -1,
      reportsPerMonth: -1,
      aiSuggestionsEnabled: true,
      familyPortalEnabled: true,
      marEnabled: true,
      exportEnabled: true,
      whiteLabelEnabled: true,
      apiAccessEnabled: true,
    },
  },
} as const

export type PlanKey = keyof typeof PLANS
export type PlanLimits = (typeof PLANS)[PlanKey]['limits']
export type FeatureKey = keyof PlanLimits
