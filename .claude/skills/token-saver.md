---
name: token-saver
description: Context efficiency techniques. Use when context is getting long, before complex multi-file tasks, or when you want to maximize what Claude can accomplish per session.
---

# Token Saver Skill — Context Efficiency

Context is finite. These techniques maximize what you can accomplish per session.

---

## The Core Problem

Every file you read, every response you write, every tool call result = tokens consumed.
A long session exploring the codebase in the main context burns tokens that could be used for implementation.

---

## Technique 0: Resume From One File

**Start new sessions from `memory/current-context.json`, not from broad repo exploration.**

That file should contain:

- current state
- exact next action
- blockers
- `openFirst` files
- commands worth reusing

The target is simple: resume from one compact brief, then open only 3 to 5 files max.

---

## Technique 1: Grep Before Read

**Never read a file to find something you can grep for.**

```bash
# BAD — reads entire 500-line file to find one function
Read: src/services/authService.js

# GOOD — targeted search
Grep: "function refreshToken" in src/services/authService.js
# Then read only if you need the full context around it
```

Use case: finding function locations, checking if a pattern exists, finding where a variable is used.

---

## Technique 2: Subagents for Exploration

**Any codebase exploration task = subagent.**

```
# BAD — main context reads 20 files to understand the codebase
Read file A... Read file B... Read file C...

# GOOD — Explore agent reads and summarizes, returns only what matters
Agent: "Explore the auth system. Tell me: (1) how JWT is generated, (2) where refresh tokens are stored, (3) what middleware protects routes. Return a 10-line summary."
```

The agent consumes its own context. Main context gets the summary.

---

## Technique 3: Targeted File Reads

**When you must read files, read only what you need.**

```
# Read specific line range only
Read: src/services/authService.js, lines 45-90

# Or read just the structure first (grep for functions)
Grep: "^export (async )?function" in src/services/authService.js
# Then read only the functions you need to modify
```

---

## Technique 4: PRIORITY-WORK.md as External Memory

**Never hold facts in the conversation when they belong in a file.**

```
# BAD — stating facts in conversation
"Remember that the VPS IP is 1.2.3.4 and PM2 process is my-app"

# GOOD — in PRIORITY-WORK.md
"Context That Must Not Be Lost:
- VPS IP: 1.2.3.4
- PM2 process: my-app"
```

Run `/context-save` before things get compressed into the summary.

`memory/current-context.json` is the fast resume layer.
`PRIORITY-WORK.md` is the detailed task anchor.

---

## Technique 5: Parallel Agent Dispatch

**Independent tasks = parallel agents = half the main context usage.**

```
# SEQUENTIAL (expensive — each result floods main context)
→ Research option A
→ Read results
→ Research option B
→ Read results

# PARALLEL (efficient — one combined summary)
→ Agent A: research option A
→ Agent B: research option B
Both return. You read one combined result.
```

---

## Technique 6: Summarize Long Results

When a tool call returns a huge result, immediately summarize:

```
# A grep returns 200 lines of results
→ Don't keep all 200 lines in context
→ Extract the 5 relevant ones
→ Note: "Searched for X, found Y in these 3 files: [list]"
```

---

## Technique 7: TodoWrite for Task State

Use the built-in task tracker instead of keeping task state in conversation:

```
# BAD — restating task state in every message
"So far I've done step 1 and step 2, now I need to do step 3..."

# GOOD — task tool tracks state, mention only what's relevant
TodoWrite: mark "step 1" and "step 2" as complete
→ Reader sees current state without re-reading history
```

---

## Warning Signs — Context Getting Heavy

- You've been in a session for 2+ hours
- You've read more than 15 files
- You're starting to re-read files you already read
- Response generation is noticeably slower

**When you see these: run `/context-save` immediately.**

## Pressure Ladder

- **70% used**: stop broad exploration, batch reads, and lean harder on subagents
- **85% used**: checkpoint immediately with `/context-save` or `node .claude/scripts/session-guard.js --context-usage 85 --summary "..." --in-progress "..." --next "..."`
- **95% used**: save handoff and end the session so the next one starts clean

---

## Context Budget Guide

| Task Type | Context Required | Strategy |
|-----------|-----------------|----------|
| Single file edit | Low | Direct, no optimization needed |
| Feature implementation | Medium | Subagents for research + testing |
| Full codebase exploration | High | Multiple parallel Explore agents |
| Multi-day project | Very High | `/context-save` each session |
| Debugging complex bug | High | `bug-hunter` agent + context-save checkpoints |
