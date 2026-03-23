# CareDoc AI

**AI-powered care documentation platform for UK domiciliary care providers.**

CareDoc AI transforms how care agencies document visits, manage compliance, and communicate with families. Instead of caregivers writing reports by hand or using generic note-taking apps, CareDoc AI guides them through a structured workflow and uses Claude AI to turn brief notes into professional, CQC-ready care reports — all from a mobile phone.

---

## The Problem It Solves

UK domiciliary care agencies face a documentation crisis:

- **Caregivers hate paperwork.** A caregiver making 6 visits a day doesn't have time to write 6 detailed reports. Notes become one-liners like "Client was fine." This is legally and clinically dangerous.
- **Managers can't see risk in real time.** Without structured data, a manager can't know which clients are deteriorating, which caregivers are missing documentation, or what a CQC inspector will find.
- **CQC inspections are stressful and manual.** Agencies spend days pulling together evidence when an inspection is announced. One missing record can result in enforcement action.
- **Medication errors are a leading cause of harm.** Without a proper MAR system, medication refusals, misses, and stock discrepancies go unnoticed until something goes seriously wrong.
- **Families are left in the dark.** Relatives of care recipients often have no idea what happened during a visit. This erodes trust and increases safeguarding concerns.

CareDoc AI solves all of this in one platform.

---

## Who Is It For

| Role | What they use it for |
|------|---------------------|
| **Caregivers** | Completing visit documentation on their phone in minutes |
| **Senior Carers** | Reviewing and approving reports for their team |
| **Managers** | Monitoring compliance, managing incidents, reviewing reports |
| **Admins** | Setting up the agency, managing users, billing, and integrations |
| **Family members** | Viewing care updates for their relative via the Family Portal |
| **Enterprise integrators** | Connecting CareDoc AI to existing care platforms via public API |

---

## Core Features

### 1. Visit Documentation Workflow

The end-to-end visit workflow runs on mobile, designed for use in the field:

**Step 1 — Select Client**
The caregiver sees only their assigned clients for today (from the rota). Each client shows their name, address, and any active care flags.

**Step 2 — GPS Check-In**
The app captures the caregiver's location on check-in. If the GPS coordinates don't match the client's address within a configurable radius, the visit is flagged for manager review.

**Step 3 — Task Checklist**
A structured checklist of care tasks (personal care, meal preparation, medication, mobility support, etc.) grouped by category. Caregivers tick completed tasks and can leave notes per task.

**Step 4 — Medication Administration Record (MAR)**
For clients with active medications, caregivers must record an outcome for each medication before proceeding:
- **Administered** — given as prescribed (with stock count)
- **Prompted** — caregiver prompted, client self-administered
- **Refused** — client refused (reason required)
- **Missed** — unable to administer (reason required)
- **Not Due** — scheduled but not due at this visit
- **Stock Out** — no stock available

Every medication must have an outcome before the caregiver can proceed. This is a hard block.

**Step 5 — Guided Notes**
Four structured free-text fields, each with a specific purpose:
- **Care provided** — what personal care and support was given
- **Client condition** — how the client appeared physically and mentally
- **Incidents** — any accidents, falls, or concerning events
- **Client response** — how the client engaged with care

As the caregiver types, Claude Haiku provides **real-time AI suggestions** — gentle prompts like *"You may want to note how the client responded to personal care — did they engage willingly?"* Suggestions appear after 800ms of idle typing, max 3 per field, with dismiss/accept buttons.

**Step 6 — AI Report Generation**
The caregiver submits their notes. Claude Sonnet processes:
- The structured task checklist
- The four note fields
- The client's care plan, conditions, and risk flags
- The agency's custom care policy (if uploaded)
- The MAR entries for this visit

It generates a professional, clinically accurate care report in the agency's preferred style. The report is automatically quality-scored (0–100) across four dimensions: completeness, specificity, risk awareness, and language quality.

**Step 7 — Review & Digital Sign-Off**
The caregiver reads the generated report, can edit any section, and digitally approves it. Their name, timestamp, IP address, and user agent are recorded on the signature.

**Step 8 — Submission**
The report is submitted and stored with a full audit trail. The system automatically:
- Generates a family-friendly 2-sentence summary (Claude Haiku)
- Sends push notifications to any family members who opted in
- Fires outbound webhooks to connected enterprise systems
- Runs MAR discrepancy checks

---

### 2. Offline Mode

Caregivers often work in buildings with poor signal. CareDoc AI captures all notes locally using IndexedDB and syncs automatically when connectivity returns. The caregiver never loses work.

---

### 3. Voice Input

Any note field can be populated using the device's built-in speech-to-text (Web Speech API). Caregivers can dictate notes hands-free while providing care.

---

### 4. Manager Dashboard

The manager view is a complete operational picture of the agency:

