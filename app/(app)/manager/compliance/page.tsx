'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── TypeScript interfaces ──────────────────────────────────────────────────

interface ComplianceScore {
  overall: number
  completionRate: number
  flagResolutionRate: number
  documentationQuality: number
  caregiverSignOffRate: number
  trend: 'improving' | 'stable' | 'declining'
}

interface DailyScore {
  date: string
  score: number
}

interface ClientRisk {
  id: string
  name: string
  lastVisitAt: string | null
  flagCount: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  isOverdue: boolean
}

interface CaregiverSummary {
  id: string
  name: string
  reportsSubmitted: number
  avgQualityScore: number | null
  flagsRaised: number
}

interface ComplianceData {
  score: ComplianceScore
  history: DailyScore[]
  clientRisk: ClientRisk[]
  caregiverSummary: CaregiverSummary[]
}

interface Theme {
  theme: string
  frequency: number
  sentiment: 'concern' | 'positive' | 'neutral'
  example: string
}

interface ThemeData {
  themes: Theme[]
  topConcerns: string[]
  positivePatterns: string[]
  message?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColour(score: number): string {
  if (score >= 80) return 'text-care-dark'
  if (score >= 60) return 'text-amber-700'
  return 'text-red-700'
}

function scoreBarColour(score: number): string {
  if (score >= 80) return 'bg-care'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function qualityColour(score: number | null): string {
  if (score === null) return 'text-slate-mid'
  if (score >= 80) return 'text-care-dark'
  if (score >= 60) return 'text-amber-700'
  return 'text-red-700'
}

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreCard({
  label,
  value,
  trend,
}: {
  label: string
  value: number
  trend?: ComplianceScore['trend']
}) {
  const TrendIcon =
    trend === 'improving'
      ? TrendingUp
      : trend === 'declining'
        ? TrendingDown
        : Minus

  const trendColour =
    trend === 'improving'
      ? 'text-care'
      : trend === 'declining'
        ? 'text-red-600'
        : 'text-amber-600'

  return (
    <div className="bg-white border border-border-soft rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-5xl font-display font-bold ${scoreColour(value)}`}>
          {value}
        </span>
        {trend && (
          <TrendIcon className={`h-5 w-5 ${trendColour} shrink-0`} />
        )}
      </div>
      <p className="text-sm text-slate-mid">{label}</p>
      {/* thin progress bar */}
      <div className="h-1 w-full bg-border-light rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarColour(value)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

function SkeletonScoreCard() {
  return <Skeleton className="h-28" />
}

function ThemePill({ theme }: { theme: Theme }) {
  const bgClass =
    theme.sentiment === 'concern'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : theme.sentiment === 'positive'
        ? 'bg-care-light text-care-dark border border-green-200'
        : 'bg-surface text-slate-mid border border-border-light'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${bgClass}`}>
      {theme.theme}
      <span className="font-bold">{theme.frequency}</span>
    </span>
  )
}

function RiskBadge({ level }: { level: ClientRisk['riskLevel'] }) {
  const cls =
    level === 'HIGH'
      ? 'bg-red-50 border-red-200 text-red-700'
      : level === 'MEDIUM'
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-care-light border-green-200 text-care-dark'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {level}
    </span>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const router = useRouter()
  const [data, setData] = useState<ComplianceData | null>(null)
  const [themes, setThemes] = useState<ThemeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [themesLoading, setThemesLoading] = useState(false)

  useEffect(() => {
    fetch('/api/manager/compliance?days=30')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    setThemesLoading(true)
    fetch('/api/manager/compliance/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then(setThemes)
      .catch(() => {})
      .finally(() => setThemesLoading(false))
  }, [])

  // ── Error state ──────────────────────────────────────────────────────────
  if (!loading && data === null) {
    return (
      <div className="space-y-4">
        <Link href="/manager">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} className="-ml-2">
            Back to Reports
          </Button>
        </Link>
        <div className="text-center py-16 text-slate-mid text-sm">
          Failed to load compliance data. Please try again.
        </div>
      </div>
    )
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-7 w-56 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonScoreCard key={i} />
          ))}
        </div>
        {/* Chart */}
        <div className="bg-white border border-border-soft rounded-xl p-4">
          <Skeleton className="h-4 w-36 mb-4" />
          <Skeleton className="h-56 w-full" />
        </div>
        {/* Two-col panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        {/* Caregiver table */}
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  // ── Render (data is non-null here) ───────────────────────────────────────
  const { score, history, clientRisk, caregiverSummary } = data!

  const hasHistory = history.length >= 5

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <Link href="/manager">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} className="-ml-2 mb-2">
            Back to Reports
          </Button>
        </Link>
        <h1 className="font-display text-2xl font-bold text-care-dark">Compliance Dashboard</h1>
        <p className="text-slate-mid text-sm mt-1">30-day compliance overview · {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* ── Score cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard
          label="Overall Score"
          value={score.overall}
          trend={score.trend}
        />
        <ScoreCard
          label="Completion Rate"
          value={score.completionRate}
        />
        <ScoreCard
          label="Flag Resolution"
          value={score.flagResolutionRate}
        />
        <ScoreCard
          label="Documentation Quality"
          value={score.documentationQuality}
        />
      </div>

      {/* ── Line chart ── */}
      <div className="bg-white border border-border-soft rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-4">
          Score History — Last 30 Days
        </p>
        {hasHistory ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(d: string) => {
                  const date = new Date(d)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                formatter={(value: unknown) => [`${value}`, 'Score']}
                labelFormatter={(label: unknown) => {
                  try { return new Date(String(label)).toLocaleDateString('en-GB') } catch { return String(label) }
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2D6A4F"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-slate-mid text-sm text-center px-4">
            Not enough data yet. Complete at least 5 visits to see your compliance score.
          </div>
        )}
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Key Themes Panel ── */}
        <div className="bg-white border border-border-soft rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide">
            Key Themes This Month
          </p>

          {themesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>
          ) : themes?.message ? (
            <p className="text-sm text-slate-mid">{themes.message}</p>
          ) : themes ? (
            <>
              {/* Theme pills */}
              {themes.themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.themes.map((t, i) => (
                    <ThemePill key={i} theme={t} />
                  ))}
                </div>
              )}

              {/* Top concerns */}
              {themes.topConcerns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">
                    Top Concerns
                  </p>
                  <ul className="space-y-1.5">
                    {themes.topConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-deep">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Positive patterns */}
              {themes.positivePatterns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">
                    Positive Patterns
                  </p>
                  <ul className="space-y-1.5">
                    {themes.positivePatterns.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-deep">
                        <span className="mt-0.5 text-care">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-mid">Theme analysis unavailable.</p>
          )}
        </div>

        {/* ── Client Risk Overview ── */}
        <div className="bg-white border border-border-soft rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide">
            Client Risk Overview
          </p>

          {clientRisk.length === 0 ? (
            <p className="text-sm text-slate-mid">No active clients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light">
                    {['Client', 'Last Visit', 'Flags', 'Risk', 'Overdue'].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-2 pr-3 text-[11px] font-semibold text-slate-mid uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {clientRisk.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-surface transition-colors cursor-pointer"
                      onClick={() => router.push(`/manager/clients/${client.id}`)}
                    >
                      <td className="py-2.5 pr-3 font-medium text-slate-deep whitespace-nowrap">
                        {client.name}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-mid whitespace-nowrap">
                        {formatLastVisit(client.lastVisitAt)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-mid">
                        {client.flagCount > 0 ? (
                          <span className="font-semibold text-care-accent">{client.flagCount}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <RiskBadge level={client.riskLevel} />
                      </td>
                      <td className="py-2.5">
                        {client.isOverdue ? (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 border-red-200 text-red-700">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="text-slate-mid text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Caregiver Performance Summary ── */}
      <div className="bg-white border border-border-soft rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide">
            Team Documentation Performance
          </p>
          <p className="text-xs text-slate-mid mt-1">
            This data is for quality improvement purposes, not performance management.
          </p>
        </div>

        {caregiverSummary.length === 0 ? (
          <p className="text-sm text-slate-mid">No caregiver data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  {['Caregiver', 'Reports', 'Avg Quality', 'Flags'].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-2 pr-4 text-[11px] font-semibold text-slate-mid uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {caregiverSummary.map((cg) => (
                  <tr key={cg.id} className="hover:bg-surface transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-slate-deep whitespace-nowrap">
                      {cg.name}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-mid">{cg.reportsSubmitted}</td>
                    <td className="py-2.5 pr-4">
                      {cg.avgQualityScore !== null ? (
                        <span className={`font-semibold ${qualityColour(cg.avgQualityScore)}`}>
                          {cg.avgQualityScore}
                        </span>
                      ) : (
                        <span className="text-slate-mid">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-mid">{cg.flagsRaised}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
