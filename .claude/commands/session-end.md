---
name: session-end
description: End-of-session memory writer. Summarizes what was done, updates all memory files, commits everything. Run this before closing Claude Code — it makes the next session instant to resume.
---

# /session-end — Persist Memory Before Closing

Run this at the end of EVERY session, even short ones.

The goal is to make the next session start from one compact brief, not from a multi-file archaeology dig.

---

## Step 1: Update Compact Memory First

Write `memory/current-context.json` as the primary resume source.

It must contain:

- current state
- exact next action
- blockers
- 3 to 5 `openFirst` files
- commands worth reusing
- must-remember facts that would be expensive to rediscover
- context usage percentage if known
- checkpoint policy: warn at 70%, save at 85%, stop at 95%

Also update `memory/last-handoff.md` as the human-readable mirror.

Optional timer-based save:

```bash
node .claude/scripts/session-candle.js --minutes 45 --label "feature pass"
node .claude/scripts/session-candle.js --minutes 45 --context-usage 72 --warn-at 70 --save-at 85 --close-at 95
```

Immediate save:

```bash
node .claude/scripts/session-candle.js --minutes 0 --non-interactive --summary "..." --next "..."
node .claude/scripts/session-guard.js --context-usage 96 --auto-close --summary "..." --in-progress "..." --next "..."
```

---

## Step 2: Update PRIORITY-WORK.md

Fill every field, especially:

- Current task
- Status
- Blocked on
- Next immediate action
- Context that must not be lost

This file should agree with `memory/current-context.json`.
If using the JavaScript session tools, this sync now happens automatically.

---

## Step 3: Update memory/INDEX.md Active State

```markdown
## Active Project State

| Field | Value |
|-------|-------|
| Last session | [today's date] |
| Current phase | [exact phase name] |
| Last thing completed | [what was just finished] |
| Currently in progress | [what's half-done] |
| Blocked on | [blocker or "nothing"] |
| Next action | [exact first command next session] |
```

---

## Step 4: Append to memory/session-log.md

Add a short entry with:

- what was completed
- key decisions
- what remains
- exact first action for next session

Keep this brief. The detailed resume logic belongs in `memory/current-context.json`.

---

## Step 5: Update Long-Lived Memory Only If Needed

- `memory/project-brain.md` for new permanent project facts
- `memory/errors.md` for debugging lessons worth keeping
- `memory/decisions.md` for architecture decisions
- `lessons.md` for corrections that should become future rules

Recent decisions from structured saves are now appended automatically when provided.

---

## Step 6: Commit Everything

```bash
git add memory/ lessons.md PRIORITY-WORK.md
git commit -m "chore: session memory — $(date +%Y-%m-%d)"
git push origin main 2>/dev/null || true
```

---

## Step 7: Print Handoff Summary

```
SESSION SAVED
────────────────────────
Current state: [from memory/current-context.json]
Next action:   [from memory/current-context.json]
Open first:    [top files]

NEXT SESSION:
  1. Say: "resume" or run /session-start
  2. Read memory/current-context.json first
  3. Continue from the saved next action
────────────────────────
```

---

> Rule: Never close Claude Code without updating `memory/current-context.json`.
> Rule: The next session should not need to read more than a few files to continue.
> Rule: At **95% context used**, save and end the session instead of pushing through compaction.
