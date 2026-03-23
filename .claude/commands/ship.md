---
name: ship
description: Full pipeline — security audit, type check, tests, git diff review, commit, push. Then routes to deployment skill based on your platform (VPS/Vercel/Railway/etc). The ONLY way code leaves the machine.
---

# /ship — Audit → Test → Commit → Push → Deploy → Verify

Every step is mandatory. If any step fails → STOP and fix before continuing.

---

## Step 1: Security Audit

```bash
npm audit --audit-level=high 2>&1
[ $? -ne 0 ] && echo "❌ High vulnerabilities — run /security and fix before shipping" && exit 1
```

---

## Step 2: Type Check

```bash
# TypeScript
npx tsc --noEmit 2>&1
[ $? -ne 0 ] && echo "❌ TypeScript errors — fix before shipping" && exit 1

# Frontend (if separate)
[ -d client ] && cd client && npx tsc --noEmit 2>&1

# Python
# mypy src/ 2>&1 || exit 1

# Go
# go vet ./... 2>&1 || exit 1
```

---

## Step 3: Run Tests

```bash
npm test 2>&1 | tail -30
[ $? -ne 0 ] && echo "❌ Tests failing — fix before shipping" && exit 1
```

If no tests exist yet: write at minimum one smoke test before shipping.

---

## Step 4: Frontend Build (if applicable)

```bash
[ -d client ] && cd client && npx vite build --mode production 2>&1 | tail -15
[ $? -ne 0 ] && echo "❌ Frontend build failed" && exit 1

BUILD_KB=$(du -sk dist/ | cut -f1)
[ "$BUILD_KB" -gt 512 ] && echo "⚠️  Bundle is ${BUILD_KB}KB — over 500KB budget"
```

---

## Step 5: Git Diff Review — CRITICAL

```bash
git diff --cached 2>/dev/null || git diff HEAD
```

Manually verify:
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets, API keys, or IPs
- [ ] No `any` types in TypeScript
- [ ] No commented-out code blocks left in
- [ ] No TODO/FIXME left unresolved
- [ ] All new routes have error handling
- [ ] All new endpoints have input validation
- [ ] `.env.example` updated if new env vars added
- [ ] No debug flags left on

---

## Step 6: Stage and Commit

```bash
git add [specific files — not git add .]
git status --short
```

Review what's staged. Remove temp files, logs, `.env` if accidentally included.

```bash
git commit -m "$(cat <<'EOF'
type: short summary (max 72 chars)

- bullet: specific change
- bullet: specific change
EOF
)"
```

Commit types: `feat` / `fix` / `refactor` / `test` / `chore` / `security` / `perf`

---

## Step 7: Push

```bash
git push origin main 2>&1
[ $? -ne 0 ] && git pull --rebase origin main && git push origin main
```

---

## Step 8: Deploy

**Choose your platform:**

### VPS (PM2)
```
Use skill: vps-deploy
```

### Vercel / Netlify
```bash
# Auto-deploys on push to main via GitHub Actions
# Check deployment status:
gh run watch  # or check Vercel dashboard
```

### Railway / Render / Fly.io
```bash
# Auto-deploys on push if connected to GitHub
# Monitor at: railway.app / render.com / fly.io dashboard
```

### Docker + Custom
```bash
# Use skill: docker-deploy (if configured)
```

If not yet configured: run `/setup` and choose your deployment target to get the right skill.

---

## Step 9: Verify Live

```bash
# VPS
curl -s --max-time 10 http://$VPS_IP:$PORT/api/v1/health && echo "✅ Live" || echo "❌ Health check FAILED"

# Cloud platforms — check their dashboard or run smoke tests against the live URL
```

---

## Step 10: Update Docs and Context

```bash
git add docs/ PRIORITY-WORK.md .claude/lessons.md
git commit -m "chore: update docs post-ship"
git push origin main
```

---

## Ship Report

```
✅ SHIPPED
─────────────────────────────────
TypeScript:     ✅ clean
Tests:          ✅ X passed, 0 failed
Build:          ✅ clean (XKB)
Security:       ✅ 0 high vulnerabilities
Commit:         [hash]
Pushed:         [repo]
Deploy:         ✅ [platform] — live
Health check:   ✅ 200 OK
─────────────────────────────────
```

---

> Rule: /ship is the ONLY path from local to production. Never push and manually deploy without this pipeline.
> Rule: If you wouldn't show this diff to a senior engineer, don't ship it.
