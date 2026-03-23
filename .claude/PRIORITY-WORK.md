# PRIORITY WORK — Context Compaction Anchor

> This file is re-read at the start of every session and after every context compaction.
> It is the single most important file for resuming work. Keep it ruthlessly up to date.
> Rule: If this file is stale, everything else is uncertain.
> Fast path: read `memory/current-context.json` first, then use this file for deeper detail.

---

## Current Priority

**Phase**: focus-session
**Current task**: Preparing commit and push to GitHub
**Status**: in-progress
**Blocked on**: nothing
**Next immediate action**: Review git diff, commit the claude-forge upgrade, and push main

---

## What Was Just Completed

- Upgraded memory system and added orchestration tooling

---

## Context That Must Not Be Lost

- PRIORITY-WORK now syncs automatically from session saves
- decisions.md auto-appends fresh decisions from structured saves
- orchestrate + project-scan are now first-class workflow tools
- Context policy: warn 70% / save 85% / stop 95%

---

## Recent Decisions Made

- 2026-03-22: Added project-scan and task-orchestrator JavaScript helpers
- 2026-03-22: Structured session saves now sync PRIORITY-WORK and append decisions automatically

---

## Do Not Touch Until Current Task Is Done

- none

---

## Open Questions / Blockers

- none

---

## Session Log

```
[2026-03-22] — Preparing commit and push to GitHub. Next: Review git diff, commit the claude-forge upgrade, and push main
[2026-03-22] — Reviewing docs and agent/skill follow-ups. Next: Summarize the new memory workflow and propose new agents and skills
```

---

> When context compaction happens, Claude re-reads this file first.
> This file is the anchor that prevents losing progress between sessions.
> Update it before ending ANY work session — even a short one.
