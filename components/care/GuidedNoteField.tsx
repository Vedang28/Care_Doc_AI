'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useAISuggestion } from '@/hooks/useAISuggestion'
import { Mic, MicOff, Loader2, Sparkles, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuidedNoteFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  // AI suggestion props
  fieldKey?: 'care' | 'condition' | 'incident' | 'response'
  clientContext?: { name: string; conditions: string[] }
  enableSuggestions?: boolean
}

export function GuidedNoteField({
  id,
  label,
  placeholder,
  value,
  onChange,
  fieldKey,
  clientContext,
  enableSuggestions,
}: GuidedNoteFieldProps) {
  const handleTranscript = useCallback(
    (transcript: string) => {
      onChange(value ? `${value} ${transcript}` : transcript)
    },
    [value, onChange]
  )

  const { state, isSupported, start, stop } = useVoiceInput(handleTranscript)

  const handleAccept = useCallback(
    (s: string) => onChange(value ? `${value}\n${s}` : s),
    [value, onChange]
  )

  const { suggestion, isLoading, dismiss, accept } = useAISuggestion(
    fieldKey ?? 'care',
    value,
    clientContext ?? { name: '', conditions: [] },
    handleAccept,
    enableSuggestions === true && !!fieldKey,
  )

  const showSuggestionWidget = enableSuggestions === true && !!fieldKey

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

      {/* AI Suggestion widget */}
      <AnimatePresence>
        {showSuggestionWidget && (isLoading || suggestion) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-lg bg-care-pale border border-care-light p-3 mt-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-care-dark">
                <Sparkles className="h-3.5 w-3.5 text-care" />
                AI Suggestion
              </div>
              {suggestion && (
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-slate-mid hover:text-slate-deep p-0.5"
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isLoading && !suggestion ? (
              <div className="flex items-center gap-2 mt-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-care" />
                <span className="text-xs text-slate-mid">Thinking...</span>
              </div>
            ) : suggestion ? (
              <>
                <p className="text-sm text-slate-deep mt-1.5 leading-relaxed">{suggestion}</p>
                <button
                  type="button"
                  onClick={accept}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-care hover:text-care-dark transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to notes
                </button>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
