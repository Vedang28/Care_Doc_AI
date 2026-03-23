'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepProgress } from '@/components/care/StepProgress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVisitStore } from '@/store/visit'
import { ArrowLeft, ArrowRight, Pill, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MarOutcome = 'ADMINISTERED' | 'PROMPTED' | 'REFUSED' | 'MISSED' | 'NOT_DUE' | 'STOCK_OUT'

interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  route: string
}

interface MarEntryState {
  medicationId: string
  outcome: MarOutcome | ''
  refusalReason: string
  missedReason: string
  stockBefore: string
  stockAfter: string
  notes: string
}

const OUTCOMES: { value: MarOutcome; label: string }[] = [
  { value: 'ADMINISTERED', label: 'Administered' },
  { value: 'PROMPTED',     label: 'Prompted' },
  { value: 'REFUSED',      label: 'Refused' },
  { value: 'MISSED',       label: 'Missed' },
  { value: 'NOT_DUE',      label: 'Not Due' },
  { value: 'STOCK_OUT',    label: 'Stock Out' },
]

function outcomeChipClass(value: MarOutcome, selected: boolean): string {
  if (!selected) {
    return 'bg-surface text-slate-mid border border-border-light hover:border-border-soft cursor-pointer'
  }
  if (value === 'ADMINISTERED' || value === 'PROMPTED') {
    return 'bg-care text-white border border-care cursor-pointer'
  }
  if (value === 'REFUSED' || value === 'MISSED') {
    return 'bg-amber-100 text-amber-800 border border-amber-300 cursor-pointer'
  }
  // NOT_DUE, STOCK_OUT
  return 'bg-surface text-slate-deep border border-border-soft cursor-pointer'
}

interface MedicationsPageProps {
  params: { visitId: string }
}

