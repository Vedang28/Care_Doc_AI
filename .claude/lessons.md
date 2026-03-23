# Lessons — Self-Improvement Log

> This file is the memory of every mistake made and fixed in this project.
> READ THIS BEFORE STARTING ANY SESSION.
> WRITE TO THIS AFTER EVERY CORRECTION.

---

## Format

Each lesson follows this structure:

```
### [YYYY-MM-DD] — Short title of what went wrong
**What happened**: One sentence describing the mistake.
**Why it happened**: Root cause, not symptom.
**Rule**: One actionable rule that prevents this forever.
```

---

## Lessons

<!-- New lessons go here, newest first -->

### [TEMPLATE] — Example lesson
**What happened**: Applied authLimiter middleware in the wrong file, so it was defined but never used.
**Why it happened**: Defined the limiter in rateLimiter.js but forgot to import and apply it in authRoutes.js.
**Rule**: After creating any middleware, immediately search for every route file that needs it and apply it in the same commit.

---

> Every time a human corrects Claude, a new lesson goes here.
> The goal: make the mistake rate drop to zero over time.
