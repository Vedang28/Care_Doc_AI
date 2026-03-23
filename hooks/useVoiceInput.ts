'use client'

import { useState, useRef, useCallback } from 'react'

type VoiceState = 'idle' | 'listening' | 'processing'

interface UseVoiceInputReturn {
  state: VoiceState
  isSupported: boolean
  start: () => void
  stop: () => void
}

// Minimal types for Web Speech API (not yet in TypeScript lib)
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly [index: number]: { transcript: string }
}

interface SpeechRecognitionResultList {
  readonly length: number
  readonly [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useVoiceInput(onTranscript: (text: string) => void): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceState>('idle')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const isSupported = getSpeechRecognition() !== null

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return

    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setState('listening')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setState('processing')
      const transcript = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0].transcript)
        .join('')

      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript)
        setState('idle')
      }
    }

    recognition.onerror = () => setState('idle')
    recognition.onend = () => setState('idle')

    recognitionRef.current = recognition
    recognition.start()
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setState('idle')
  }, [])

  return { state, isSupported, start, stop }
}
