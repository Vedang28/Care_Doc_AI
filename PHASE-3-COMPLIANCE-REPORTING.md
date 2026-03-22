# CareDoc AI — Phase 3: Compliance Reporting & Manager Dashboard
## Claude Code Build Prompt

---

## CONTEXT & PREREQUISITES

You are continuing development of **CareDoc AI**. Phases 1 and 2 are complete. The following are working:
- Full visit workflow with AI report generation
- Multi-agency architecture with row-level security
- Rota management (admin assigns clients to caregivers)
- GPS check-in with location mismatch flagging
- Offline mode with IndexedDB queue and background sync
- Manager email alerts on flagged reports
- In-app notification centre
- PDF export via Cloudflare Worker
- Voice input (Web Speech API)

The product documentation file (`CareDocAI-Product-Documentation.docx`) is your source of truth.

Phase 3 is **where the product earns its enterprise value**. This is what separates CareDoc AI from a notes app and makes it defensible during CQC inspections. The goal is to give care agency managers a complete compliance picture — not just raw reports, but trends, risks, quality scores, and a one-click inspection pack.

Phase 3 deliverables:
1. **CQC Compliance Dashboard** — agency-wide compliance score, theme extraction, risk overview
2. **Audit Trail Export** — inspection-ready documentation pack per client
3. **Incident Management Module** — escalation workflow from flagged reports
4. **Care Policy Customisation** — agency uploads their policy, AI adapts terminology

---

## FEATURE 1 — CQC COMPLIANCE DASHBOARD

### Overview

This is the centrepiece of Phase 3. The compliance dashboard gives managers a living, quantitative picture of their agency's documentation health. It is not just a view — it actively surfaces problems before a CQC inspection does.

### New Route: `/manager/compliance`

Add to the manager navigation sidebar as the primary item (above Reports).

### Compliance Score Calculation

Create `lib/compliance/score.ts`:

The compliance score (0–100) is calculated per agency for a rolling 30-day window. It combines four sub-scores:

```typescript
interface ComplianceScore {
  overall: number          // weighted average
  completionRate: number   // % of visits with submitted reports
  flagResolutionRate: number  // % of flags marked resolved within 72h
  documentationQuality: number // avg quality score across all reports
  caregiverSignOffRate: number // % of reports digitally signed
  trend: 'improving' | 'stable' | 'declining' // vs previous 30 days
  breakdown: ComplianceSubScore[]
}
```

**CompletionRate** = (submitted reports / total completed visits) × 100

**FlagResolutionRate** = (flags with incident.resolvedAt set within 72h / total flags raised) × 100. If no flags: defaults to 100.

**DocumentationQuality** = average of all `report.qualityScore` values (see Feature: Quality Scoring below — add quality scoring to report generation in this phase).

**CaregiverSignOffRate** = (reports with Signature record / total submitted reports) × 100

Weights: completion 35%, quality 30%, sign-off 20%, flag resolution 15%.

### API Route

```
GET /api/manager/compliance?agencyId=&days=30
Returns: ComplianceScore object + historical data (daily score for chart)
```

### Dashboard Layout

Use a grid layout. On desktop: 4 columns. On mobile: 2 columns.

**Top row — Score Cards (4 cards):**

Each card:
- Large number (48px, Playfair Display, care-dark)
- Trend arrow (↑ green / → amber / ↓ red) with percentage change
- Label (14px, muted)
- Thin progress bar at bottom (care green fill)

Cards: Overall Compliance | Completion Rate | Flag Resolution | Documentation Quality

