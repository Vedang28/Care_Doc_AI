'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, FileDown } from 'lucide-react'

interface ExportModalProps {
  clientId: string
  clientName: string
  open: boolean
  onClose: () => void
}

type Preset = '30d' | '90d' | '180d' | 'custom'
type Format = 'pdf' | 'csv'

interface IncludeOptions {
  includeReports: boolean
  includeRawNotes: boolean
  includeFlags: boolean
  includeTasks: boolean
  includeSignatures: boolean
  includeAuditLog: boolean
}

const PRESET_LABELS: Record<Preset, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 3 months',
  '180d': 'Last 6 months',
  custom: 'Custom',
}

export function ExportModal({ clientId, clientName, open, onClose }: ExportModalProps) {
  const [preset, setPreset] = useState<Preset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [options, setOptions] = useState<IncludeOptions>({
    includeReports: true,
    includeRawNotes: true,
    includeFlags: true,
    includeTasks: true,
    includeSignatures: true,
    includeAuditLog: true,
  })
  const [anonymise, setAnonymise] = useState(false)
  const [format, setFormat] = useState<Format>('pdf')
  const [generating, setGenerating] = useState(false)

  if (!open) return null

  function getDateFrom(): string {
    if (preset === 'custom') return customFrom ? new Date(customFrom).toISOString() : ''
    const now = new Date()
    const days = preset === '30d' ? 30 : preset === '90d' ? 90 : 180
    now.setDate(now.getDate() - days)
    return now.toISOString()
  }

  function toggleOption(key: keyof IncludeOptions) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const dateFrom = getDateFrom()
      const dateTo = new Date().toISOString()

      const res = await fetch(`/api/manager/clients/${clientId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          format,
          includeRawNotes: options.includeRawNotes,
          includeFlags: options.includeFlags,
          includeTasks: options.includeTasks,
          includeSignatures: options.includeSignatures,
          includeAuditLog: options.includeAuditLog,
          anonymiseCaregivers: anonymise,
        }),
      })

      const data = await res.json() as {
        mode?: string
        url?: string
        html?: string
        files?: Record<string, string>
        error?: string
      }

      if (!res.ok) {
        alert(data.error ?? 'Export failed. Please try again.')
        return
      }

      if (data.mode === 'pdf' && data.url) {
        window.open(data.url, '_blank')
      } else if (data.mode === 'html' && data.html) {
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(data.html)
          win.document.close()
          win.print()
        }
      } else if (data.mode === 'csv' && data.files) {
        Object.entries(data.files as Record<string, string>).forEach(([filename, content]) => {
          const blob = new Blob([content], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
        })
      }
      onClose()
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const checkboxItems: { key: keyof IncludeOptions; label: string }[] = [
    { key: 'includeReports', label: 'All visit reports' },
    { key: 'includeRawNotes', label: 'Original caregiver notes' },
    { key: 'includeFlags', label: 'Flagged concerns' },
    { key: 'includeTasks', label: 'Task completion records' },
    { key: 'includeSignatures', label: 'Digital signature records' },
    { key: 'includeAuditLog', label: 'Audit log' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-care-dark">Generate Inspection Pack</h2>
            <p className="text-sm text-slate-mid mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface transition-colors text-slate-mid hover:text-slate-deep"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Date range presets */}
          <div>
            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">Date Range</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={[
                    'text-xs font-medium rounded-lg px-2 py-2 border transition-colors',
                    preset === p
                      ? 'bg-care text-white border-care'
                      : 'bg-white text-slate-deep border-border-soft hover:bg-surface',
                  ].join(' ')}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-mid mb-1 block">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm text-slate-deep focus:outline-none focus:ring-2 focus:ring-care"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-mid mb-1 block">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm text-slate-deep focus:outline-none focus:ring-2 focus:ring-care"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Include options */}
          <div>
            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">Include</p>
            <div className="space-y-2.5">
              {checkboxItems.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => toggleOption(key)}
                    className="h-4 w-4 rounded border-border-soft text-care accent-care cursor-pointer"
                  />
                  <span className="text-sm text-slate-deep group-hover:text-care-dark transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Redaction toggle */}
          <div>
            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">Privacy</p>
            <label className="flex items-center gap-3 cursor-pointer group">
              {/* Toggle switch styled with a checkbox */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={anonymise}
                  onChange={(e) => setAnonymise(e.target.checked)}
                  className="sr-only peer"
                  id="anonymise-toggle"
                />
                <div
                  onClick={() => setAnonymise((v) => !v)}
                  className={[
                    'w-10 h-5 rounded-full transition-colors cursor-pointer',
                    anonymise ? 'bg-care' : 'bg-slate-200',
                  ].join(' ')}
                />
                <div
                  onClick={() => setAnonymise((v) => !v)}
                  className={[
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform cursor-pointer',
                    anonymise ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </div>
              <span className="text-sm text-slate-deep group-hover:text-care-dark transition-colors">
                Anonymise caregiver names (for external sharing)
              </span>
            </label>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">Format</p>
            <div className="flex gap-3">
              {([
                { value: 'pdf', label: 'PDF', description: 'Full formatted document' },
                { value: 'csv', label: 'CSV', description: 'Data tables only' },
              ] as { value: Format; label: string; description: string }[]).map(({ value, label, description }) => (
                <label
                  key={value}
                  className={[
                    'flex-1 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    format === value
                      ? 'border-care bg-care-pale'
                      : 'border-border-soft bg-white hover:bg-surface',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="format"
                    value={value}
                    checked={format === value}
                    onChange={() => setFormat(value)}
                    className="mt-0.5 accent-care cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-deep">{label}</p>
                    <p className="text-xs text-slate-mid">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generating || (preset === 'custom' && (!customFrom || !customTo))}
            icon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          >
            {generating ? 'Generating...' : 'Generate Inspection Pack'}
          </Button>
        </div>
      </div>
    </div>
  )
}
