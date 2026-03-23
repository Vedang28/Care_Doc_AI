# CareDoc AI — Build Log

Newest entries at top.

---

## [2026-03-23] — Phase 4: AI Sophistication & SaaS Scale — COMPLETE
**Status:** ✅ Complete — `npm run build` ✅ | `tsc --noEmit` ✅ | `next lint` ✅
**Chunks:** 20 chunks (C1–C20)

### Summary of all Phase 4 changes

**Schema additions:**
- `Agency`: stripeCustomerId, subscriptionStatus, subscriptionId, planUpdatedAt
- `Client`: portalSlug (unique)
- `Visit`: marEntries relation, composite index [agencyId, status, createdAt]
- `Report`: familySummary, composite index [agencyId, createdAt]
- New models: `Medication`, `MarEntry`, `MarDiscrepancy`, `FamilyContact`, `FamilyPushSubscription`, `ApiKey`, `AiUsageLog`, `Webhook`
- New enum: `MarOutcome` (ADMINISTERED | PROMPTED | REFUSED | MISSED | NOT_DUE | STOCK_OUT)

**Real-time AI Suggestions (C1–C2):**
- `POST /api/ai/suggest` — Claude Haiku, 150 max_tokens, Upstash Redis rate limit (30/hr)
- `hooks/useAISuggestion.ts` — 800ms debounce, 15-char min, max 3 calls per field
- `GuidedNoteField` extended with Framer Motion suggestion card, dismiss/accept

**MAR Module (C3–C7):**
- `Medication` management page — manager can add/edit/deactivate per client
- MAR step injected into visit workflow between tasks and notes
- Pill-style outcome chips — hard block until all outcomes selected
- `lib/mar/discrepancy-check.ts` — stock plausibility, consecutive refusals, consecutive misses
- `POST /api/visits/[visitId]/mar` — idempotent deleteMany + createMany
- MAR table included in inspection pack PDF (C7)
- `GET /api/manager/reports/[reportId]/mar` — MAR detail for manager report view

**Family Portal (C8–C12):**
- `FamilyContact` management — manager UI with consent chips, push prefs, portal link copy
- `app/(portal)/` route group — portal login, consent page, visit list, visit detail
- Token auth: base64(contactId), gates on `consentGiven: true`
- Web Push (VAPID) — `lib/push/send.ts`, `lib/push/notify-family.ts`, push subscribe/unsubscribe routes
- `POST /api/portal/generate-family-summary` — 2-sentence Claude Haiku family summary

**SaaS Infrastructure (C13–C15):**
- `lib/billing/plans.ts` — STARTER/GROWTH/ENTERPRISE plan definitions with limits
- `lib/billing/gate.ts` — `checkFeatureGate()` throws PlanLimitError for blocked features
- `POST /api/billing/webhook` — Stripe signature verification, subscription lifecycle
- Billing admin page at `/admin/billing`
- White-label: CSS custom properties (`--brand-primary`), Enterprise-only logo injection

**Public API (C16–C17):**
- `lib/api-keys.ts` — key generation (`cda_{code}_{random}`), bcrypt hash/verify
- `lib/api-keys/authenticate.ts` — Bearer token auth middleware
- `/api/v1/` routes: clients (read/write), reports (read), webhooks (register/delete)
- `lib/webhooks/deliver.ts` — HMAC-SHA256 signed, 3 retries with exponential backoff
- API key management UI at `/admin/api-keys`

**AI Cost Tracking (C19):**
- `lib/ai/cost-tracker.ts` — `logAiCall()`, per-model pricing, monthly usage query
- `AiUsageLog` written on every AI call

**Performance & Polish (C20):**
- `app/error.tsx`, `app/global-error.tsx`, `app/(app)/error.tsx` — error boundaries
- `app/not-found.tsx` — 404 page
- Loading skeletons: dashboard, reports list, client list
- `lib/cache/redis.ts` — `cacheGet/cacheSet/cacheDel/cacheDelPattern` + `CacheKeys` builder
- `app/docs/api/page.tsx` — public API documentation page (no auth, force-static)

