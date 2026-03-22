import { z } from 'zod'

export const managerReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  clientId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
  hasFlags: z.enum(['true', 'false']).optional(),
})

export type ManagerReportsQuery = z.infer<typeof managerReportsQuerySchema>
