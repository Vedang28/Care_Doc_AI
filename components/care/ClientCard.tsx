'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, ArrowRight, Calendar } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import type { ClientSummary } from '@/types'

interface ClientCardProps {
  client: ClientSummary
  onStartVisit: (clientId: string) => Promise<void>
  loading?: boolean
}

export function ClientCard({ client, onStartVisit, loading }: ClientCardProps) {
  const [hovered, setHovered] = useState(false)
  const [starting, setStarting] = useState(false)

  const visibleConditions = client.conditions.slice(0, 3)
  const extraCount = client.conditions.length - 3

  async function handleStart() {
    setStarting(true)
    try {
      await onStartVisit(client.id)
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
              <Button
                onClick={handleStart}
                loading={starting}
                className="w-full"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Start Visit
              </Button>
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
