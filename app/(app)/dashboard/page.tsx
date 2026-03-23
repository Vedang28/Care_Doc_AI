'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientCard, ClientCardSkeleton } from '@/components/care/ClientCard'
import { StepProgress } from '@/components/care/StepProgress'
import { useVisitStore } from '@/store/visit'
import { getGreeting } from '@/lib/utils'
import type { ClientSummary } from '@/types'
import { Users } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { startVisit } = useVisitStore()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((s) => setUserName(s?.user?.name ?? ''))
      .catch(() => {})

    fetch('/api/clients')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load clients')
        return r.json()
      })
      .then((data: ClientSummary[]) => setClients(data))
      .catch(() => setError('Could not load your client list. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStartVisit(clientId: string, coords?: { lat: number; lng: number }) {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    if (!res.ok) throw new Error('Failed to start visit')

    const { visitId } = await res.json() as { visitId: string }
    const client = clients.find((c) => c.id === clientId)!
    startVisit(visitId, clientId, client.name)

    // Verify GPS in background — non-blocking
    if (coords) {
      fetch(`/api/visits/${visitId}/verify-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
      }).catch(() => {})
    }

    router.push(`/visit/${visitId}/tasks`)
  }

  return (
    <div className="space-y-6">
      <StepProgress currentStep="select" />

      <div>
        <h1 className="font-display text-2xl font-bold text-care-dark">
          {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}.
        </h1>
        <p className="text-slate-mid text-sm mt-1">
          Select a client to start documenting their visit.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-care-accent-light border border-orange-200 p-3 text-sm text-care-accent">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <>
            <ClientCardSkeleton />
            <ClientCardSkeleton />
            <ClientCardSkeleton />
          </>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="rounded-full bg-care-pale p-4">
              <Users className="h-8 w-8 text-care" />
            </div>
            <div>
              <p className="font-semibold text-slate-deep">No visits scheduled for today.</p>
              <p className="text-slate-mid text-sm mt-1">
                Contact your manager if you believe this is incorrect.
              </p>
            </div>
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onStartVisit={handleStartVisit}
            />
          ))
        )}
      </div>
    </div>
  )
}
