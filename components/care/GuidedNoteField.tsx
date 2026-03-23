'use client'

import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuidedNoteFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function GuidedNoteField({ id, label, placeholder, value, onChange }: GuidedNoteFieldProps) {
  const handleTranscript = useCallback(
    (transcript: string) => {
      onChange(value ? `${value} ${transcript}` : transcript)
    },
    [value, onChange]
  )

  const { state, isSupported, start, stop } = useVoiceInput(handleTranscript)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[13px] font-semibold text-slate-deep">
          {label}
        </Label>

        {/* Voice input button */}
        <div className="relative">
          {isSupported ? (
            <button
              type="button"
              onClick={state === 'listening' ? stop : start}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                state === 'listening'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'text-slate-mid hover:text-slate-deep hover:bg-surface'
              )}
              aria-label={state === 'listening' ? 'Stop recording' : 'Start voice input'}
            >
              {state === 'processing' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : state === 'listening' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <MicOff className="h-3.5 w-3.5" />
                  <span>Listening...</span>
                </>
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div title="Voice input not available in your browser">
              <Mic className="h-3.5 w-3.5 text-slate-mid/40 cursor-not-allowed" />
            </div>
          )}
        </div>
      </div>

      <Textarea
        id={id}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'transition-all duration-200',
          state === 'listening' && 'border-red-300 focus-visible:border-red-400'
        )}
      />
    </div>
  )
}
