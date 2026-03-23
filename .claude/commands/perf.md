---
name: perf
description: Performance profiling and optimization. Analyzes API response times, N+1 queries, bundle size, Redis hit rates, and memory usage. Returns actionable top-3 fixes ranked by impact.
---

# /perf — Performance Analysis

Find and fix the top 3 performance bottlenecks. Ranked by user impact.

---

## Phase 1: Backend — API Response Times

```bash
# Benchmark key endpoints
PORT=${PORT:-3000}
for endpoint in health users posts; do
  echo "=== GET /api/v1/$endpoint ==="
  time curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:$PORT/api/v1/$endpoint > /dev/null
done
```

Targets:
- Cached data: < 50ms
- DB read: < 200ms
- Complex aggregation: < 500ms
- File operations: < 1000ms

---

## Phase 2: N+1 Query Detection

```bash
# Find service files with potential N+1 patterns
grep -rn "prisma\.\|db\.\|orm\." src/services/ \
  --include="*.js" --include="*.ts" --include="*.py" -l
```

For each service file found, check for loops containing DB calls:

```javascript
// RED FLAG — N+1
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
  // ☝️ 1 query per post = N+1
}

// FIX — single query
const posts = await prisma.post.findMany({
  include: { author: { select: { id: true, name: true } } }
  // ☝️ 1 query total
});
```

Also check for missing `select` optimization (fetching all columns when only 2–3 are needed).

---

## Phase 3: Frontend Bundle Analysis

```bash
cd client || cd frontend

# Production build with analysis
npx vite build --mode production 2>&1

# Bundle sizes
find dist/ -name "*.js" -exec du -sh {} \; 2>/dev/null | sort -rh | head -10
du -sh dist/ 2>/dev/null
```

Performance budgets:
- Total bundle: < 500KB ✅ | 500–800KB ⚠️ | > 800KB ❌
- Largest single chunk: < 200KB ✅ | > 200KB ⚠️

Common fixes:
- Replace `moment` → `date-fns` (tree-shakeable, 97% smaller)
- Replace `lodash` → `lodash-es` or individual imports
- Route-based code splitting with `React.lazy()`
- Add `loading="lazy"` to images

---

## Phase 4: Redis Cache Health

```bash
redis-cli info stats 2>/dev/null | grep -E "keyspace_hits|keyspace_misses"
redis-cli info memory 2>/dev/null | grep "used_memory_human"
```

Calculate hit rate: `hits / (hits + misses) × 100`
Target: > 80% hit rate for hot paths.

Identify uncached hot paths:
- List endpoints with response time > 200ms
- Check if they have cache headers or Redis cache layer
- Add caching to top offenders

---

## Phase 5: Memory Profile

```bash
# Node.js — check for memory leaks
curl -s http://localhost:$PORT/api/v1/health | grep -i memory 2>/dev/null

# Check process memory
ps aux | grep node | grep -v grep | awk '{print $6}' | head -3
```

---

## Performance Report

```
⚡ PERFORMANCE REPORT — [timestamp]
═══════════════════════════════════
BACKEND
  Slowest endpoint:    /api/v1/X — Xms  (target: <200ms) ✅/⚠️/❌
  N+1 queries found:   X instances in X service files
  Missing select opts: X (fetching unnecessary columns)

FRONTEND
  Total bundle:        XKB (budget: 500KB) ✅/⚠️/❌
  Largest chunk:       [name].js — XKB
  Bloat libraries:     [moment/lodash/etc] found: ✅/❌

CACHING
  Redis hit rate:      X% (target: >80%) ✅/⚠️/❌
  Uncached hot paths:  X identified

TOP 3 FIXES BY IMPACT:
  1. [Fix — expected improvement]
  2. [Fix — expected improvement]
  3. [Fix — expected improvement]
═══════════════════════════════════
```

---

> Rule: Fix the biggest bottleneck first — one fix often unlocks 3x more than the next two combined.
> Rule: Always measure before and after. A "fix" that doesn't improve numbers isn't a fix.
