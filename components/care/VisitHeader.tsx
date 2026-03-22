'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface VisitHeaderProps {
  clientName: string
  conditions: string[]
  checkInTime: Date
}

export function VisitHeader({ clientName, conditions, checkInTime }: VisitHeaderProps) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    function update() {
      const ms = Date.now() - new Date(checkInTime).getTime()
      const totalSecs = Math.floor(ms / 1000)
      const mins = Math.floor(totalSecs / 60)
      const secs = totalSecs % 60
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [checkInTime])

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border-light px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-care-dark">{clientName}</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {conditions.slice(0, 3).map((c) => (
              <Badge key={c} variant="warning" className="text-[10px]">{c}</Badge>
            ))}
            {conditions.length > 3 && (
              <Badge variant="default" className="text-[10px]">+{conditions.length - 3}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-mid text-sm shrink-0">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{elapsed}</span>
        </div>
      </div>
    </div>
  )
}
