# Project Brain — CareDoc AI

## Project Identity
- **Name**: CareDoc AI
- **Purpose**: AI-powered CQC-compliant visit documentation platform for UK domiciliary care agencies
- **Stack**: Next.js 14 App Router, Prisma + Neon PostgreSQL, NextAuth v5, Tailwind CSS, Anthropic Claude API
- **Deployment target**: Vercel
- **Current phase**: Phase 3 of 4

## Project-Specific Rules
- All IDs are UUIDs (`@default(uuid())`)
- All queries MUST filter by `agencyId` — use `lib/db/agency-guard.ts`
- `getAgencyContext()` re-fetches user from DB on every request (prevents stale-JWT spoofing)
- Never hard-delete user data — use soft deletes where applicable
- All admin routes require ADMIN role; non-admin users redirect to `/dashboard`
- `@ducanh2912/next-pwa` is used (NOT `next-pwa`) — ESM-compatible
- Cloudflare Worker types are excluded from `tsconfig.json` (`workers/` in exclude array)
- `prisma generate` must be run after any schema change before TypeScript will be happy

## Key Files & Their Roles
| File | Purpose |
|------|---------|
| `lib/db/agency-guard.ts` | `getAgencyContext()` + `assertSameAgency()` — row-level security |
| `lib/ai/generate-report.ts` | Main AI report generation function |
| `lib/ai/prompts.ts` | System prompt for visit report generation |
| `lib/notifications.ts` | `createNotification()` + `notifyManagersOfFlaggedReport()` |
| `lib/offline/visit-queue.ts` | IndexedDB queue for offline visits |
| `lib/pdf/report-template.ts` | `buildReportHtml()` — A4 HTML report builder |
| `lib/utils.ts` | `haversineDistance()`, `formatDate()`, `formatTime()`, `formatDuration()` |
| `hooks/useNetworkStatus.ts` | `isOnline`/`wasOffline` network detection |
| `hooks/useVoiceInput.ts` | Web Speech API wrapper (en-GB, append-only) |
| `workers/pdf-generator/src/index.ts` | Cloudflare Worker PDF stub (Puppeteer ready) |
| `emails/FlaggedReportEmail.tsx` | React Email flagged report alert |
| `emails/DailyDigestEmail.tsx` | React Email daily digest |
| `vercel.json` | Cron: daily-digest at 08:00 UTC |

## Non-Obvious Architecture
- `middleware.ts` parses host header and injects `x-agency-subdomain` for multi-tenant routing
- `app/api/sync/visit/route.ts` — offline sync endpoint; must match `generateVisitReport()` signature exactly
- `generateVisitReport()` takes `{ clientName, conditions, carePlan, visitDate, checkInTime, checkOutTime, completedTasks, freeNotes }` NOT a visitId
- GPS verify-location is fire-and-forget (non-blocking) — called after navigation starts
- Quality scoring will be added to AI report response in Phase 3 (new JSON fields on Report model)

## Environment Gotchas
- `DATABASE_URL` must use `?sslmode=require` (Neon)
- `CRON_SECRET` is checked via `Authorization: Bearer` header on cron routes
- `PDF_WORKER_SECRET` is passed as `X-Worker-Secret` header to Cloudflare Worker
- Google Maps API key is already set with a real value in `.env.local`

## Phase 3 — What to Build
1. Quality scoring on AI report generation (update prompts.ts, Report model, success screen)
2. CQC Compliance Dashboard (`/manager/compliance`) with Recharts
3. AI theme extraction (`/api/manager/compliance/themes`) — Upstash Redis cache
4. Client risk overview + `/manager/clients/[clientId]` detail page
5. Audit trail export — inspection pack PDF + CSV ZIP
6. Incident management module (`/manager/incidents`)
7. Care policy customisation (`/admin/policy`) with pdf-parse + mammoth

## Pending DB Migrations (run when DATABASE_URL is set)
```bash
npx prisma migrate dev --name phase2-agency-settings-notifications
npx prisma migrate dev --name add-quality-scoring-to-reports
npx prisma migrate dev --name add-incident-management
npx prisma migrate dev --name add-visit-frequency-to-clients
npx prisma migrate dev --name add-policy-extract-to-agency-settings
```
