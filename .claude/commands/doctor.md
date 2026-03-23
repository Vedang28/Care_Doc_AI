---
name: doctor
description: Full system health diagnostic. Checks git, env vars, DB, cache, tests, types, security, and server health. Run at session start, before planning, or when something feels off.
---

# /doctor — System Health Diagnostic

Run this to get a complete picture of system health before starting work.

---

## Check 1: Git Status

```bash
echo "=== Git ==="
git status --short
git branch --show-current
git log --oneline -3
```

- Uncommitted changes? → stash or commit before starting new work
- Wrong branch? → switch before proceeding
- Diverged from remote? → pull or rebase

---

## Check 2: Environment Variables

```bash
echo "=== Environment ==="
[ -f .env ] && echo "✅ .env present" || echo "❌ .env MISSING — copy from .env.example"

# Read required vars from CLAUDE.md and check each is set
# Adapt this to your stack:
node -e "
  require('dotenv').config();
  const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  required.forEach(v => console.log(process.env[v] ? '✅ ' + v : '❌ ' + v + ' NOT SET'));
" 2>/dev/null
```

---

## Check 3: Database

```bash
echo "=== Database ==="
# Adapt to your ORM:

# Prisma
npx prisma db execute --stdin <<< "SELECT 1" 2>&1 | head -2 && echo "✅ DB connected" || echo "❌ DB connection failed"
npx prisma migrate status 2>&1 | grep -E "Applied|Pending|Failed" | head -5

# SQLAlchemy (Python)
# python -c "from app.db import engine; engine.connect(); print('✅ DB connected')"

# GORM (Go)
# go run scripts/health.go
```

---

## Check 4: Cache / Queue

```bash
echo "=== Redis ==="
redis-cli ping 2>/dev/null && echo "✅ Redis responding" || echo "⚠️  Redis not running (required if using queues/caching)"
```

---

## Check 5: Type Checking

```bash
echo "=== Type Check ==="
# Node.js/TypeScript
npx tsc --noEmit 2>&1 | head -15 && echo "✅ No TS errors" || echo "❌ TypeScript errors found"

# Python
# mypy src/ 2>&1 | tail -5

# Go
# go vet ./... 2>&1
```

---

## Check 6: Tests

```bash
echo "=== Tests ==="
npm test -- --passWithNoTests 2>&1 | tail -15
# pytest -q 2>&1 | tail -10
# go test ./... 2>&1 | tail -10
```

---

## Check 7: Running Server

```bash
echo "=== Server Health ==="
PORT=${PORT:-3000}
curl -s --max-time 3 http://localhost:$PORT/api/v1/health 2>/dev/null \
  && echo "✅ Server responding" \
  || echo "⚠️  Server not running (start it if needed)"
```

---

## Check 8: Security Quick Scan

```bash
echo "=== Security ==="
npm audit --audit-level=high 2>&1 | grep -E "high|critical|0 vulnerabilities" | head -3
grep -r "console\.log" src/ --include="*.ts" --include="*.js" -l 2>/dev/null | head -3
```

---

## Diagnostic Report

```
🩺 SYSTEM DIAGNOSTIC — [timestamp]
═══════════════════════════════════
Git:            ✅/⚠️  [status + branch]
.env:           ✅/❌  [X/Y required vars set]
Database:       ✅/❌  [connected / error message]
Redis:          ✅/⚠️  [responding / not running]
Type check:     ✅/❌  [clean / X errors]
Tests:          ✅/❌  [X passed, Y failed]
Server:         ✅/⚠️  [responding / not running]
Security:       ✅/⚠️  [X high vulnerabilities]

ISSUES TO FIX:
  [List each issue with recommended fix command]

HEALTH SCORE: [X/10]
═══════════════════════════════════
```

**Score < 7**: do not start new feature work. Fix issues first.
**Score 7–9**: proceed with caution, fix issues during session.
**Score 10**: all clear, proceed.

---

> Rule: Run /doctor at the start of every session after a gap of more than a day.
> Rule: Health score < 7 means fixing infra issues IS the priority work.
