'use client'

import { useEffect, useState, useRef } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const wasOfflineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Set initial state from navigator
    setIsOnline(navigator.onLine)

    function handleOnline() {
      setIsOnline(true)
      setWasOffline(true)
      if (wasOfflineTimer.current) clearTimeout(wasOfflineTimer.current)
      wasOfflineTimer.current = setTimeout(() => setWasOffline(false), 30_000)
    }

    function handleOffline() {
      setIsOnline(false)
      setWasOffline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (wasOfflineTimer.current) clearTimeout(wasOfflineTimer.current)
    }
  }, [])

  return { isOnline, wasOffline }
}
