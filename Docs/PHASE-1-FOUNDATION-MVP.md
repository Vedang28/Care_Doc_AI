# CareDoc AI — Phase 1: Foundation MVP
## Claude Code Build Prompt

---

## CONTEXT & YOUR ROLE

You are building **CareDoc AI** — an AI-powered care documentation platform for UK domiciliary care providers. You have been given the full Product Documentation file (`CareDocAI-Product-Documentation.docx`) as your source of truth.

Your job in this phase is to build the **complete, working MVP** from scratch. This is a real product that will be piloted with a live care agency. Every decision you make should reflect that — production-quality code, no shortcuts, no placeholder components.

At the end of Phase 1, a caregiver should be able to:
1. Log in on their phone
2. Select a client from their assigned list
3. Complete a task checklist for the visit
4. Write free-text notes in guided prompts
5. Trigger AI report generation via the Anthropic API
6. Review the AI output, edit if needed, and digitally approve
7. Submit the report — stored securely with full audit trail

A manager should be able to log in and view all submitted reports for their agency.

---

## TECH STACK — USE EXACTLY THIS

```
Framework:        Next.js 14 (App Router)
Language:         TypeScript 5 (strict mode)
Styling:          Tailwind CSS 3
Components:       shadcn/ui (for accessible primitives)
Animation:        Framer Motion
State:            Zustand
Forms:            React Hook Form + Zod
Auth:             NextAuth.js v5
Database:         PostgreSQL via Prisma ORM
DB Host:          Neon (serverless Postgres)
AI:               Anthropic Claude API (claude-sonnet-4-20250514)
Email:            Resend
Error tracking:   Sentry
Deployment:       Vercel
```

Do NOT introduce any libraries not on this list without flagging it first with a comment explaining why.

---

## DESIGN SYSTEM — IMPLEMENT EXACTLY THIS

### Colour Tokens (add to tailwind.config.ts)

```typescript
colors: {
  'care-dark':    '#1A4332',
  'care':         '#2D6A4F',
  'care-light':   '#D8F3DC',
  'care-pale':    '#F0FAF3',
  'care-accent':  '#B7410E',
  'care-accent-light': '#FDEBD0',
  'slate-deep':   '#1E293B',
  'slate-mid':    '#475569',
  'border-soft':  '#CBD5E1',
  'border-light': '#E2E8F0',
  'surface':      '#F8FAFC',
}
```

### Typography

```typescript
fontFamily: {
  display: ['Playfair Display', 'Georgia', 'serif'],
  body:    ['DM Sans', '-apple-system', 'sans-serif'],
  mono:    ['JetBrains Mono', 'monospace'],
}
```

Load from Google Fonts in `app/layout.tsx`:
- Playfair Display: weights 700
- DM Sans: weights 400, 500, 600
- JetBrains Mono: weight 400

### Component Conventions

**Badges** — 4 variants:
- `default`: bg-surface border-border-light text-slate-mid
- `success`: bg-care-light border-green-200 text-care-dark
- `warning`: bg-amber-50 border-amber-200 text-amber-800
- `danger`: bg-care-accent-light border-orange-200 text-care-accent

**Buttons** — Primary: `bg-care text-white hover:bg-care-dark` with 8px radius, icon-left slot, loading state with spinner. Secondary: transparent with border.

**Cards** — `bg-white border border-border-soft rounded-xl p-4 md:p-5` with hover: `border-care` transition-colors duration-200.

**Alert boxes** — always icon-left, colour-coded by type, rounded-lg, no drop shadows.

**Form fields** — label above (never floating), `bg-surface` at rest, `bg-white border-care` on focus, `rounded-lg`, 14px body font.

---

## PROJECT STRUCTURE

Set up this exact folder structure:

