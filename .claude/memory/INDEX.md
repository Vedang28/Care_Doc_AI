# Memory Index — Always Read at Session Start

> Claude: read this file at the start of EVERY session before doing anything else.
> It points to what matters. Don't read all memory files — read what's relevant.

---

## Load Order (each session start)

1. **`current-context.json`** — compact resume brief
2. **`PRIORITY-WORK.md`** — exact current task and next action
3. **This file** (`INDEX.md`) — orient yourself
4. **Only the files listed in `resumeBrief.openFirst`**

Read `session-log.md`, `project-brain.md`, `decisions.md`, `patterns.md`, and `errors.md` only when relevant to the current task.

---

## Active Project State

| Field | Value |
|-------|-------|
| Last session | 2026-03-23 |
| Current phase | Phase 4 complete |
| Last thing completed | Phase 4 — AI Sophistication & SaaS Scale (all 20 chunks) |
| Currently in progress | nothing |
| Blocked on | DB migrations for 7 new Phase 4 models |
| Next action | Run `prisma migrate deploy`, set real env vars, start Phase 5 |

---

## Context Policy

- Warn at 70% used
- Save at 85% used
- Stop and resume fresh at 95% used

---

## Memory Files

| File | Contents | When to read |
|------|----------|-------------|
| `current-context.json` | Compact machine-readable resume brief | First file every session |
| `session-log.md` | Rolling log of session summaries | When you need recent history |
| `project-brain.md` | Persistent knowledge about this specific project | When permanent facts matter |
| `decisions.md` | Architecture decisions + reasoning | When touching affected areas |
| `patterns.md` | Discovered code patterns in this codebase | When writing new code |
| `errors.md` | Past errors + how they were solved | When debugging |
| `checkpoints.ndjson` | Machine-readable save history | For tools, hooks, and wrappers |

---

## Quick Recovery Protocol

```
1. Read memory/current-context.json
2. Read PRIORITY-WORK.md
3. Open only the listed openFirst files
4. If the last save ended at >= 95% context used, continue in a fresh session
5. Announce: "Resuming from [state]. Next: [action]."
```

---

> This file is the entry point to Claude's persistent memory for this project.
> It is updated automatically whenever a structured checkpoint is saved.
