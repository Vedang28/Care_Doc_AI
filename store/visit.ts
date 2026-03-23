'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CompletedTask {
  taskId: string
  taskLabel: string
  category: string
  note?: string
}

interface FreeNotes {
  care: string
  condition: string
  incident: string
  response: string
}

interface QualityScore {
  overall: number
  completeness: number
  specificity: number
  riskAwareness: number
  feedback: string
}

interface GeneratedReport {
  report: string
  flags: string[]
  transformations: string[]
  qualityScore?: QualityScore | null
}

interface VisitState {
  // Session
  visitId: string | null
  clientId: string | null
  clientName: string | null
  checkInTime: Date | null

  // Progress
  currentStep: 'select' | 'tasks' | 'medications' | 'notes' | 'processing' | 'review' | 'saved'

  // Data
  completedTasks: CompletedTask[]
  freeNotes: FreeNotes
  generatedReport: GeneratedReport | null
  editedReportText: string

  // Actions
  startVisit: (visitId: string, clientId: string, clientName: string) => void
  setStep: (step: VisitState['currentStep']) => void
  toggleTask: (task: Omit<CompletedTask, 'note'>) => void
  setTaskNote: (taskId: string, note: string) => void
  setFreeNote: (key: keyof FreeNotes, value: string) => void
  setGeneratedReport: (report: GeneratedReport) => void
  setEditedReportText: (text: string) => void
  resetVisit: () => void
}

const initialState = {
  visitId: null,
  clientId: null,
  clientName: null,
  checkInTime: null,
  currentStep: 'select' as const,
  completedTasks: [],
  freeNotes: { care: '', condition: '', incident: '', response: '' },
  generatedReport: null,
  editedReportText: '',
}

export const useVisitStore = create<VisitState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startVisit: (visitId, clientId, clientName) =>
        set({ visitId, clientId, clientName, checkInTime: new Date(), currentStep: 'tasks' }),

      setStep: (step) => set({ currentStep: step }),

      toggleTask: (task) => {
        const { completedTasks } = get()
        const exists = completedTasks.find((t) => t.taskId === task.taskId)
        if (exists) {
          set({ completedTasks: completedTasks.filter((t) => t.taskId !== task.taskId) })
        } else {
          set({ completedTasks: [...completedTasks, task] })
        }
      },

      setTaskNote: (taskId, note) => {
        const { completedTasks } = get()
        set({
          completedTasks: completedTasks.map((t) =>
            t.taskId === taskId ? { ...t, note } : t
          ),
        })
      },

      setFreeNote: (key, value) =>
        set((state) => ({ freeNotes: { ...state.freeNotes, [key]: value } })),

      setGeneratedReport: (report) =>
        set({ generatedReport: report, editedReportText: report.report }),

      setEditedReportText: (text) => set({ editedReportText: text }),

      resetVisit: () => set(initialState),
    }),
    {
      name: 'caredoc-visit-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