**Reports**
All submitted reports, filterable by date, caregiver, client, and status (pending review / approved / flagged). Each report shows:
- The full AI-generated report text
- The task checklist
- MAR entries with outcome codes
- Quality score breakdown
- Any flags raised by the AI or MAR discrepancy checker
- Digital signature details

**Report Statuses**
- `PENDING` — submitted, awaiting manager review
- `APPROVED` — manager has reviewed and approved
- `FLAGGED` — one or more concerns raised (AI-detected or MAR-triggered)

Managers can add feedback to reports (visible to caregivers) and digitally sign off on them.

---

### 5. CQC Compliance Dashboard

`/manager/compliance`

The compliance dashboard is the centrepiece of the management layer. It gives a live, quantitative picture of the agency's documentation health.

**Compliance Score (0–100)**
Calculated as a weighted average of four sub-scores over a rolling 30-day window:
- **Completion Rate** — percentage of completed visits with a submitted report
- **Flag Resolution Rate** — percentage of flagged reports resolved within 72 hours
- **Documentation Quality** — average AI quality score across all reports
- **Caregiver Sign-Off Rate** — percentage of reports with a digital signature

The score shows a trend indicator: **improving**, **stable**, or **declining** vs. the previous 30-day period.

**AI Theme Extraction**
Claude Haiku analyses all recent reports and extracts recurring themes — both positive patterns ("consistent person-centred language", "detailed mobility observations") and concerns ("vague condition notes", "repeated food refusal not escalated"). Themes are cached for 6 hours.

**Risk Overview**
- Clients with no visit in the last N days (configurable per client via `visitFrequencyDays`)
- Caregivers with low documentation scores
- Open incidents past their follow-up date

**Compliance Score History**
30-day line chart showing daily compliance score, making trends immediately visible.

---

### 6. Inspection Pack Export

`/manager/clients/[clientId]/export`

One-click PDF generation of a complete inspection pack for any client, covering a specified date range. The pack includes:
- Client profile (name, DOB, address, conditions, care plan, risks)
- All visit reports in the date range
- Task completion summary
- **MAR calendar grid** — rows = medications, columns = dates, cells show outcome codes (A/P/R/M/—) with colour coding and administration rate per medication
- Incident log
- Caregiver sign-off summary
- Audit trail

This is what you hand to a CQC inspector. It takes one click to generate.

---

### 7. Rota Management

`/manager/rota`

Managers assign caregivers to clients on a per-day basis. The rota system:
- Shows a weekly calendar view by caregiver or by client
- Supports drag-and-drop (or form-based) assignment
- Drives the caregiver's "My Clients Today" list
- Supports visit types (standard, complex, social)

---

### 8. Incident Management

`/manager/incidents`

When the AI detects a potential incident in a report (a fall, a safeguarding concern, a medication error), it raises a flag. The incident module tracks these through to resolution:

- **Severity levels**: LOW / MEDIUM / HIGH / CRITICAL
- **Escalation** — incidents can be escalated with a timestamp and reason
- **Resolution tracking** — who resolved it, when, and what actions were taken
- **Follow-up dates** — set a date for review; the dashboard highlights overdue incidents
- **Auto-creation** — when 3+ consecutive medication refusals are detected, a HIGH-severity incident is automatically created and the manager is notified

---

### 9. Medication Management

`/manager/clients/[clientId]/medications`

Managers add and manage a client's medication list:
- Medication name, dose, frequency, route (oral/topical/inhaled/injection/other)
- Prescribing doctor
- Start and end dates
- Active/inactive toggle (medications are never deleted — audit trail is preserved)

These medications drive the MAR step in every visit for that client.

---

### 10. Family Portal

`/portal/[clientSlug]`

A read-only portal for designated family members. Completely separate from the main app — no login credentials, no agency data visible.

**How it works:**
1. Manager adds a family contact for a client (name, email, relationship)
2. The system sends a consent invitation email with a link
3. The family member clicks the link, reads the consent terms, and gives GDPR consent
4. They receive a secure magic-link email whenever a new care visit is submitted
5. Clicking the link takes them to their relative's portal

**What families see:**
- Date, time, and duration of each visit
- A 2-sentence plain-English summary of what happened (AI-generated, no clinical terminology)
- Wellbeing indicator: 😊 Good / 😐 Neutral / 😟 Concerns
- Categories of care provided (personal care, meals, medication, etc.)
- A flag notice if concerns were raised (without clinical details)

**What families never see:**
- Raw report text
- Caregiver names
- Medication details
- Clinical flags

**Push notifications**
Family members can subscribe to browser push notifications. They're notified on visit completion and when flags are raised (based on their per-contact preferences).

---

### 11. Care Policy Customisation

`/admin/policy`