**Trend chart** (full width below cards):
- Line chart showing daily overall compliance score for the past 30 days
- Use Recharts (`LineChart`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`)
- Green line, no fill. X axis: dates. Y axis: 0–100.
- Hover tooltip shows date + score + change from previous day.

**Key Themes Panel** (left half, below chart):

This is AI-powered. Create a batch analysis endpoint:

```
POST /api/manager/compliance/themes
Body: { agencyId, dateFrom, dateTo }
```

This endpoint:
1. Fetches all `Report.reportText` + `Report.flags` for the date range (max 100 reports, most recent first)
2. Calls Claude API with a summarisation prompt:
   ```
   Analyse these domiciliary care visit reports and return a JSON object:
   {
     "themes": [
       { "theme": "string", "frequency": number, "sentiment": "concern|positive|neutral", "example": "brief quote" }
     ],
     "topConcerns": ["string", "string", "string"],
     "positivePatterns": ["string", "string"]
   }
   ```
3. Caches result in Redis (Upstash) for 6 hours — this is expensive to compute
4. Returns themes to the dashboard

Display as a card with:
- "Key Themes This Month" heading
- Coloured pill badges for each theme (red for concern, green for positive, grey for neutral)
- Frequency number on each badge
- "Top Concerns" section with orange dot list
- "Positive Patterns" section with green check list

**Client Risk Overview** (right half, below chart):

Table: Client name | Last visit | Flags (30d) | Risk level | Overdue?

Risk level is computed server-side:
- HIGH: 3+ flags in 30 days, or any unresolved critical flag
- MEDIUM: 1–2 flags, or last visit > 7 days ago
- LOW: 0 flags, visited within 7 days

Overdue: last visit was > scheduled frequency (from client.visitFrequency field — add this to the Client model: `visitFrequencyDays Int @default(1)`).

Clicking a client row navigates to `/manager/clients/[clientId]` — a new page showing all visits, reports, and flags for that client.

### Caregiver Performance Summary

Below the main grid:

Table: Caregiver | Reports submitted | Avg quality score | Flags raised | Flag accuracy | Last active

Flag accuracy = (flags confirmed as valid by manager / total flags on their reports). High flag accuracy = AI is catching real issues. Low accuracy = either false positives or the caregiver is having genuine problems.

**Note**: Display this with care. Add a header: "This data is for quality improvement purposes, not performance management." Consider anonymising for non-admin managers (show names only to ADMIN role).

---

## FEATURE 2 — QUALITY SCORING ON REPORT GENERATION

Add this to the existing Phase 1 AI report generation flow. When generating a report, include quality scoring in the AI response:

### Update System Prompt

Add to the prompt in `lib/ai/prompts.ts`:

```
Additionally, after the report, evaluate the quality of the caregiver's original notes.
Add to your JSON response:
"qualityScore": {
  "overall": 0-100,
  "completeness": 0-100,    // did notes cover all 4 prompts?
  "specificity": 0-100,     // were notes specific or vague?
  "riskAwareness": 0-100,   // did notes identify any risks/changes?
  "feedback": "One sentence of constructive feedback for the caregiver"
}
```

### Update Zod Schema

```typescript
const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  riskAwareness: z.number().min(0).max(100),
  feedback: z.string(),
})
```

### Update Report Model

```prisma
model Report {
  // ... existing fields ...
  qualityScoreOverall     Int?
  qualityCompleteness     Int?
  qualitySpecificity      Int?
  qualityRiskAwareness    Int?
  qualityFeedback         String?
}
```

### Show to Caregiver Post-Submission

On the "Report Submitted" success screen, show a quality score card:

- Circular progress ring (use a lightweight SVG component, no extra library)
- Score number in the centre (large, Playfair Display)
- Label: "Documentation Quality"
- Brief feedback sentence below: "Great detail on mobility support. Consider noting fluid intake next time."
- Encouraging tone always — this is a training tool, not a judgement

Show a subtle breakdown: Completeness / Specificity / Risk Awareness as three small progress bars.

---

## FEATURE 3 — AUDIT TRAIL EXPORT

### Overview

A "one-click inspection pack" per client covering any date range. This is what a CQC inspector would request, and managers should be able to produce it in under 60 seconds.

### Route: `/manager/clients/[clientId]/export`

Accessible from:
- The client risk overview table (compliance dashboard)
- The client detail page (`/manager/clients/[clientId]`)

### Export Configuration UI

A modal with:

**Date range picker**: from / to date inputs. Preset buttons: "Last 30 days" | "Last 3 months" | "Last 6 months" | "Custom"

**Include options** (checkboxes, all checked by default):
- [ ] All visit reports (AI-generated final versions)
- [ ] Original caregiver notes (raw input)
- [ ] Flagged concerns & resolutions
- [ ] Task completion records
- [ ] Digital signature records
- [ ] Audit log (all access/edits to this client's records)

**Redaction toggle**: "Anonymise caregiver names (for external sharing)"

**Format**: PDF (default) | CSV (data tables only)

**"Generate Inspection Pack" button**: triggers the export.

### Export Generation

`POST /api/manager/clients/[clientId]/export`:

1. Validate date range (max 1 year)
2. Fetch all matching records
3. For PDF: pass to Cloudflare Worker PDF generator (reuse from Phase 2)
4. PDF structure:
   ```
   Cover page: Client name, DOB, address, conditions, care plan, export date, agency logo
   Table of contents (auto-generated)
   ─── Section 1: Visit Summary ───
   Table: Date | Caregiver | Duration | Tasks | Flags | Status
   ─── Section 2: Full Visit Reports ───
   Each report on its own page: header, report text, flags, signature
   ─── Section 3: Flagged Concerns & Resolutions ───
   Each flag with: date, description, severity, actions taken, resolved by, resolution date
   ─── Section 4: Task Completion Record ───
   Heatmap-style grid: dates × tasks, coloured by completion
   ─── Section 5: Audit Trail ───
   Chronological log table: timestamp | user | action
   Footer on every page: "Exported from CareDoc AI | [Date] | CONFIDENTIAL"
   ```
5. Upload to R2, return signed URL (1-hour expiry for security)
6. Log export in AuditLog: action="INSPECTION_PACK_EXPORTED", entityId=clientId

### CSV Export

For the data-only option, return a ZIP file containing:
- `visits.csv` — one row per visit
- `reports.csv` — one row per report with text
- `flags.csv` — one row per flag
- `audit_log.csv` — chronological audit entries

---

## FEATURE 4 — INCIDENT MANAGEMENT MODULE

### Overview

When a report is flagged, it currently just shows an alert. Phase 3 formalises this into a proper incident management workflow with severity levels, actions taken, and resolution tracking.

### New Model (already in schema, flesh out usage)

```prisma
model Incident {
  id            String         @id @default(uuid())
  reportId      String
  agencyId      String
  clientId      String
  caregiverId   String
  severity      IncidentSeverity
  title         String
  description   String
  actionsTaken  String?
  followUpDate  DateTime?
  resolvedAt    DateTime?
  resolvedBy    String?
  escalated     Boolean        @default(false)
  escalatedAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  report    Report @relation(fields: [reportId], references: [id])
  agency    Agency @relation(fields: [agencyId], references: [id])
}

