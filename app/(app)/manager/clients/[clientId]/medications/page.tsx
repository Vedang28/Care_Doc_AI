'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Pill, X, ArrowLeft, ChevronDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  route: string
  prescribedBy: string | null
  startDate: string
  endDate: string | null
  active: boolean
  notes: string | null
  createdAt: string
  _count: { marEntries: number }
}

interface MedicationPageProps {
  params: { clientId: string }
}

type TabFilter = 'active' | 'all'

const ROUTES = ['oral', 'topical', 'inhaled', 'injection', 'other'] as const

interface FormState {
  name: string
  dose: string
  frequency: string
  route: string
  prescribedBy: string
  startDate: string
  endDate: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '',
  dose: '',
  frequency: '',
  route: 'oral',
  prescribedBy: '',
  startDate: '',
  endDate: '',
  notes: '',
}

// ─── Slide-over panel ─────────────────────────────────────────────────────────

interface SlideOverProps {
  open: boolean
  onClose: () => void
  clientId: string
  editTarget: Medication | null
  onSaved: () => void
}

function MedicationSlideOver({ open, onClose, clientId, editTarget, onSaved }: SlideOverProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      setForm({
        name: editTarget.name,
        dose: editTarget.dose,
        frequency: editTarget.frequency,
        route: editTarget.route,
        prescribedBy: editTarget.prescribedBy ?? '',
        startDate: editTarget.startDate.slice(0, 10),
        endDate: editTarget.endDate ? editTarget.endDate.slice(0, 10) : '',
        notes: editTarget.notes ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [editTarget, open])

  if (!open) return null

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)
    if (!form.name.trim()) { setError('Medication name is required.'); return }
    if (!form.dose.trim()) { setError('Dose is required.'); return }
    if (!form.frequency.trim()) { setError('Frequency is required.'); return }
    if (!form.route) { setError('Route is required.'); return }
    if (!form.startDate) { setError('Start date is required.'); return }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        dose: form.dose.trim(),
        frequency: form.frequency.trim(),
        route: form.route,
        startDate: new Date(form.startDate).toISOString(),
      }
      if (form.prescribedBy.trim()) body.prescribedBy = form.prescribedBy.trim()
      if (form.endDate) body.endDate = new Date(form.endDate).toISOString()
      if (form.notes.trim()) body.notes = form.notes.trim()

      const url = editTarget
        ? `/api/manager/clients/${clientId}/medications/${editTarget.id}`
        : `/api/manager/clients/${clientId}/medications`
      const method = editTarget ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to save medication.')
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!editTarget

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-care-dark">
            {isEdit ? 'Edit Medication' : 'Add Medication'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface transition-colors">
            <X className="h-5 w-5 text-slate-mid" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Medication Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Metformin 500mg"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Dose */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Dose <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.dose}
              onChange={(e) => set('dose', e.target.value)}
              placeholder="e.g. 1 tablet"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Frequency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              placeholder="e.g. twice daily with food"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Route */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Route <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.route}
                onChange={(e) => set('route', e.target.value)}
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 pr-9 text-sm appearance-none focus:outline-none focus:border-care"
              >
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-mid" />
            </div>
          </div>

          {/* Prescribed by */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Prescribed By <span className="text-slate-mid normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.prescribedBy}
              onChange={(e) => set('prescribedBy', e.target.value)}
              placeholder="e.g. Dr. Smith"
              className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                End Date <span className="text-slate-mid normal-case font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
              Notes <span className="text-slate-mid normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button className="w-full" loading={saving} onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Medication'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Medication card ───────────────────────────────────────────────────────────

interface MedicationCardProps {
  med: Medication
  onEdit: (med: Medication) => void
  onToggleActive: (med: Medication) => void
  toggling: boolean
}

function MedicationCard({ med, onEdit, onToggleActive, toggling }: MedicationCardProps) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  function handleToggleClick() {
    if (med.active) {
      // Ask inline confirmation before deactivating
      setConfirmDeactivate(true)
    } else {
      onToggleActive(med)
    }
  }

  return (
    <div
      className={`bg-white border border-border-soft rounded-xl p-5 transition-opacity ${
        !med.active ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + name/dose */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 h-9 w-9 rounded-lg bg-care-pale flex items-center justify-center shrink-0">
            <Pill className="h-4 w-4 text-care" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-deep text-sm leading-snug">{med.name}</h3>
              {/* Active/inactive dot */}
              <span className="flex items-center gap-1 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    med.active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span className={med.active ? 'text-emerald-700' : 'text-slate-mid'}>
                  {med.active ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-mid mt-0.5">{med.dose}</p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(med)}
            className="p-1.5 rounded-lg border border-border-soft hover:bg-surface transition-colors"
            title="Edit medication"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-mid" />
          </button>
          <button
            onClick={handleToggleClick}
            disabled={toggling}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
              med.active
                ? 'border-border-soft text-slate-deep hover:bg-surface'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {med.active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>

      {/* Inline deactivation confirmation */}
      {confirmDeactivate && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800 font-medium">
            Mark this medication as inactive?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmDeactivate(false)}
              className="px-2.5 py-1 rounded-md border border-amber-200 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmDeactivate(false)
                onToggleActive(med)
              }}
              disabled={toggling}
              className="px-2.5 py-1 rounded-md bg-amber-500 text-xs text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-[11px] text-slate-mid uppercase tracking-wide">Frequency</p>
          <p className="text-slate-deep text-xs mt-0.5">{med.frequency}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-mid uppercase tracking-wide">Route</p>
          <p className="text-slate-deep text-xs mt-0.5 capitalize">{med.route}</p>
        </div>
        {med.prescribedBy && (
          <div>
            <p className="text-[11px] text-slate-mid uppercase tracking-wide">Prescribed By</p>
            <p className="text-slate-deep text-xs mt-0.5">{med.prescribedBy}</p>
          </div>
        )}
        <div>
          <p className="text-[11px] text-slate-mid uppercase tracking-wide">Start Date</p>
          <p className="text-slate-deep text-xs mt-0.5">{formatDate(med.startDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-mid uppercase tracking-wide">End Date</p>
          <p className="text-slate-deep text-xs mt-0.5">
            {med.endDate ? formatDate(med.endDate) : 'Ongoing'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-mid uppercase tracking-wide">MAR Entries</p>
          <p className="text-slate-deep text-xs mt-0.5">{med._count.marEntries}</p>
        </div>
      </div>

      {med.notes && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <p className="text-[11px] text-slate-mid uppercase tracking-wide mb-1">Notes</p>
          <p className="text-xs text-slate-deep leading-relaxed">{med.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MedicationsPage({ params }: MedicationPageProps) {
  const { clientId } = params

  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [tab, setTab] = useState<TabFilter>('active')
  const [slideOpen, setSlideOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Medication | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadMedications = useCallback(() => {
    setLoading(true)
    setFetchError(false)
    fetch(`/api/manager/clients/${clientId}/medications`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<{ medications: Medication[] }>
      })
      .then((data) => setMedications(data.medications))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => {
    loadMedications()
  }, [loadMedications])

  function openAdd() {
    setEditTarget(null)
    setSlideOpen(true)
  }

  function openEdit(med: Medication) {
    setEditTarget(med)
    setSlideOpen(true)
  }

  async function handleToggleActive(med: Medication) {
    setTogglingId(med.id)
    try {
      const res = await fetch(`/api/manager/clients/${clientId}/medications/${med.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !med.active }),
      })
      if (res.ok) {
        // Optimistic update
        setMedications((prev) =>
          prev.map((m) => (m.id === med.id ? { ...m, active: !med.active } : m))
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = tab === 'active'
    ? medications.filter((m) => m.active)
    : medications

  const activeCount = medications.filter((m) => m.active).length

  return (
    <>
      <div className="space-y-5">
        {/* Back link */}
        <Link href={`/manager/clients/${clientId}`}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} className="-ml-2">
            Back to Client
          </Button>
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-care-dark">Client Medications</h1>
            <p className="text-sm text-slate-mid mt-0.5">
              {activeCount} active medication{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>
            Add Medication
          </Button>
        </div>

        {/* Tab toggle */}
        <div className="inline-flex rounded-lg border border-border-soft bg-surface p-1 gap-1">
          {(['active', 'all'] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white shadow-sm text-care-dark border border-border-light'
                  : 'text-slate-mid hover:text-slate-deep'
              }`}
            >
              {t === 'active' ? 'Active' : 'All'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-sm text-red-700 font-medium">Failed to load medications.</p>
            <button
              onClick={loadMedications}
              className="mt-2 text-sm text-red-600 underline underline-offset-2 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-surface border border-border-light p-12 text-center">
            <Pill className="h-8 w-8 text-slate-mid mx-auto mb-3" />
            <p className="text-sm text-slate-mid font-medium">
              {tab === 'active' ? 'No active medications.' : 'No medications recorded yet.'}
            </p>
            {tab === 'active' && medications.length > 0 && (
              <button
                onClick={() => setTab('all')}
                className="mt-2 text-sm text-care underline underline-offset-2 hover:text-care-dark"
              >
                View all medications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((med) => (
              <MedicationCard
                key={med.id}
                med={med}
                onEdit={openEdit}
                onToggleActive={handleToggleActive}
                toggling={togglingId === med.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over */}
      <MedicationSlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        clientId={clientId}
        editTarget={editTarget}
        onSaved={loadMedications}
      />
    </>
  )
}
