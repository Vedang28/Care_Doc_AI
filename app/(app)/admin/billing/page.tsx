'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, Zap, Building2, Rocket } from 'lucide-react'

// ─── Plan display data ────────────────────────────────────────────────────────

type PlanKey = 'starter' | 'growth' | 'enterprise'

const PLAN_DISPLAY: Record<
  PlanKey,
  {
    name: string
    price: string
    description: string
    icon: React.ElementType
    colour: string
    features: string[]
    unavailable: string[]
  }
> = {
  starter: {
    name: 'Starter',
    price: '£49',
    description: 'For small agencies getting started',
    icon: Rocket,
    colour: 'text-slate-deep',
    features: [
      'Up to 10 caregivers',
      'Up to 20 clients',
      '500 reports / month',
      'Basic compliance dashboard',
      'Email support',
    ],
    unavailable: [
      'AI writing suggestions',
      'Family portal',
      'MAR module',
      'PDF exports',
      'White-label',
      'API access',
    ],
  },
  growth: {
    name: 'Growth',
    price: '£149',
    description: 'For growing agencies that need more',
    icon: Zap,
    colour: 'text-care',
    features: [
      'Unlimited caregivers',
      'Unlimited clients',
      'Unlimited reports',
      'AI writing suggestions',
      'Family portal',
      'MAR module',
      'PDF exports',
      'Priority support',
    ],
    unavailable: ['White-label branding', 'API access'],
  },
  enterprise: {
    name: 'Enterprise',
    price: '£499',
    description: 'For large agencies needing full control',
    icon: Building2,
    colour: 'text-care-dark',
    features: [
      'Everything in Growth',
      'White-label branding',
      'Custom domain',
      'Public API access',
      'Dedicated support',
      'SLA guarantee',
    ],
    unavailable: [],
  },
}

// ─── Feature comparison table data ───────────────────────────────────────────

type FeatureCell = boolean | string

interface ComparisonRow {
  name: string
  starter: FeatureCell
  growth: FeatureCell
  enterprise: FeatureCell
}

