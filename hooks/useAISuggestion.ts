'use client'

import { useState, useEffect, useRef } from 'react'

interface ClientContext {
  name: string
  conditions: string[]
}

interface SuggestionState {
  suggestion: string | null
  isLoading: boolean
  callsUsed: number
  dismiss: () => void
  accept: () => void
}

export function useAISuggestion(
  fieldKey: 'care' | 'condition' | 'incident' | 'response',
  currentValue: string,
  clientContext: ClientContext,
  onAccept: (suggestion: string) => void,
  enabled: boolean = true,
): SuggestionState {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [callsUsed, setCallsUsed] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled || currentValue.length < 15 || callsUsed >= 3) return

    const timer = setTimeout(async () => {
      // Cancel previous in-flight request
      controllerRef.current?.abort()
      controllerRef.current = new AbortController()

      setIsLoading(true)
      try {
        const res = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldKey, currentValue, clientContext }),
          signal: controllerRef.current.signal,
        })
        if (!res.ok) return
        const data = await res.json() as { suggestion: string | null }
        setSuggestion(data.suggestion)
        if (data.suggestion) setCallsUsed((p) => p + 1)
      } catch {
        // Ignore abort errors and network failures
      } finally {
        setIsLoading(false)
      }
    }, 800)

    return () => {
      clearTimeout(timer)
      controllerRef.current?.abort()
    }
  }, [currentValue, fieldKey, enabled]) // Intentionally omit callsUsed and clientContext to avoid retriggering

  function dismiss() {
    setSuggestion(null)
  }

  function accept() {
    if (suggestion) {
      onAccept(suggestion)
      setSuggestion(null)
    }
  }

  return { suggestion, isLoading, callsUsed, dismiss, accept }
}