export default function MedicationsPage({ params }: MedicationsPageProps) {
  const router = useRouter()
  const { visitId, clientName, checkInTime, setStep } = useVisitStore()

  const [loading, setLoading] = useState(true)
  const [medications, setMedications] = useState<Medication[]>([])
  const [entries, setEntries] = useState<MarEntryState[]>([])
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [marNotice, setMarNotice] = useState('')

  useEffect(() => {
    async function fetchMedications() {
      try {
        const res = await fetch(`/api/visits/${params.visitId}/medications`)
        if (!res.ok) throw new Error('Failed to fetch medications')
        const data = await res.json()
        const meds: Medication[] = data.medications ?? []
        const existingEntries: MarEntryState[] = data.existingEntries ?? []

        setMedications(meds)

        const initialEntries: MarEntryState[] = meds.map((med) => {
          const existing = existingEntries.find((e) => e.medicationId === med.id)
          return existing ?? {
            medicationId: med.id,
            outcome: '',
            refusalReason: '',
            missedReason: '',
            stockBefore: '',
            stockAfter: '',
            notes: '',
          }
        })
        setEntries(initialEntries)
      } catch {
        setMedications([])
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchMedications()
  }, [params.visitId])

  function updateEntry(medicationId: string, patch: Partial<MarEntryState>) {
    setEntries((prev) =>
      prev.map((e) => (e.medicationId === medicationId ? { ...e, ...patch } : e))
    )
    setValidationError('')
  }

  async function handleProceed() {
    if (medications.length === 0) {
      setStep('notes')
      router.push(`/visit/${params.visitId}/notes`)
      return
    }

    const missing = entries.some((e) => e.outcome === '')
    if (missing) {
      setValidationError('Please select an outcome for all medications')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/visits/${params.visitId}/mar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.flags && data.flags.length > 0) {
          setMarNotice('Some discrepancies were noted. Your manager will be informed.')
          // Brief pause to show notice before navigating
          await new Promise((resolve) => setTimeout(resolve, 1800))
        }
      }

      setStep('notes')
      router.push(`/visit/${params.visitId}/notes`)
    } finally {
      setSaving(false)
    }
  }

  if (!visitId || !clientName || !checkInTime) {
    router.push('/dashboard')
    return null
  }

  const allOutcomesSelected = medications.length === 0 || entries.every((e) => e.outcome !== '')

  return (
    <div className="space-y-0 -mx-4 -mt-6">
      <StepProgress currentStep="medications" />

      <div className="px-4 pt-5 pb-28 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-care-dark">{clientName}</h2>
          <p className="text-slate-mid text-sm mt-0.5">Medication Administration Record</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border-light bg-white p-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 flex-wrap pt-1">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-white p-6 text-center space-y-2">
            <Pill className="h-8 w-8 text-slate-mid mx-auto" />
            <p className="text-slate-deep font-medium">No medications recorded</p>
            <p className="text-slate-mid text-sm">
              No medications recorded for this client. Contact your manager to add medications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => {
              const entry = entries.find((e) => e.medicationId === med.id)
              if (!entry) return null

              return (
                <div
                  key={med.id}
                  className="rounded-xl border border-border-light bg-white p-4 space-y-3"
                >
                  {/* Medication header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-care-pale">
                      <Pill className="h-4 w-4 text-care-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-slate-deep">{med.name} {med.dose}</span>
                        <span className="text-xs text-slate-mid whitespace-nowrap">
                          {med.dose} · {med.route}
                        </span>
                      </div>
                      <p className="text-sm text-slate-mid mt-0.5">{med.frequency}</p>
                    </div>
                  </div>

                  {/* Outcome chips */}
                  <div>
                    <p className="text-xs font-medium text-slate-mid mb-2">Outcome</p>
                    <div className="flex flex-wrap gap-2">
                      {OUTCOMES.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateEntry(med.id, { outcome: o.value })}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            outcomeChipClass(o.value, entry.outcome === o.value)
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Refused reason */}
                  {entry.outcome === 'REFUSED' && (
                    <div>
                      <label className="text-xs font-medium text-slate-mid block mb-1">
                        Reason for refusal
                      </label>
                      <textarea
                        value={entry.refusalReason}
                        onChange={(e) => updateEntry(med.id, { refusalReason: e.target.value })}
                        placeholder="e.g. Client said they felt nauseous..."
                        rows={2}
                        className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-slate-deep placeholder:text-slate-mid focus:outline-none focus:ring-2 focus:ring-care resize-none"
                      />
                    </div>
                  )}

                  {/* Missed reason */}
                  {entry.outcome === 'MISSED' && (
                    <div>
                      <label className="text-xs font-medium text-slate-mid block mb-1">
                        Reason medication was missed
                      </label>
                      <textarea
                        value={entry.missedReason}
                        onChange={(e) => updateEntry(med.id, { missedReason: e.target.value })}
                        placeholder="e.g. Client was asleep, could not be roused..."
                        rows={2}
                        className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-slate-deep placeholder:text-slate-mid focus:outline-none focus:ring-2 focus:ring-care resize-none"
                      />
                    </div>
                  )}

                  {/* Administered — stock after */}
                  {entry.outcome === 'ADMINISTERED' && (
                    <div>
                      <label className="text-xs font-medium text-slate-mid block mb-1">
                        Stock after (optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={entry.stockAfter}
                          onChange={(e) => updateEntry(med.id, { stockAfter: e.target.value })}
                          placeholder="0"
                          className="w-24 rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-slate-deep placeholder:text-slate-mid focus:outline-none focus:ring-2 focus:ring-care"
                        />
                        <span className="text-sm text-slate-mid">tablets remaining</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        {/* MAR discrepancy notice */}
        {marNotice && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">{marNotice}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light p-4 flex items-center justify-between gap-3 max-w-2xl mx-auto">
        <Button
          variant="secondary"
          onClick={() => { setStep('tasks'); router.push(`/visit/${params.visitId}/tasks`) }}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <Button
          onClick={handleProceed}
          loading={saving}
          disabled={!loading && !allOutcomesSelected}
          icon={<ArrowRight className="h-4 w-4" />}
          className="flex-1"
        >
          Proceed to Notes
        </Button>
      </div>
    </div>
  )
}
