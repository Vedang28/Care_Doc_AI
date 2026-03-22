'use client'

import { Sparkles } from 'lucide-react'

interface TransformationBoxProps {
  transformations: string[]
}

export function TransformationBox({ transformations }: TransformationBoxProps) {
  if (!transformations.length) return null

  return (
    <div className="rounded-lg bg-care-pale border border-care-light p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-care shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-care-dark text-sm mb-2">Language Improvements</p>
          <ul className="space-y-1.5">
            {transformations.map((t, i) => (
              <li key={i} className="font-mono text-xs text-care-dark bg-white rounded px-2 py-1 border border-care-light">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