const COMPARISON_FEATURES: ComparisonRow[] = [
  { name: 'Caregivers',           starter: '10',        growth: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Clients',              starter: '20',        growth: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Reports/month',        starter: '500',       growth: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'AI suggestions',       starter: false,       growth: true,        enterprise: true },
  { name: 'Family portal',        starter: false,       growth: true,        enterprise: true },
  { name: 'MAR module',           starter: false,       growth: true,        enterprise: true },
  { name: 'PDF exports',          starter: false,       growth: true,        enterprise: true },
  { name: 'White-label branding', starter: false,       growth: false,       enterprise: true },
  { name: 'API access',           starter: false,       growth: false,       enterprise: true },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingData {
  currentPlan: PlanKey
  subscriptionStatus: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCellContent({ value, isCurrent }: { value: FeatureCell; isCurrent: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className={`text-sm font-medium ${isCurrent ? 'text-care-dark' : 'text-slate-deep'}`}>
        {value}
      </span>
    )
  }
  if (value) {
    return <Check className={`h-4 w-4 mx-auto ${isCurrent ? 'text-care' : 'text-green-500'}`} />
  }
  return <X className="h-4 w-4 mx-auto text-slate-mid opacity-40" />
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  targetPlan: PlanKey
  onClose: () => void
}

function UpgradeModal({ targetPlan, onClose }: UpgradeModalProps) {
  const plan = PLAN_DISPLAY[targetPlan]
  const Icon = plan.icon
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: targetPlan.toUpperCase() }),
      })
      const data = await res.json() as { url?: string; error?: string; notConfigured?: boolean }

      if (data.notConfigured) {
        setError('Stripe not yet configured. Contact support to upgrade.')
        return
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-deep/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-light">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-care-pale">
              <Icon className={`h-5 w-5 ${plan.colour}`} />
            </div>
            <div>
              <p className="font-bold text-slate-deep text-lg leading-tight">{plan.name} Plan</p>
              <p className="text-slate-mid text-sm">{plan.description}</p>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-care-dark">
            {plan.price}
            <span className="text-base font-normal text-slate-mid"> / month</span>
          </p>
        </div>

        {/* Features list */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-3">
            What&apos;s included
          </p>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-deep">
                <Check className="h-4 w-4 text-care shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" loading={loading} onClick={() => void handleCheckout()}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [upgradeTarget, setUpgradeTarget] = useState<PlanKey | null>(null)

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => r.json())
      .then((d: { currentPlan: PlanKey; subscriptionStatus: string }) => {
        setData({ currentPlan: d.currentPlan, subscriptionStatus: d.subscriptionStatus })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleManageBilling() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json() as { url?: string; error?: string; notConfigured?: boolean }

      if (json.notConfigured) {
        setPortalError('Stripe not yet configured. Contact support to manage billing.')
        return
      }
      if (!res.ok || !json.url) {
        setPortalError(json.error ?? 'Could not open billing portal. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      setPortalError('Network error. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const currentPlan = data?.currentPlan ?? 'starter'
  const planDisplay = PLAN_DISPLAY[currentPlan]
  const PlanIcon = planDisplay.icon

  // Determine next upgrade target
  const upgradeMap: Partial<Record<PlanKey, PlanKey>> = {
    starter: 'growth',
    growth: 'enterprise',
  }
  const nextPlan = upgradeMap[currentPlan]

  const planOrder: PlanKey[] = ['starter', 'growth', 'enterprise']

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-care-dark">Billing &amp; Plan</h1>
          <p className="text-slate-mid text-sm mt-1">Manage your subscription and usage.</p>
        </div>

        {/* ── Current plan card ───────────────────────────────────────────────── */}
        {loading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-care-pale shrink-0">
                  <PlanIcon className={`h-6 w-6 ${planDisplay.colour}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-deep text-lg">Current Plan: {planDisplay.name}</p>
                    <Badge variant={data?.subscriptionStatus === 'active' ? 'success' : 'warning'}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1" />
                      {data?.subscriptionStatus === 'active' ? 'Active' : (data?.subscriptionStatus ?? 'Unknown')}
                    </Badge>
                  </div>
                  <p className="text-slate-mid text-sm mt-0.5">{planDisplay.description}</p>
                  <p className="mt-2 text-3xl font-bold text-care-dark">
                    {planDisplay.price}
                    <span className="text-base font-normal text-slate-mid"> / month</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  variant="secondary"
                  loading={portalLoading}
                  onClick={() => void handleManageBilling()}
                >
                  Manage Billing →
                </Button>
                {nextPlan && (
                  <Button onClick={() => setUpgradeTarget(nextPlan)}>
                    Upgrade to {PLAN_DISPLAY[nextPlan].name} →
                  </Button>
                )}
              </div>
            </div>

            {/* Portal error */}
            {portalError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {portalError}
              </div>
            )}

            {/* Included features summary */}
            <div className="mt-5 pt-5 border-t border-border-light">
              <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-3">
                Included in your plan
              </p>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {planDisplay.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-deep">
                    <Check className="h-3.5 w-3.5 text-care shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── All plans grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {planOrder.map((key) => {
            const p = PLAN_DISPLAY[key]
            const Icon = p.icon
            const isCurrent = key === currentPlan
            const isUpgradeable = planOrder.indexOf(key) > planOrder.indexOf(currentPlan)

            return (
              <div
                key={key}
                className={`bg-white rounded-xl border p-5 flex flex-col gap-4 transition-all ${
                  isCurrent
                    ? 'border-care ring-2 ring-care/20 shadow-sm'
                    : 'border-border-soft'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${p.colour}`} />
                    <p className="font-bold text-slate-deep">{p.name}</p>
                  </div>
                  {isCurrent && (
                    <Badge variant="success" className="text-[10px]">Current</Badge>
                  )}
                </div>

                <p className="text-2xl font-bold text-care-dark">
                  {p.price}
                  <span className="text-sm font-normal text-slate-mid"> / mo</span>
                </p>

                <p className="text-xs text-slate-mid">{p.description}</p>

                <ul className="space-y-1.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-deep">
                      <Check className="h-3.5 w-3.5 text-care shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {p.unavailable.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-mid opacity-50">
                      <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isUpgradeable && (
                  <Button
                    size="sm"
                    variant={key === 'enterprise' ? 'secondary' : 'default'}
                    className="w-full mt-auto"
                    onClick={() => setUpgradeTarget(key)}
                  >
                    Upgrade to {p.name}
                  </Button>
                )}
                {isCurrent && (
                  <p className="text-xs text-center text-care font-medium">Your current plan</p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Feature comparison table ────────────────────────────────────────── */}
        <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light">
            <p className="font-semibold text-slate-deep text-sm">Feature Comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-mid w-1/2">
                    Feature
                  </th>
                  {planOrder.map((key) => {
                    const isCurrent = key === currentPlan
                    return (
                      <th
                        key={key}
                        className={`px-4 py-3 text-center text-xs font-semibold w-1/6 ${
                          isCurrent ? 'text-care bg-care-pale' : 'text-slate-mid'
                        }`}
                      >
                        {PLAN_DISPLAY[key].name}
                        {isCurrent && (
                          <span className="ml-1 text-[10px] font-normal">(current)</span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {COMPARISON_FEATURES.map((row) => (
                  <tr key={row.name} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-slate-deep font-medium">{row.name}</td>
                    {planOrder.map((key) => {
                      const isCurrent = key === currentPlan
                      return (
                        <td
                          key={key}
                          className={`px-4 py-3 text-center ${isCurrent ? 'bg-care-pale/50' : ''}`}
                        >
                          <FeatureCellContent value={row[key]} isCurrent={isCurrent} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Upgrade modal ─────────────────────────────────────────────────────── */}
      {upgradeTarget && (
        <UpgradeModal
          targetPlan={upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
        />
      )}
    </>
  )
}
