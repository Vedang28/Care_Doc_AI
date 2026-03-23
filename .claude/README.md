<div align="center">

<br/>

```
  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
 ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
 ██║     ██║     ███████║██║   ██║██║  ██║█████╗      █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
 ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝      ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
 ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗    ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**Drop one folder into any project. Claude becomes a senior engineering team.**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-8A2BE2?style=for-the-badge)](https://claude.ai/code)
[![Stacks](https://img.shields.io/badge/6_Stacks-Supported-00C851?style=for-the-badge)](#stack-templates)
[![Commands](https://img.shields.io/badge/16_Commands-Built_In-FF6B35?style=for-the-badge)](#commands)
[![Agents](https://img.shields.io/badge/12_Agents-Parallel-E91E63?style=for-the-badge)](#agents)
[![Skills](https://img.shields.io/badge/10_Skills-Built_In-00A0E3?style=for-the-badge)](#skills)

<br/>

[**Get Started →**](#install-in-one-line) · [**See What's Inside →**](#whats-inside) · [**View Examples →**](examples/) · [**Contributing →**](CONTRIBUTING.md)

<br/>

</div>

---

## The problem with Claude Code out of the box

Claude Code is powerful — but undirected. It dives into code without planning. It forgets what happened last session. It doesn't parallelize work. It makes the same mistakes twice.

**claude-forge fixes this.** It's a `.claude/` configuration system that gives Claude a structured engineering process — planning, parallel agents, persistent memory, quality gates, and a self-improvement loop that gets better with every mistake.

---

## Install in one line

```bash
curl -fsSL https://raw.githubusercontent.com/Aadi262/claude-forge/main/install.sh | bash
```

Then open your project in Claude Code and run `/setup`. Done in 2 minutes.

---

## The difference

**Without claude-forge:**
```
You: "Add user authentication"
Claude: [immediately starts writing code, no plan, no tests, no structure]
         [next session: "What were we building again?"]
         [makes the same JWT mistake you corrected 3 sessions ago]
```

**With claude-forge:**
```
You: "Add user authentication"
Claude: [reads memory/current-context.json — resumes in seconds]
         [runs /plan — writes a full spec before touching code]
         [dispatches backend-engineer ∥ test-writer in parallel]
         [runs /review — security-auditor + code-reviewer in parallel]
         [runs /ship — type check, tests, audit, then deploys]
         [writes compact session memory — next session starts from one brief]
```

---

## What's Inside

```
.claude/
├── CLAUDE.md               ← Project brain: principles, rules, stack, patterns
├── PRIORITY-WORK.md        ← Context anchor: survives compaction, always current
├── ADR.md                  ← Architecture decisions + rollback hashes
├── lessons.md              ← Self-improvement log: every mistake becomes a rule
│
├── commands/               ← 16 slash commands (auto-loaded by Claude Code)
│   ├── setup.md            ← Project wizard: fills CLAUDE.md, scaffolds structure
│   ├── orchestrate.md      ← Route task flow before implementation starts
│   ├── plan.md             ← Writes a full plan before any code is touched
│   ├── execute.md          ← Runs the plan using parallel specialist agents
│   ├── ship.md             ← Audit → test → commit → push → deploy → verify
│   ├── fix.md              ← Autonomous bug hunt: logs → root cause → fix → lesson
│   ├── review.md           ← Quality gate: code-reviewer ∥ security-auditor
│   ├── test.md             ← Type check + unit + integration + build
│   ├── scaffold.md         ← Generate auth/crud/payment/upload boilerplate
│   ├── migrate.md          ← Safe DB migration: create / run / rollback
│   ├── security.md         ← OWASP Top 10 + dependency audit
│   ├── perf.md             ← Profile endpoints + bundle analysis
│   ├── doctor.md           ← Full system health diagnostic
│   └── context-save.md     ← Save state before compaction
│
├── agents/                 ← 12 specialist subagents for parallel execution
├── skills/                 ← 10 reusable procedures invoked by commands
├── templates/              ← 6 stack configs + 5 feature scaffolds
└── memory/                 ← Persistent project memory across sessions
    ├── current-context.json← Compact resume brief: read this first next session
    ├── INDEX.md            ← Active state: what's in progress, what's next
    ├── checkpoints.ndjson  ← Machine-readable checkpoint history for hooks/wrappers
    ├── last-handoff.md     ← Human-readable last session summary
    ├── session-log.md      ← Rolling log: last 10 sessions
    ├── project-brain.md    ← Evergreen facts about this specific project
    ├── decisions.md        ← Architecture decisions with reasoning
    ├── patterns.md         ← Discovered patterns unique to this codebase
    └── errors.md           ← Past bugs + how they were solved
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `/setup` | One-time project wizard — detects stack, fills CLAUDE.md, scaffolds folders |
| `/orchestrate` | Route a task before starting — scan repo, choose agents, enforce review loops |
| `/plan [task]` | Writes a full implementation plan before code is touched |
| `/execute` | Runs the approved plan using parallel specialist agents |
| `/test` | Type check → unit tests → integration → build |
| `/review` | Launches `code-reviewer` + `security-auditor` in parallel |
| `/ship` | The only way code leaves the machine: audit → commit → push → deploy |
| `/fix [bug]` | Reads logs, identifies root cause, fixes it, writes a lesson |
| `/scaffold [feature]` | Generates production boilerplate (auth, crud, payments, upload, notifications) |
| `/migrate [action]` | Safe DB migrations with automatic rollback on failure |
| `/security` | OWASP Top 10 scan + dependency audit |
| `/perf` | Profile slow endpoints + analyze bundle size |
| `/doctor` | Full system health check (DB, Redis, deps, env vars) |
| `/context-save` | Persist state to memory before context compaction |

