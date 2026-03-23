---
name: test
description: Full verification suite. Type checking, unit tests, integration tests, frontend build, and API contract tests. Run after /execute, before /review and /ship.
---

# /test — Full Verification Suite

Every check is mandatory. Fix failures before proceeding to /review.

---

## Step 1: Type Check

```bash
echo "=== Type Check ==="

# TypeScript (Node.js)
npx tsc --noEmit 2>&1
[ $? -ne 0 ] && echo "❌ TypeScript errors — fix before shipping" && exit 1

# TypeScript (Frontend — if separate)
[ -d client ] && cd client && npx tsc --noEmit 2>&1 && cd ..

# Python
# mypy src/ 2>&1 | tail -5

# Go
# go vet ./... 2>&1

echo "✅ Type check passed"
```

---

## Step 2: Unit + Integration Tests

```bash
echo "=== Tests ==="
npm test 2>&1
# pytest -v 2>&1
# go test ./... 2>&1

[ $? -ne 0 ] && echo "❌ Tests failing — do not ship" && exit 1
echo "✅ All tests passing"
```

If any tests fail: fix them before continuing. Do NOT ship with failing tests.

---

## Step 3: Coverage Check

```bash
echo "=== Coverage ==="
npm test -- --coverage 2>&1 | grep -E "Statements|Branches|Functions|Lines" | head -5
```

Target: 80%+ on new code. If below threshold: write missing tests before shipping a significant feature.

---

## Step 4: API Contract Tests

Verify key endpoints haven't changed their response shape:

```bash
echo "=== API Contracts ==="
PORT=${PORT:-3000}

# Health check
HEALTH=$(curl -s --max-time 5 http://localhost:$PORT/api/v1/health)
echo $HEALTH | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('success') == True, 'Health check response shape changed'
print('✅ Health endpoint shape correct')
" 2>/dev/null || echo "⚠️  Server not running — start it for contract tests"
```

---

## Step 5: Frontend Build (if applicable)

```bash
echo "=== Frontend Build ==="
[ -d client ] && {
  cd client
  npx vite build --mode production 2>&1 | tail -10
  [ $? -ne 0 ] && echo "❌ Frontend build broken — fix before shipping" && exit 1

  BUILD_KB=$(du -sk dist/ | cut -f1)
  echo "Build size: ${BUILD_KB}KB"
  [ "$BUILD_KB" -gt 512 ] && echo "⚠️  Over 500KB budget — consider code splitting" || echo "✅ Bundle within budget"
  cd ..
}
```

---

## Step 6: Lint (optional but recommended)

```bash
echo "=== Lint ==="
npx eslint src/ --ext .ts,.js --max-warnings=0 2>&1 | tail -10
# ruff check . / flake8 . / golangci-lint run
```

---

## Test Report

```
🧪 TEST REPORT — [timestamp]
─────────────────────────────────
Type check:           ✅ clean / ❌ X errors
Unit tests:           ✅ X passed, 0 failed / ❌ X failing
Integration tests:    ✅ X passed / ❌ X failing
Coverage:             X% (target: ≥80%)
API contracts:        ✅ / ⚠️
Frontend build:       ✅ clean (XKB) / ❌ broken / N/A
─────────────────────────────────
Ready to /review: ✅ / ❌ [reason]
```

---

> Rule: No shipping without a green test report. No exceptions.
> Rule: A skipped test is a bug waiting to be deployed to production.
