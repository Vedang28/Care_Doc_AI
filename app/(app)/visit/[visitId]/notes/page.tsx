'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepProgress } from '@/components/care/StepProgress'
import { GuidedNoteField } from '@/components/care/GuidedNoteField'
import { Button } from '@/components/ui/button'
import { useVisitStore } from '@/store/visit'
import { Shield, Sparkles, ArrowLeft } from 'lucide-react'

interface NotesPageProps {
  params: { visitId: string }
}

export default function NotesPage({ params }: NotesPageProps) {
  const router = useRouter()
  const { visitId, clientName, checkInTime, freeNotes, setFreeNote, setStep } = useVisitStore()
  const [saving, setSaving] = useState(false)

  const NOTE_FIELDS = [
    {
      id: 'care',
      label: 'What care did you provide today?',
      placeholder: 'e.g. Helped Margaret with her morning wash and got her dressed. Prepared porridge for breakfast...',
      key: 'care' as const,
    },
    {
      id: 'condition',
      label: 'Did you notice any changes in their condition?',
      placeholder: 'e.g. Arthur seemed more breathless than usual. Oxygen levels checked...',
      key: 'condition' as const,
    },
    {
      id: 'incident',
      label: 'Were there any incidents, concerns, or refusals?',
      placeholder: 'e.g. Doris refused her morning medication. No falls. No injuries...',
      key: 'incident' as const,
    },
    {
      id: 'response',
      label: 'How did the client respond to the visit?',
      placeholder: 'e.g. Margaret was in good spirits and enjoyed our chat. Ate well...',
      key: 'response' as const,
    },
  ]

  async function handleGenerate() {
    setSaving(true)
    try {
      // Save notes first
      const notesRes = await fetch(`/api/visits/${params.visitId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          care:      freeNotes.care,
          condition: freeNotes.condition,
          incident:  freeNotes.incident,
          response:  freeNotes.response,
        }),
      })
      if (!notesRes.ok) throw new Error('Failed to save notes')

      setStep('processing')
      router.push(`/visit/${params.visitId}/processing`)
    } finally {
      setSaving(false)
    }
  }

  if (!visitId || !clientName || !checkInTime) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="space-y-0 -mx-4 -mt-6">
      <StepProgress currentStep="notes" />

      <div className="px-4 pt-5 pb-6 space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-care-dark">{clientName}</h2>
          <p className="text-slate-mid text-sm mt-0.5">Add notes about today&apos;s visit</p>
        </div>

        {NOTE_FIELDS.map((f) => (
          <GuidedNoteField
            key={f.id}
            id={f.id}
            label={f.label}
            placeholder={f.placeholder}
            value={freeNotes[f.key]}
            onChange={(v) => setFreeNote(f.key, v)}
          />
        ))}

        {/* Caution banner */}
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs leading-relaxed">
            Write naturally — the AI will transform your notes into a professional report.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => { setStep('tasks'); router.push(`/visit/${params.visitId}/tasks`) }}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            loading={saving}
            className="flex-1"
            icon={<Sparkles className="h-4 w-4" />}
          >
            Complete Visit &amp; Generate Report
          </Button>
        </div>
      </div>
    </div>
  )
}