**Session memory commands:**

| Command | What it does |
|---------|-------------|
| `/session-end` | Write memory, commit, print handoff — run before every close |
| `/session-start` | Restore full context — or just say **"resume"** |

---

## Agents

12 specialists that run **in parallel**:

| Agent | What it does |
|-------|-------------|
| `planner` | Writes atomic, executable plans — never writes code |
| `workflow-orchestrator` | Decides the right workflow, review loop, and agent mix before implementation |
| `researcher` | Evaluates libraries and patterns, returns ranked recommendations |
| `backend-engineer` | Builds API routes, services, middleware |
| `frontend-designer` | Builds accessible, typed React/[framework] components |
| `db-architect` | Designs schemas, writes reviewed migrations with rollback SQL |
| `security-auditor` | OWASP Top 10 scan, secrets check, auth review |
| `devops-engineer` | CI/CD pipelines, Docker, deployment (VPS / Vercel / Railway / Fly.io) |
| `code-reviewer` | Quality, patterns, edge cases — ranked issue report |
| `test-writer` | TDD cycle: unit + integration + E2E tests |
| `performance-analyst` | Profiles bottlenecks, returns top-3 fixes ranked by impact |
| `context-sentinel` | Protects the session: checkpoints at pressure thresholds and forces clean handoffs |

**Parallel dispatch patterns:**
```
Pre-ship audit:    security-auditor ∥ code-reviewer ∥ test-writer
Feature build:     backend-engineer ∥ frontend-designer ∥ db-architect
Research:          researcher × N (one question per agent)
Complex bug:       bug-hunter skill + researcher in parallel
```

---

## Skills

Key reusable skills:

| Skill | What it does |
|-------|--------------|
| `token-saver` | Keeps context lean and checkpoints before compaction |
| `brownfield-onboarding` | Scans an existing repo and captures safe entry constraints |
| `human-review-handoff` | Produces a compact review packet before ship |
| `bug-hunter` | Deep bug investigation and root-cause tracing |
| `error-analyzer` | Classifies errors and narrows the search area |
| `tdd-guide` | Enforces test-first loops for features and bug fixes |
| `api-design` | Keeps REST APIs predictable and consistent |
| `stack-auditor` | Full dependency, security, and quality audit |
| `lessons-writer` | Turns mistakes into reusable mechanical rules |
| `vps-deploy` | Multi-platform deployment workflow with rollback |

---

## The Workflow

Every task flows through the same pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLAUDE-FORGE PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /plan ──────────────────────────────────────── think before coding │
│    └─→  planner agent ─────────────────────── write the spec first  │
│           └─→  /execute ──────────────────── parallel agents build  │
│                  └─→  /test ──────────────── verify it works        │
│                         └─→  /review ─────── quality gate           │
│                                └─→  /ship ── only path to prod      │
│                                                                     │
│  Bug report → /fix → logs → root cause → fix → lesson → /ship      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 6 Core Principles

These are hardcoded into every command and agent:

| # | Principle | What it means in practice |
|---|-----------|--------------------------|
| 1 | **Plan before code** | `/plan` is mandatory for any task with 3+ steps |
| 2 | **Parallel specialists** | Never do in series what can be done in parallel |
| 3 | **Self-improvement loop** | Every correction → lesson → rule that prevents it forever |
| 4 | **Proof before done** | No `[x]` without a curl response, test output, or screenshot |
| 5 | **Demand elegance** | `/review` asks: *"Would a staff engineer approve this?"* |
| 6 | **Autonomous fixes** | Bug report → Claude reads logs, finds root cause, ships fix alone |

---

## Session Memory

The most underrated part of claude-forge. Claude **remembers across sessions**.

```bash
# End of session
/session-end
# → Writes memory/current-context.json (compact resume brief)
# → Updates PRIORITY-WORK.md (exact next action)
# → Updates memory/session-log.md (longer trail)
# → Commits memory to git

# Next session, just say:
"resume"
# → Claude reads the compact brief first
# → Opens only the listed priority files
# → "Resuming from [state]. Next: [action]."
```

Memory files that grow over time:
- **`current-context.json`** — compact machine-readable resume brief
- **`checkpoints.ndjson`** — rolling machine-readable save history
- **`session-log.md`** — rolling log of sessions (newest first)
- **`project-brain.md`** — permanent facts about this codebase
- **`decisions.md`** — architecture decisions with reasoning
- **`patterns.md`** — patterns unique to this project
- **`errors.md`** — every bug, root cause, and fix
- **`lessons.md`** — every mistake, as a rule that prevents it forever

