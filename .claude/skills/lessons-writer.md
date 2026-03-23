---
name: lessons-writer
description: Write a structured lesson after any mistake, correction, or bug. Use immediately after every human correction or unexpected bug. Keeps lessons.md sharp and actionable.
---

# Lessons Writer Skill

Trigger: After ANY correction from a human, or any bug that took more than 5 minutes to find.

## When to Write a Lesson
- Human corrects a mistake Claude made
- A bug takes more than 5 minutes to debug
- A task has to be redone because it was wrong
- A plan was abandoned mid-execution
- A deploy broke production
- The same type of issue appears twice

## Lesson Format
```markdown
### [YYYY-MM-DD] — [Short descriptive title]
**What happened**: [One sentence — the symptom]
**Why it happened**: [Root cause — not the symptom]
**What I tried first (wrong)**: [False lead if any]
**Rule**: [One actionable sentence that prevents this forever]
**Severity**: 🔴 Critical / 🟡 Important / 🟢 Minor
```

## Writing a Good Lesson

BAD lesson (too vague):
```
### 2024-01-15 — Middleware not applied
Root cause: forgot to add it
Rule: remember to add middleware
```

GOOD lesson (specific and actionable):
```
### 2024-01-15 — authLimiter defined but never wired to routes
**What happened**: Rate limiter was created in rateLimiter.js but auth endpoints had no protection despite the limiter existing.
**Why it happened**: Created the middleware in one file, never checked which routes needed it, never imported it into authRoutes.js.
**Rule**: After creating ANY middleware, immediately grep for every route file that handles the relevant endpoints and apply the middleware in the same commit. Never create middleware without applying it.
**Severity**: 🔴 Critical
```

## After Writing — Do This
1. Add the lesson to `.claude/lessons.md` at the TOP (newest first)
2. Ask: does this lesson imply a rule that should go in CLAUDE.md permanently?
3. If yes — add the rule to the relevant section of CLAUDE.md
4. If the same lesson type appears 3+ times — write a CLAUDE.md rule and delete the duplicate lessons

## Lesson Quality Check
Before saving, verify:
- [ ] The rule is specific enough that Claude could follow it mechanically
- [ ] The rule starts with an action verb ("After...", "Always...", "Never...", "Before...")
- [ ] The root cause is the ACTUAL cause, not a symptom
- [ ] It would prevent the exact same mistake from happening again

> Rule: Vague lessons are useless. If the rule can't be followed mechanically, rewrite it.
> Rule: Lessons should make Claude slightly smarter after every mistake. Track the improvement.
