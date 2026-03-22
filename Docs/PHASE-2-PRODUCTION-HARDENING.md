# CareDoc AI — Phase 2: Production Hardening & Multi-User Management
## Claude Code Build Prompt

---

## CONTEXT & PREREQUISITES

You are continuing development of **CareDoc AI**. Phase 1 is complete. The following are working:
- Full visit workflow (select client → tasks → notes → AI report → review → submit)
- Authentication with NextAuth (credentials)
- PostgreSQL database via Prisma on Neon
- Basic manager report view
- Deployed to Vercel

The product documentation file (`CareDocAI-Product-Documentation.docx`) is your source of truth for all design decisions, data models, and feature specifications.

**Before starting any feature, read the Phase 2 section of the product doc carefully.**

Phase 2 transforms the MVP into an agency-ready platform. The headline additions are:

1. **Multi-agency architecture** — proper tenant isolation
2. **Rota management** — admin assigns clients to caregivers
3. **GPS check-in** — location verification with mismatch handling
4. **Offline mode** — notes captured in low-signal environments
5. **Manager alerts & notifications** — email on flagged reports
6. **Voice input** — speech-to-text in note fields
7. **PDF export** — downloadable reports

---

## WHAT'S CHANGING IN THE EXISTING CODEBASE

Before adding new features, make these structural changes:

### 1. Add Row-Level Security to All DB Queries

Every Prisma query that reads or writes data **must** filter by `agencyId`. This is non-negotiable.

