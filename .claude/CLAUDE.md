# CLAUDE.md — Project Brain v2

> **Single source of truth.** Read every session start. Fill every `[FILL]` before use.
> New project? Run `/setup` to auto-fill this file and scaffold your structure.

---

## Session Protocol — Read This First

**Every new session:**
1. Read `memory/current-context.json` — compact resume brief
2. Read `PRIORITY-WORK.md` — exact current task
3. Read `memory/INDEX.md` — active project state
4. Open only the files listed in `resumeBrief.openFirst`

**Trigger words** that auto-run `/session-start`: "resume", "where were we", "let's continue", "pick up from last time"

**End of every session:** run `/session-end` — writes memory, commits, prints handoff.
If context usage reaches **95% used** (about 5% left), stop work, save a handoff, and continue in a fresh session.

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
| **Name** | [FILL] |
| **Purpose** | [FILL — one sentence] |
| **Current Phase** | [FILL — e.g. Phase 2 of 6] |
| **Repo** | [FILL — github.com/...] |
| **Stack Template** | [FILL — nextjs / node-express / fastapi / react-spa / t3 / go-fiber / custom] |

### Deployment Target

| Field | Value |
|-------|-------|
| **Platform** | [FILL — VPS / Vercel / Railway / Fly.io / Render / AWS] |
| **VPS IP** | [FILL or N/A] |
| **VPS User** | [FILL or N/A] |
| **App Path** | [FILL or N/A] |
| **Process Manager** | [FILL — PM2 process name / systemd unit / N/A] |
| **Port** | [FILL — e.g. 3000] |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [FILL — e.g. Node.js 20 / Python 3.12 / Go 1.22] |
| Backend | [FILL — e.g. Express / FastAPI / Fiber / Next.js API] |
| ORM / DB Client | [FILL — e.g. Prisma / SQLAlchemy / GORM / Drizzle] |
| Database | [FILL — e.g. PostgreSQL 16 / MySQL / SQLite] |
| Frontend | [FILL — e.g. React 18 + Vite / Next.js / None] |
| Styling | [FILL — e.g. Tailwind CSS / CSS Modules / None] |
| Auth | [FILL — e.g. JWT + bcrypt / NextAuth / Lucia] |
| Queue / Cache | [FILL — e.g. Redis + BullMQ / None] |
| Testing | [FILL — e.g. Jest + Supertest / Pytest / Vitest] |
| CI/CD | [FILL — e.g. GitHub Actions / None] |

---

## Folder Structure

```
[FILL — run /setup to auto-generate, or paste your structure here]
```

---

## FF Workflow Principles — 6 Non-Negotiable Rules

These govern every single session. No exceptions, no shortcuts.

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
| 2 | 3+ step task → write plan in `docs/phases/` before touching code |
| 3 | Never mark `[x]` without proof the task actually works |
| 4 | Staff engineer standard — ask if they'd approve before shipping |
| 5 | Hacky fix detected → stop, find the elegant solution |
| 6 | Bug report → read logs, identify root cause, fix it, write lesson |
| 7 | Simplicity first — smallest change that solves the problem |
| 8 | No laziness — find root cause, not symptom |
| 9 | Only touch files the task actually requires |
| 10 | Document results and proof in the phase doc for each task |
| 11 | Pre-flight health check before planning a complex task |
| 12 | Run type-check after every file edit (language-appropriate tool) |
| 13 | `git diff` review before every commit — no secrets, no debug logs |
| 14 | Check dependency freshness monthly via `stack-auditor` skill |
| 15 | Performance budget enforced on every ship (stack-specific thresholds) |
| 16 | Track error budget by counting lessons written per phase |
| 17 | Significant architecture decisions → write an ADR entry |
| 18 | Keep the last 3 rollback commit hashes in `ADR.md` at all times |

---

## Token Efficiency Rules

*Run `/context-save` proactively — never wait for compaction to hit you.*

| Rule | How |
|------|-----|
| Grep before Read | Search for what you need, don't read whole files blindly |
| Subagents for exploration | Never scan the whole codebase in the main context |
| 70/85/95 pressure ladder | 70% used: tighten scope. 85% used: checkpoint now. 95% used: save and stop. |
| Batch reads | Read related files in one parallel shot |
| PRIORITY-WORK.md is truth | Always up to date; trust it after any compaction |
| current-context.json first | Restore from the compact resume brief before reading anything else |
| Agent tool for deep dives | Any 8+ step investigation → offload to an agent |
| TodoWrite for task state | Track progress in tasks, not conversation messages |

---

## Subagent Roster

Each agent has a definition in `agents/`. Invoke them via the Agent tool.

| Agent | When to Invoke | What It Produces |
|-------|---------------|-----------------|
| `planner` | Any 3+ step task before coding | Detailed plan with steps, files, rollback |
| `researcher` | Library choices, architecture decisions | Comparison table + recommendation |
| `backend-engineer` | API routes, services, middleware, queues | Working backend code with tests |
| `frontend-designer` | Components, pages, UI flows | Accessible, typed React/[framework] code |
| `db-architect` | Schema design, migrations | Reviewed migration with rollback SQL |
| `security-auditor` | Pre-ship, auth changes | OWASP audit report with blockers flagged |
| `devops-engineer` | CI/CD, Docker, deployment | Pipeline config, deploy scripts |
| `code-reviewer` | After any significant feature | Review report with issues ranked |
| `test-writer` | New features, bug fixes | Tests written before or alongside code |
| `performance-analyst` | Slow endpoints, large bundles | Profiling report + top 3 fixes |

**Parallel execution patterns:**
- Backend + Frontend work → `backend-engineer` ∥ `frontend-designer`
- Pre-ship audit → `security-auditor` ∥ `code-reviewer` ∥ `test-writer` (all three in parallel)
- Multiple unknowns → N × `researcher` in parallel, one question each
- Complex bug → `bug-hunter` skill + `researcher` in parallel

---

## Active Phase

[FILL — paste current phase checklist here every session]

```markdown
## Phase [N] — [Name]

**Goal**: [one sentence — what done looks like]
**Started**: [date]
**Deadline**: [date or "open"]

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Verification**: [how to prove this phase is complete]
**Rollback**: [how to undo if something breaks]
```

---

## Environment Variables

```env
# Required — app will not start without these
DATABASE_URL=
PORT=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=

# External services
[FILL]=

# Optional — graceful degradation without these
[FILL]=
```

---

## API Patterns

```json
{ "success": true,  "data": {},       "message": ""        }
{ "success": false, "error": "...",   "code": "ERROR_CODE" }
```

- **Routes**: `/api/v1/[resource]`
- **Auth**: `authenticate` middleware → attaches `req.user` (or framework equivalent)
- **Roles**: `requireRole('admin', 'editor')` — checked after auth
- **Errors**: throw `AppError(message, statusCode, errorCode)` — centralized handler responds

---

## Lessons Reference

> Always read `lessons.md` before starting work.
> After any correction: invoke `lessons-writer` skill.

---

## Notes / Decisions

[FILL — any project-specific rules or decisions that don't fit elsewhere]