---

## [2026-03-23] — Phase 3: Compliance Reporting & Manager Dashboard — COMPLETE
**Status:** ✅ Complete — `npm run build` ✅ | `tsc --noEmit` ✅ | `next lint` ✅
**Chunks:** 20 chunks (1-20)

### Summary of all Phase 3 changes

**Schema (Chunks 1, 4):**
- `Report`: qualityScoreOverall, qualityCompleteness, qualitySpecificity, qualityRiskAwareness, qualityFeedback, incidents relation
- `Client`: visitFrequencyDays Int @default(1), incidents relation
- `AgencySettings`: policyExtract Json?
- New `Incident` model + `IncidentSeverity` enum (LOW/MEDIUM/HIGH/CRITICAL)
- `prisma generate` run successfully

**AI Quality Scoring (Chunks 2-3):**
- System prompt now returns qualityScore JSON in AI response
- `buildSystemPrompt` accepts `policyExtract` for custom terminology injection
- `QualityScoreCard` component (SVG ring, no external lib) on caregiver success screen

**Compliance Engine (Chunks 4-6):**
- `lib/compliance/score.ts` — 4 sub-scores, weighted average, trend detection, daily history
- `GET /api/manager/compliance` — returns score, history, clientRisk, caregiverSummary
- `POST /api/manager/compliance/themes` — Claude Haiku AI extraction, Upstash Redis 6hr cache

**Compliance Dashboard (Chunks 7-10):**
- `/manager/compliance` — 4 score cards, Recharts line chart, key themes panel, client risk table, caregiver performance summary
- Manager layout with tab navigation: Compliance | Reports | Incidents

**Incident Management (Chunks 11-15):**
- `lib/incidents.ts` — `notifyAdminsOfCriticalIncident()` (immediate email for HIGH/CRITICAL)
- `POST/GET /api/manager/incidents` + `GET/PUT /api/manager/incidents/[id]`
- Daily cron extended with overdue incident reminders
- `/manager/incidents` — filterable table, severity colours, OVERDUE badge
- `IncidentSlideOver` — create (with CRITICAL safeguarding alert) and resolve flows
- "Create Incident" buttons on each flag in report detail

**Audit Trail Export (Chunks 16-17):**
- `lib/pdf/audit-template.ts` — full inspection pack HTML builder
- `POST /api/manager/clients/[clientId]/export` — PDF via Cloudflare Worker or HTML fallback, CSV ZIP
- `ExportModal` — date presets, options, redaction toggle, format selection
- `/manager/clients/[clientId]` — client detail page with visit history

**Care Policy Customisation (Chunks 18-20):**
- `POST /api/admin/policy/upload` — R2 upload (graceful fallback)
- `POST /api/admin/policy/extract` — pdf-parse/mammoth + Claude Haiku extraction
- `POST /api/admin/policy/activate` — creates PromptVersion, updates AgencySettings.policyExtract
- `GET /api/admin/policy/versions` + restore endpoint
- `/admin/policy` — drag-and-drop upload, terminology review, version history

### New env vars
```env
UPSTASH_REDIS_REST_URL="placeholder"
UPSTASH_REDIS_REST_TOKEN="placeholder"
```

### New dependencies
- recharts, pdf-parse, mammoth, @upstash/redis, @aws-sdk/client-s3, @types/pdf-parse

### Migrations needed (run when DATABASE_URL is set)
```bash
npx prisma migrate dev --name add-quality-scoring-to-reports
npx prisma migrate dev --name add-incident-management
npx prisma migrate dev --name add-visit-frequency-to-clients
npx prisma migrate dev --name add-policy-extract-to-agency-settings
```

---

