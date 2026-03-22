'use client'

import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'

interface ReportReviewPanelProps {
  reportText: string
  onChange: (text: string) => void
  checkInAt: string
  checkOutAt: string
  taskCount: number
}

export function ReportReviewPanel({
  reportText,
  onChange,
  checkInAt,
  checkOutAt,
  taskCount,
}: ReportReviewPanelProps) {
  const metaFields = [
    { label: 'Date',            value: formatDate(checkInAt) },
    { label: 'Check-in',        value: formatTime(checkInAt) },
    { label: 'Check-out',       value: formatTime(checkOutAt) },
    { label: 'Duration',        value: formatDuration(checkInAt, checkOutAt) },
    { label: 'Tasks completed', value: String(taskCount) },
    { label: 'Status',          value: 'Pending Review' },
  ]

  return (
    <div className="space-y-4">
      {/* Report textarea */}
      <div className="bg-white border border-border-soft rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Generated Report</Label>
          <Badge variant="success">CQC Compliant</Badge>
        </div>
        <Textarea
          value={reportText}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[280px] font-body text-sm leading-relaxed"
        />
      </div>

      {/* Metadata grid */}
      <div className="bg-white border border-border-soft rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-deep mb-3">Visit Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          {metaFields.map((f) => (
            <div key={f.label}>
              <p className="text-[11px] text-slate-mid uppercase tracking-wide">{f.label}</p>
              <p className="text-sm font-medium text-slate-deep mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
