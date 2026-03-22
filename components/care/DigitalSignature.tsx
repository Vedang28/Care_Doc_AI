'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface DigitalSignatureProps {
  userName: string
  onSubmit: () => Promise<void>
  loading?: boolean
}

export function DigitalSignature({ userName, onSubmit, loading }: DigitalSignatureProps) {
  const [confirmed, setConfirmed] = useState(false)
  const now = new Date()

  return (
    <div className="bg-white border border-border-soft rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-slate-deep text-sm">Digital Signature</h3>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(v === true)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm text-slate-deep leading-snug">
          I confirm this report is an accurate record of the care provided during this visit.
        </span>
      </label>

      {confirmed && (
        <p className="text-xs text-slate-mid pl-8">
          Digital signature:{' '}
          <span className="font-medium text-slate-deep">
            {userName}
          </span>{' '}
          on {formatDate(now)} at {formatTime(now)}
        </p>
      )}

      <Button
        onClick={onSubmit}
        loading={loading}
        disabled={!confirmed}
        className="w-full"
        icon={<CheckCircle2 className="h-4 w-4" />}
      >
        Submit Report
      </Button>
    </div>
  )
}
