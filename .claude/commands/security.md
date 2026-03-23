---
name: security
description: Comprehensive security audit covering OWASP Top 10, dependency vulnerabilities, secrets scan, auth review, and input validation. Any HIGH finding blocks shipping.
---

# /security — Security Audit

Any HIGH or CRITICAL finding is a hard blocker. Fix before shipping.

---

## Audit 1: Dependency Vulnerabilities

```bash
echo "=== Dependency Audit ==="
npm audit --audit-level=moderate 2>&1
[ -d client ] && cd client && npm audit --audit-level=moderate 2>&1

# Python
# pip audit 2>/dev/null || safety check

# Go
# govulncheck ./... 2>/dev/null
```

If HIGH/CRITICAL: run `npm audit fix` → if still failing, document in lessons.md with justification.

---

## Audit 2: Secrets Scan

```bash
echo "=== Secrets Scan ==="
grep -rn \
  "password\s*=\s*['\"].\|secret\s*=\s*['\"].\|api_key\s*=\s*['\"].\|sk_live\|pk_live\|sk_test\|AKIA[0-9A-Z]\|token\s*=\s*['\"]." \
  src/ client/src/ app/ \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.py" \
  | grep -v "test\|spec\|example\|\.env\|process\.env\|os\.environ"

# .env must NOT be committed
git ls-files | grep "\.env$" && echo "❌ .env IS IN GIT — REMOVE IMMEDIATELY" || echo "✅ .env not tracked"
```

---

## Audit 3: OWASP Top 10

### A01 — Broken Access Control
```bash
# Find routes without auth middleware
grep -rn "router\.\(get\|post\|put\|patch\|delete\)" src/routes/ \
  --include="*.js" --include="*.ts" | grep -v "authenticate\|requireRole\|authMiddleware"
# Review each result — are they intentionally public?
```

### A02 — Cryptographic Failures
```bash
# Weak hashing algorithms
grep -rn "md5\|sha1\|createHash.*md5\|createHash.*sha1" src/ --include="*.ts" --include="*.js"

# Passwords using bcrypt/argon2?
grep -rn "bcrypt\|argon2" src/ --include="*.ts" --include="*.js" | head -5
```

### A03 — Injection (SQL, NoSQL, Command)
```bash
# Raw SQL without parameterization
grep -rn "\$queryRaw\|\$executeRaw\|raw.*query\|db\.query.*\${" src/ --include="*.ts" --include="*.js" --include="*.py"

# Command injection
grep -rn "exec\|spawn\|execSync" src/ --include="*.ts" --include="*.js" | grep -v "child_process.*\[" | head -10
```

### A05 — Security Misconfiguration
```bash
# CORS — is it locked down?
grep -rn "cors\|CORS\|origin" src/ --include="*.ts" --include="*.js" | head -10

# Helmet (Node.js)
grep -rn "helmet" src/ --include="*.ts" --include="*.js" | head -3

# Rate limiting present?
grep -rn "rateLimit\|rate_limit\|limiter" src/ --include="*.ts" --include="*.js" | head -5
```

### A07 — Auth Failures
```bash
# JWT secret from env (not hardcoded)
grep -rn "JWT_SECRET\|jwtSecret\|jwt.*secret" src/ --include="*.ts" --include="*.js" | grep -v "process.env" | head -5

# Token expiry configured?
grep -rn "expiresIn\|exp\b" src/ --include="*.ts" --include="*.js" | head -5
```

### A09 — Logging Failures
```bash
# No sensitive data in logs
grep -rn "logger\.\|console\." src/ --include="*.ts" --include="*.js" \
  | grep -i "password\|token\|secret\|credit" | head -5
```

---

## Audit 4: Input Validation

```bash
# Every mutation route should have validation
grep -rn "router\.\(post\|put\|patch\)" src/routes/ --include="*.js" --include="*.ts" | \
  while IFS=: read file rest; do
    grep -l "validate\|Joi\|Zod\|yup\|schema\|body-parser" "$file" 2>/dev/null || echo "⚠️  No validation found in: $file"
  done
```

---

## Security Report

```
🔒 SECURITY AUDIT — [date]
═══════════════════════════════════
DEPENDENCIES
  Critical:        X (SHIP BLOCKER)
  High:            X (SHIP BLOCKER)
  Moderate:        X (fix this sprint)

SECRETS              ✅/❌
  Hardcoded creds: X found
  .env in git:     ✅ safe / ❌ REMOVE NOW

ACCESS CONTROL       ✅/⚠️
  Unprotected routes: [list or "none"]

INJECTION            ✅/⚠️
  Raw queries:     X (review each)

CONFIGURATION        ✅/⚠️
  CORS:            ✅ restricted / ⚠️ open
  Rate limiting:   ✅ present / ❌ missing
  Helmet:          ✅ / ❌

AUTH                 ✅/⚠️
  JWT secret env:  ✅ / ❌ hardcoded
  Token expiry:    ✅ / ❌ not set

INPUT VALIDATION     ✅/⚠️
  Routes missing:  [list or "all covered"]

SHIP BLOCKERS:
  [ ] [list each HIGH/CRITICAL item]

WARNINGS (fix this sprint):
  [ ] [list each MEDIUM item]
═══════════════════════════════════
```

---

> Rule: No shipping until all SHIP BLOCKERS are resolved.
> Rule: Any hardcoded secret found in code = stop everything and rotate it immediately.
