import type { Role, VisitStatus, ReportStatus } from '@prisma/client'

export type { Role, VisitStatus, ReportStatus }

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  agencyId: string
}

// ─── API Response shapes ─────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface ClientSummary {
  id: string
  name: string
  address: string
  conditions: string[]
  carePlan: string
  risks: string | null
  lastVisitAt: string | null
}

// ─── Visit ───────────────────────────────────────────────────────────────────

export interface TaskItem {
  taskId: string
  taskLabel: string
  category: string
  note?: string
}

export interface NotePayload {
  care: string
  condition: string
  incident: string
  response: string
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface ReportListItem {
  reportId: string
  visitId: string
  clientName: string
  caregiverName: string
  checkInAt: string
  checkOutAt: string | null
  taskCount: number
  flagCount: number
  status: ReportStatus
  visitStatus: VisitStatus
}

export interface ReportDetail {
  id: string
  visitId: string
  reportText: string
  flags: string[]
  transformations: string[]
  aiModel: string
  promptVersion: string
  status: ReportStatus
  createdAt: string
  client: {
    name: string
    address: string
    conditions: string[]
    carePlan: string
  }
  caregiver: {
    name: string
    email: string
  }
  visit: {
    checkInAt: string
    checkOutAt: string | null
    tasks: TaskItem[]
    notes: {
      careText: string
      conditionText: string
      incidentText: string
      responseText: string
    } | null
  }
  signature: {
    signedAt: string
    userId: string
  } | null
}

// ─── Task categories ─────────────────────────────────────────────────────────

export interface TaskDefinition {
  id: string
  label: string
  category: string
}

export interface TaskCategoryDefinition {
  id: string
  label: string
  tasks: TaskDefinition[]
}