Context pressure policy:
- **70% used** — stop broad exploration, grep first, offload more to agents
- **85% used** — run `/context-save` or a session guard checkpoint immediately
- **95% used** — save handoff and continue in a fresh session

Optional timer-based save:

```bash
node .claude/scripts/session-candle.js --minutes 45 --label "auth pass"
node .claude/scripts/session-candle.js --minutes 45 --context-usage 72 --warn-at 70 --save-at 85 --close-at 95
node .claude/scripts/session-candle.js --show-latest
node .claude/scripts/session-guard.js --context-usage 96 --auto-close --summary "checkpointed auth pass" --in-progress "refresh token rotation" --next "resume in auth service"
node .claude/scripts/project-scan.js
node .claude/scripts/task-orchestrator.js --task "add auth" --needs-backend --needs-testing --context-usage 58
```

Import from JavaScript when you want a tool, hook, or wrapper to save state without shelling out:

```js
const {
  loadCurrentContext,
  saveClaudeSession,
  startSessionCandle,
} = require(".claude/scripts/session-candle");
```

Other JS helpers:

```js
const { scanProject } = require(".claude/scripts/project-scan");
const { buildWorkflow } = require(".claude/scripts/task-orchestrator");
```

---

## Self-Improvement Loop

claude-forge gets **smarter the longer you use it**:

```
You correct Claude on something
    → lessons-writer skill runs immediately
    → structured lesson written to lessons.md
    → lesson includes: what happened, root cause, mechanical rule
    → if same lesson type appears 3×: promoted to permanent CLAUDE.md rule
    → Claude never makes that exact mistake again
```

Over time, `lessons.md` becomes the institutional memory of every mistake ever made in the project. The error rate drops measurably.

---

## Stack Templates

`/setup` configures everything for your stack:

| Template | Stack |
|----------|-------|
| `node-express` | Node.js 20 + Express + React/Vite + Prisma + Redis + BullMQ |
| `nextjs-fullstack` | Next.js 14 App Router + Prisma + Tailwind + NextAuth |
| `python-fastapi` | Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL + Celery |
| `t3-stack` | Next.js + tRPC + Prisma + Tailwind + NextAuth |
| `react-vite-spa` | React 18 + Vite + TanStack Query + Zustand (frontend-only) |
| `go-fiber` | Go + Fiber + GORM + PostgreSQL + Redis |
| `custom` | Describe your stack → Claude fills in CLAUDE.md from your description |

---

## Feature Scaffolds

`/scaffold [feature]` generates production-ready boilerplate:

| Feature | What's generated |
|---------|-----------------|
| `auth` | Register · Login · JWT refresh · Logout · Forgot-password · Role guards |
| `crud [resource]` | Paginated list · Get · Create · Update · Soft-delete with ownership checks |
| `payment` | Stripe checkout · Webhook handler (signature verified) · Billing portal |
| `upload` | File upload · Type/size validation · Local + S3 storage abstraction |
| `notification` | Email (Resend/SendGrid) · In-app notifications · SSE real-time push |

---

## Quick Start

```bash
# 1. Install into your project
curl -fsSL https://raw.githubusercontent.com/Aadi262/claude-forge/main/install.sh | bash

# 2. Open in Claude Code
claude

# 3. Run the setup wizard
/setup

# 4. Start building
/plan build a user authentication system
```

`/setup` detects your existing stack (if any), asks 6 questions, fills in `CLAUDE.md`, scaffolds your folder structure, and verifies your environment. About 2 minutes.

---

## Installation Options

**One-line (recommended):**
```bash
curl -fsSL https://raw.githubusercontent.com/Aadi262/claude-forge/main/install.sh | bash
```

**Custom target directory:**
```bash
curl -fsSL https://raw.githubusercontent.com/Aadi262/claude-forge/main/install.sh | bash -s -- .claude
```

**Git clone:**
```bash
git clone --depth=1 https://github.com/Aadi262/claude-forge.git
cp -r claude-forge/. your-project/.claude/
rm -rf claude-forge
```

---

## Updating

```bash
# Re-run the installer — overwrites only forge files
curl -fsSL https://raw.githubusercontent.com/Aadi262/claude-forge/main/install.sh | bash
```

Your `CLAUDE.md`, `lessons.md`, `PRIORITY-WORK.md`, `ADR.md`, and everything in `memory/` are preserved.

---

## Examples

See [`examples/`](examples/) for:
- [`CLAUDE.filled.md`](examples/CLAUDE.filled.md) — fully configured CLAUDE.md for a Node.js + Express project
- More examples coming soon

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

PRs welcome — new stack templates, agents, and skills especially.

---

## License

MIT — use it, fork it, build on it.

---

<div align="center">

Built by [Aditya Tiwari](https://github.com/Aadi262)

**If this saved you time, star it ⭐ — it helps others find it.**

</div>
