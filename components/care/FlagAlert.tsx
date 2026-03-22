'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface FlagAlertProps {
  flags: string[]
}

export function FlagAlert({ flags }: FlagAlertProps) {
  if (!flags.length) return null

  return (
    <div className="rounded-lg bg-care-accent-light border border-orange-200 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-care-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-care-accent text-sm mb-2">Flagged Concerns</p>
          <ul className="space-y-1">
            {flags.map((flag, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-sm text-care-accent"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-care-accent shrink-0" />
                {flag}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