enum IncidentSeverity {
  LOW       // Documentation concern, no immediate risk
  MEDIUM    // Requires follow-up within 7 days
  HIGH      // Requires immediate attention (24 hours)
  CRITICAL  // Safeguarding concern — notify designated person
}
```

### Creating an Incident

From the manager report view (`/manager/reports/[reportId]`):

Each flag now has a "Create Incident" button. Clicking opens a slide-over panel:

**Incident form:**
- Title (auto-populated from flag text, editable)
- Severity (radio buttons with colour-coded labels: LOW/MEDIUM/HIGH/CRITICAL)
- Description (textarea — what happened, fuller context than the flag)
- Actions Taken (textarea — what has been done so far)
- Follow-up Date (date picker — required for HIGH and CRITICAL)
- Assign to (dropdown of agency managers)

**CRITICAL severity trigger:**
- Shows a red alert box: "This will notify the designated safeguarding lead immediately."
- Adds a mandatory "Safeguarding Category" field (dropdown from CQC categories)
- Sends immediate email to all ADMIN users in the agency

### Incident List: `/manager/incidents`

Filterable table: All | Open | Resolved | Escalated

Columns: Client | Date | Severity | Title | Assigned To | Follow-up Date | Status | Actions

Colour coding:
- CRITICAL: red background tint on row
- HIGH: amber background tint
- MEDIUM: no tint
- LOW: muted text

**Overdue indicator**: if `followUpDate` has passed and `resolvedAt` is null → red "OVERDUE" badge.

### Resolving an Incident

"Resolve" button on incident detail opens a form:
- Actions Taken (if not already filled)
- Resolution summary (what was the outcome?)
- "Mark as Resolved" button → sets `resolvedAt`, `resolvedBy`
- Option: "Escalate to external agency" → sets `escalated: true`, free-text notes field

### Automatic Escalation Reminder

Add to the daily cron job (from Phase 2):
- Any HIGH/CRITICAL incidents with `followUpDate` < tomorrow and `resolvedAt = null`
- Send reminder email to the assigned manager
- After 72 hours overdue: send to all ADMIN users

---

## FEATURE 5 — CARE POLICY CUSTOMISATION

### Overview

Every care agency has their own policies, terminology preferences, and CQC compliance frameworks they've been advised on. Phase 3 lets agencies upload their policy document and have the AI adapt to it.

### Route: `/admin/policy`

Only accessible to ADMIN role.

**Policy Document Upload:**

Drag-and-drop upload area. Accepts: PDF, DOCX, TXT. Max 10MB.

On upload:
1. Store file in R2: `policies/{agencyId}/{filename}`
2. POST to `/api/admin/policy/extract` which:
   - Reads the document text (use `pdf-parse` for PDF, `mammoth` for DOCX)
   - Sends to Claude with this prompt:
     ```
     You are analysing a UK domiciliary care policy document.
     Extract the following and return as JSON:
     {
       "preferredTerminology": {
         "clientTerm": "service user | client | resident | individual",
         "medicationTerm": "medication | medicine | tablets",
         "carePlanTerm": "support plan | care plan | person-centred plan"
       },
       "keyPolicies": ["array of key policy points in plain English, max 10"],
       "safeguardingProcedures": ["array of key safeguarding steps"],
       "customInstructions": "Additional prompt instructions derived from the policy"
     }
     ```
   - Stores extracted data in `AgencySettings.policyExtract` (JSONB field, add to schema)
3. Shows extracted terminology for admin review/edit
4. "Activate Policy" button creates a new `PromptVersion` with the custom instructions injected

### Custom Prompt Builder

When the policy is activated, `lib/ai/prompts.ts` merges the base prompt with agency-specific rules:

```typescript
export function buildSystemPrompt(
  agencyPromptOverride?: string,
  policyExtract?: PolicyExtract
): string {
  if (agencyPromptOverride) return agencyPromptOverride
  
  const base = BASE_SYSTEM_PROMPT
  
  if (!policyExtract) return base
  
  const customisation = `
AGENCY-SPECIFIC TERMINOLOGY:
- Refer to clients as "${policyExtract.preferredTerminology.clientTerm}"
- Refer to medication as "${policyExtract.preferredTerminology.medicationTerm}"

AGENCY POLICY REQUIREMENTS:
${policyExtract.keyPolicies.map(p => `- ${p}`).join('\n')}

${policyExtract.customInstructions}
`
  return base + '\n\n' + customisation
}
```

### Policy Version History

Table on `/admin/policy` showing:
- All past policy versions (filename, uploaded date, activated date, deactivated date)
- "Restore" button to reactivate a previous version
- All historical reports store `promptVersion` ID — so you always know which policy version was in effect

---

## NEW DATABASE MIGRATIONS

Run all migrations with descriptive names:

```bash
npx prisma migrate dev --name add-quality-scoring-to-reports
npx prisma migrate dev --name add-incident-management
npx prisma migrate dev --name add-visit-frequency-to-clients
npx prisma migrate dev --name add-policy-extract-to-agency-settings
npx prisma migrate dev --name add-notifications-model
```

---

## NEW API ROUTES SUMMARY

```
GET  /api/manager/compliance              → compliance score + history
POST /api/manager/compliance/themes       → AI theme extraction (cached)
GET  /api/manager/clients/[id]            → client detail + visit history
POST /api/manager/clients/[id]/export     → generate inspection pack
POST /api/manager/incidents               → create incident
GET  /api/manager/incidents               → list incidents (filtered)
GET  /api/manager/incidents/[id]          → incident detail
PUT  /api/manager/incidents/[id]          → update/resolve incident
POST /api/admin/policy/upload             → upload policy document
POST /api/admin/policy/extract            → extract terminology from policy
POST /api/admin/policy/activate           → create new PromptVersion
GET  /api/admin/policy/versions           → list prompt versions
```

---

## UI PATTERNS — PHASE 3 SPECIFIC

### Data Visualisation

Use **Recharts** for all charts (already compatible with Next.js/React).

Charts to implement:
- `LineChart` — compliance score over time (compliance dashboard)
- `BarChart` — visits per caregiver per week (caregiver summary)
- `RadialBarChart` — compliance score gauge on overview cards
- Custom SVG — quality score ring on submission success screen

Keep all charts responsive via `<ResponsiveContainer width="100%" height={240}>`.

### Slide-Over Panels

For incident creation form and policy upload — use a **slide-over** pattern (panel slides in from right, background dims):

```typescript
// Use shadcn/ui Sheet component:
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
```

Max width 480px on desktop, full-screen on mobile.

### Severity Colour System

Extend Tailwind config with:
```
'severity-critical': '#7F1D1D'   // deep red
'severity-high':     '#92400E'   // amber
'severity-medium':   '#1E40AF'   // blue
'severity-low':      '#166534'   // green
```

Use these consistently across incident badges, table row tints, and notification icons.

### Empty States

Every table and chart needs a proper empty state:
- Compliance chart with no data: "Not enough data yet. Complete at least 5 visits to see your compliance score."
- Incident list with no incidents: green check + "No open incidents. Your team's documentation is on track."
- Client export with no visits in range: "No visits recorded in this date range."

---

## PHASE 3 DONE CRITERIA

- [ ] Compliance dashboard loads with correct score calculation
- [ ] Recharts line chart renders compliance trend for last 30 days
- [ ] AI theme extraction runs and returns key themes (test with real report data)
- [ ] Client risk overview correctly identifies HIGH/MEDIUM/LOW risk clients
- [ ] Inspection pack PDF generates with correct structure and all sections
- [ ] CSV export downloads a valid ZIP with all four CSVs
- [ ] Incident form creates an incident linked to the correct report/client
- [ ] CRITICAL incidents trigger immediate email to admin users
- [ ] Overdue incidents appear with red OVERDUE badge
- [ ] Daily cron sends reminder emails for overdue incidents
- [ ] Policy document upload extracts terminology correctly for DOCX and PDF
- [ ] Custom prompt is used for report generation after policy activation
- [ ] Policy version is stored with each report (for historical accuracy)
- [ ] Quality score appears on caregiver success screen post-submission
- [ ] All charts are responsive at 375px
- [ ] `npm run build` passes with zero errors

---

## DO NOT BUILD IN PHASE 3

These are Phase 4+:
- Real-time AI suggestions while typing
- Medication Administration Record (MAR) module
- Family portal
- Stripe billing / subscription management
- White-label mode
- API access for external systems
- RIDDOR statutory reporting integration