Create `lib/db/agency-guard.ts`:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Use this in every API route instead of raw prisma
export async function getSessionWithAgency() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED')
  
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, agencyId: true, role: true, name: true }
  })
  return user
}
```

Add this check to every API route handler. No route should ever return data from a different agency. Write a middleware test to verify this.

### 2. Update Session Type

Extend `next-auth.d.ts` to include `agencyId` and `role` in the session object so every route has access without an extra DB query.

### 3. Add Agency Settings Model

```prisma
model AgencySettings {
  id              String  @id @default(uuid())
  agencyId        String  @unique
  brandColour     String  @default("#2D6A4F")
  logoUrl         String?
  defaultPromptId String?
  notifyOnFlags   Boolean @default(true)
  notifyEmail     String?
  timezone        String  @default("Europe/London")
  
  agency Agency @relation(fields: [agencyId], references: [id])
}
```

Run `npx prisma migrate dev --name add-agency-settings` after all schema changes.

---

## FEATURE 1 — MULTI-AGENCY ARCHITECTURE

### Agency Onboarding Flow

Create `/admin/setup` — accessible only to users with role `ADMIN`:

**Step 1 — Agency Details:**
- Agency name (required)
- Unique agency code (auto-suggested from name, editable, validated unique)
- Contact email
- Timezone (dropdown, default: Europe/London)

**Step 2 — Branding:**
- Logo upload (drag-and-drop, max 2MB, PNG/JPG/SVG)
  - Store in Cloudflare R2: `logos/{agencyId}/{filename}`
  - Display logo in app header once set
- Primary colour picker (default: #2D6A4F)

**Step 3 — Create First Manager:**
- Name, email, temporary password
- Role auto-set to MANAGER

On completion: redirect admin to `/admin/dashboard`.

### Subdomain Routing (Vercel)

In `middleware.ts`, parse the subdomain from the host header:

```typescript
// agency-name.caredocai.com → extract "agency-name"
// Look up agency by subdomain field in DB
// Inject agencyId into request headers for downstream use
// Fallback: app.caredocai.com for the master admin portal
```

Add `subdomain` field to the `Agency` model. Update seed data to set `subdomain: "sunrise"` on the test agency.

Note: This requires Vercel wildcard domain configuration (`*.caredocai.com`). Add a comment in `middleware.ts` with the Vercel DNS setup instructions.

### Admin Dashboard `/admin`

Only accessible to `ADMIN` role. Shows:
- All agencies (table): name, code, plan, caregiver count, last activity, active toggle
- "Create Agency" button → onboarding flow
- Global stats: total reports today, active visits right now, flagged reports unresolved

---

## FEATURE 2 — ROTA MANAGEMENT

### Rota Assignment UI `/manager/rota`

Calendar view (weekly, defaults to current week):

**Left sidebar**: caregiver list with avatar + name + today's visit count badge.

**Main grid**: 7-day calendar. Each cell shows assigned visits for that caregiver/day.

**Assigning a visit:**
- Click empty cell → modal opens
- Select client from dropdown (agency clients only)
- Select caregiver
- Select visit type: Standard / Complex / Social / Medication Only
- Set time (optional — morning/afternoon/evening or specific time)
- Submit → creates RotaAssignment record

**Editing/removing:**
- Click existing assignment → edit modal
- Delete button with confirmation

**Caregiver dashboard effect:**
- `/dashboard` now filters clients to only those with a `RotaAssignment` for today
- If no assignments for today: show "No visits scheduled for today. Contact your manager." empty state
- Sort by scheduled time if time is set

### Rota API Routes

```
GET  /api/manager/rota?weekStart=YYYY-MM-DD   → assignments for the week
POST /api/manager/rota                         → create assignment
PUT  /api/manager/rota/[id]                    → update assignment
DELETE /api/manager/rota/[id]                  → remove assignment
```

---

## FEATURE 3 — GPS CHECK-IN VERIFICATION

### Implementation

When a caregiver taps "Start Visit" on a client card:

1. **Request geolocation** using `navigator.geolocation.getCurrentPosition()`
2. Show a loading state: "Getting your location..." with a map pin animation
3. If permission denied or timeout (>10s): proceed without GPS, set `locationLat/Lng = null`, add a soft note in the audit log
4. If location obtained:
   - POST to `/api/visits/[visitId]/verify-location` with `{ lat, lng }`
   - Server geocodes the client's address using the Google Maps Geocoding API
   - Calculate distance (Haversine formula)
   - If distance > 300m: flag = `"Location mismatch: caregiver was recorded >300m from client address"`
   - Do NOT block the visit — this is a flag, not a hard stop
5. Show the caregiver a subtle amber notice if mismatch, with a "Add explanation" link that opens a one-line text input

### Environment Variable

```env
GOOGLE_MAPS_API_KEY="AIza..."
```

### Haversine utility in `lib/utils.ts`:

```typescript
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  // Returns distance in metres
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI/180) *
            Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
```

---

## FEATURE 4 — OFFLINE MODE

### Strategy

Use a **Service Worker** with a **cache-first strategy** for the app shell, and **IndexedDB** for buffering visit data when offline.

### Service Worker Setup

Install `next-pwa`:
```bash
npm install next-pwa
```

Configure in `next.config.ts`:
```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache app shell (HTML, CSS, JS)
    // Network-first for API routes
    // Cache-first for static assets
  ]
})
```

Cache these routes offline:
- `/dashboard` — client list (stale-while-revalidate, 1 hour)
- `/visit/[visitId]/tasks` — task categories (cache-first, static)
- All fonts from Google Fonts

### IndexedDB Visit Queue

Create `lib/offline/visit-queue.ts` using the `idb` library:

```typescript
import { openDB } from 'idb'

