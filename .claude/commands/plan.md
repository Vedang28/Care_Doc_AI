---
name: plan
description: Think and write a full plan before touching any code. Required for any task with 3+ steps or architectural decisions. Launches planner agent for complex tasks.
---

# /plan — Think Before Coding

**Rule**: A plan that takes 5 minutes to write saves 2 hours of wrong code.

## When to Use
- Any task with 3+ steps
- Any architectural decision
- Any task touching 3+ files
- Anything involving DB schema, auth, or deployment

For simple 1–2 step tasks (fix a typo, rename a variable): skip this and just do it.

---

## Step 1: Read Context

```
1. CLAUDE.md         — stack, principles, API patterns
2. lessons.md        — mistakes to avoid TODAY
3. PRIORITY-WORK.md  — confirm you're working on the right thing
4. docs/phases/phase-[N].md — if working on a phased project
```

If this is a brownfield repo or the workflow is unclear:

```bash
node .claude/scripts/project-scan.js
/orchestrate
```

---

## Step 2: Pre-flight Check

```bash
git status --short
git branch --show-current
```

If git is not clean: stop. Ask whether to stash or commit first.

---

## Step 3: Understand the Task

Answer these in writing before planning:

```
TASK: [what exactly needs to be done — one sentence]
FILES TO TOUCH: [list]
WHAT COULD GO WRONG: [top 2 risks]
SUCCESS LOOKS LIKE: [observable proof]
COMPLEXITY: [simple / medium / complex]
```

---

## Step 4: Subagent Strategy

**For complex tasks** (5+ steps, multiple files, architectural decisions):
→ Launch `planner` agent to write the plan document.

If the workflow itself is unclear:
→ Launch `workflow-orchestrator` first, then `planner`.

**For parallel workstreams:**
→ Identify what can be done in parallel and assign to agents.

```
Thread A: [backend-engineer — what specifically]
Thread B: [frontend-designer — what specifically]
Main:     synthesize results, handle integration
```

---

## Step 5: Write the Plan

For **phased projects**: write to `docs/phases/phase-[N].md`
For **feature work**: write to `docs/plans/[feature-name].md`
For **quick fixes**: write inline below before proceeding

```markdown
## Plan: [Task Name]

**Date**: [YYYY-MM-DD]
**Goal**: [one sentence — what done looks like]
**Complexity**: [simple / medium / complex]

### Files to Touch
- `path/to/file.js` — [what changes and why]
- `path/to/test.js` — [what tests to write]

### Steps
- [ ] Step 1: [exact action — unambiguous]
- [ ] Step 2: [exact action]
- [ ] Step 3: [exact action]

### Parallel Opportunities
- [What can be done simultaneously?]

### Verification
- [ ] [How to prove step X works]
- [ ] [Integration test / curl command / visual check]

### Rollback
- [How to undo this if it breaks]

### Risks
- [Risk]: [mitigation]
```

---

## Step 6: Get Approval

Print the plan. **Wait for human confirmation before writing any code.**

If the human asks to proceed: run `/execute`.

---

> Rule: Never start writing code if the task has 3+ steps and no plan exists.
> Rule: If mid-task you realize the plan is wrong — stop, update the plan, get re-approval.
