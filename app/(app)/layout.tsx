import type { ReactNode, CSSProperties } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppShell } from '@/components/layout/AppShell'
import { OfflineBanner } from '@/components/care/OfflineBanner'
import type { SessionUser } from '@/types'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  // Fetch agency plan + brand settings for white-label (enterprise only)
  const agency = await db.agency.findUnique({
    where: { id: user.agencyId },
    select: {
      plan: true,
      settings: {
        select: {
          brandColour: true,
          logoUrl: true,
        },
      },
    },
  })

  const isEnterprise = agency?.plan === 'enterprise'
  const brandColour = isEnterprise ? (agency?.settings?.brandColour ?? null) : null
  const agencyLogo = isEnterprise ? (agency?.settings?.logoUrl ?? null) : null

  const brandStyle: CSSProperties = brandColour
    ? ({ '--brand-primary': brandColour } as CSSProperties)
    : {}

  return (
    <div style={brandStyle}>
      <AppShell userName={user.name} role={user.role} agencyLogo={agencyLogo ?? undefined}>
        <OfflineBanner />
        {children}
      </AppShell>
    </div>
  )
}