interface QueuedVisit {
  id: string  // temp local ID
  clientId: string
  tasks: CompletedTask[]
  notes: FreeNotes
  checkInTime: string
  queuedAt: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

// openDB, get, put, delete, getAll operations
// Called from Zustand store when network is unavailable
```

### Network Status Detection

Create `hooks/useNetworkStatus.ts`:
```typescript
// Returns { isOnline: boolean, wasOffline: boolean }
// Uses navigator.onLine + online/offline event listeners
// wasOffline: true for 30s after coming back online (shows "Syncing..." indicator)
```

### Offline UI

- **Banner**: amber strip at top of every app page when offline: "📶 You're offline. Notes will sync when connection returns."
- **Visit flow**: fully functional offline. Tasks + notes saved to IndexedDB.
- **"Complete Visit" button**: if offline, shows "Save & Sync Later" instead.
- **On reconnection**: auto-sync background process:
  1. Reads all `pending` visits from IndexedDB
  2. Creates visit in DB via API
  3. Saves tasks and notes
  4. Triggers AI report generation
  5. Shows in-app notification: "Your visit for [Client] has been processed."

### Sync API Route

```
POST /api/sync/visit
Body: { localId, clientId, checkInTime, checkOutAt, tasks, notes }
Returns: { visitId, reportId }
```

---

## FEATURE 5 — MANAGER ALERTS & NOTIFICATIONS

### Email Notification on Flagged Reports

When a report is submitted with `flags.length > 0`:

1. Check `AgencySettings.notifyOnFlags` — if false, skip
2. Find all MANAGER users in the agency
3. Send email via Resend to each manager

**Email template** (`emails/FlaggedReportEmail.tsx` using React Email):

Subject: `⚠️ Flagged visit report — [Client Name] — [Date]`

Body:
- CareDocAI logo/wordmark
- "A visit report has been submitted with the following concerns:"
- List of flags (bulleted)
- Client name, caregiver name, visit date/time
- "View Report" button → deep link to `/manager/reports/[reportId]`
- Footer: "This alert was sent because flagged concerns were identified in the visit documentation."

### In-App Notification Centre

Add a bell icon to the manager header. Badge shows unread count.

Create `Notification` model:
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  agencyId  String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user  User   @relation(fields: [userId], references: [id])
  agency Agency @relation(fields: [agencyId], references: [id])
  
  @@index([userId, read])
}
```

Clicking the bell opens a dropdown panel showing the 10 most recent notifications.

API routes:
```
GET    /api/notifications         → list unread + recent
PATCH  /api/notifications/[id]    → mark as read
PATCH  /api/notifications/read-all → mark all read
```

### Daily Digest Email

Create a cron job (Vercel Cron, runs daily at 8:00 AM Europe/London):

`app/api/cron/daily-digest/route.ts`:

For each agency that has `notifyOnFlags: true`:
- Count visits completed yesterday
- Count flags raised and resolved
- Count incomplete/cancelled visits
- Send digest email to all managers

Vercel cron config in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-digest",
    "schedule": "0 8 * * *"
  }]
}
```

Protect cron routes with `CRON_SECRET` env var.

---

## FEATURE 6 — VOICE INPUT

### Implementation

In each `GuidedNoteField` component, add a microphone button (right side of textarea header):

```typescript
// Uses Web Speech API (SpeechRecognition)
// Supported: Chrome, Edge (desktop + Android)
// Unsupported: Safari iOS, Firefox → show tooltip "Voice input not available in your browser"

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.lang = 'en-GB'
recognition.continuous = false
recognition.interimResults = true
```

**UX states:**
- Idle: microphone icon (muted colour)
- Listening: pulsing red dot + "Listening..." label, microphone icon turns red
- Processing: spinner briefly
- Done: transcript appended to existing textarea content with a space

**Important**: voice input *appends* to existing text — it never replaces what the caregiver has already typed.

Show a brief toast notification if the browser doesn't support the Web Speech API.

---

## FEATURE 7 — PDF EXPORT

### Architecture

Use a **Cloudflare Worker** for PDF generation (avoids Vercel serverless memory/time limits).

Worker stack:
- Cloudflare Worker + Puppeteer via `@cloudflare/puppeteer`
- Triggered by POST from the Next.js API
- Generates PDF from a headless-rendered HTML template
- Uploads to Cloudflare R2
- Returns a signed URL (24-hour expiry)

### Report HTML Template

Create `lib/pdf/report-template.ts` that produces HTML:

```
Header: Agency logo (if set) + "CareDocAI" wordmark + Report ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT: Margaret Thompson          DATE: Monday 12 May 2025
CAREGIVER: Sarah Jones             VISIT: 09:14 – 10:02 (48 min)
AGENCY: Sunrise Care Agency        TASKS: 7 completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[If flags exist]
⚠ FLAGGED CONCERNS
• Near-fall during transfer...

