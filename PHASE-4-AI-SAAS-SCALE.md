# CareDoc AI — Phase 4: AI Sophistication & SaaS Scale
## Claude Code Build Prompt

---

## CONTEXT & PREREQUISITES

You are continuing development of **CareDoc AI**. Phases 1–3 are complete. The platform is live, being used by real care agencies, and generating revenue. The following are all working:

- Full visit documentation workflow with AI report generation
- Multi-agency architecture (subdomain routing, row-level security)
- Rota management + GPS check-in + offline mode
- Manager email alerts + in-app notifications + PDF export
- CQC Compliance Dashboard with scoring, theme extraction, and risk overview
- Audit trail export (inspection packs)
- Incident management with escalation
- Care policy customisation (agency uploads their policy, AI adapts)
- Quality scoring per report (shown to caregivers post-submission)

The product documentation file (`CareDocAI-Product-Documentation.docx`) is your source of truth.

Phase 4 is about becoming the definitive platform for UK domiciliary care documentation. It adds AI sophistication that increases the value of every interaction, mission-critical compliance modules (MAR), a family-facing portal, and the full SaaS infrastructure needed to operate as a commercial product at scale.

Phase 4 deliverables:
1. **Real-time AI suggestions** — inline coaching while caregivers type
2. **Medication Administration Record (MAR)** — full MAR module
3. **Family Portal** — read-only portal for designated family contacts
4. **SaaS Infrastructure** — Stripe billing, subscription tiers, white-label mode
5. **Public API** — for enterprise integration with existing care platforms

---

## FEATURE 1 — REAL-TIME AI SUGGESTIONS

### Overview

As caregivers type in the guided note fields, the system makes lightweight AI calls to suggest what information might be missing or could be added. This is a training mechanism as much as a productivity tool — it coaches caregivers toward better documentation habits in real time.

### Implementation Strategy

**Model**: Use `claude-haiku-4-5-20251001` for all suggestion calls — it is fast and cheap enough for high-frequency use.

**Debouncing**: Only trigger a suggestion call when the user has stopped typing for **800ms** and the field contains at least 15 characters.

**Rate limiting**: Max 3 suggestion calls per field per visit. Once a field has been suggested 3 times, stop suggesting (prevent annoying repetition).

**Token budget**: max_tokens: 150 per suggestion call. Suggestions must be brief.

### `hooks/useAISuggestion.ts`

```typescript
interface SuggestionState {
  suggestion: string | null
  isLoading: boolean
  callsUsed: number
  dismiss: () => void
  accept: () => void  // appends suggestion to the textarea
}

function useAISuggestion(
  fieldKey: 'care' | 'condition' | 'incident' | 'response',
  currentValue: string,
  clientContext: { name: string; conditions: string[] }
): SuggestionState
```

Debounce logic:
```typescript
useEffect(() => {
  if (currentValue.length < 15 || callsUsed >= 3) return
  
  const timer = setTimeout(async () => {
    setIsLoading(true)
    const result = await fetch('/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ fieldKey, currentValue, clientContext })
    })
    const { suggestion } = await result.json()
    setSuggestion(suggestion)
    setIsLoading(false)
    setCallsUsed(prev => prev + 1)
  }, 800)
  
  return () => clearTimeout(timer)
}, [currentValue])
```

### Suggestion API Route

`POST /api/ai/suggest`:

```typescript
// Rate limit: 30 calls per caregiver per hour (Upstash Redis)
// System prompt for suggestions:
const SUGGESTION_SYSTEM_PROMPT = `
You are assisting a UK domiciliary caregiver with documentation.
The caregiver is filling in a visit note. Based on what they've written,
suggest ONE brief addition that would improve documentation quality.

