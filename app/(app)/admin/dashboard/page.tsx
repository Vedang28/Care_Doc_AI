'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Plus, Building2, Activity, Flag, Clock } from 'lucide-react'

interface Agency {
  id: string
  name: string
  code: string
  subdomain: string | null
  plan: string
  active: boolean
  createdAt: string
  _count: { users: number; visits: number }
}

interface Stats {
  totalAgencies: number
  activeAgencies: number
  reportsToday: number
  activeVisits: number
  flaggedReports: number
}

export default function AdminDashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/agencies').then((r) => r.json()),
      fetch('/api/admin/stats').then((r) => r.json()),
    ])
      .then(([agencyData, statsData]: [Agency[], Stats]) => {
        setAgencies(agencyData)
        setStats(statsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Agencies', value: stats.totalAgencies, icon: Building2 },
    { label: 'Reports Today',  value: stats.reportsToday,  icon: Activity },
    { label: 'Active Visits',  value: stats.activeVisits,  icon: Clock },
    { label: 'Flagged (Open)', value: stats.flaggedReports, icon: Flag },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-care-dark">Admin Dashboard</h1>
          <p className="text-slate-mid text-sm mt-1">Manage all agencies on the platform.</p>
        </div>
        <Link href="/admin/setup">
          <Button icon={<Plus className="h-4 w-4" />}>New Agency</Button>
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white border border-border-soft rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-care" />
                  <span className="text-xs text-slate-mid">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-care-dark">{s.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Agencies table */}
      <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-light">
          <p className="font-semibold text-slate-deep text-sm">All Agencies</p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-mid text-sm">No agencies yet.</p>
            <Link href="/admin/setup">
              <Button variant="ghost" className="mt-3" icon={<Plus className="h-4 w-4" />}>Create First Agency</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {agencies.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-deep text-sm">{a.name}</p>
                    <Badge variant={a.active ? 'success' : 'default'} className="text-[10px]">
                      {a.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs font-mono text-slate-mid bg-surface rounded px-1.5 py-0.5">{a.plan}</span>
                  </div>
                  <p className="text-xs text-slate-mid mt-0.5">
                    {a._count.users} users · {a._count.visits} visits · Since {formatDate(a.createdAt)}
                  </p>
                </div>
                <Link href={`/admin/agencies/${a.id}`}>
                  <Button variant="ghost" size="sm">Manage</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