## [2026-03-23] — Phase 3 Chunks 13-15: Incident Management UI
Status: ✅ Complete
Agent: frontend
Files created: app/(app)/manager/incidents/page.tsx, components/care/IncidentSlideOver.tsx
Files modified: app/(app)/manager/reports/[reportId]/page.tsx
Changes: Incident list with filter tabs, severity colour system, OVERDUE badge. Slide-over for create (with CRITICAL safeguarding alert) and resolve flows. "Create Incident" buttons on each flag in report detail.
Build status: tsc --noEmit ✅
Next: Chunk 16-17 — Audit trail export UI

---

## [2026-03-23] — Phase 3 Chunk 17: Client Detail + Export Modal
Status: ✅ Complete
Agent: frontend
Files created: app/(app)/manager/clients/[clientId]/page.tsx, components/care/ExportModal.tsx
Files created (if missing): app/api/manager/clients/[clientId]/route.ts
Changes: Client detail page with visit history. Export modal with date presets, include options, redaction toggle, PDF/CSV format selection. Wired to /api/manager/clients/[clientId]/export.
Build status: tsc --noEmit ✅
Next: Chunk 18-19 — Policy UI

---

## [2026-03-23] — Phase 3 Chunks 19-20: Policy Upload UI
Status: ✅ Complete
Agent: frontend
Files created: app/(app)/admin/policy/page.tsx
Changes: Policy page with drag-and-drop upload, AI extraction review (editable terminology/policies/instructions), activate button creates new PromptVersion. Version history table with restore. State machine: idle → uploading → review → activating → idle.
Build status: tsc --noEmit ✅
Next: Final build check

---

## [2026-03-23] — Phase 3 Chunks 7-10: Compliance Dashboard UI (Full)
Status: ✅ Complete
Agent: frontend
Files created: app/(app)/manager/compliance/page.tsx
Changes: Full compliance dashboard — 4 score cards, Recharts line chart (30-day history), AI key themes panel, client risk overview table, caregiver performance summary. All data wired to real API. Skeleton loading, empty states, error state.
Build status: tsc --noEmit ✅
Next: Chunk 13 — Incident list UI

---

## [2026-03-23] — Phase 3 Chunk 18: Care Policy Backend
Status: ✅ Complete
Agent: backend
Files created: app/api/admin/policy/upload/route.ts, app/api/admin/policy/extract/route.ts, app/api/admin/policy/activate/route.ts, app/api/admin/policy/versions/route.ts
Changes: Policy document upload (R2 if configured), text extraction via pdf-parse/mammoth, Claude Haiku terminology extraction, activate creates new PromptVersion + updates AgencySettings.policyExtract, version restore endpoint.
Build status: tsc --noEmit ✅
Next: Chunk 19 — Policy upload UI

---

## [2026-03-23] — Phase 3 Chunk 16: Audit Trail Export
Status: ✅ Complete
Agent: backend
Files created: app/api/manager/clients/[clientId]/export/route.ts, lib/pdf/audit-template.ts
Changes: POST endpoint generates full inspection pack. PDF mode via Cloudflare Worker (HTML fallback). CSV mode returns 4-file JSON. Date range validation (max 1 year). Caregiver anonymisation option. AuditLog entry on every export.
Build status: tsc --noEmit ✅
Next: Chunk 17 — Export modal UI

---

## [2026-03-23] — Phase 3 Chunk 11: Incident Management API
Status: ✅ Complete
Agent: backend
Files created: app/api/manager/incidents/route.ts, app/api/manager/incidents/[id]/route.ts, lib/incidents.ts
Changes: Full CRUD for incidents. GET supports filter=all|open|resolved|escalated. POST validates agency ownership. isOverdue computed on GET. CRITICAL/HIGH triggers immediate admin email.
Build status: tsc --noEmit ✅
Next: Chunk 12 — Cron reminders

---

