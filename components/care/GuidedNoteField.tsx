'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface GuidedNoteFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function GuidedNoteField({ id, label, placeholder, value, onChange }: GuidedNoteFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold text-slate-deep">
        {label}
      </Label>
      <Textarea
        id={id}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="transition-all duration-200"
      />
    </div>
  )
}
