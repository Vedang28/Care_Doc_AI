'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportModal } from '@/components/care/ExportModal'
import { formatDate, formatDuration, formatTime } from '@/lib/utils'
import { ArrowLeft, Calendar, FileDown, Flag, MapPin, User } from 'lucide-react'

interface ClientPageProps {
  params: { clientId: string }
}

interface VisitRow {
  id: string
  checkInAt: string
  checkOutAt: string | null
  status: string
  caregiver: { name: string }
  tasks: { id: string }[]
  report: { id: string; flags: string[]; status: string } | null
}

interface ClientDetail {
  id: string
  name: string
  address: string
  conditions: string[]
  carePlan: string
  risks: string | null
  visitFrequencyDays: number
  visits: VisitRow[]
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'APPROVED') return 'success'
  if (status === 'FLAGGED') return 'danger'
  return 'warning'
}

function visitStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'COMPLETED') return 'success'
  if (status === 'MISSED') return 'danger'
  if (status === 'IN_PROGRESS') return 'warning'
  return 'default'
}

export default function ClientDetailPage({ params }: ClientPageProps) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/manager/clients/${params.clientId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setClient)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.clientId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-mid">Client not found.</p>
        <Link href="/manager">
          <Button variant="ghost" className="mt-4" icon={<ArrowLeft className="h-4 w-4" />}>
            All Clients
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* Back + heading */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/manager">
              <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} className="mb-2 -ml-2">
                All Clients
              </Button>
            </Link>
            <h1 className="font-display text-xl font-bold text-care-dark">{client.name}</h1>
          </div>
          <Button
            onClick={() => setExportOpen(true)}
            icon={<FileDown className="h-4 w-4" />}
          >
            Generate Inspection Pack
          </Button>
        </div>

        {/* Client header card */}
        <div className="bg-white border border-border-soft rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 text-slate-mid mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-mid uppercase tracking-wide font-semibold">Address</p>
                <p className="text-sm text-slate-deep mt-0.5">{client.address}</p>
              </div>
            </div>

            {/* Visit frequency */}
            <div className="flex gap-3">
              <Calendar className="h-4 w-4 text-slate-mid mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-mid uppercase tracking-wide font-semibold">Visit Frequency</p>
                <p className="text-sm text-slate-deep mt-0.5">
                  {client.visitFrequencyDays > 1
                    ? `Expected every ${client.visitFrequencyDays} days`
                    : 'Daily visits expected'}
                </p>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {client.conditions.length > 0 && (
            <div>
              <p className="text-[11px] text-slate-mid uppercase tracking-wide font-semibold mb-2">Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {client.conditions.map((c) => (
                  <Badge key={c} variant="warning">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Care plan */}
          <div>
            <p className="text-[11px] text-slate-mid uppercase tracking-wide font-semibold mb-1">Care Plan</p>
            <p className="text-sm text-slate-deep leading-relaxed">{client.carePlan}</p>
          </div>

          {/* Risks */}
          {client.risks && (
            <div className="rounded-lg bg-care-accent-light border border-orange-200 p-3">
              <p className="text-[11px] text-care-accent uppercase tracking-wide font-semibold mb-1">Risk Notes</p>
              <p className="text-sm text-care-accent">{client.risks}</p>
            </div>
          )}
        </div>

        {/* Visit history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-care-dark">Visit History</h2>
            <p className="text-xs text-slate-mid">Last {client.visits.length} visits</p>
          </div>

          <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
            {client.visits.length === 0 ? (
              <div className="text-center py-12 text-slate-mid text-sm">No visits recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface border-b border-border-light">
                    <tr>
                      {['Date', 'Caregiver', 'Duration', 'Tasks', 'Flags', 'Status'].map((h) => (
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
                    {client.visits.map((v) => {
                      const flagCount = v.report?.flags?.length ?? 0
                      const reportStatus = v.report?.status
                      return (
                        <tr key={v.id} className="hover:bg-surface transition-colors">
                          {/* Date */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-slate-deep font-medium">{formatDate(v.checkInAt)}</p>
                            <p className="text-xs text-slate-mid">{formatTime(v.checkInAt)}</p>
                          </td>

                          {/* Caregiver */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-mid shrink-0" />
                              <span className="text-slate-deep">{v.caregiver.name}</span>
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-slate-mid whitespace-nowrap">
                            {v.checkOutAt ? formatDuration(v.checkInAt, v.checkOutAt) : '—'}
                          </td>

                          {/* Tasks */}
                          <td className="px-4 py-3 text-slate-mid">
                            {v.tasks.length}
                          </td>

                          {/* Flags */}
                          <td className="px-4 py-3">
                            {flagCount > 0 ? (
                              <Badge variant="danger" className="gap-1">
                                <Flag className="h-3 w-3" />
                                {flagCount}
                              </Badge>
                            ) : (
                              <span className="text-slate-mid">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {reportStatus ? (
                              <Badge variant={statusBadgeVariant(reportStatus)}>
                                {reportStatus}
                              </Badge>
                            ) : (
                              <Badge variant={visitStatusBadgeVariant(v.status)}>
                                {v.status}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export modal */}
      <ExportModal
        clientId={client.id}
        clientName={client.name}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </>
  )
}