VISIT REPORT
[Full report text in readable format]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIGITAL SIGNATURE
Signed by: Sarah Jones on Monday 12 May 2025 at 10:06
Report ID: CDR-SUNRISE-m8x4k2-A3F1

This report was generated with AI assistance and reviewed and approved by the caregiver named above.
CareDoc AI — CQC-compliant documentation platform
```

### Trigger Points

Add "Export PDF" button to:
1. `/manager/reports/[reportId]` — manager view
2. A new `/visit/history/[visitId]` caregiver view (list of their past submissions)

Both call `POST /api/reports/[reportId]/export-pdf`, which triggers the Cloudflare Worker and returns a download URL.

---

## UPDATED FILE STRUCTURE FOR PHASE 2

Add these to the existing structure:

```
app/
├── admin/
│   ├── setup/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── manager/
│   ├── rota/
│   │   └── page.tsx
│   └── reports/
│       └── [reportId]/
│           └── page.tsx      (updated)
├── api/
│   ├── visits/
│   │   └── [visitId]/
│   │       └── verify-location/
│   │           └── route.ts
│   ├── sync/
│   │   └── visit/
│   │       └── route.ts
│   ├── notifications/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── cron/
│       └── daily-digest/
│           └── route.ts
emails/
├── FlaggedReportEmail.tsx
└── DailyDigestEmail.tsx
lib/
├── offline/
│   └── visit-queue.ts
└── pdf/
    └── report-template.ts
hooks/
└── useNetworkStatus.ts
workers/
└── pdf-generator/            (Cloudflare Worker — separate project)
    ├── src/
    │   └── index.ts
    └── wrangler.toml
```

---

## NEW ENVIRONMENT VARIABLES

```env
# Google Maps (for geocoding)
GOOGLE_MAPS_API_KEY="AIza..."

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY="..."
CLOUDFLARE_R2_SECRET_KEY="..."
CLOUDFLARE_R2_BUCKET="caredocai-assets"
CLOUDFLARE_R2_PUBLIC_URL="https://assets.caredocai.com"

# Cron security
CRON_SECRET="generate-random-secret"

# PDF worker
PDF_WORKER_URL="https://pdf.caredocai.workers.dev"
PDF_WORKER_SECRET="generate-random-secret"
```

---

## UPDATED SEED DATA

Extend `prisma/seed.ts` to also seed:
- `AgencySettings` for the Sunrise agency (default settings)
- 5 `RotaAssignment` records for this week (spread across the 3 clients and 2 caregivers)
- 1 `PromptVersion` still active
- 3 completed `Visit` + `Report` + `Signature` records (past visits to populate manager view)

---

## PHASE 2 DONE CRITERIA

- [ ] Different agencies cannot see each other's data (test this explicitly)
- [ ] Rota page allows manager to assign clients to caregivers
- [ ] Caregiver dashboard shows only today's assigned clients
- [ ] GPS check-in records coordinates and flags mismatches > 300m
- [ ] App functions offline: tasks + notes captured, synced on reconnection
- [ ] Manager receives email when a flagged report is submitted
- [ ] In-app notification bell shows unread flagged reports
- [ ] Voice input works in Chrome/Edge and gracefully fails in Safari
- [ ] PDF export downloads a formatted report from manager view
- [ ] All new API routes are protected with agency-scoped queries
- [ ] `npm run build` passes with zero errors

---

## DO NOT BUILD IN PHASE 2

These are Phase 3+:
- CQC Compliance Dashboard / scoring
- Audit trail export pack
- Incident management module
- Care policy document upload / custom prompt extraction
- Stripe billing
- Family portal
- Quality scoring per report
