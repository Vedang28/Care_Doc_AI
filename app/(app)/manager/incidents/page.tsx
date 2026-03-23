'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IncidentSlideOver } from '@/components/care/IncidentSlideOver'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Incident {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  actionsTaken: string | null
  followUpDate: string | null
  resolvedAt: string | null
  resolvedBy: string | null
  escalated: boolean
  createdAt: string
  client: { id: string; name: string }
  caregiver: { id: string; name: string }
  reportFlags: string[]
  isOverdue: boolean
}

type Filter = 'all' | 'open' | 'resolved' | 'escalated'

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'open',      label: 'Open' },
  { value: 'resolved',  label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
]

function severityRowClass(severity: string) {
  if (severity === 'CRITICAL') return 'bg-red-50/50'
  if (severity === 'HIGH')     return 'bg-amber-50/30'
  return ''
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = (() => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 text-red-900 border-red-200'
      case 'HIGH':     return 'bg-amber-50 text-amber-900 border-amber-200'
      case 'MEDIUM':   return 'bg-blue-50 text-blue-800 border-blue-200'
      default:         return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  })()
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  )
}

function StatusBadge({ incident }: { incident: Incident }) {
  if (incident.resolvedAt) {
    return <Badge variant="success">Resolved</Badge>
  }
  if (incident.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
        OVERDUE
      </span>
    )
  }
  if (incident.escalated) {
    return <Badge variant="warning">Escalated</Badge>
  }
  return <Badge variant="default">Open</Badge>
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [slideOver, setSlideOver] = useState<{ open: boolean; incident?: Incident }>({ open: false })

  const PER_PAGE = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/incidents?filter=${filter}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as Incident[]
      setIncidents(data)
      setPage(1)
    } catch {
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(incidents.length / PER_PAGE)
  const paginated = incidents.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function openSlideOver(incident: Incident) {
    setSlideOver({ open: true, incident })
  }

  function handleSaved() {
    load()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-care-dark">Incidents</h1>
        <p className="text-slate-mid text-sm mt-1">Track, manage and resolve care incidents across your agency.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface border border-border-soft rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-white text-slate-deep shadow-sm border border-border-soft'
                : 'text-slate-mid hover:text-slate-deep'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border-light">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            {filter === 'open' ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-care" />
                <p className="text-slate-deep font-medium">No open incidents.</p>
                <p className="text-slate-mid text-sm">Your team&apos;s documentation is on track.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-slate-mid" />
                <p className="text-slate-mid text-sm">No incidents found.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border-light">
                <tr>
                  {['Client', 'Date', 'Severity', 'Title', 'Assigned To', 'Follow-up', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-slate-mid uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {paginated.map((incident) => (
                  <tr
                    key={incident.id}
                    className={`transition-colors hover:brightness-95 ${severityRowClass(incident.severity)}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-deep whitespace-nowrap">
                      {incident.client.name}
                    </td>
                    <td className="px-4 py-3 text-slate-mid whitespace-nowrap">
                      {formatDate(incident.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-4 py-3 text-slate-deep max-w-[200px] truncate">
                      {incident.title}
                    </td>
                    <td className="px-4 py-3 text-slate-mid whitespace-nowrap">
                      {incident.caregiver.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {incident.followUpDate ? (
                        <span className={incident.isOverdue && !incident.resolvedAt ? 'text-red-700 font-medium' : 'text-slate-mid'}>
                          {formatDate(incident.followUpDate)}
                        </span>
                      ) : (
                        <span className="text-slate-mid">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge incident={incident} />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSlideOver(incident)}
                      >
                        {incident.resolvedAt ? 'View' : 'View / Resolve'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-mid">
          <span>{incidents.length} incidents total</span>
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {slideOver.open && slideOver.incident && (
        <IncidentSlideOver
          open={slideOver.open}
          onClose={() => setSlideOver({ open: false })}
          mode="view"
          incident={slideOver.incident}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
