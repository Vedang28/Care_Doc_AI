'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, ArrowRight, Calendar, LocateFixed, AlertTriangle, X } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import type { ClientSummary } from '@/types'

interface LocationMismatch {
  distanceMetres: number
  flag: string
}

interface ClientCardProps {
  client: ClientSummary
  onStartVisit: (clientId: string, coords?: { lat: number; lng: number }) => Promise<void>
  loading?: boolean
}

export function ClientCard({ client, onStartVisit, loading }: ClientCardProps) {
  const [hovered, setHovered] = useState(false)
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'done'>('idle')
  const [mismatch] = useState<LocationMismatch | null>(null)
  const [mismatchNote, setMismatchNote] = useState('')
  const [showMismatchInput, setShowMismatchInput] = useState(false)
  const [starting, setStarting] = useState(false)

  const visibleConditions = client.conditions.slice(0, 3)
  const extraCount = client.conditions.length - 3

  async function handleStart() {
    setStarting(true)
    setGpsState('locating')
    let coords: { lat: number; lng: number } | undefined

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 })
      })
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch {
      // GPS denied or timed out — proceed without
      coords = undefined
    }

    setGpsState('done')

    try {
      await onStartVisit(client.id, coords)
    } finally {
      setStarting(false)
    }
  }

  return (
    <motion.div
      className="bg-white border border-border-soft rounded-xl p-4 md:p-5 transition-colors duration-200 hover:border-care cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      layout
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-care-pale text-care-dark font-semibold text-sm">
          {getInitials(client.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-deep text-base leading-tight">{client.name}</h3>
            {client.lastVisitAt && (
              <div className="flex items-center gap-1 text-slate-mid text-xs shrink-0">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(client.lastVisitAt)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-slate-mid shrink-0" />
            <span className="text-slate-mid text-[13px] truncate">{client.address}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {visibleConditions.map((c) => (
              <Badge key={c} variant="warning" className="text-[10px]">{c}</Badge>
            ))}
            {extraCount > 0 && (
              <Badge variant="default" className="text-[10px]">+{extraCount} more</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Location mismatch notice */}
      {mismatch && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-800 text-xs font-medium">{mismatch.flag}</p>
              {!showMismatchInput ? (
                <button
                  onClick={() => setShowMismatchInput(true)}
                  className="text-amber-700 text-xs underline mt-1"
                >
                  Add explanation
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={mismatchNote}
                    onChange={(e) => setMismatchNote(e.target.value)}
                    placeholder="e.g. parking nearby, visited neighbour first"
                    className="flex-1 text-xs rounded border border-amber-300 px-2 py-1 focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={() => setShowMismatchInput(false)}>
                    <X className="h-4 w-4 text-amber-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(hovered || loading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-border-light">
              {gpsState === 'locating' ? (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-mid">
                  <LocateFixed className="h-4 w-4 animate-pulse text-care" />
                  Getting your location...
                </div>
              ) : (
                <Button
                  onClick={handleStart}
                  loading={starting}
                  className="w-full"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Start Visit
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ClientCardSkeleton() {
  return (
    <div className="bg-white border border-border-soft rounded-xl p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