## [2026-03-23] — Phase 3 Chunk 12: Overdue Incident Cron Reminders
Status: ✅ Complete
Agent: backend
Files modified: app/api/cron/daily-digest/route.ts
Changes: Daily cron now also sends overdue incident reminder email for HIGH/CRITICAL incidents where followUpDate < tomorrow and resolvedAt = null.
Build status: tsc --noEmit ✅
Next: Chunk 13 — Incident list UI

---

## [2026-03-23] — Phase 3 Chunk 3: Quality Score Ring UI
Status: ✅ Complete
Agent: frontend
Files created: components/care/QualityScoreCard.tsx
Files modified: app/api/visits/[visitId]/generate-report/route.ts, store/visit.ts, app/(app)/visit/[visitId]/processing/page.tsx, app/(app)/visit/[visitId]/review/page.tsx
Changes: Quality score saved to DB on report generation. Ring component (SVG, no extra lib) with breakdown bars. Shown on caregiver success screen after submission.
Build status: tsc --noEmit ✅
Next: Chunk 4 — Compliance Score Engine

---

## [2026-03-23] — Phase 3 Chunk 4: Compliance Score Engine
Status: ✅ Complete
Agent: backend
Files created: lib/compliance/score.ts
Changes: calculateComplianceScore() with 4 sub-scores (completion, quality, sign-off, flag resolution), weighted average, trend detection, daily history, getClientRiskOverview()
Build status: tsc --noEmit ✅
Next: Chunk 5 — Compliance API

---

## [2026-03-23] — Phase 3 Chunk 5: Compliance API
Status: ✅ Complete
Agent: backend
Files created: app/api/manager/compliance/route.ts
Changes: GET returns score, history, clientRisk, caregiverSummary
Build status: tsc --noEmit ✅
Next: Chunk 6 — AI Themes

---

## [2026-03-23] — Phase 3 Chunk 6: AI Theme Extraction
Status: ✅ Complete
Agent: backend
Files created: app/api/manager/compliance/themes/route.ts
Changes: POST endpoint, Claude Haiku analysis, Upstash Redis 6hr cache (gracefully skipped when env is placeholder)
Build status: tsc --noEmit ✅
Next: Chunk 7 — Compliance Dashboard UI

---

## [2026-03-23] — Phase 3 Chunk 1: Quality Score Schema
Status: ✅ Complete
Agent: backend
Files modified: prisma/schema.prisma
Changes: Added qualityScore fields to Report, visitFrequencyDays to Client, policyExtract to AgencySettings, Incident model + IncidentSeverity enum
Build status: prisma generate ✅
Note: Migration skipped — DATABASE_URL is placeholder. Run `npx prisma migrate dev --name add-quality-scoring-to-reports` and `npx prisma migrate dev --name add-incident-management` when DATABASE_URL is set.
Next: Chunk 2 — AI prompt update

---

## [2026-03-23] — Phase 3 Chunk 2: AI Quality Scoring
Status: ✅ Complete
Agent: backend
Files modified: lib/ai/prompts.ts, lib/ai/generate-report.ts
Changes: System prompt now returns qualityScore JSON. ReportResponseSchema extended with QualityScoreSchema. buildSystemPrompt accepts policyExtract for custom terminology.
Build status: tsc --noEmit ✅
Next: Chunk 3 — Quality score ring UI

---

## [CHUNKS 3–13] Phase 2 Full Feature Build
**Date:** 2026-03-23
**Phase:** 2 — Production Hardening
**Status:** ✅ Complete — `npm run build` ✅ | `tsc --noEmit` ✅

### Chunk 3 — Rota Management API
- `app/api/manager/rota/route.ts` — GET week assignments + caregivers list; POST create assignment (agency-scoped)
- `app/api/manager/rota/[id]/route.ts` — PUT update visit type/status; DELETE remove assignment
- `app/api/manager/clients/route.ts` — GET all active clients for manager (used by rota modal)

### Chunk 4 — Admin Frontend
- `app/(app)/admin/setup/page.tsx` — 3-step agency creation wizard (details → branding → first manager)
- `app/(app)/admin/dashboard/page.tsx` — Platform stats grid + agency table with manage links