Rules:
- Maximum 1 sentence
- Frame as a gentle question or prompt, not a command
- Be specific to the context (client's conditions + field type)
- If the note is already complete and specific, respond with: null
- Never invent clinical facts

Response format: plain text string, or the word "null" if no suggestion needed.
`
```

Field-specific suggestion prompts:
- `care`: "Consider whether you've mentioned: specific personal care tasks, use of equipment, any adaptations needed"
- `condition`: "Consider whether you've noted: comparison to baseline, any physical symptoms, mental state, skin condition"
- `incident`: "Consider whether you've documented: time of incident, immediate response, who was informed, any injuries"
- `response`: "Consider whether you've captured: the client's mood, engagement level, any verbal responses, preferences expressed"

### Suggestion UI Component

In `GuidedNoteField.tsx`, add below the textarea (only visible when a suggestion exists):

```
┌─────────────────────────────────────────────────────────┐
│ ✦ AI Suggestion                            [×] Dismiss  │
│                                                         │
│  "You may want to note how the client responded to      │
│   the personal care — did they engage willingly?"       │
│                                                         │
│  [+ Add to notes]                                       │
└─────────────────────────────────────────────────────────┘
```

Style: subtle, collapsible. Care-pale background, care-light border. The `✦` sparkle icon in care-green. Small dismiss `×` button top-right.

Clicking "Add to notes": appends the suggestion to the textarea value with a newline. Increments callsUsed to prevent infinite suggestions.

Animation: `motion.div` with `initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}`.

---

## FEATURE 2 — MEDICATION ADMINISTRATION RECORD (MAR)

### Overview

MAR is a legally significant clinical record. It tracks every instance of medication being administered, prompted, refused, or missed. In UK domiciliary care, an accurate MAR is essential for CQC compliance and for coordinating with GPs and pharmacists.

This is the most complex feature in Phase 4. Build it carefully and with clinical accuracy in mind.

### Data Model

```prisma
model Medication {
  id           String  @id @default(uuid())
  clientId     String
  agencyId     String
  name         String  // e.g. "Metformin 500mg"
  dose         String  // e.g. "1 tablet"
  frequency    String  // e.g. "twice daily with food"
  route        String  // oral | topical | inhaled | injection | other
  prescribedBy String?
  startDate    DateTime @db.Date
  endDate      DateTime? @db.Date
  active       Boolean  @default(true)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  client      Client       @relation(fields: [clientId], references: [id])
  agency      Agency       @relation(fields: [agencyId], references: [id])
  marEntries  MarEntry[]
  
  @@index([clientId, active])
}

model MarEntry {
  id            String         @id @default(uuid())
  medicationId  String
  visitId       String
  caregiverId   String
  agencyId      String
  scheduledTime String?        // "morning" | "afternoon" | "evening" | "08:00"
  outcome       MarOutcome
  administeredAt DateTime?
  refusalReason  String?
  missedReason   String?
  notes          String?
  witnessedBy    String?        // for controlled drugs
  stockBefore    Int?
  stockAfter     Int?
  createdAt      DateTime       @default(now())
  
  medication  Medication @relation(fields: [medicationId], references: [id])
  visit       Visit      @relation(fields: [visitId], references: [id])
  caregiver   User       @relation(fields: [caregiverId], references: [id])
  
  @@index([medicationId, createdAt])
  @@index([visitId])
}

enum MarOutcome {
  ADMINISTERED     // Given as prescribed
  PROMPTED         // Caregiver prompted, client self-administered
  REFUSED          // Client refused
  MISSED           // Caregiver unable to administer
  NOT_DUE          // Scheduled but not due at this visit
  STOCK_OUT        // Could not administer — no stock
}
```

### Medication Management: `/manager/clients/[clientId]/medications`

Manager/admin can:
- Add new medications to a client (form: name, dose, frequency, route, prescribed by, start date, notes)
- Edit existing medications
- Mark medications as inactive (never delete — for audit trail)
- View full medication list with active/inactive toggle

### MAR in the Visit Workflow

Add a new step between "Tasks" and "Notes":

`/visit/[visitId]/medications`

The visit workflow becomes: Tasks → **Medications** → Notes → Processing → Review → Saved.

Update `StepProgress` component to show the new step.

**MAR screen UI:**

For each active medication for this client:

```
┌────────────────────────────────────────────────────────────────┐
│ Metformin 500mg                         [1 tablet | oral]      │
│ Twice daily with food                                          │
│                                                                │
│ Outcome:                                                       │
│  ● Administered   ○ Prompted   ○ Refused   ○ Missed           │
│                                                                │
│ [if Refused or Missed → reason textarea appears]              │
│ [if Administered → "Stock after: [  ] tablets" input]         │
└────────────────────────────────────────────────────────────────┘
```

If a client has no active medications: show "No medications recorded for this client. Contact your manager to add medications." Do not block the visit.

**Validation before proceeding to Notes:**
- Every active medication must have an outcome selected (hard block — cannot proceed without completing MAR)
- Exception: "Not Due" is always a valid selection

### Discrepancy Detection

After MAR submission, run `lib/mar/discrepancy-check.ts`:

```typescript
// Check 1: Stock level plausibility
// If stockAfter < stockBefore - dosesExpected → flag "Possible stock discrepancy"

// Check 2: Consecutive refusals
// If same medication refused 3+ times in a row → flag "Repeated medication refusal — GP notification may be required"

// Check 3: Consecutive misses
// If same medication missed 2+ times in a row → flag "Repeated missed administration — review scheduling"
```

Any discrepancies are added to the report's `flags` array (merged with the AI report flags).

### GP/Pharmacist Notification Workflow

When the "Repeated medication refusal" flag triggers:
1. Create an incident automatically (severity: HIGH)
2. Add to manager notification centre
3. Show a notice to the caregiver: "This has been flagged for your manager's attention."

Add a `MarDiscrepancy` table for tracking:
```prisma
model MarDiscrepancy {
  id           String   @id @default(uuid())
  medicationId String
  clientId     String
  agencyId     String
  type         String   // stock_discrepancy | repeated_refusal | repeated_miss
  description  String
  resolvedAt   DateTime?
  resolvedBy   String?
  createdAt    DateTime @default(now())
}
```

### MAR Report View

Add a "Medications" tab to the manager report detail view showing:
- MAR table: Medication | Scheduled Time | Outcome | Administered At | Notes
- Stock changes (before → after)
- Any discrepancies flagged

Monthly MAR PDF (add to inspection pack export):
- Calendar grid: rows = medications, columns = dates
- Cell content: outcome code (A/P/R/M) with colour coding
- Summary row: administration rate per medication

---

## FEATURE 3 — FAMILY PORTAL

### Overview

The family portal gives designated family members or next-of-kin a read-only view of visit summaries for their relative. It is intentionally limited — this is not a clinical portal, it is a reassurance tool.

### What Families Can See
- Visit completion status (date, time, duration)
- Care summary (AI-generated 2-sentence summary, not the full clinical report)
- General wellbeing indicator (😊 Good | 😐 Neutral | 😟 Concerns)
- Tasks completed (category level only — "Personal Care ✓", not individual tasks)
- Flagged concerns (simplified language, no clinical terminology)
- "Last updated" timestamp

### What Families Cannot See
- Full clinical report text
- Raw caregiver notes
- Other clients' data
- Staff names (shown as "your caregiver")
- Medication details (GDPR / clinical sensitivity)

### Family User Model

```prisma
model FamilyContact {
  id            String   @id @default(uuid())
  clientId      String
  agencyId      String
  name          String
  email         String
  relationship  String   // "Son" | "Daughter" | "Next of Kin" | etc.
  consentGiven  Boolean  @default(false)
  consentDate   DateTime?
  notifyOnVisit Boolean  @default(false)
  notifyOnFlag  Boolean  @default(true)
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  client Client @relation(fields: [clientId], references: [id])
  
  @@unique([clientId, email])
  @@index([agencyId])
}
```

### Portal Authentication

Family members use **magic link authentication** only (no password):
- Enter their email on the portal login page
- Receive a one-time link via Resend (valid 30 minutes)
- Session lasts 7 days before requiring re-authentication
- Session is scoped to their specific family contact record

Use NextAuth's Email provider for this.

### Portal Route Structure

```
/portal/
├── login/          (magic link request)
├── verify/         (magic link callback)
└── [clientSlug]/   (family dashboard — accessible after auth)
    ├── page.tsx    (visit summary list)
    └── visits/
        └── [visitId]/
            └── page.tsx  (individual visit summary)
```

`clientSlug` is derived from client name: "margaret-thompson". Store as `client.portalSlug`.

### Portal UI Design

The portal has a **distinct, simplified design** — it is not the same UI as the caregiver app. Use:
- Font: DM Sans only (no Playfair Display — less clinical-feeling)
- Colours: same care green but softer application — lighter, more approachable
- No navigation sidebar — just a simple top bar with the agency logo and client name
- Mobile-first — family members will primarily access on phones
- Accessibility: larger text (16px base), high contrast mode support, ARIA labels on all interactive elements

**Visit summary card:**
```
┌─────────────────────────────────────────────────────────────┐
│ Monday, 12 May 2025 · 9:14am – 10:02am (48 min)            │
│                                                             │
│ 😊 Margaret had a good visit today.                         │
│                                                             │
│ Your caregiver provided personal care support, assisted     │
│ with breakfast, and checked in on Margaret's wellbeing.     │
│                                                             │
│ ✓ Personal Care   ✓ Medication   ✓ Nutrition               │
│                                                             │
│ [View Details →]                                            │
└─────────────────────────────────────────────────────────────┘
```

The 2-sentence care summary is generated by a separate lightweight Claude call at submission time:

```typescript
// POST /api/visits/[visitId]/generate-family-summary
// System prompt:
"Write a 2-sentence, plain-English summary of this care visit for a family member.
Use warm, reassuring language. Do not include clinical terminology or medication names.
Refer to the client by their first name. Focus on what was done and how they were."
```

Store as `Report.familySummary` (add to schema). Generate alongside the main report.

### GDPR Consent Flow

Before a family contact can access the portal, explicit GDPR consent must be recorded:
- Manager adds family contact via `/manager/clients/[clientId]/family`
- System sends a consent email to the family member (via Resend)
- Email contains: explanation of what they'll see, data retention period, how to withdraw consent
- Family member clicks "I consent to receive visit updates" → `consentGiven: true, consentDate: now`
- If consent is withdrawn: `active: false`, all access revoked, anonymise their record after 30 days

### Push Notifications (Web Push)

If `notifyOnVisit: true`, send a push notification when a visit is submitted for their relative:
"Sarah's visit has been completed today. All went well."

Use the **Web Push API** with VAPID keys. Store subscription tokens in `FamilyPushSubscription` model.

If `notifyOnFlag: true`, send: "A concern was noted during today's visit. Please check the portal."

---

## FEATURE 4 — SAAS INFRASTRUCTURE

### Stripe Billing

Install: `npm install stripe @stripe/stripe-js`

#### Subscription Plans

```typescript
export const PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID,  // Stripe price ID
    limits: {
      caregivers: 10,
      clients: 20,
      reportsPerMonth: 500,
      aiSuggestionsEnabled: false,
      familyPortalEnabled: false,
      marEnabled: false,
      exportEnabled: false,
    }
  },
  GROWTH: {
    name: 'Growth',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    limits: {
      caregivers: -1,        // unlimited
      clients: -1,
      reportsPerMonth: -1,
      aiSuggestionsEnabled: true,
      familyPortalEnabled: true,
      marEnabled: true,
      exportEnabled: true,
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    limits: {
      caregivers: -1,
      clients: -1,
      reportsPerMonth: -1,
      aiSuggestionsEnabled: true,
      familyPortalEnabled: true,
      marEnabled: true,
      exportEnabled: true,
      whiteLabelEnabled: true,
      apiAccessEnabled: true,
    }
  }
} as const
```

#### Plan Enforcement

Create `lib/billing/gate.ts`:

```typescript
export async function checkFeatureGate(
  agencyId: string,
  feature: keyof typeof PLANS.STARTER.limits
): Promise<boolean>
// Returns true if the agency's plan includes this feature
// Throws PlanLimitError if the feature is not available
```

Use this in every feature that has plan restrictions. Example:
```typescript
// In /api/ai/suggest
await checkFeatureGate(agencyId, 'aiSuggestionsEnabled')
// If STARTER plan: return 402 with message "AI Suggestions available on Growth plan"
```

Show upgrade prompts in the UI when a feature is gated. The upgrade prompt is a modal with the plan comparison table and a "Upgrade Now" CTA linking to the billing portal.

#### Billing Routes

```
GET  /api/billing/plans              → available plans + current plan
POST /api/billing/checkout           → create Stripe checkout session
POST /api/billing/portal             → create Stripe customer portal session
POST /api/billing/webhook            → Stripe webhook handler (CRITICAL — verify signature)
```

Stripe webhook handler must handle:
- `checkout.session.completed` → activate subscription, update `Agency.plan`
- `customer.subscription.updated` → update plan
- `customer.subscription.deleted` → downgrade to free/suspended

#### Billing Page `/admin/billing`

Show:
- Current plan card (name, price, renewal date)
- Usage metrics: caregivers used / limit, reports this month / limit
- "Manage Billing" button → Stripe Customer Portal
- Feature comparison table with current plan highlighted

### White-Label Mode

For Enterprise plan agencies:
- Custom domain support: `care.agencyname.co.uk`
  - Agency adds their domain in settings
  - Vercel programmatic domain API adds it to the project
  - SSL handled by Vercel automatically
- Logo replaces "CareDocAI" wordmark in header and emails
- Primary colour from `AgencySettings.brandColour` applied via CSS custom property
- "Powered by CareDoc AI" attribution in footer (cannot be removed on white-label — brand protection)

Implement with CSS custom properties in `globals.css`:
```css
:root {
  --brand-primary: #2D6A4F;      /* overridden per agency */
  --brand-primary-dark: #1A4332;
  --brand-primary-light: #D8F3DC;
}
```

Set these in `app/(app)/layout.tsx` based on `AgencySettings.brandColour`.

### New Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_GROWTH_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Web Push (VAPID)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@caredocai.com"
```

---

## FEATURE 5 — PUBLIC API

### Overview

Enterprise customers need to integrate CareDoc AI with their existing care management systems (Nourish, Carezapp, Birdie, etc.). The public API allows them to pull reports, push client updates, and receive webhooks.

### API Key Management

```prisma
model ApiKey {
  id          String   @id @default(uuid())
  agencyId    String
  name        String   // e.g. "Nourish Integration"
  keyHash     String   @unique  // bcrypt hash of the key
  keyPrefix   String            // first 8 chars, shown in UI for identification
  scopes      String[]          // "reports:read" | "clients:read" | "clients:write"
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  agency Agency @relation(fields: [agencyId], references: [id])
}
```

Key format: `cda_{agencyCode}_{random32chars}` (e.g. `cda_sunrise_x8f2k9...`)

Key is shown to the user ONCE on creation. Store only the hash.

### Public API Routes (under `/api/v1/`)

Authenticate with `Authorization: Bearer cda_...` header.

```
GET  /api/v1/clients                  → list clients (scopes: clients:read)
GET  /api/v1/clients/:id              → client detail
PUT  /api/v1/clients/:id              → update client conditions/care plan (clients:write)
GET  /api/v1/reports                  → list reports, filterable by date/client
GET  /api/v1/reports/:id              → full report detail
GET  /api/v1/reports/:id/pdf          → signed PDF download URL
POST /api/v1/webhooks                 → register a webhook endpoint
DELETE /api/v1/webhooks/:id           → remove webhook
```

### Outbound Webhooks

When reports are submitted, trigger webhooks for any registered endpoints:

```typescript
// Webhook payload:
{
  event: "report.submitted",
  agencyId: string,
  reportId: string,
  visitId: string,
  clientId: string,
  submittedAt: string,
  hasFlags: boolean,
  flagCount: number
}
```

Use a job queue (Upstash QStash or similar) for webhook delivery with retry logic (3 attempts, exponential backoff). Sign payloads with HMAC-SHA256 using a per-webhook secret.

### API Documentation Page

Create `/docs/api` — a public-facing API documentation page (no auth required). Use the Mintlify component style or build a clean custom layout.

Document every endpoint with:
- Method + path
- Authentication requirements
- Request body schema
- Response schema
- Example request/response (curl + TypeScript)
- Rate limits

---

## PERFORMANCE & RELIABILITY FOR SCALE

By Phase 4, the platform is under real production load. Add these:

### Database Optimisation

Run `EXPLAIN ANALYZE` on the top 5 most frequent queries. Add composite indexes where missing:

```prisma
// Add to schema if missing:
@@index([agencyId, status, createdAt])  // Visit
@@index([agencyId, createdAt])          // Report  
@@index([clientId, scheduledDate])      // RotaAssignment
@@index([medicationId, createdAt])      // MarEntry
```

### Caching Strategy

Extend Upstash Redis usage:
- Cache client list per caregiver (5 minute TTL, invalidate on rota change)
- Cache compliance score (1 hour TTL, invalidate on report submission)
- Cache AI theme extraction (6 hours TTL)
- Cache family portal summary (30 minute TTL)

### AI Cost Management

Create `lib/ai/cost-tracker.ts`:
```typescript
// Track token usage per agency per month
// Alert admin when agency approaches 80% of their model budget
// Log every AI call: model, input tokens, output tokens, endpoint, latency
```

Add `AiUsageLog` model to track costs per agency.

---

## PHASE 4 DONE CRITERIA

**Real-time suggestions:**
- [ ] Suggestions appear after 800ms idle in note fields
- [ ] Maximum 3 suggestions per field per visit
- [ ] Suggestions dismissed/accepted correctly update textarea
- [ ] Graceful failure (no suggestion shown) if API call fails

**MAR:**
- [ ] Medications can be added/edited by manager per client
- [ ] MAR step appears in visit workflow for clients with active medications
- [ ] Every medication requires an outcome before proceeding
- [ ] Discrepancy detection flags consecutive refusals and stock issues
- [ ] MAR included in inspection pack PDF

**Family Portal:**
- [ ] Magic link auth works end-to-end
- [ ] Family members see only their relative's data
- [ ] GDPR consent recorded before access granted
- [ ] Family summary (2 sentences) generated per visit
- [ ] Push notifications fire on visit completion

**SaaS:**
- [ ] Stripe checkout creates subscription and updates Agency.plan
- [ ] Stripe webhook correctly handles subscription events
- [ ] Feature gates enforce plan limits (STARTER cannot access Growth features)
- [ ] Upgrade prompts appear correctly when gated features are accessed
- [ ] White-label: custom domain works, logo replaces wordmark, brand colour applies

**Public API:**
- [ ] API key creation, hashing, and authentication works
- [ ] All `/api/v1/` routes return correct scoped data
- [ ] Webhook delivery works with retry logic
- [ ] API documentation page is publicly accessible

**Performance:**
- [ ] Compliance dashboard loads in < 2 seconds (cached data)
- [ ] Report generation P95 < 6 seconds
- [ ] Database queries have no N+1 patterns (use Prisma `include` correctly)

---

## NOTES FOR FUTURE PHASES (POST-PHASE 4)

Document these as `// TODO: Future` comments where relevant:

- **RIDDOR Integration** — statutory reporting for workplace injuries. Would integrate with HSE online reporting portal.
- **NHS Spine Integration** — for agencies connected to NHS care pathways. Requires NHS Digital API access.
- **Rostering/Rota AI** — predictive rostering based on client needs and caregiver availability.
- **Outcome Monitoring** — tracking client health outcomes over time (weight, mobility, mental state) with trend analysis.
- **Caregiver Training Module** — personalised micro-learning based on documentation quality scores.
