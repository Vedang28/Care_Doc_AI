'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FlagAlert } from '@/components/care/FlagAlert'
import { TransformationBox } from '@/components/care/TransformationBox'
import { IncidentSlideOver } from '@/components/care/IncidentSlideOver'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { ReportDetail } from '@/types'
import { ArrowLeft, CheckCircle2, Download, Loader2 } from 'lucide-react'

interface ReportDetailPageProps {
  params: { reportId: string }
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [slideOverFlag, setSlideOverFlag] = useState('')

  async function handleExportPdf() {
    if (!report) return
    setExportingPdf(true)
    try {
      const res = await fetch(`/api/reports/${params.reportId}/export-pdf`, { method: 'POST' })
      const data = await res.json() as { url?: string; html?: string; mode: string }
      if (data.mode === 'pdf' && data.url) {
        window.open(data.url, '_blank')
      } else if (data.mode === 'html' && data.html) {
        // Fallback: open print dialog
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(data.html)
          win.document.close()
          win.print()
        }
      }
    } catch {
      // Fail silently
    } finally {
      setExportingPdf(false)
    }
  }

  useEffect(() => {
    fetch(`/api/manager/reports/${params.reportId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.reportId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-mid">Report not found.</p>
        <Link href="/manager"><Button variant="ghost" className="mt-4" icon={<ArrowLeft className="h-4 w-4" />}>Back to reports</Button></Link>
      </div>
    )
  }

  const rawNotes = [
    report.visit.notes?.careText      && `Care provided:\n${report.visit.notes.careText}`,
    report.visit.notes?.conditionText && `Condition changes:\n${report.visit.notes.conditionText}`,
    report.visit.notes?.incidentText  && `Incidents/concerns:\n${report.visit.notes.incidentText}`,
    report.visit.notes?.responseText  && `Client response:\n${report.visit.notes.responseText}`,
  ].filter(Boolean).join('\n\n')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/manager">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} className="mb-2 -ml-2">
              All reports
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold text-care-dark">{report.client.name}</h1>
          <p className="text-slate-mid text-sm">{formatDate(report.visit.checkInAt)} · {report.caregiver.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={report.status === 'APPROVED' ? 'success' : report.status === 'FLAGGED' ? 'danger' : 'warning'}>
            {report.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPdf}
            icon={exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          >
            {exportingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Flags + Transformations */}
      {report.flags.length > 0 && <FlagAlert flags={report.flags} />}
      {report.flags.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {report.flags.map((flag, i) => (
            <button
              key={i}
              onClick={() => {
                setSlideOverFlag(flag)
                setSlideOverOpen(true)
              }}
              className="text-left text-xs text-amber-700 hover:text-amber-900 underline"
            >
              + Create incident for: &ldquo;{flag.slice(0, 60)}{flag.length > 60 ? '...' : ''}&rdquo;
            </button>
          ))}
        </div>
      )}
      {report.transformations.length > 0 && <TransformationBox transformations={report.transformations} />}

      {/* Two-column: Notes | Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original notes */}
        <div className="bg-surface border border-border-soft rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-3">Original Notes</p>
          <pre className="text-sm text-slate-deep whitespace-pre-wrap font-body leading-relaxed">
            {rawNotes || 'No notes recorded.'}
          </pre>
          {report.visit.tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-2">Tasks Completed</p>
              <ul className="space-y-1">
                {report.visit.tasks.map((t) => (
                  <li key={t.taskId} className="text-sm text-slate-deep flex gap-2">
                    <span className="text-care mt-0.5">✓</span>
                    <span>{t.taskLabel}{t.note && <span className="text-slate-mid"> — {t.note}</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Final report */}
        <div className="bg-white border border-border-soft rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide">Submitted Report</p>
            <Badge variant="success">CQC Compliant</Badge>
          </div>
          <p className="text-sm text-slate-deep whitespace-pre-wrap leading-relaxed">{report.reportText}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-border-soft rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mb-3">Visit Details</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Client',     value: report.client.name },
            { label: 'Caregiver',  value: report.caregiver.name },
            { label: 'Date',       value: formatDate(report.visit.checkInAt) },
            { label: 'Check-in',   value: formatTime(report.visit.checkInAt) },
            { label: 'Check-out',  value: report.visit.checkOutAt ? formatTime(report.visit.checkOutAt) : '—' },
            { label: 'Duration',   value: report.visit.checkOutAt ? formatDuration(report.visit.checkInAt, report.visit.checkOutAt) : '—' },
            { label: 'AI Model',   value: report.aiModel },
            { label: 'Prompt v',   value: report.promptVersion },
            { label: 'Tasks',      value: String(report.visit.tasks.length) },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[11px] text-slate-mid uppercase tracking-wide">{f.label}</p>
              <p className="font-medium text-slate-deep mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature */}
      {report.signature && (
        <div className="flex items-center gap-2 rounded-lg bg-care-pale border border-care-light p-3">
          <CheckCircle2 className="h-4 w-4 text-care shrink-0" />
          <p className="text-sm text-care-dark">
            Digitally signed by <strong>{report.caregiver.name}</strong> on {formatDate(report.signature.signedAt)} at {formatTime(report.signature.signedAt)}
          </p>
        </div>
      )}

      {/* Create Incident slide-over (triggered from flags) */}
      {slideOverOpen && (
        <IncidentSlideOver
          open={slideOverOpen}
          onClose={() => setSlideOverOpen(false)}
          mode="create"
          reportId={params.reportId}
          flagText={slideOverFlag}
          onSaved={() => { setSlideOverOpen(false) }}
        />
      )}
    </div>
  )
}
