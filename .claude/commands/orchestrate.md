---
name: orchestrate
description: Task router for serious work. Uses project scan + task orchestration to decide whether to checkpoint, plan, research, execute in parallel, run review loops, or ship.
---

# /orchestrate — Route The Work Before Doing The Work

Use this when the task is fuzzy, brownfield, multi-agent, or likely to spiral.

The goal is simple: decide the right workflow before burning context or touching code.

---

## Step 1: Scan The Project

```bash
node .claude/scripts/project-scan.js
```

Capture:
- stack and package manager
- key directories
- likely test/build/dev commands
- whether this is a brownfield repo

If this is an existing project, load `brownfield-onboarding`.

---

## Step 2: Check Context Pressure

```bash
node .claude/scripts/task-orchestrator.js --task "[task]" --context-usage 72 --needs-backend --needs-testing
```

If the result says:
- checkpoint now → run `/context-save`
- save and stop → run `session-guard` and continue in a fresh session

Do not start broad exploration if context is already hot.

---

## Step 3: Let The Router Pick The Workflow

The orchestrator should decide:
- whether `/plan` is mandatory
- which agents can run in parallel
- whether research is needed first
- whether the review loop should include human handoff
- whether brownfield analysis must happen before implementation

Default expectations:
- Feature work → `planner` → implementation agents → tests → review loop
- Bug fix → `error-analyzer` + `bug-hunter` → regression test → targeted fix → review
- Brownfield repo → project scan first, then plan

---

## Step 4: Execute The Right Path

Common outputs:

### Feature Work
1. `/plan`
2. `/execute`
3. `/test`
4. `/review`
5. `human-review-handoff`
6. `/ship`

### Bug Work
1. `error-analyzer`
2. `bug-hunter`
3. `test-writer`
4. targeted fix
5. `/review`

### Brownfield Work
1. `project-scan.js`
2. `brownfield-onboarding`
3. `/plan`
4. `/execute`

---

## Step 5: Keep Context Lean During Execution

- If context crosses 70% used: tighten scope
- At 85% used: checkpoint immediately
- At 95% used: save and stop

The router is not a one-time step. Re-run it if the task shape changes.

---

> Rule: Workflow drift is real. Re-route the task when facts change.
> Rule: The fastest path is often "scan → route → plan", not "open 14 files and improvise."