```
caredoc-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Caregiver: client selection
│   │   ├── visit/
│   │   │   └── [visitId]/
│   │   │       ├── tasks/
│   │   │       │   └── page.tsx
│   │   │       ├── notes/
│   │   │       │   └── page.tsx
│   │   │       ├── processing/
│   │   │       │   └── page.tsx
│   │   │       └── review/
│   │   │           └── page.tsx
│   │   ├── manager/
│   │   │   ├── page.tsx           # Manager: report list
│   │   │   └── reports/
│   │   │       └── [reportId]/
│   │   │           └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── clients/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── visits/
│   │   │   ├── route.ts
│   │   │   └── [visitId]/
│   │   │       ├── tasks/
│   │   │       │   └── route.ts
│   │   │       ├── notes/
│   │   │       │   └── route.ts
│   │   │       ├── generate-report/
│   │   │       │   └── route.ts
│   │   │       └── submit/
│   │   │           └── route.ts
│   │   └── manager/
│   │       └── reports/
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── care/                      # CareDoc-specific components
│   │   ├── ClientCard.tsx
│   │   ├── TaskCategory.tsx
│   │   ├── GuidedNoteField.tsx
│   │   ├── ProcessingScreen.tsx
│   │   ├── ReportReviewPanel.tsx
│   │   ├── FlagAlert.tsx
│   │   ├── TransformationBox.tsx
│   │   ├── VisitHeader.tsx
│   │   ├── StepProgress.tsx
│   │   └── DigitalSignature.tsx
│   └── layout/
│       ├── AppShell.tsx
│       └── AuthShell.tsx
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── db.ts                      # Prisma client singleton
│   ├── ai/
│   │   ├── generate-report.ts     # Claude API call + parsing
│   │   └── prompts.ts             # System prompt builder
│   ├── validations/
│   │   ├── visit.ts               # Zod schemas
│   │   └── report.ts
│   └── utils.ts
├── store/
│   └── visit.ts                   # Zustand visit session store
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts
└── middleware.ts                  # Auth + role protection
```

---

## DATABASE SCHEMA

Create `prisma/schema.prisma` with exactly this schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agency {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  logoUrl   String?
  plan      String   @default("starter")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  clients  Client[]
  visits   Visit[]
  reports  Report[]
  auditLogs AuditLog[]
  promptVersions PromptVersion[]
}

model User {
  id           String   @id @default(uuid())
  agencyId     String
  email        String   @unique
  name         String
  role         Role     @default(CAREGIVER)
  passwordHash String
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  agency     Agency     @relation(fields: [agencyId], references: [id])
  visits     Visit[]
  signatures Signature[]
  auditLogs  AuditLog[]

  @@index([agencyId])
}

enum Role {
  ADMIN
  MANAGER
  SENIOR_CARER
  CAREGIVER
}

model Client {
  id         String   @id @default(uuid())
  agencyId   String
  name       String
  dob        DateTime?
  address    String
  conditions String[]
  carePlan   String
  risks      String?
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  agency  Agency  @relation(fields: [agencyId], references: [id])
  visits  Visit[]
  rotaAssignments RotaAssignment[]

  @@index([agencyId])
}

model RotaAssignment {
  id            String   @id @default(uuid())
  clientId      String
  caregiverId   String
  scheduledDate DateTime @db.Date
  visitType     String   @default("standard")
  status        String   @default("scheduled")
  createdAt     DateTime @default(now())

  client Client @relation(fields: [clientId], references: [id])

  @@index([caregiverId, scheduledDate])
}

model Visit {
  id          String      @id @default(uuid())
  clientId    String
  caregiverId String
  agencyId    String
  checkInAt   DateTime    @default(now())
  checkOutAt  DateTime?
  status      VisitStatus @default(IN_PROGRESS)
  locationLat Float?
  locationLng Float?
  cancelledAt DateTime?
  cancelReason String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  client    Client      @relation(fields: [clientId], references: [id])
  caregiver User        @relation(fields: [caregiverId], references: [id])
  agency    Agency      @relation(fields: [agencyId], references: [id])
  tasks     VisitTask[]
  notes     VisitNotes?
  report    Report?

  @@index([agencyId, clientId])
  @@index([caregiverId])
}

enum VisitStatus {
  IN_PROGRESS
  PENDING_REVIEW
  SUBMITTED
  CANCELLED
}

model VisitTask {
  id        String  @id @default(uuid())
  visitId   String
  taskId    String
  taskLabel String
  category  String
  completed Boolean @default(true)
  note      String?

  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([visitId])
}

