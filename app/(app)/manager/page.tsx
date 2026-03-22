'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { ReportListItem, PaginatedResponse } from '@/types'
import { Search, Flag, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

function statusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'APPROVED') return 'success'
  if (status === 'FLAGGED')  return 'danger'
  return 'warning'
}

export default function ManagerPage() {
  const [data, setData] = useState<PaginatedResponse<ReportListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hasFlags, setHasFlags] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(hasFlags ? { hasFlags: 'true' } : {}),
      })
      const res = await fetch(`/api/manager/reports?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, hasFlags])

  useEffect(() => { load() }, [load])

  const filtered = data?.data.filter((r) =>
    search
      ? r.clientName.toLowerCase().includes(search.toLowerCase()) ||
        r.caregiverName.toLowerCase().includes(search.toLowerCase())
      : true
  ) ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-care-dark">Reports</h1>
        <p className="text-slate-mid text-sm mt-1">All submitted visit reports for your agency.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-mid pointer-events-none" />
          <Input
            placeholder="Search client or caregiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={hasFlags ? 'default' : 'secondary'}
          size="sm"
          onClick={() => { setHasFlags((v) => !v); setPage(1) }}
          icon={<Flag className="h-4 w-4" />}
        >
          Flagged only
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border-light">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-mid text-sm">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border-light">
                <tr>
                  {['Client', 'Caregiver', 'Date', 'Duration', 'Tasks', 'Flags', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-mid uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((r) => (
                  <tr key={r.reportId} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-deep whitespace-nowrap">{r.clientName}</td>
                    <td className="px-4 py-3 text-slate-mid whitespace-nowrap">{r.caregiverName}</td>
                    <td className="px-4 py-3 text-slate-mid whitespace-nowrap">
                      {formatDate(r.checkInAt)}<br />
                      <span className="text-xs">{formatTime(r.checkInAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-mid whitespace-nowrap">
                      {r.checkOutAt ? formatDuration(r.checkInAt, r.checkOutAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-mid">{r.taskCount}</td>
                    <td className="px-4 py-3">
                      {r.flagCount > 0 ? (
                        <Badge variant="danger" className="gap-1">
                          <Flag className="h-3 w-3" />{r.flagCount}
                        </Badge>
                      ) : (
                        <span className="text-slate-mid">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/manager/reports/${r.reportId}`}>
                        <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-mid">
          <span>{data.total} reports total</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Prev
            </Button>
            <span className="flex items-center px-2">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
