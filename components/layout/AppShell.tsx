'use client'

import type { ReactNode } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { LogOut, HeartPulse } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
  userName?: string
  role?: string
}

export function AppShell({ children, userName, role }: AppShellProps) {
  const isManager = role === 'MANAGER' || role === 'ADMIN' || role === 'SENIOR_CARER'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-border-light sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-care" />
            <span className="font-display font-bold text-care-dark">
              CareDoc<span className="text-care">AI</span>
            </span>
            {isManager && (
              <span className="ml-2 text-xs text-slate-mid bg-surface border border-border-light rounded px-1.5 py-0.5">
                Manager
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isManager && <NotificationBell />}
            {userName && (
              <span className="text-sm text-slate-mid hidden sm:block mx-2">{userName}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              icon={<LogOut className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
