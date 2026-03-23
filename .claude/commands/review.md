---
name: review
description: Code quality gate. Run before /ship on any significant change. Launches code-reviewer + security-auditor agents in parallel. Blocks shipping until all HIGH issues are resolved.
---

# /review — Quality Gate

Run this before shipping any significant feature, fix, or refactor.
Launches `code-reviewer` and `security-auditor` agents in parallel.

---

## Step 1: Parallel Agent Dispatch

For any change touching 3+ files or involving auth/payments/user data:

```
Launch simultaneously:
  Agent 1 (code-reviewer):    review all changed files for quality + patterns
  Agent 2 (security-auditor): review for security issues

Both return reports. Merge findings below.
```

For small changes (1–2 files, no security-sensitive areas):
- Run manual checks below without agents.

---

## Step 2: Self-Review — Staff Engineer Test

For every file changed, ask:
> *"If a senior engineer opened this file right now, would they approve it without changes?"*

If the answer is "probably not" → fix before continuing.

---

## Step 3: Elegance Check

For every function written:
- [ ] Is there a simpler way to do this?
- [ ] Am I repeating logic that already exists?
- [ ] Does this function do one thing only?
- [ ] Would a new developer understand this in 6 months?

---

## Step 4: Quick Security Scan

```bash
# No secrets or debug artifacts
grep -rn "console\.log\|TODO\|FIXME\|HACK\|debugger" src/ --include="*.ts" --include="*.js" | grep -v test | head -10

# No TypeScript any
grep -rn ": any\b\|as any\b" src/ --include="*.ts" | grep -v test | head -10

# No process.env outside config
grep -rn "process\.env\." src/ --include="*.ts" --include="*.js" | grep -v "config\|test" | head -5
```

---

## Step 5: API Response Shape

Every new endpoint must return:
```json
{ "success": true,  "data": {},     "message": "" }
{ "success": false, "error": "...", "code": "..."  }
```

Check every new controller function follows this.

---

## Step 6: Error Handling Audit

```bash
# Find async routes without try/catch
grep -rn "router\.\(get\|post\|patch\|delete\|put\)" src/routes/ --include="*.js" --include="*.ts" | head -20
```

Every async handler must either have try/catch or use asyncHandler wrapper.

---

## Step 7: Architecture Decision Record

If this change involved a significant architectural decision:

```bash
cat >> ADR.md << 'EOF'

## ADR-[N] — [YYYY-MM-DD] — [Decision Title]
**Status**: Accepted
**Context**: [why a decision was needed]
**Decision**: [what was decided]
**Alternatives considered**: [what else was evaluated]
**Consequences**: [trade-offs accepted]
**Rollback**: `git reset --hard [hash]`
EOF
```

---

## Review Report

```
📋 REVIEW COMPLETE — [timestamp]
─────────────────────────────────
Code quality:       ✅ / ⚠️  [issues found]
Security:           ✅ / ❌  [blockers found]
Staff eng standard: ✅ / ❌
API shape:          ✅ all consistent
Error handling:     ✅ all routes covered
Type safety:        ✅ / ❌  [any types: X]
Console.logs:       ✅ / ❌  [X found]
ADR written:        ✅ / N/A

BLOCKERS (must fix):
  [ ] [list each blocker]

READY TO /ship: ✅ / ❌
─────────────────────────────────
```

---

> Rule: If review finds 3+ issues of the same type, write a CLAUDE.md rule about the pattern.
> Rule: Any security blocker found → fix immediately before any other work.
