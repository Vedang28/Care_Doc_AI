'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskCategoryDefinition } from '@/types'

interface TaskCategoryProps {
  category: TaskCategoryDefinition
  completedTaskIds: Set<string>
  taskNotes: Record<string, string>
  onToggle: (task: { taskId: string; taskLabel: string; category: string }) => void
  onNoteChange: (taskId: string, note: string) => void
}

export function TaskCategory({
  category,
  completedTaskIds,
  taskNotes,
  onToggle,
  onNoteChange,
}: TaskCategoryProps) {
  const [open, setOpen] = useState(true)
  const completedCount = category.tasks.filter((t) => completedTaskIds.has(t.id)).length

  return (
    <div className="bg-white border border-border-soft rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-deep text-sm">{category.label}</span>
          <span className="text-xs text-slate-mid bg-surface border border-border-light rounded-full px-2 py-0.5">
            {completedCount} / {category.tasks.length}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-mid" />
        </motion.div>
      </button>

      {/* Tasks */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border-light border-t border-border-light">
              {category.tasks.map((task, index) => {
                const checked = completedTaskIds.has(task.id)
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'px-4 py-3 transition-colors',
                      checked ? 'bg-care-pale' : 'bg-white'
                    )}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          onToggle({ taskId: task.id, taskLabel: task.label, category: category.id })
                        }
                        className="mt-0.5 shrink-0"
                      />
                      <span
                        className={cn(
                          'text-sm leading-snug transition-colors',
                          checked ? 'text-care-dark font-medium' : 'text-slate-deep'
                        )}
                      >
                        {task.label}
                      </span>
                    </label>

                    <AnimatePresence>
                      {checked && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ml-8">
                            <Textarea
                              rows={2}
                              placeholder="Optional note..."
                              value={taskNotes[task.id] ?? ''}
                              onChange={(e) => onNoteChange(task.id, e.target.value)}
                              className="text-xs resize-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
