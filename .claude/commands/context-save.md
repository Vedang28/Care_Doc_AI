---
name: context-save
description: Save critical context before Claude's context window compacts. Updates PRIORITY-WORK.md with current state, decisions, next steps. Run proactively when conversations get long.
---

# /context-save — Compact Resume Save

Run this **before** context gets compacted, not after.

The goal is a narrow restart path: one JSON file, a few priority files, and one exact next action.

---

## When to Run

- conversation has gone on for 1+ hours
- about to pause a complex task
- approaching compaction
- before switching to a different task
- before ending a session

## Context Pressure Ladder

- **70% used** — stop broad reading and tighten scope
- **85% used** — run `/context-save` immediately
- **95% used** — save handoff and resume in a fresh session

---

## Step 1: Update memory/current-context.json

Write or refresh:

- `resumeBrief.currentState`
- `resumeBrief.nextAction`
- `resumeBrief.blockers`
- `resumeBrief.openFirst`
- `resumeBrief.checkpointPolicy`
- `resumeBrief.commandsToReuse`
- `session.contextWindow`
- `session.mustRemember`

Rules:

- `openFirst` must be 3 to 5 files max
- `nextAction` must be a single exact action
- `mustRemember` should only contain facts that are expensive to rediscover

---

## Step 2: Mirror Critical State in PRIORITY-WORK.md

Make sure these fields are current:

- Current task
- Status
- Blocked on
- Next immediate action
- Context that must not be lost

If `PRIORITY-WORK.md` and `memory/current-context.json` disagree, fix both now.

---

## Step 3: Save a Human Handoff

Update `memory/last-handoff.md` so a human can scan the current state quickly.

---

## Step 4: Print Recovery Instructions

```
CONTEXT SAVED
────────────────────────
Primary memory: memory/current-context.json
Next action:    [exact next action]
Open first:     [3-5 files max]

Recovery:
1. Run /session-start
2. Read memory/current-context.json first
3. Open only the listed priority files
────────────────────────
```

---

> Rule: Save a resume brief, not a diary.
> Rule: The next session should continue from one JSON file and a few priority files.
> Rule: 95% context used means save and stop, not "one more big tool call".
