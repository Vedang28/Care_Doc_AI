'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff, RefreshCw } from 'lucide-react'

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  if (!isOnline) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-amber-800">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You&apos;re offline. Notes will sync when your connection returns.</span>
        </div>
      </div>
    )
  }

  // wasOffline — reconnecting/syncing
  return (
    <div className="bg-care-pale border-b border-care-light px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-care-dark">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        <span>Back online — syncing your saved visits...</span>
      </div>
    </div>
  )
}
