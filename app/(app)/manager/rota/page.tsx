'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials, formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

interface RotaCarer {
  id: string
  name: string
  role: string
}

interface RotaClient {
  id: string
  name: string
}

interface Assignment {
  id: string
  clientId: string
  caregiverId: string
  scheduledDate: string
  visitType: string
  status: string
  client: RotaClient
  caregiver: RotaCarer
}

interface RotaData {
  assignments: Assignment[]
  caregivers: RotaCarer[]
}

const VISIT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'complex', label: 'Complex' },
  { value: 'social', label: 'Social' },
  { value: 'medication_only', label: 'Medication Only' },
]

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toYMD(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function RotaPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [data, setData] = useState<RotaData | null>(null)
  const [clients, setClients] = useState<RotaClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [form, setForm] = useState({ clientId: '', caregiverId: '', visitType: 'standard', scheduledDate: '' })
  const [saving, setSaving] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const fetchRota = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/rota?weekStart=${toYMD(weekStart)}`)
      if (res.ok) setData(await res.json() as RotaData)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { fetchRota() }, [fetchRota])

  // Fetch clients list (all agency clients)
  useEffect(() => {
    fetch('/api/manager/clients')
      .then((r) => r.ok ? r.json() as Promise<RotaClient[]> : Promise.reject())
      .then(setClients)
      .catch(() => {})
  }, [])

  function openNewModal(dateStr: string) {
    setEditingId(null)
    setSelectedDay(dateStr)
    setForm({ clientId: '', caregiverId: '', visitType: 'standard', scheduledDate: dateStr })
    setShowModal(true)
  }

  function openEditModal(a: Assignment) {
    setEditingId(a.id)
    setSelectedDay(a.scheduledDate.split('T')[0])
    setForm({
      clientId: a.clientId,
      caregiverId: a.caregiverId,
      visitType: a.visitType,
      scheduledDate: a.scheduledDate.split('T')[0],
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId) {
        await fetch(`/api/manager/rota/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitType: form.visitType }),
        })
      } else {
        await fetch('/api/manager/rota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      fetchRota()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this assignment?')) return
    await fetch(`/api/manager/rota/${id}`, { method: 'DELETE' })
    setShowModal(false)
    fetchRota()
  }

  const assignmentsByDay: Record<string, Assignment[]> = {}
  data?.assignments.forEach((a) => {
    const day = a.scheduledDate.split('T')[0]
    if (!assignmentsByDay[day]) assignmentsByDay[day] = []
    assignmentsByDay[day].push(a)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-care-dark">Rota Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}>
            <ChevronLeft className="h-5 w-5 text-slate-mid hover:text-slate-deep" />
          </button>
          <span className="text-sm font-medium text-slate-deep">
            {formatDate(weekStart)} — {formatDate(weekDays[6])}
          </span>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}>
            <ChevronRight className="h-5 w-5 text-slate-mid hover:text-slate-deep" />
          </button>
        </div>
      </div>

      {/* Caregiver sidebar + calendar grid */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-36 shrink-0">
          <p className="text-[11px] font-semibold text-slate-mid uppercase tracking-wide mb-2">Caregivers</p>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-2">
              {data?.caregivers.map((c) => {
                const todayCount = data.assignments.filter((a) => a.caregiverId === c.id).length
                return (
                  <div key={c.id} className="flex items-center gap-2 bg-white border border-border-soft rounded-lg p-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-care-pale text-care-dark text-[10px] font-semibold shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-deep truncate">{c.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-mid">{todayCount} visits</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[600px]">
            {weekDays.map((day) => {
              const ymd = toYMD(day)
              const isToday = ymd === toYMD(new Date())
              const dayAssignments = assignmentsByDay[ymd] ?? []

              return (
                <div key={ymd} className={`border rounded-lg p-2 min-h-[120px] ${isToday ? 'border-care bg-care-pale/30' : 'border-border-soft bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-slate-mid uppercase">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                      <p className={`text-sm font-semibold ${isToday ? 'text-care' : 'text-slate-deep'}`}>{day.getDate()}</p>
                    </div>
                    <button onClick={() => openNewModal(ymd)} className="p-0.5 rounded hover:bg-care-pale">
                      <Plus className="h-3.5 w-3.5 text-slate-mid" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {loading ? (
                      <Skeleton className="h-8 rounded" />
                    ) : dayAssignments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => openEditModal(a)}
                        className="rounded bg-care-pale border border-care-light px-1.5 py-1 cursor-pointer hover:bg-care-light/30 transition-colors"
                      >
                        <p className="text-[10px] font-semibold text-care-dark truncate">{a.client.name}</p>
                        <p className="text-[10px] text-care truncate">{a.caregiver.name.split(' ')[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Assignment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-deep">{editingId ? 'Edit Assignment' : 'New Assignment'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-mid" /></button>
            </div>

            {selectedDay && (
              <p className="text-sm text-slate-mid">
                {new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            )}

            {!editingId && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-deep">Client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-deep">Caregiver</label>
                  <select
                    value={form.caregiverId}
                    onChange={(e) => setForm((f) => ({ ...f, caregiverId: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
                  >
                    <option value="">Select caregiver...</option>
                    {data?.caregivers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep">Visit Type</label>
              <select
                value={form.visitType}
                onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
              >
                {VISIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              {editingId && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(editingId)}>Delete</Button>
              )}
              <Button className="flex-1" loading={saving} onClick={handleSave}
                disabled={!editingId && (!form.clientId || !form.caregiverId)}>
                {editingId ? 'Save Changes' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
