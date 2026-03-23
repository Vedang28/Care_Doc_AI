import type { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { OfflineBanner } from '@/components/care/OfflineBanner'
import type { SessionUser } from '@/types'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  return (
    <AppShell userName={user.name} role={user.role}>
      <OfflineBanner />
      {children}
    </AppShell>
  )
}
