'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 'select',      label: 'Select Client' },
  { id: 'tasks',       label: 'Tasks' },
  { id: 'medications', label: 'Medications' },
  { id: 'notes',       label: 'Notes' },
  { id: 'processing',  label: 'Processing' },
  { id: 'review',      label: 'Review' },
  { id: 'saved',       label: 'Done' },
] as const

type Step = (typeof STEPS)[number]['id']

const STEP_ORDER: Step[] = ['select', 'tasks', 'medications', 'notes', 'processing', 'review', 'saved']

interface StepProgressProps {
  currentStep: Step
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-3 px-4 bg-white border-b border-border-light">
      {STEPS.map((step, index) => {
        const isDone    = index < currentIndex
        const isActive  = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isDone   && 'bg-care text-white',
                  isActive && 'bg-care-dark text-white ring-2 ring-care ring-offset-1',
                  isPending && 'bg-border-light text-slate-mid'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] whitespace-nowrap',
                  isActive  && 'text-care-dark font-semibold',
                  isDone    && 'text-care',
                  isPending && 'text-slate-mid'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 mx-1 mb-4 transition-colors',
                  index < currentIndex ? 'bg-care' : 'bg-border-light'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