model VisitNotes {
  id           String @id @default(uuid())
  visitId      String @unique
  careText     String @default("")
  conditionText String @default("")
  incidentText String @default("")
  responseText String @default("")

  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Report {
  id              String       @id @default(uuid())
  visitId         String       @unique
  agencyId        String
  reportText      String
  flags           String[]
  transformations String[]
  aiModel         String
  promptVersion   String
  status          ReportStatus @default(PENDING)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  visit     Visit      @relation(fields: [visitId], references: [id])
  agency    Agency     @relation(fields: [agencyId], references: [id])
  signature Signature?

  @@index([agencyId])
}

enum ReportStatus {
  PENDING
  APPROVED
  FLAGGED
}

model Signature {
  id         String   @id @default(uuid())
  reportId   String   @unique
  userId     String
  signedAt   DateTime @default(now())
  ipAddress  String?
  userAgent  String?

  report Report @relation(fields: [reportId], references: [id])
  user   User   @relation(fields: [userId], references: [id])
}

model AuditLog {
  id         String   @id @default(uuid())
  agencyId   String
  userId     String?
  action     String
  entityType String
  entityId   String?
  before     Json?
  after      Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  agency Agency @relation(fields: [agencyId], references: [id])
  user   User?  @relation(fields: [userId], references: [id])

  @@index([agencyId, createdAt])
}

model PromptVersion {
  id           String   @id @default(uuid())
  agencyId     String
  systemPrompt String
  version      String
  active       Boolean  @default(false)
  createdAt    DateTime @default(now())

  agency Agency @relation(fields: [agencyId], references: [id])

  @@index([agencyId, active])
}
```

After creating the schema, run:
```bash
npx prisma generate
npx prisma db push
```

---

## ENVIRONMENT VARIABLES

Create `.env.local` with these keys (values to be filled by user):

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Resend
RESEND_API_KEY="re_..."

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## ZUSTAND VISIT STORE

Create `store/visit.ts`:

```typescript
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

interface GeneratedReport {
  report: string
  flags: string[]
  transformations: string[]
}

interface VisitState {
  // Session
  visitId: string | null
  clientId: string | null
  clientName: string | null
  checkInTime: Date | null

  // Progress
  currentStep: 'select' | 'tasks' | 'notes' | 'processing' | 'review' | 'saved'

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
        const exists = completedTasks.find(t => t.taskId === task.taskId)
        if (exists) {
          set({ completedTasks: completedTasks.filter(t => t.taskId !== task.taskId) })
        } else {
          set({ completedTasks: [...completedTasks, task] })
        }
      },

      setTaskNote: (taskId, note) => {
        const { completedTasks } = get()
        set({
          completedTasks: completedTasks.map(t =>
            t.taskId === taskId ? { ...t, note } : t
          )
        })
      },

      setFreeNote: (key, value) =>
        set(state => ({ freeNotes: { ...state.freeNotes, [key]: value } })),

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
```

---

## AI LAYER IMPLEMENTATION

### `lib/ai/prompts.ts`

```typescript
export function buildSystemPrompt(agencyPromptOverride?: string): string {
  if (agencyPromptOverride) return agencyPromptOverride

  return `You are a CQC-compliant care documentation assistant for domiciliary care in England.
Your role is to transform caregiver notes into professional, person-centred visit reports.

RULES:
- Use dignified, person-centred language. Refer to "the client" or use their first name.
- Never use terms like "patient", "elderly", "demented", or any infantilising language.
- Replace informal or judgmental language without altering factual meaning:
  Examples: "grabbed" → "assisted", "rude" → "appeared reluctant to engage",
  "didn't eat" → "declined support with eating", "confused" → "appeared disoriented"
- Expand vague notes into structured professional sentences.
- Flag any safeguarding concerns, falls, refusal of medication, or changes in condition.
- If notes mention: falls, near-falls, injuries, refusal of medication, skin changes,
  significant confusion, or distress — these MUST appear in the flags array.
- Never invent details not present in the caregiver's notes.
- Structure the report: Summary → Tasks Completed → Observations → Concerns/Risks → Recommendations
- If no concerns: omit the Concerns section entirely (do not write "No concerns noted")
- Keep the report factual, concise, and readable by a CQC inspector.

RESPOND ONLY with a valid JSON object. No markdown fences. No preamble. No explanation.
{
  "report": "The full professional report text as a single string with \\n for line breaks",
  "flags": ["Array of flagged concerns. Empty array if none."],
  "transformations": ["Array describing each informal→formal change made, e.g. 'grabbed → assisted with mobilising'"]
}`
}

export function buildUserMessage(context: {
  clientName: string
  clientAge?: number
  conditions: string[]
  carePlan: string
  visitDate: string
  checkInTime: string
  checkOutTime: string
  completedTasks: Array<{ taskLabel: string; category: string; note?: string }>
  freeNotes: {
    care: string
    condition: string
    incident: string
    response: string
  }
}): string {
  const taskList = context.completedTasks.length > 0
    ? context.completedTasks
        .map(t => `• ${t.taskLabel}${t.note ? ` — ${t.note}` : ''}`)
        .join('\n')
    : 'No tasks recorded'

  const noteLines = [
    context.freeNotes.care && `Care provided: ${context.freeNotes.care}`,
    context.freeNotes.condition && `Condition changes: ${context.freeNotes.condition}`,
    context.freeNotes.incident && `Incidents/concerns: ${context.freeNotes.incident}`,
    context.freeNotes.response && `Client response: ${context.freeNotes.response}`,
  ].filter(Boolean).join('\n')

  return `Client: ${context.clientName}${context.clientAge ? `, Age: ${context.clientAge}` : ''}
Known conditions: ${context.conditions.join(', ') || 'None recorded'}
Care plan: ${context.carePlan}
Visit date: ${context.visitDate}
Check-in: ${context.checkInTime}
Check-out: ${context.checkOutTime}

Tasks completed:
${taskList}

Caregiver notes:
${noteLines || 'No additional notes provided'}`
}
```

### `lib/ai/generate-report.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserMessage } from './prompts'
import { z } from 'zod'

