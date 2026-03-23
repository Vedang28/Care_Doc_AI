'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Wellbeing = 'good' | 'neutral' | 'concerns'

interface VisitDetail {
  id: string
  checkInAt: string
  checkOutAt: string | null
  durationMinutes: number | null
  familySummary: string | null
  hasFlags: boolean
  taskCategories: string[]
  wellbeing: Wellbeing
  clientName: string
  reportUpdatedAt?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wellbeingEmoji(w: Wellbeing): { emoji: string; label: string; text: string } {
  if (w === 'good')     return { emoji: '😊', label: 'Good visit',          text: 'had a good visit.' }
  if (w === 'concerns') return { emoji: '😟', label: 'Concerns noted',      text: 'had some concerns noted during this visit.' }
  return                       { emoji: '😐', label: 'Neutral visit',        text: 'had a routine visit.' }
}

function formatDurationText(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-care-light rounded w-24" />
      <div className="bg-white rounded-2xl border border-care-light p-5 space-y-3">
        <div className="h-5 bg-care-light rounded w-3/5" />
        <div className="h-4 bg-care-light rounded w-full" />
        <div className="h-4 bg-care-light rounded w-4/5" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-care-light rounded-full w-28" />
          <div className="h-6 bg-care-light rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalVisitDetailPage() {
  const params = useParams<{ clientSlug: string; visitId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') ?? ''
  const { clientSlug, visitId } = params

  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.replace('/portal/login')
      return
    }

    fetch(`/api/portal/${clientSlug}/visits/${visitId}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/portal/login')
          return null
        }
        if (res.status === 404) {
          router.replace(`/portal/${clientSlug}?token=${token}`)
          return null
        }
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        if (data) setVisit(data)
      })
      .catch(() => router.replace('/portal/login'))
      .finally(() => setLoading(false))
  }, [clientSlug, visitId, token, router])

  const backHref = `/portal/${clientSlug}?token=${token}`

  return (
    <div className="min-h-screen font-body">
      {/* Header bar */}
      <header className="bg-white border-b border-care-light sticky top-0 z-10">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-semibold text-care-dark">
            <span className="text-care">CareDoc</span> AI
          </span>
          {visit && (
            <span className="text-sm font-medium text-slate-mid truncate ml-4 text-right">
              {visit.clientName}&apos;s Care Updates
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 py-6 space-y-5">
        {/* Back link */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-care hover:text-care-dark transition-colors focus:outline-none focus:underline"
          aria-label="Back to all care updates"
        >
          <span aria-hidden="true">←</span>
          Back to care updates
        </Link>

        {loading ? (
          <Skeleton />
        ) : !visit ? null : (
          <div className="space-y-4">
            {/* Date / time / duration */}
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold text-care-dark font-body">
                {new Date(visit.checkInAt).toLocaleDateString('en-GB', { weekday: 'long' })},{' '}
                {formatDate(visit.checkInAt)}
              </h1>
              <p className="text-sm text-slate-mid">
                {formatTime(visit.checkInAt)}
                {visit.checkOutAt && (
                  <> &ndash; {formatTime(visit.checkOutAt)}</>
                )}
                {visit.durationMinutes && (
                  <> &middot; {formatDurationText(visit.durationMinutes)}</>
                )}
              </p>
            </div>

            {/* Wellbeing + summary card */}
            <div className="bg-white rounded-2xl border border-care-light p-5 space-y-3 shadow-sm">
              {(() => {
                const { emoji, label, text } = wellbeingEmoji(visit.wellbeing)
                const summary = visit.familySummary?.trim()
                  ? visit.familySummary
                  : `Your relative ${text}`
                return (
                  <>
                    <div className="flex items-start gap-3">
                      <span
                        className="text-3xl shrink-0 mt-0.5"
                        role="img"
                        aria-label={label}
                      >
                        {emoji}
                      </span>
                      <p className="text-base text-slate-deep leading-relaxed">{summary}</p>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Task categories */}
            {visit.taskCategories.length > 0 && (
              <div className="bg-white rounded-2xl border border-care-light p-5 space-y-3 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-mid uppercase tracking-wide font-body">
                  Care completed
                </h2>
                <ul
                  className="space-y-2"
                  role="list"
                  aria-label="Completed care tasks"
                >
                  {visit.taskCategories.map((cat) => (
                    <li
                      key={cat}
                      className="flex items-center gap-2.5 text-slate-deep text-sm"
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full bg-care-pale border border-care-light flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="text-care text-xs font-bold">✓</span>
                      </span>
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flag notice */}
            {visit.hasFlags && (
              <div
                className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-1"
                role="alert"
              >
                <p className="text-sm font-semibold text-amber-800">
                  ⚠ Concerns noted
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your caregiver noted some concerns during this visit. You may wish to
                  speak with the agency for more information.
                </p>
              </div>
            )}

            {/* Last updated */}
            {visit.reportUpdatedAt && (
              <p className="text-xs text-slate-mid text-center pb-2">
                Last updated {formatDate(visit.reportUpdatedAt)} at{' '}
                {formatTime(visit.reportUpdatedAt)}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
