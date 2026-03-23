---
name: stack-auditor
description: Full stack health audit. Security vulnerabilities, outdated dependencies, performance budget, type coverage, dead code. Run monthly or before major releases.
---

# Stack Auditor Skill — Full Health Check

Run monthly or before any major release.

## Audit 1: Security Vulnerabilities
```bash
echo "=== Backend Security ==="
cd backend && npm audit 2>&1

echo "=== Frontend Security ==="
cd ../client && npm audit 2>&1

echo "=== Secrets Scan ==="
grep -r "sk_live\|pk_live\|password\s*=\|secret\s*=\|api_key\s*=" src/ client/src/ \
  --include="*.ts" --include="*.js" --include="*.jsx" --include="*.tsx" \
  | grep -v ".env\|test\|spec\|example" 2>&1
```

## Audit 2: Dependency Freshness
```bash
echo "=== Backend Outdated ==="
cd backend && npm outdated 2>&1

echo "=== Frontend Outdated ==="
cd ../client && npm outdated 2>&1
```

Flag anything more than 2 major versions behind as a risk item.

## Audit 3: TypeScript Coverage
```bash
echo "=== Any types (should be zero) ==="
grep -r ": any\b\|as any\b" src/ --include="*.ts" | grep -v test | wc -l

echo "=== Missing return types ==="
grep -r "^export.*function\|^  async " src/ --include="*.ts" | grep -v ":" | head -20
```

## Audit 4: Dead Code
```bash
echo "=== Commented code blocks ==="
grep -rn "\/\*\|\/\/" src/ --include="*.ts" --include="*.js" | \
  grep -v "\/\/ eslint\|\/\/ TODO\|\/\/ @\|\/\/\/" | wc -l

echo "=== Console.log in production code ==="
grep -rn "console\.log\|console\.error\|console\.warn" src/ --include="*.ts" --include="*.js" | \
  grep -v test | grep -v logger | wc -l

echo "=== Unused imports (approximate) ==="
grep -rn "^import " src/ --include="*.ts" | wc -l
```

## Audit 5: Performance Budget
```bash
echo "=== Frontend bundle size ==="
cd client && npx vite build --mode production 2>&1 | grep "dist/"
du -sh dist/ 2>/dev/null

echo "=== Largest chunks ==="
find dist/ -name "*.js" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10
```

Budget thresholds:
- Total bundle: < 500KB ✅, 500-800KB ⚠️, >800KB ❌
- Largest single chunk: < 200KB ✅, >200KB ⚠️

## Audit 6: Database Health
```bash
echo "=== Pending migrations ==="
npx prisma migrate status 2>&1

echo "=== Schema drift ==="
npx prisma db push --dry-run 2>&1 | head -20
```

## Audit 7: Error Budget Review
```bash
echo "=== Lessons written this phase ==="
grep -c "^###" .claude/lessons.md

echo "=== Most common error types ==="
grep "Root cause\|Why it happened" .claude/lessons.md | \
  sort | uniq -c | sort -rn | head -10
```

## Audit Report
```
🔍 STACK AUDIT REPORT — [DATE]
═══════════════════════════════════════
SECURITY
  High vulnerabilities:    X (fix immediately)
  Moderate:                X (fix this week)
  
DEPENDENCIES  
  Critical outdated:       X packages
  Minor outdated:          X packages
  
CODE QUALITY
  Any types:               X (target: 0)
  Console.logs:            X (target: 0)
  Commented blocks:        X
  
PERFORMANCE
  Bundle size:             XKB (budget: 500KB) ✅/⚠️/❌
  Largest chunk:           XKB
  
DATABASE
  Pending migrations:      X
  Schema drift:            ✅/⚠️
  
ERROR BUDGET
  Lessons this phase:      X
  Repeat mistakes:         X (target: 0)

ACTIONS REQUIRED:
1. [Most critical fix]
2. [Second priority]
3. [Third priority]
═══════════════════════════════════════
```

Document the audit report in `docs/audits/[DATE]-audit.md`.

> Rule: Any high-severity vulnerability found in audit must be fixed before the next ship.
> Rule: If the same type of issue appears in 3 consecutive audits, write a CLAUDE.md rule about it.