const client = new Anthropic()

const ReportResponseSchema = z.object({
  report: z.string().min(1),
  flags: z.array(z.string()),
  transformations: z.array(z.string()),
})

export type ReportResponse = z.infer<typeof ReportResponseSchema>

export interface GenerateReportInput {
  clientName: string
  clientAge?: number
  conditions: string[]
  carePlan: string
  visitDate: string
  checkInTime: string
  checkOutTime: string
  completedTasks: Array<{ taskLabel: string; category: string; note?: string }>
  freeNotes: {
    care: string
    condition: string
    incident: string
    response: string
  }
  agencyPromptOverride?: string
  promptVersion?: string
}

export async function generateVisitReport(input: GenerateReportInput): Promise<ReportResponse> {
  const systemPrompt = buildSystemPrompt(input.agencyPromptOverride)
  const userMessage = buildUserMessage(input)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content
    .map(block => (block.type === 'text' ? block.text : ''))
    .join('')
    .replace(/```json|```/g, '')
    .trim()

  const parsed = JSON.parse(rawText)
  return ReportResponseSchema.parse(parsed)
}
```

---

## API ROUTES — IMPLEMENT ALL OF THESE

### `app/api/visits/route.ts` — Start a visit

```typescript
// POST /api/visits
// Body: { clientId: string }
// Creates visit record, records check-in time, returns visitId
// Auth: CAREGIVER+ required
// Write to AuditLog: action="VISIT_STARTED"
```

### `app/api/visits/[visitId]/tasks/route.ts` — Save tasks

```typescript
// POST /api/visits/[visitId]/tasks
// Body: { tasks: Array<{ taskId, taskLabel, category, note? }> }
// Upserts VisitTask records for this visit (delete existing, insert new)
// Auth: visit must belong to requesting caregiver
```

### `app/api/visits/[visitId]/notes/route.ts` — Save notes

```typescript
// POST /api/visits/[visitId]/notes
// Body: { care, condition, incident, response }
// Upserts VisitNotes record
// Auth: visit must belong to requesting caregiver
```

### `app/api/visits/[visitId]/generate-report/route.ts` — AI generation

```typescript
// POST /api/visits/[visitId]/generate-report
// 1. Verify visit belongs to caregiver
// 2. Fetch visit + client + notes + tasks from DB
// 3. Fetch active PromptVersion for agency (or use default)
// 4. Call generateVisitReport()
// 5. Store result in Report table (status: PENDING)
// 6. Update visit status to PENDING_REVIEW, set checkOutAt
// 7. Write AuditLog: action="REPORT_GENERATED"
// 8. Return { reportId, report, flags, transformations }
// Error handling: if AI fails, store raw notes with flag
//   ["AI processing failed — manual review required"]
```

### `app/api/visits/[visitId]/submit/route.ts` — Submit report

```typescript
// POST /api/visits/[visitId]/submit
// Body: { reportText: string } (caregiver may have edited)
// 1. Update Report.reportText with edited version
// 2. Update Report.status to APPROVED
// 3. Update Visit.status to SUBMITTED
// 4. Create Signature record with userId, timestamp, ipAddress, userAgent
// 5. Write AuditLog: action="REPORT_SUBMITTED"
// 6. Return { reportId, submittedAt }
```

### `app/api/manager/reports/route.ts` — Manager report list

```typescript
// GET /api/manager/reports
// Query params: ?page=1&limit=20&clientId=&caregiverId=&hasFlags=
// Auth: MANAGER+ required
// Returns paginated list with: visitId, clientName, caregiverName,
//   checkInAt, checkOutAt, taskCount, flagCount, status
```

---

## PAGE-BY-PAGE UI IMPLEMENTATION

### `/login` — Auth Screen

Full-screen layout. White card centred, max-w-sm. 
- Top: CareDoc**AI** wordmark (Playfair Display, green)
- Subtitle: "Care documentation, done right."
- Email input + Password input (show/hide toggle)
- "Sign In" button (full-width, care green)
- Error state: inline red text below relevant field
- No registration link (admin creates accounts)
- On submit: NextAuth `signIn('credentials', ...)` with redirect to `/dashboard`

### `/dashboard` — Client Selection

Show a welcoming greeting: "Good morning, [Name]." in Playfair Display.
Sub-heading: "Select a client to start documenting their visit."

**Client cards** — each card shows:
- Avatar circle (initials, care-pale background, care-dark text)
- Client name (semibold, 16px)
- Address (muted, 13px)
- Conditions as Badge components (max 3 shown, "+N more" if overflow)
- Right side: small "Last visit" date in muted text
- Full-width "Start Visit →" button that appears on hover (Framer Motion layout animation)
- Clicking the button: POST /api/visits with clientId, then navigate to /visit/[visitId]/tasks

Use `useEffect` + `fetch('/api/clients')` to load the client list.
Show skeleton loading state (3 grey card shapes) while loading.
Empty state: illustration + "No clients assigned to you today."

**StepProgress component** — horizontal strip at top showing:
`Select Client → Tasks → Notes → Review → Done`
Highlight the active step.

### `/visit/[visitId]/tasks` — Task Checklist

**VisitHeader** sticky at top: client name, conditions badges, elapsed timer (updates every second via `useInterval`).

Five `TaskCategory` accordion components. Each:
- Category name as header with completed count badge (e.g. "3 / 5")
- Framer Motion `AnimatePresence` + `motion.div` for expand/collapse with spring physics
- Staggered children: each task reveals 50ms after previous

Each task item:
- Checkbox (shadcn Checkbox, `accentColor: care`)
- Task label text
- When checked: `motion.div` slides down to reveal optional note input
- Checked state: `bg-care-pale border-care-light` background fill

Bottom bar (sticky on mobile):
- "{N} tasks recorded" in muted text
- "Continue to Notes →" button

On "Continue": save tasks via POST /api/visits/[visitId]/tasks, then navigate to notes.

### `/visit/[visitId]/notes` — Guided Notes

Four `GuidedNoteField` components, each with:
- Label: question text (bold, 13px)
- Textarea: `bg-surface` rest → `bg-white border-care` focus, `rows={3}` expandable
- Smooth border-color transition on focus (Framer Motion or CSS transition)

Yellow caution banner below: shield icon + "Write naturally — the AI will transform your notes into a professional report."

**"Complete Visit & Generate Report"** button: care green, sparkle icon left, large (full-width on mobile).

On click:
1. Save notes via POST /api/visits/[visitId]/notes
2. Navigate to /visit/[visitId]/processing (do NOT await the report here)
3. On the processing page, trigger POST /api/visits/[visitId]/generate-report

### `/visit/[visitId]/processing` — AI Processing

Full-screen centred layout. No header nav.

Animated sparkle icon (Framer Motion `animate={{ rotate: 360 }}` with `repeat: Infinity, duration: 2`).

Subtitle cycles through these steps with a fade transition every 1.5s:
1. "Analysing your notes..."
2. "Applying person-centred language..."
3. "Checking CQC compliance..."
4. "Flagging concerns..."
5. "Preparing your report..."

Use `useEffect` to call the generate-report API. On success: navigate to review. On failure: navigate to review with error state (raw notes preserved).

### `/visit/[visitId]/review` — Report Review & Approval

**FlagAlert** component (if flags exist):
- Rust/danger coloured box, triangle icon, "Flagged Concerns" heading
- Each flag as a list item with bullet
- Animate in with `motion.div` staggered 100ms per flag

**TransformationBox** component (if transformations exist):
- Care-green box, sparkle icon, "Language Improvements" heading
- Each transformation in JetBrains Mono: "grabbed → assisted with mobilising"

**Report textarea**:
- Full generated report, fully editable
- "Generated Report" header with "CQC Compliant" success badge
- `min-h-[280px]`, `resize-y`

**Visit metadata grid** (2 columns):
Date | Check-in time | Check-out time | Duration | Tasks completed | Status

**DigitalSignature component**:
- Checkbox + label: "I confirm this report is an accurate record of the care provided during this visit."
- Sub-text: "Digital signature: [Name] on [Date] at [Time]"
- Submit button disabled until checkbox ticked

On submit: POST /api/visits/[visitId]/submit → navigate to saved state.

**"← Edit Notes" button**: navigates back, preserves all state in Zustand store.

### Saved / Success State

Green circle with check icon (Framer Motion scale spring: `initial={{ scale: 0 }} animate={{ scale: 1 }}`).
"Report Submitted" heading.
Client name confirmation.
Report ID in mono font.
Audit badges: "Audit Trail Preserved" + "CQC Ready".
"Start New Visit" button → resetVisit() + navigate to dashboard.

### `/manager` — Manager Report List

Table view with columns:
Client | Caregiver | Date | Duration | Tasks | Flags | Status | Actions

- Flags column: red badge with count if > 0
- Status: success/warning/danger badge
- "View Report" link opens the report detail page
- Filter bar at top: search by client name, filter by date range, filter "Has flags only"
- Pagination: 20 per page

### `/manager/reports/[reportId]` — Report Detail

Two-column layout (desktop) / stacked (mobile):
- Left: Original raw caregiver notes (grey background, read-only, labelled "Original Notes")
- Right: Final report (white, labelled "Submitted Report")
- Below: Flags, Transformations, Signature details, Audit metadata

---

## MIDDLEWARE & AUTH PROTECTION

`middleware.ts`:
```typescript
// Protect all /dashboard, /visit, /manager routes
// /manager routes: redirect to /dashboard if role is CAREGIVER
// Redirect unauthenticated users to /login
// Use NextAuth getToken() for edge-compatible auth check
```

---

## SEED DATA

Create `prisma/seed.ts` with:
- 1 Agency: "Sunrise Care Agency", code: "SUNRISE"
- 1 Admin user: admin@sunrise.care / password: Admin123!
- 1 Manager user: manager@sunrise.care / password: Manager123!
- 3 Caregiver users: carer1@sunrise.care, carer2@sunrise.care, carer3@sunrise.care / password: Carer123!
- 3 Clients (use names from the existing prototype): Margaret Thompson, Arthur Davies, Doris Mitchell
  (with their conditions and care plans from the original caredoc-ai.jsx file)
- Rota assignments: all 3 clients assigned to carer1 for today's date
- 1 PromptVersion: the base system prompt from `lib/ai/prompts.ts`, version "1.0", active: true

Run seed: `npx prisma db seed`

---

## QUALITY & ERROR HANDLING REQUIREMENTS

1. **No raw `console.error` in production** — all errors go through a `logger.ts` utility that wraps Sentry.
2. **All API routes must return consistent error shapes**:
   ```typescript
   { error: string, code: string, details?: unknown }
   ```
3. **Loading states on every async operation** — no UI should show stale/blank content.
4. **TypeScript strict mode** — zero `any` types. All API responses typed end-to-end.
5. **Mobile first** — test every page at 375px width first, then expand.
6. **Zustand persistence** — visit state survives accidental page refresh mid-visit (sessionStorage).
7. **AI fallback** — if Claude API fails or returns unparseable JSON, store raw notes and set flags = `["AI processing failed — manual review required"]`. Never lose caregiver data.

---

## PHASE 1 DONE CRITERIA

You are done with Phase 1 when:

- [ ] `npm run build` completes with zero errors
- [ ] `npx prisma db push` + seed runs successfully
- [ ] A caregiver can log in and complete a full visit end-to-end
- [ ] AI report generation works with a real Anthropic API key
- [ ] Report is stored in DB with original notes + final report separate
- [ ] Manager can log in and view submitted reports
- [ ] All pages are responsive at 375px (iPhone SE) and 768px (tablet)
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] ESLint passes (`npx next lint`)
- [ ] Auth protection works — caregiver cannot access /manager

---

## WHAT NOT TO BUILD IN PHASE 1

Do not build any of the following — they are Phase 2+:
- GPS check-in / geolocation
- PDF export
- Email notifications to managers
- Voice input
- Offline mode / service worker
- Multi-agency admin panel
- Real-time AI suggestions while typing
- Family portal
- Stripe billing

If the product doc mentions these features, acknowledge them with a `// TODO: Phase 2` comment and move on.
