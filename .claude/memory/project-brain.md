# Project Brain — Persistent Knowledge

> Facts about this specific project that Claude should always know.
> Unlike PRIORITY-WORK.md (current task), this is evergreen project knowledge.
> Updated by /session-end when new permanent knowledge is discovered.

---

## Project-Specific Rules

> Things that are true for THIS project that override general knowledge.

- [FILL — e.g. "We use argon2, NOT bcrypt — already decided, don't suggest changing"]
- [FILL — e.g. "Frontend uses Zustand, NOT Redux — don't suggest Redux"]
- [FILL — e.g. "All IDs are CUIDs, never UUIDs or integers"]
- [FILL — e.g. "Soft deletes everywhere — never hard delete user data"]

---

## Key Files & Their Roles

> "What is X for?" — so Claude doesn't have to re-explore every session.

| File | Purpose |
|------|---------|
| [FILL path] | [FILL description] |
| [FILL path] | [FILL description] |

---

## Non-Obvious Architecture

> Things that aren't obvious from reading the code.

- [FILL — e.g. "Auth middleware is applied at the ROUTER level, not individual routes"]
- [FILL — e.g. "BullMQ queue 'emails' has a concurrency of 3 — don't increase, SendGrid rate limit"]
- [FILL — e.g. "The /health endpoint intentionally does NOT check DB — used by load balancer every 5s"]

---

## Environment Gotchas

> Things that will burn time if forgotten.

- [FILL — e.g. "JWT_SECRET must be ≥ 32 chars or the app throws on startup with a cryptic error"]
- [FILL — e.g. "DATABASE_URL must use ?sslmode=require in production (Supabase)"]
- [FILL — e.g. "Redis must be running before npm run dev — app does NOT gracefully degrade without it"]

---

## Deployment Notes

> Things that matter for shipping.

- [FILL — e.g. "PM2 process name is 'myapp-backend' — NOT 'myapp'"]
- [FILL — e.g. "Migrations must run manually on prod after deploy — not in CI"]
- [FILL — e.g. "VPS has Node 18, not 20 — watch for Node 20-specific APIs"]

---

## What Has Been Built So Far

> Running inventory of completed features (high level).

- [ ] [Feature 1]
- [ ] [Feature 2]

---

## Known Technical Debt

> Things that work but should be improved later.

- [FILL — e.g. "authService.js is 300 lines — should be split into tokenService + passwordService"]
- [FILL — e.g. "No integration tests for payment webhooks yet"]

---

> This file grows over time. Add to it via /session-end when new permanent knowledge is discovered.
> Never delete entries — mark them as resolved/outdated instead.
