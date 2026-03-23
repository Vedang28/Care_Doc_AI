# Error Bank — Solved Problems

> When an error takes more than 5 minutes to solve, it goes here.
> Format: exact error → root cause → fix → prevention.
> Search this before debugging — the answer might already be here.

---

## Format

```markdown
### [Error signature or short title]
**Error**: [exact error message]
**Context**: [what was being done when it appeared]
**Root cause**: [why it happened]
**Fix**: [exact change made]
**Prevention**: [rule to prevent it]
**Date**: [YYYY-MM-DD]
```

---

<!-- New errors go here, newest first -->

---

## Quick Search Tips

Before debugging any error:
```bash
grep -i "[keyword from error]" .claude/memory/errors.md
```

If found: apply the documented fix.
If not found: solve it, then add it here.
