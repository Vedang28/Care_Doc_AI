# CLAUDE.md — Project Brain v2
# EXAMPLE: Fully configured for a Node.js + Express SaaS project
# This shows what your CLAUDE.md looks like after running /setup

---

## Session Protocol — Read This First

**Every new session:**
1. Read `memory/INDEX.md` — active project state
2. Read `memory/session-log.md` — last 3 sessions
3. Read `memory/project-brain.md` — persistent project knowledge
4. Read `PRIORITY-WORK.md` — exact current task

**Trigger words** that auto-run `/session-start`: "resume", "where were we", "let's continue", "pick up from last time"

**End of every session:** run `/session-end` — writes memory, commits, prints handoff.

---

## ⚡ Quick Command Reference

| I want to... | Run |
|---|---|
| Start a new project from scratch | `/setup` |
| Plan a task (3+ steps) | `/plan [description]` |
| Execute an approved plan | `/execute` |
| Fix a bug autonomously | `/fix [description]` |
| Run full test suite | `/test` |
| Code quality gate | `/review` |
| Commit + push + deploy | `/ship` |
| Generate feature boilerplate | `/scaffold [feature]` |
| Database migrations | `/migrate [action]` |
| Security audit | `/security` |
| Performance audit | `/perf` |
| Full system health check | `/doctor` |
| Save context before compaction | `/context-save` |

---

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | TaskFlow API |
| **Purpose** | SaaS task management API with team collaboration and real-time notifications |
| **Current Phase** | Phase 3 of 5 — Notifications + Real-time |
| **Repo** | github.com/Aadi262/taskflow-api |
| **Stack Template** | node-express |

### Deployment Target

| Field | Value |
|-------|-------|
| **Platform** | VPS (Hetzner) |
| **VPS IP** | 65.21.100.42 |
| **VPS User** | deploy |
| **App Path** | /var/www/taskflow-api |
| **Process Manager** | PM2 — process name: taskflow-backend |
| **Port** | 3000 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Backend | Express 4 |
| ORM / DB Client | Prisma 6 |
| Database | PostgreSQL 16 |
| Frontend | N/A — API only |
| Styling | N/A |
| Auth | JWT (access 15m) + Refresh tokens (7d) + argon2 |
| Queue / Cache | Redis 7 + BullMQ |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions → SSH → PM2 |

---

## Folder Structure

```
taskflow-api/
├── src/
│   ├── routes/           # Express routers (auth, tasks, teams, notifications)
│   ├── controllers/      # HTTP layer — thin, delegates to services
│   ├── services/         # Business logic (authService, taskService, etc.)
│   ├── middleware/       # authenticate, requireRole, validate, errorHandler, rateLimiter
│   ├── queues/           # BullMQ: emailQueue, notificationQueue
│   ├── config/           # db.js (Prisma singleton), redis.js, logger.js
│   └── utils/            # tokens.js, pagination.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/          # testDb.js, factories.js
├── docs/
│   ├── plans/            # Implementation plans
│   └── audits/           # Security/perf audit reports
├── logs/
├── .env.example
└── .gitignore
```

---

## FF Workflow Principles — 6 Non-Negotiable Rules

### 1. Plan Mode Default
- Enter plan mode for **ANY** task with 3+ steps or architectural decisions
- If something goes sideways mid-task → **STOP and re-plan immediately**
- Use plan mode for verification steps too, not just building
- Write detailed specs upfront to eliminate ambiguity → `/plan` always precedes `/execute`

### 2. Subagent Strategy
- Keep the main context window **lean** — offload exploration and research aggressively
- Research, file exploration, parallel analysis → **always subagents**
- For complex problems: throw more compute at it via parallel agents
- **One focused task per subagent** — no multi-tasking agents

### 3. Self-Improvement Loop
- After **ANY** correction from the user → write a lesson to `lessons.md` immediately
- Write rules that **mechanically prevent** the same mistake forever
- Review `lessons.md` at the start of every session — scan for relevant patterns
- Same mistake twice = unacceptable. Rewrite the lesson if it wasn't clear enough.