### Chunk 5 — GPS Verify-Location API
- `app/api/visits/[visitId]/verify-location/route.ts` — Stores GPS coords, geocodes client address via Google Maps, runs Haversine, flags >300m mismatches, creates AuditLog entry
- `lib/utils.ts` — Added `haversineDistance()` (returns distance in metres)

### Chunk 6 — GPS Check-in UI
- `components/care/ClientCard.tsx` — "Getting your location..." state, map pin animation, amber mismatch notice with "Add explanation" input
- `app/(app)/dashboard/page.tsx` — Passes GPS coords to visit creation, calls verify-location non-blocking

### Chunk 7 — PWA / Offline Infrastructure
- `next.config.mjs` — Wrapped with `@ducanh2912/next-pwa` (disabled in dev)
- `lib/offline/visit-queue.ts` — IndexedDB queue using `idb`: queue/get/update/delete/sync all pending visits
- `hooks/useNetworkStatus.ts` — `isOnline`/`wasOffline` (30s syncing state after reconnection)
- `app/api/sync/visit/route.ts` — POST: creates visit+tasks+notes+AI report from queued offline data

### Chunk 8 — Offline UI
- `components/care/OfflineBanner.tsx` — Amber "offline" banner + green "syncing" banner on reconnect
- `app/(app)/layout.tsx` — OfflineBanner rendered above main content

### Chunk 9 — Notifications Backend
- `lib/notifications.ts` — `createNotification()` + `notifyManagersOfFlaggedReport()` (creates in-app + sends email via Resend)
- `emails/FlaggedReportEmail.tsx` — React Email flagged report alert template
- `emails/DailyDigestEmail.tsx` — React Email daily digest template
- `app/api/notifications/route.ts` — GET last 20 + unread count
- `app/api/notifications/[id]/route.ts` — PATCH mark single read
- `app/api/notifications/read-all/route.ts` — PATCH mark all read
- `app/api/cron/daily-digest/route.ts` — POST (CRON_SECRET protected): daily digest email to all agencies
- `vercel.json` — Cron schedule: 8:00 AM UTC daily
- `app/api/visits/[visitId]/submit/route.ts` — Now triggers `notifyManagersOfFlaggedReport()` on submit

### Chunk 10 — Notification Bell UI
- `components/layout/NotificationBell.tsx` — Bell icon with unread badge, dropdown panel, mark-read, poll every 60s
- `components/layout/AppShell.tsx` — Bell added to nav (visible to MANAGER/SENIOR_CARER/ADMIN)

### Chunk 11 — Voice Input
- `hooks/useVoiceInput.ts` — Web Speech API hook with typed interfaces, en-GB, append-only behaviour
- `components/care/GuidedNoteField.tsx` — Mic button in field header; idle/listening/processing states; tooltip fallback for unsupported browsers

### Chunk 12 — PDF Generation
- `lib/pdf/report-template.ts` — `buildReportHtml()`: fully formatted A4 report with header, meta grid, flags, report text, digital signature, CDR reference ID
- `app/api/reports/[reportId]/export-pdf/route.ts` — POST: builds HTML, delegates to Cloudflare Worker if `PDF_WORKER_URL` set, falls back to HTML print mode
- `workers/pdf-generator/src/index.ts` — Cloudflare Worker stub (Puppeteer integration commented, ready to uncomment on deploy)
- `workers/pdf-generator/wrangler.toml` — R2 bucket binding, deploy config
- `tsconfig.json` — Excluded `workers/` directory (uses Cloudflare types not in Next.js lib)

### Chunk 13 — PDF Export Button
- `app/(app)/manager/reports/[reportId]/page.tsx` — "Export PDF" button with loading state; opens PDF URL or print dialog fallback

### New env vars required
```env
GOOGLE_MAPS_API_KEY=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=caredocai-assets
CRON_SECRET=
PDF_WORKER_URL=
PDF_WORKER_SECRET=
```

