import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-care-pale via-white to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
