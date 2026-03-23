---
name: execute
description: Execute an approved plan. Orchestrates backend-engineer, frontend-designer, test-writer, and other agents in parallel. Never run without an approved plan from /plan.
---

# /execute — Run the Approved Plan

**Never run this without a completed and approved `/plan` first.**

The difference between `/execute` and just coding: this command uses agents strategically,
verifies after each step, and leaves a clean commit trail.

---

## Step 1: Re-read the Plan

```
Read: docs/plans/[feature].md  OR  docs/phases/phase-[N].md
Confirm: plan is approved (human said "go" or "approved")
```

If no approved plan exists: run `/plan` first.

---

## Step 2: Pre-flight Check

```bash
git status --short
# Nothing uncommitted that shouldn't be here
```

---

## Step 3: Identify Parallel Workstreams

Look at the plan steps. Split into parallel tracks where safe:

```
Can backend + frontend be done simultaneously? → Yes → launch both agents in parallel
Can tests be written alongside implementation? → Often yes
Can DB migration + service code be done together? → Yes with coordination
```

**Example parallel dispatch:**
```
Launch simultaneously:
  Agent A (backend-engineer): implement the API route + service
  Agent B (test-writer): write tests for the same feature
  Agent C (db-architect): write the migration [if schema changes needed]
```

If context pressure is already high:
- launch `context-sentinel`
- checkpoint before opening more files

---

## Step 4: Execute Each Task

For **each task in the plan checklist**:

### 4a. Implement
- Touch **only files listed in the plan**
- Follow patterns in CLAUDE.md (response shape, error handling, etc.)
- No `console.log` in production code — use project logger
- No `any` types if TypeScript
- No hardcoded secrets

### 4b. Type-check after every file (if applicable)
```bash
# TypeScript
npx tsc --noEmit 2>&1 | head -20

# Python
mypy src/ 2>&1 | head -20

# Go
go build ./... 2>&1
```

If check fails → **fix before moving to next file**.

### 4c. Prove the task works
Required before marking `[x]`:
- API endpoint → curl it and show the response
- UI change → describe exactly what changed
- DB change → query to prove data is correct
- Service logic → run the relevant test

### 4d. Mark complete with proof
```markdown
- [x] Task name — verified: curl returned {"success":true}, test passing
```

### 4e. Write a micro-lesson if anything surprised you
Even if nothing went wrong — capture what you learned.

---

## Step 5: Post-Execution Checks

After all tasks are complete:

```bash
# Run the full test suite
npm test 2>&1 | tail -20   # or: pytest / go test ./...

# Type-check everything
npx tsc --noEmit 2>&1

# Verify main feature end-to-end
curl -s http://localhost:[PORT]/api/v1/[new-endpoint]
```

---

## Step 6: Update Docs

```bash
# Mark phase/plan tasks complete
# Update PRIORITY-WORK.md with what was done and what's next
```

---

## Step 7: Hand off to /review

Once all tasks are verified:
1. run `/review`
2. generate `human-review-handoff`
3. then run `/ship`

---

> Rule: One task at a time. Verify each one. Never batch unverified changes.
> Rule: If execution reveals the plan was wrong — stop, update the plan, re-execute.
