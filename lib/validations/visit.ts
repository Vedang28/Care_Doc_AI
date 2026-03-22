import { z } from 'zod'

export const startVisitSchema = z.object({
  clientId: z.string().uuid(),
})

export const saveTasksSchema = z.object({
  tasks: z.array(
    z.object({
      taskId: z.string(),
      taskLabel: z.string().min(1),
      category: z.string().min(1),
      note: z.string().optional(),
    })
  ),
})

export const saveNotesSchema = z.object({
  care: z.string(),
  condition: z.string(),
  incident: z.string(),
  response: z.string(),
})

export const submitReportSchema = z.object({
  reportText: z.string().min(1, 'Report text cannot be empty'),
})

export type StartVisitInput = z.infer<typeof startVisitSchema>
export type SaveTasksInput = z.infer<typeof saveTasksSchema>
export type SaveNotesInput = z.infer<typeof saveNotesSchema>
export type SubmitReportInput = z.infer<typeof submitReportSchema>
