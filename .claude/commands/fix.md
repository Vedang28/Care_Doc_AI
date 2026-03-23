---
name: fix
description: Autonomous bug investigation and fix. Read logs, identify root cause, fix, verify, write lesson. No hand-holding required from the user.
---

# /fix — Autonomous Bug Investigation

Do not ask the user what's wrong beyond what they've already described.
Read logs. Find root cause. Fix it. Verify. Write a lesson.

---

## Step 1: Gather Evidence

```bash
# Application logs (adapt to your stack)
cat logs/error.log 2>/dev/null | tail -50
cat logs/combined.log 2>/dev/null | tail -50

# VPS logs (if deployed)
ssh $VPS_USER@$VPS_IP "pm2 logs $PM2_PROCESS --lines 100 --nostream" 2>/dev/null

# Recent changes (what changed that could cause this?)
git log --oneline -10
git diff HEAD~3 HEAD -- src/ 2>&1 | head -60

# Type errors
npx tsc --noEmit 2>&1 | head -30

# Test output
npm test 2>&1 | tail -40
```

---

## Step 2: Classify the Error

Use `error-analyzer` skill to identify the category before diving in.

Common categories: connection, auth, validation, type, import, schema/migration, environment, async, memory.

---

## Step 3: Write Root Cause Analysis (Before Touching Code)

```
SYMPTOM: [exact error message + where it appears]
STACK TRACE POINTS TO: [file:line]
ERROR CATEGORY: [from error-analyzer]

ROOT CAUSE: [why it's actually happening — not the symptom]
NOT THE CAUSE: [what I ruled out and why]
FIX: [exact change to make — file and line]
VERIFICATION: [how to prove it's fixed]
```

Do not write code until root cause is confirmed. Read more logs if unclear.

---

## Step 4: Check lessons.md

```bash
grep -i "[error type keyword]" .claude/lessons.md | head -10
```

Has this type of bug appeared before? Apply the existing lesson. If new: it becomes a lesson after fixing.

---

## Step 5: Fix It

- Make the **minimal change** that fixes the root cause
- Do NOT fix other things noticed while in the file — open a separate task
- Only touch files that directly need changing

```bash
# Type-check after fix
npx tsc --noEmit 2>&1

# Run relevant tests
npm test -- --testPathPattern=[affected feature] 2>&1
```

---

## Step 6: Verify

```bash
# Show the error is gone — reproduce the original scenario
# Show the feature works — curl the endpoint or run the test

# Local
curl -s http://localhost:$PORT/api/v1/health
npm test 2>&1 | tail -10

# VPS (if bug was on production)
ssh $VPS_USER@$VPS_IP "pm2 logs $PM2_PROCESS --lines 10 --nostream"
curl -s http://$VPS_IP:$PORT/api/v1/health
```

Proof required: show the error is gone AND the feature works correctly.

---

## Step 7: Write a Lesson

Immediately add to `lessons.md` (use `lessons-writer` skill for format):

```markdown
### [DATE] — [Short bug title]
**What happened**: [symptom]
**Why it happened**: [root cause]
**What I tried first (wrong)**: [false lead, if any]
**Rule**: [one sentence that prevents this forever]
**Severity**: 🔴/🟡/🟢
```

---

## Step 8: Ship the Fix

Even small bug fixes go through `/ship`. No manual commits outside the pipeline.

---

> Rule: Never apply a band-aid. If the fix feels temporary, it is. Find the real cause.
> Rule: If the same bug appears twice, the lesson wasn't specific enough. Rewrite it.
> Rule: "I don't know why this works now" is not an acceptable conclusion. Keep digging.