Agencies upload their own care policy document. The system uses AI to extract key terminology, preferred phrases, and policy-specific requirements. This extracted context is injected into the AI report generation prompt, so reports use the agency's own language and reflect their specific standards.

For example, an agency that uses "service users" instead of "clients", or has a specific protocol for falls, will see that reflected in every generated report.

---

### 12. Quality Scoring

Every AI-generated report receives a quality score (0–100) across four dimensions:

| Dimension | What it measures |
|-----------|-----------------|
| **Completeness** | Were all relevant areas of care documented? |
| **Specificity** | Are details concrete and factual vs. vague? |
| **Risk Awareness** | Were potential concerns flagged appropriately? |
| **Language Quality** | Professional, person-centred language? |

The overall score is a weighted average. Caregivers see their score after submission on a visual ring chart. This is a **coaching tool** — it trains better documentation habits over time without requiring a manager to give individual feedback on every report.

---

### 13. Audit Trail

Every action in the system is logged: report creation, edits, approvals, logins, data exports, API key usage. The audit log is immutable and accessible to agency admins. It's the foundation for regulatory compliance and dispute resolution.

---

### 14. Notification Centre

`/notifications`

In-app notification bell with a dropdown. Managers receive notifications for:
- New flagged reports
- Incidents approaching their follow-up date
- Caregivers with no documentation for 48+ hours
- MAR discrepancies detected

Notifications link directly to the relevant record.

---

### 15. SaaS Billing (Stripe)

`/admin/billing`

Three subscription tiers:

| Plan | Caregivers | Reports/month | AI Suggestions | Family Portal | MAR | White-label | Public API |
|------|-----------|--------------|----------------|---------------|-----|-------------|------------|
| **Starter** | Up to 10 | 200 | — | — | — | — | — |
| **Growth** | Unlimited | Unlimited | ✓ | ✓ | ✓ | — | — |
| **Enterprise** | Unlimited | Unlimited | ✓ | ✓ | ✓ | ✓ | ✓ |

Billing is managed via Stripe Checkout and the Stripe Customer Portal. Feature gates enforce plan limits at the API level.

---

### 16. White-Label Mode (Enterprise)

Enterprise plan agencies can replace the CareDoc AI branding with their own:
- Upload their logo — appears in the app header and emails
- Set a brand colour — applied as the primary action colour throughout the UI
- "Powered by CareDoc AI" attribution remains in the footer (cannot be removed)

---

### 17. Public API (Enterprise)

`/docs/api`

Enterprise customers can integrate CareDoc AI with their existing systems (Nourish, Carezapp, Birdie, etc.) using the REST API.

**Authentication:** `Authorization: Bearer cda_[agencyCode]_[key]`

**Endpoints:**

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/api/v1/clients` | List all clients | `clients:read` |
| GET | `/api/v1/clients/:id` | Client detail | `clients:read` |
| PUT | `/api/v1/clients/:id` | Update conditions/care plan | `clients:write` |
| GET | `/api/v1/reports` | List reports (filterable) | `reports:read` |
| GET | `/api/v1/reports/:id` | Full report detail | `reports:read` |
| POST | `/api/v1/webhooks` | Register webhook endpoint | `webhooks:write` |
| DELETE | `/api/v1/webhooks/:id` | Remove webhook | `webhooks:write` |

**Outbound webhooks** fire on `report.submitted` events, signed with HMAC-SHA256. 3 retry attempts with exponential backoff.

API keys are managed at `/admin/api-keys`. Keys are shown once on creation and stored only as a bcrypt hash.

---

### 18. AI Cost Tracking

The platform tracks every AI call per agency: model, input tokens, output tokens, endpoint, and latency. Admins can see monthly AI usage and per-call costs.

---

## User Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full access — billing, API keys, user management, all manager features |
| **MANAGER** | Reports, compliance, rota, incidents, client management, family contacts |
| **SENIOR_CARER** | All caregiver features + report review and approval |
| **CAREGIVER** | Visit workflow only — assigned clients, task checklist, MAR, notes, report submission |

Role hierarchy is enforced at the API level. Every route validates that the authenticated user's role meets the minimum required level.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| AI | Anthropic Claude API (Sonnet for reports, Haiku for suggestions/summaries) |
| Styling | Tailwind CSS 3 |
| Components | shadcn/ui |
| Animation | Framer Motion |
| State | Zustand |
| Email | Resend |
| Cache / Rate limiting | Upstash Redis |
| Push notifications | Web Push (VAPID) |
| PDF export | Cloudflare Workers |
| Payments | Stripe |
| Error tracking | Sentry |
| Deployment | Vercel |

---

## Architecture

CareDoc AI is a multi-tenant SaaS platform. Each agency is a separate tenant identified by `agencyId`. All database queries are filtered by `agencyId` — no agency can ever see another agency's data.

```
app/
├── (app)/              # Authenticated app — caregivers and managers
│   ├── dashboard/      # Caregiver home screen
│   ├── visit/[id]/     # Visit workflow (tasks → MAR → notes → review)
│   ├── manager/        # Manager features
│   │   ├── reports/    # Report list and detail
│   │   ├── compliance/ # CQC compliance dashboard
│   │   ├── rota/       # Rota management
│   │   ├── incidents/  # Incident tracker
│   │   └── clients/    # Client profiles, medications, family contacts
│   └── admin/          # Admin features
│       ├── billing/    # Stripe billing
│       ├── api-keys/   # Public API key management
│       └── policy/     # Care policy upload
│
├── (portal)/           # Family portal — unauthenticated, token-based
│   └── portal/
│       ├── login/      # Magic link request
│       ├── consent/    # GDPR consent flow
│       └── [slug]/     # Visit history and detail
│
├── api/
│   ├── v1/             # Public REST API (Bearer token auth)
│   ├── billing/        # Stripe webhooks and checkout
│   ├── portal/         # Family portal data endpoints
│   ├── visits/         # Visit workflow API
│   ├── manager/        # Manager API
│   └── ai/             # AI suggestion endpoint
│
└── docs/
    └── api/            # Public API documentation (no auth required)

