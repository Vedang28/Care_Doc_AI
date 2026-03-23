# CareDoc AI — Build Log

Newest entries at top.

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
