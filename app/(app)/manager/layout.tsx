'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, AlertTriangle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/manager/compliance', label: 'Compliance', icon: BarChart3 },
  { href: '/manager', label: 'Reports', icon: FileText },
  { href: '/manager/incidents', label: 'Incidents', icon: AlertTriangle },
]

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-0">
      {/* Manager nav tabs */}
      <nav className="-mx-4 -mt-6 px-4 pt-4 pb-0 bg-white border-b border-border-light mb-5">
        <div className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/manager'
              ? pathname === '/manager'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-care text-care-dark'
                    : 'border-transparent text-slate-mid hover:text-slate-deep hover:border-border-soft'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {children}
    </div>
  )
}
