'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProcessingScreen } from '@/components/care/ProcessingScreen'
import { useVisitStore } from '@/store/visit'

interface ProcessingPageProps {
  params: { visitId: string }
}

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const router = useRouter()
  const { setGeneratedReport, setStep } = useVisitStore()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function generate() {
      try {
        const res = await fetch(`/api/visits/${params.visitId}/generate-report`, {
          method: 'POST',
        })

        if (!res.ok) throw new Error('Generation failed')

        const data = await res.json()
        setGeneratedReport({
          report:          data.report,
          flags:           data.flags,
          transformations: data.transformations,
          qualityScore:    data.qualityScore ?? null,
        })
        setStep('review')
        router.push(`/visit/${params.visitId}/review`)
      } catch {
        // Navigate to review anyway — raw notes are preserved in the store
        setStep('review')
        router.push(`/visit/${params.visitId}/review?error=1`)
      }
    }

    generate()
  }, [params.visitId, router, setGeneratedReport, setStep])

  return <ProcessingScreen />
}
