'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const STEPS = [
  'Analysing your notes...',
  'Applying person-centred language...',
  'Checking CQC compliance...',
  'Flagging concerns...',
  'Preparing your report...',
]

export function ProcessingScreen() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-care"
      >
        <Sparkles className="h-14 w-14" />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-care-dark">Generating Report</h2>

        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-slate-mid text-sm"
            >
              {STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-care-light"
            animate={{ width: i === stepIndex ? 24 : 6, opacity: i === stepIndex ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}
