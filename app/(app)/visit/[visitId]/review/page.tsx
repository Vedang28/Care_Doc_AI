'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { StepProgress } from '@/components/care/StepProgress'
import { FlagAlert } from '@/components/care/FlagAlert'
import { TransformationBox } from '@/components/care/TransformationBox'
import { ReportReviewPanel } from '@/components/care/ReportReviewPanel'
import { DigitalSignature } from '@/components/care/DigitalSignature'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVisitStore } from '@/store/visit'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

interface ReviewPageProps {
  params: { visitId: string }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasError = searchParams.get('error') === '1'

  const {
    clientName,
    checkInTime,
    completedTasks,
    generatedReport,
    editedReportText,
    setEditedReportText,
    setStep,
    resetVisit,
  } = useVisitStore()

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  // Get user name
  useState(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((s) => setUserName(s?.user?.name ?? ''))
      .catch(() => {})
  })

  const checkOut = new Date().toISOString()

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/visits/${params.visitId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText: editedReportText }),
      })
      if (!res.ok) throw new Error('Submission failed')

      const data = await res.json()
      setReportId(data.reportId)
      setStep('saved')
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleNewVisit() {
    resetVisit()
    router.push('/dashboard')
  }

  if (!clientName || !checkInTime) {
    router.push('/dashboard')
    return null
  }

  // ── Saved state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="rounded-full bg-care-light p-5"
        >
          <CheckCircle2 className="h-12 w-12 text-care-dark" />
        </motion.div>

        <div>
          <h2 className="font-display text-2xl font-bold text-care-dark">Report Submitted</h2>
          <p className="text-slate-mid text-sm mt-1">Visit for <strong>{clientName}</strong> has been recorded.</p>
          {reportId && (
            <p className="font-mono text-xs text-slate-mid mt-1">Report ID: {reportId.slice(0, 8)}...</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <Badge variant="success">Audit Trail Preserved</Badge>
          <Badge variant="success">CQC Ready</Badge>
        </div>

        <Button onClick={handleNewVisit} className="mt-2">
          Start New Visit
        </Button>
      </div>
    )
  }

  // ── Review state ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 -mx-4 -mt-6">
      <StepProgress currentStep="review" />

      <div className="px-4 pt-5 pb-6 space-y-4">
        {hasError && (
          <div className="rounded-lg bg-care-accent-light border border-orange-200 p-3 text-sm text-care-accent">
            AI processing was unavailable. Your notes have been preserved below — please edit the report manually before submitting.
          </div>
        )}

        {generatedReport?.flags && generatedReport.flags.length > 0 && (
          <FlagAlert flags={generatedReport.flags} />
        )}

        {generatedReport?.transformations && generatedReport.transformations.length > 0 && (
          <TransformationBox transformations={generatedReport.transformations} />
        )}

        <ReportReviewPanel
          reportText={editedReportText}
          onChange={setEditedReportText}
          checkInAt={checkInTime.toString()}
          checkOutAt={checkOut}
          taskCount={completedTasks.length}
        />

        <DigitalSignature
          userName={userName}
          onSubmit={handleSubmit}
          loading={submitting}
        />

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => { setStep('notes'); router.push(`/visit/${params.visitId}/notes`) }}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Edit Notes
        </Button>
      </div>
    </div>
  )
}
