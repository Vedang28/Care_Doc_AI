'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VisitHeader } from '@/components/care/VisitHeader'
import { StepProgress } from '@/components/care/StepProgress'
import { TaskCategory } from '@/components/care/TaskCategory'
import { Button } from '@/components/ui/button'
import { useVisitStore } from '@/store/visit'
import { TASK_CATEGORIES } from '@/lib/tasks'
import { ArrowRight } from 'lucide-react'

interface TasksPageProps {
  params: { visitId: string }
}

export default function TasksPage({ params }: TasksPageProps) {
  const router = useRouter()
  const { visitId, clientId, clientName, checkInTime, completedTasks,
    toggleTask, setTaskNote, setStep } = useVisitStore()

  const [saving, setSaving] = useState(false)

  // Derive client conditions from the store isn't practical; fetch minimal data
  const [conditions, setConditions] = useState<string[]>([])

  useEffect(() => {
    if (clientId) {
      fetch(`/api/clients`)
        .then((r) => r.json())
        .then((clients: Array<{ id: string; conditions: string[] }>) => {
          const c = clients.find((x) => x.id === clientId)
          if (c) setConditions(c.conditions)
        })
        .catch(() => {})
    }
  }, [clientId])

  const completedTaskIds = new Set(completedTasks.map((t) => t.taskId))
  const taskNotesMap: Record<string, string> = {}
  completedTasks.forEach((t) => { if (t.note) taskNotesMap[t.taskId] = t.note })

  async function handleContinue() {
    setSaving(true)
    try {
      const res = await fetch(`/api/visits/${params.visitId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: completedTasks }),
      })
      if (!res.ok) throw new Error('Failed to save tasks')
      setStep('medications')
      router.push(`/visit/${params.visitId}/medications`)
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
      <StepProgress currentStep="tasks" />
      <VisitHeader
        clientName={clientName}
        conditions={conditions}
        checkInTime={checkInTime}
      />

      <div className="px-4 pt-4 pb-28 space-y-3">
        {TASK_CATEGORIES.map((cat) => (
          <TaskCategory
            key={cat.id}
            category={cat}
            completedTaskIds={completedTaskIds}
            taskNotes={taskNotesMap}
            onToggle={toggleTask}
            onNoteChange={setTaskNote}
          />
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light p-4 flex items-center justify-between max-w-2xl mx-auto">
        <span className="text-sm text-slate-mid">
          <span className="font-semibold text-slate-deep">{completedTasks.length}</span> tasks recorded
        </span>
        <Button onClick={handleContinue} loading={saving} icon={<ArrowRight className="h-4 w-4" />}>
          Continue to Medications
        </Button>
      </div>
    </div>
  )
}
