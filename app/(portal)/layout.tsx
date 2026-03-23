import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CareDoc — Family Portal',
  description: "Stay informed about your relative's care",
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-care-pale to-white">
      {children}
    </div>
  )
}