### 4. Verification Before Done
- **Never** mark `[x]` without proof it actually works
- Diff behavior before/after your changes on non-trivial tasks
- Ask: *"Would a staff engineer approve this?"*
- Proof = test passing, curl response shown, screenshot described, health check green

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask *"Is there a more elegant way?"*
- If a fix feels hacky: *"Knowing everything I know now, implement the elegant solution"*
- **Skip this for simple, obvious fixes** — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- Bug report received → **just fix it**. No hand-holding required.
- Read logs → identify root cause → fix → verify → write lesson
- Zero context-switching required from the user
- Go fix failing CI tests without being told how

---

## 18 Hardcoded Rules

| # | Rule |
|---|------|
| 1 | After every correction → immediately write a lesson in `lessons.md` |
| 2 | 3+ step task → write plan in `docs/plans/` before touching code |
| 3 | Never mark `[x]` without proof the task actually works |
| 4 | Staff engineer standard — ask if they'd approve before shipping |
| 5 | Hacky fix detected → stop, find the elegant solution |
| 6 | Bug report → read logs, identify root cause, fix it, write lesson |
| 7 | Simplicity first — smallest change that solves the problem |
| 8 | No laziness — find root cause, not symptom |
| 9 | Only touch files the task actually requires |
| 10 | Document results and proof in the phase doc for each task |
| 11 | Pre-flight health check before planning a complex task |
| 12 | Run `npx tsc --noEmit` after every file edit |
| 13 | `git diff` review before every commit — no secrets, no debug logs |
| 14 | Check dependency freshness monthly via `stack-auditor` skill |
| 15 | Performance budget: p95 API response < 200ms, no endpoint > 500ms |
| 16 | Track error budget by counting lessons written per phase |
| 17 | Significant architecture decisions → write an ADR entry |
| 18 | Keep the last 3 rollback commit hashes in `ADR.md` at all times |

---

## Project-Specific Rules

- We use **argon2**, NOT bcrypt — already decided, never suggest changing
- All IDs are **CUIDs** (Prisma default) — never UUIDs or integers
- **Soft deletes everywhere** — never hard delete user/task/team data (`deletedAt` column)
- JWT_SECRET must be **≥ 32 chars** or jsonwebtoken throws on startup
- BullMQ email queue concurrency is **3** — do not increase (SendGrid rate limit)
- The `/health` endpoint intentionally does **NOT** check DB — used by load balancer every 5s

---

## Environment Variables

```env
# Required — app will not start without these
DATABASE_URL=postgresql://user:pass@localhost:5432/taskflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-min-32-chars-here-make-it-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3000

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@taskflow.app

# Optional
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

---

## API Patterns

```json
{ "success": true,  "data": {},       "message": ""        }
{ "success": false, "error": "...",   "code": "ERROR_CODE" }
```

- **Routes**: `/api/v1/[resource]`
- **Auth**: `authenticate` middleware → attaches `req.user`
- **Roles**: `requireRole('admin', 'member')` — checked after authenticate
- **Errors**: throw `AppError(message, statusCode, errorCode)` — centralized handler responds
- **Pagination**: `?page=1&limit=20` → `{ data: [], meta: { total, page, limit, pages } }`

---

## Active Phase

```markdown
## Phase 3 — Notifications + Real-time

**Goal**: Users receive email + in-app notifications for task assignments, comments, and due dates
**Started**: 2026-03-18
**Deadline**: 2026-03-25

- [x] BullMQ email queue wired to Resend
- [x] Notification model in Prisma schema
- [ ] Task assignment triggers notification
- [ ] Comment mentions trigger notification
- [ ] SSE endpoint for real-time push
- [ ] Mark-as-read endpoint

**Verification**: Assign a task in Postman → email received within 10s + /api/v1/notifications returns the entry
**Rollback**: git reset --hard HEAD~3 + run migration rollback for notification table
```
