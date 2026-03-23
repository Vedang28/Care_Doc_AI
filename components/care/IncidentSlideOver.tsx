'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'

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

export interface IncidentSlideOverProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'view'
  reportId?: string
  clientId?: string
  caregiverId?: string
  flagText?: string
  incident?: Incident
  onSaved: () => void
}

const SEVERITY_LEVELS = [
  { value: 'LOW',      label: 'Low',      color: 'text-emerald-700', ring: 'border-emerald-400' },
  { value: 'MEDIUM',   label: 'Medium',   color: 'text-blue-700',    ring: 'border-blue-400' },
  { value: 'HIGH',     label: 'High',     color: 'text-amber-700',   ring: 'border-amber-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-700',     ring: 'border-red-500' },
] as const

const SAFEGUARDING_CATEGORIES = [
  'Physical Abuse',
  'Emotional Abuse',
  'Financial Abuse',
  'Sexual Abuse',
  'Neglect',
  'Self-Neglect',
  'Domestic Abuse',
]

function severityBadgeClass(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-50 text-red-800 border-red-200'
    case 'HIGH':     return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'MEDIUM':   return 'bg-blue-50 text-blue-800 border-blue-200'
    default:         return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
}

export function IncidentSlideOver({
  open,
  onClose,
  mode,
  reportId,
  clientId,
  caregiverId,
  flagText,
  incident,
  onSaved,
}: IncidentSlideOverProps) {
  // Create mode state
  const [title, setTitle] = useState(flagText ?? '')
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [description, setDescription] = useState('')
  const [actionsTaken, setActionsTaken] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [safeguardingCategory, setSafeguardingCategory] = useState('')

  // View/resolve mode state
  const [actionsEdit, setActionsEdit] = useState(incident?.actionsTaken ?? '')
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [escalateExternal, setEscalateExternal] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleCreate() {
    setError(null)
    if (!title.trim()) { setError('Title is required.'); return }
    if (description.trim().length < 10) { setError('Description must be at least 10 characters.'); return }
    if ((severity === 'HIGH' || severity === 'CRITICAL') && !followUpDate) {
      setError('Follow-up date is required for HIGH and CRITICAL incidents.')
      return
    }
    if (!reportId || !clientId || !caregiverId) {
      setError('Missing required context (reportId, clientId, or caregiverId).')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        reportId,
        clientId,
        caregiverId,
        severity,
        title: title.trim(),
        description: description.trim(),
      }
      if (actionsTaken.trim()) body.actionsTaken = actionsTaken.trim()
      if (followUpDate) body.followUpDate = new Date(followUpDate).toISOString()
      if (severity === 'CRITICAL' && safeguardingCategory) body.safeguardingCategory = safeguardingCategory

      const res = await fetch('/api/manager/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to create incident.')
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

  async function handleResolve() {
    if (!incident) return
    setError(null)
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        resolvedAt: new Date().toISOString(),
        resolutionSummary: resolutionSummary.trim() || undefined,
        actionsTaken: actionsEdit.trim() || undefined,
        escalated: escalateExternal || undefined,
      }

      const res = await fetch(`/api/manager/incidents/${incident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to resolve incident.')
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

  const isResolved = !!incident?.resolvedAt

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-care-dark">
            {mode === 'create' ? 'Create Incident' : 'Incident Detail'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface transition-colors">
            <X className="h-5 w-5 text-slate-mid" />
          </button>
        </div>

        {/* ── CREATE MODE ── */}
        {mode === 'create' && (
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief incident title..."
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
              />
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">Severity</label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_LEVELS.map((s) => (
                  <label
                    key={s.value}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                      severity === s.value ? s.ring + ' bg-slate-50' : 'border-border-soft hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={s.value}
                      checked={severity === s.value}
                      onChange={() => setSeverity(s.value)}
                      className="sr-only"
                    />
                    <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* CRITICAL alert + safeguarding category */}
            {severity === 'CRITICAL' && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800 font-medium">
                    This will notify the designated safeguarding lead immediately.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                    Safeguarding Category
                  </label>
                  <select
                    value={safeguardingCategory}
                    onChange={(e) => setSafeguardingCategory(e.target.value)}
                    className="w-full h-9 rounded-lg border border-red-200 bg-white px-3 text-sm focus:outline-none focus:border-red-400"
                  >
                    <option value="">Select category...</option>
                    {SAFEGUARDING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                Description <span className="text-slate-mid normal-case">(min 10 chars)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
                rows={4}
                className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care resize-none"
              />
            </div>

            {/* Actions Taken */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                Actions Taken <span className="text-slate-mid normal-case">(optional)</span>
              </label>
              <textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                placeholder="Immediate steps taken..."
                rows={3}
                className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care resize-none"
              />
            </div>

            {/* Follow-up Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                Follow-up Date
                {(severity === 'HIGH' || severity === 'CRITICAL') && (
                  <span className="text-red-600 ml-1">*required</span>
                )}
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-border-soft bg-surface px-3 text-sm focus:outline-none focus:border-care"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button className="w-full" loading={saving} onClick={handleCreate}>
              Create Incident
            </Button>
          </div>
        )}

        {/* ── VIEW / RESOLVE MODE ── */}
        {mode === 'view' && incident && (
          <div className="space-y-5">
            {/* Already resolved banner */}
            {isResolved && (
              <div className="rounded-lg bg-care-pale border border-care-light p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-care shrink-0 mt-0.5" />
                <div className="text-sm text-care-dark">
                  <p className="font-semibold">Resolved</p>
                  {incident.resolvedAt && (
                    <p className="text-xs mt-0.5">
                      {formatDate(incident.resolvedAt)} at {formatTime(incident.resolvedAt)}
                      {incident.resolvedBy && ` · by ${incident.resolvedBy}`}
                    </p>
                  )}
                  {incident.actionsTaken && (
                    <p className="mt-2 text-xs whitespace-pre-wrap">{incident.actionsTaken}</p>
                  )}
                </div>
              </div>
            )}

            {/* Incident details */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-deep text-sm">{incident.title}</h3>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityBadgeClass(incident.severity)}`}>
                  {incident.severity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-slate-mid uppercase tracking-wide">Client</p>
                  <p className="font-medium text-slate-deep mt-0.5">{incident.client.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-mid uppercase tracking-wide">Caregiver</p>
                  <p className="font-medium text-slate-deep mt-0.5">{incident.caregiver.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-mid uppercase tracking-wide">Created</p>
                  <p className="font-medium text-slate-deep mt-0.5">{formatDate(incident.createdAt)}</p>
                </div>
                {incident.followUpDate && (
                  <div>
                    <p className="text-[11px] text-slate-mid uppercase tracking-wide">Follow-up</p>
                    <p className={`font-medium mt-0.5 ${incident.isOverdue ? 'text-red-700' : 'text-slate-deep'}`}>
                      {formatDate(incident.followUpDate)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] text-slate-mid uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-deep whitespace-pre-wrap">{incident.description}</p>
              </div>

              {incident.reportFlags.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-mid uppercase tracking-wide mb-1">Report Flags</p>
                  <ul className="space-y-1">
                    {incident.reportFlags.map((f, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {incident.escalated && (
                <Badge variant="warning">Escalated to External</Badge>
              )}
            </div>

            {/* Editable sections — only if not resolved */}
            {!isResolved && (
              <div className="space-y-4 pt-2 border-t border-border-light">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                    Actions Taken
                  </label>
                  <textarea
                    value={actionsEdit}
                    onChange={(e) => setActionsEdit(e.target.value)}
                    placeholder="Document actions taken..."
                    rows={3}
                    className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-deep uppercase tracking-wide">
                    Resolution Summary
                  </label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Summarise how this was resolved..."
                    rows={3}
                    className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:border-care resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={escalateExternal}
                    onChange={(e) => setEscalateExternal(e.target.checked)}
                    className="h-4 w-4 rounded border-border-soft text-care focus:ring-care"
                  />
                  <span className="text-sm text-slate-deep">Escalate to External Authority</span>
                </label>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button className="w-full" loading={saving} onClick={handleResolve}>
                  Mark as Resolved
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
