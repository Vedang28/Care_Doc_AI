---
name: session-start
description: Restore full context at the start of a new session. Reads memory files, announces current state, runs health check. Say "resume" or run /session-start to instantly pick up where you left off.
---

# /session-start — Restore Context Fast

Run this at the start of any session, OR just say **"resume"** — Claude will run this automatically.

The goal is to continue from a compact brief, not to rediscover the codebase.

---

## Step 1: Read Memory in Minimal Order

```
1. memory/current-context.json  — primary resume brief
2. PRIORITY-WORK.md            — exact current task and next action
3. memory/INDEX.md             — active state anchor
4. Only the files listed in resumeBrief.openFirst
```

Do NOT scan the whole repository.
Do NOT read `memory/decisions.md`, `memory/patterns.md`, or `memory/errors.md` unless the current task requires them.

---

## Step 2: Announce Current State

Summarize the compact memory first:

```
CONTEXT RESTORED
────────────────────────
Current state: [resumeBrief.currentState]
Next action:   [resumeBrief.nextAction]
Context:       [N% used / M% left, if recorded]
Policy:        [warn/save/stop thresholds]
Blockers:      [resumeBrief.blockers or "none"]

Open first:
- [file 1]
- [file 2]
- [file 3]
────────────────────────
```

Then continue directly from the saved next action.
If the last checkpoint says to stop and resume fresh, continue in the new session without reopening broad repo context.

---

## Step 3: Optional Health Check

Run only if the next action depends on repo or runtime health:

```bash
git status --short
git branch --show-current
```

If app status matters for the next task, then run `/doctor`.
Otherwise skip the health check and start work.

---

## Step 4: Load Relevant Memory On Demand

- About to debug? → Read `memory/errors.md`
- About to write code in an established area? → Read `memory/patterns.md`
- About to make an architecture decision? → Read `memory/decisions.md`

If `memory/current-context.json` is good, most sessions should not need anything else.

---

## Trigger Words

Claude should run this automatically when the user says any of:
- "resume"
- "let's continue"
- "where were we"
- "pick up from last time"
- "what were we working on"
- "start the session"

---

> Rule: Never start work without reading memory first. 2 minutes of reading saves 20 minutes of re-discovery.
> Rule: `memory/current-context.json` is the first file, not an optional file.
