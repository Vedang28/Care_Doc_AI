'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Wellbeing = 'good' | 'neutral' | 'concerns'

interface FamilyVisit {
  id: string
  checkInAt: string
  checkOutAt: string | null
  durationMinutes: number | null
  familySummary: string | null
  hasFlags: boolean
  taskCategories: string[]
  wellbeing: Wellbeing
}

interface ClientInfo {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wellbeingEmoji(w: Wellbeing): { emoji: string; label: string } {
  if (w === 'good')     return { emoji: '😊', label: 'Good visit' }
  if (w === 'concerns') return { emoji: '😟', label: 'Some concerns noted' }
  return                       { emoji: '😐', label: 'Neutral visit' }
}

function formatVisitTime(checkInAt: string, checkOutAt: string | null, durationMinutes: number | null) {
  const start = formatTime(checkInAt)
  if (!checkOutAt) return start
  const end = formatTime(checkOutAt)
  const dur = durationMinutes ? ` (${durationMinutes} min)` : ''
  return `${start} – ${end}${dur}`
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-care-light p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-care-light rounded w-2/3" />
      <div className="h-4 bg-care-light rounded w-full" />
      <div className="h-4 bg-care-light rounded w-4/5" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 bg-care-light rounded-full w-24" />
        <div className="h-6 bg-care-light rounded-full w-20" />
      </div>
      <div className="h-4 bg-care-light rounded w-28 pt-1" />
    </div>
  )
}

// ─── Visit card ───────────────────────────────────────────────────────────────

function VisitCard({
  visit,
  clientSlug,
  token,
}: {
  visit: FamilyVisit
  clientSlug: string
  token: string
}) {
  const { emoji, label } = wellbeingEmoji(visit.wellbeing)
  const dateStr = formatDate(visit.checkInAt)
  // Extract day-of-week
  const dayOfWeek = new Date(visit.checkInAt).toLocaleDateString('en-GB', { weekday: 'long' })
  const timeStr = formatVisitTime(visit.checkInAt, visit.checkOutAt, visit.durationMinutes)

  const summary = visit.familySummary?.trim()
    ? visit.familySummary
    : 'Your relative had a care visit today. The caregiver completed their scheduled tasks.'

  return (
    <article className="bg-white rounded-2xl border border-care-light p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Date + time */}
      <p className="text-sm font-medium text-slate-mid">
        {dayOfWeek}, {dateStr} &middot; {timeStr}
      </p>

      {/* Wellbeing + summary */}
      <div className="space-y-1">
        <p className="text-base font-medium text-slate-deep">
          <span role="img" aria-label={label} className="mr-1.5">{emoji}</span>
          {summary}
        </p>
      </div>

      {/* Task categories */}
      {visit.taskCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-0.5" role="list" aria-label="Completed care tasks">
          {visit.taskCategories.map((cat) => (
            <span
              key={cat}
              role="listitem"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-care-pale text-care text-xs font-medium border border-care-light"
            >
              <span aria-hidden="true">✓</span>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Flag notice */}
      {visit.hasFlags && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-700 font-medium">
            ⚠ Some concerns were noted during this visit.
          </p>
        </div>
      )}

      {/* View details link */}
      <div className="pt-1">
        <Link
          href={`/portal/${clientSlug}/visits/${visit.id}?token=${token}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-care hover:text-care-dark transition-colors focus:outline-none focus:underline"
          aria-label={`View visit details for ${dayOfWeek}, ${dateStr}`}
        >
          View Details
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalClientPage() {
  const params = useParams<{ clientSlug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') ?? ''
  const clientSlug = params.clientSlug

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [visits, setVisits] = useState<FamilyVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.replace('/portal/login')
      return
    }

    fetch(`/api/portal/${clientSlug}/visits?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/portal/login')
          return null
        }
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setClient(data.client)
        setVisits(data.visits)
      })
      .catch(() => router.replace('/portal/login'))
      .finally(() => setLoading(false))
  }, [clientSlug, token, router])

  return (
    <div className="min-h-screen font-body">
      {/* Header bar */}
      <header className="bg-white border-b border-care-light sticky top-0 z-10">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-semibold text-care-dark">
            <span className="text-care">CareDoc</span> AI
          </span>
          {client && (
            <span className="text-sm font-medium text-slate-mid truncate ml-4 text-right">
              {client.name}&apos;s Care Updates
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl" role="img" aria-label="Calendar">📅</p>
            <p className="text-slate-mid text-base">No visits have been recorded yet.</p>
          </div>
        ) : (
          visits.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              clientSlug={clientSlug}
              token={token}
            />
          ))
        )}
      </main>
    </div>
  )
}