lib/
├── ai/                 # Cost tracking, prompt building
├── billing/            # Plan definitions, feature gates
├── cache/              # Upstash Redis helpers
├── compliance/         # CQC score calculation
├── mar/                # MAR discrepancy detection
├── pdf/                # Inspection pack HTML templates
├── push/               # Web Push (VAPID) delivery
└── webhooks/           # Outbound webhook delivery with retry
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Anthropic](https://console.anthropic.com) API key
- A [Resend](https://resend.com) API key (for emails)
- A [Vercel](https://vercel.com) account (for deployment)

### Environment Variables

Create `.env.local` with the following:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Email
RESEND_API_KEY="re_..."

# Stripe (billing)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_GROWTH_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@yourdomain.com"

# Upstash Redis (rate limiting + caching)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# PDF Worker (Cloudflare Worker URL)
PDF_WORKER_URL="https://..."

# Sentry (error tracking)
SENTRY_DSN="https://..."
```

### Install and Run

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### First-Time Setup

1. Open `http://localhost:3000`
2. Go to `/admin/setup` to create your first agency and admin user
3. Add caregivers at `/admin/users`
4. Add clients at `/manager/clients`
5. Assign clients to caregivers via the rota at `/manager/rota`
6. Caregivers can now log in and complete visits

---

## Database Migrations

New migrations are required when schema changes are deployed. After pulling new code:

```bash
npx prisma migrate deploy
npx prisma generate
```

The current schema includes 18 models covering agencies, users, clients, visits, reports, medications, incidents, audit logs, webhooks, family contacts, and more.

---

## Deployment

The project deploys to Vercel. Connect the GitHub repository in the Vercel dashboard, set all environment variables, and deploy. Database migrations should be run as a build step or post-deploy hook.

For production, ensure:
- `NEXTAUTH_URL` is set to your production URL
- Stripe webhook is configured to point to `https://yourdomain.com/api/billing/webhook`
- Sentry is configured for error tracking
- Upstash Redis is provisioned for rate limiting and caching

---

## Security

- **Row-level security**: every database query is scoped to the authenticated user's `agencyId`
- **Role-based access**: routes validate role at the API level, not just UI
- **API key auth**: bcrypt-hashed keys, shown once on creation
- **Stripe webhooks**: signature verification on every webhook event
- **Outbound webhooks**: HMAC-SHA256 signed payloads
- **Family portal**: token-based, consent-gated, returns zero internal data (no report text, no caregiver names, no medication details)
- **Audit log**: immutable record of all data access and changes

---

## Regulatory Context

CareDoc AI is designed specifically for the UK domiciliary care sector:

- **CQC (Care Quality Commission)**: The compliance dashboard, inspection pack export, and quality scoring directly support CQC's five key questions (Safe, Effective, Caring, Responsive, Well-led)
- **MAR requirements**: Medication Administration Records are a legal requirement in domiciliary care. The MAR module meets the expected standard for record-keeping
- **GDPR**: Family portal consent is explicitly recorded with date. Personal data is scoped by agency. Consent can be withdrawn
- **Data retention**: Audit logs are preserved indefinitely. Reports and signatures are never deleted

---

## Roadmap

Features documented for future phases:

- **RIDDOR integration** — statutory reporting for workplace injuries to HSE
- **NHS Spine integration** — for agencies connected to NHS care pathways
- **Rota AI** — predictive rostering based on client needs and caregiver availability
- **Outcome monitoring** — tracking client health trends over time (weight, mobility, mental state)
- **Caregiver training module** — personalised micro-learning based on documentation quality scores