### Migration needed
```bash
npx prisma migrate dev --name phase2-agency-settings-notifications
```

---

## [CHUNK 2] Admin Onboarding API Routes + Middleware Update
**Date:** 2026-03-23
**Phase:** 2 — Production Hardening
**Status:** ✅ Complete — `npm run build` ✅ | `tsc --noEmit` ✅

### What was built
- **`middleware.ts`** — Added `/admin` to protected paths, ADMIN-only guard, subdomain parsing (injects `x-agency-subdomain` header), updated matcher to include `/admin/:path*`. Vercel wildcard DNS setup instructions added as comment.
- **`app/api/admin/agencies/route.ts`** — GET all agencies (ADMIN only), POST create agency + seed AgencySettings + create first manager in one transaction.
- **`app/api/admin/agencies/[agencyId]/route.ts`** — GET single agency with counts, PATCH update (name, active, plan).
- **`app/api/admin/agencies/[agencyId]/settings/route.ts`** — GET/PUT agency branding + notification settings (upsert).
- **`app/api/admin/agencies/[agencyId]/manager/route.ts`** — POST create additional manager for an agency.
- **`app/api/admin/stats/route.ts`** — GET global stats (total/active agencies, reports today, active visits, flagged reports).
- **`prisma/schema.prisma`** — Added missing `rotaAssignments RotaAssignment[]` back-relation on Agency. Regenerated Prisma client.
- **`prisma/seed.ts`** — Fixed: added `agencyId` to RotaAssignment seed data (now required field).

### Migration needed (run when DB is available)
```bash
npx prisma migrate dev --name phase2-agency-settings-notifications
```

### Blockers / notes
- All admin routes require ADMIN role. Non-admin users hitting `/admin/*` are redirected to `/dashboard` by middleware.
- `POST /api/admin/agencies` creates agency + settings + first manager atomically (transaction).

---

---

## [CHUNK 1] Row-Level Security + Agency Guard + Session Types
**Date:** 2026-03-23
**Phase:** 2 — Production Hardening
**Status:** ✅ Complete — `npm run build` ✅ | `tsc --noEmit` ✅

### What was built
- **`types/next-auth.d.ts`** — Extends NextAuth `Session`, `User`, and `JWT` interfaces to include `id`, `role`, and `agencyId` at compile time. Eliminates all `as unknown as` casts in downstream code.
- **`lib/db/agency-guard.ts`** — `getAgencyContext()` fetches the session + re-queries DB to guarantee agencyId is live (not stale JWT). `assertSameAgency()` throws `FORBIDDEN` on cross-agency access. Use in every API route.
- **`prisma/schema.prisma`** — Schema additions:
  - `Agency`: `subdomain String? @unique`
  - `User`: `rotaAssignments RotaAssignment[]`, `notifications Notification[]`
  - `RotaAssignment`: `agencyId`, `agency` relation, `caregiver` relation, `@@index([agencyId])`
  - New `AgencySettings` model (brandColour, logoUrl, notifyOnFlags, notifyEmail, timezone)
  - New `Notification` model (userId, agencyId, title, body, link, read)
- **`app/api/clients/route.ts`** — Added `client: { agencyId: userOrError.agencyId }` to RotaAssignment query to enforce agency-scoped data at DB level.

### Migration needed (run when DB is available)
```bash
npx prisma migrate dev --name phase2-agency-settings-notifications
```

### Blockers / notes
- No new env vars required for this chunk.
- `getAgencyContext()` makes an extra DB round-trip per request vs reading from JWT — this is intentional (prevents stale-JWT agency spoofing). Can add Redis caching in Phase 3 if latency becomes an issue.

---

## [PHASE 1] Foundation MVP
**Date:** Pre-2026-03-23
**Status:** ✅ Complete

Full visit workflow, auth, Prisma schema, manager views, seed data, `npm run build` passing.
