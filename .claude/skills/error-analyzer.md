---
name: error-analyzer
description: Error pattern classification and analysis. Takes an error message or stack trace and identifies the root cause category, likely location, and fix approach. Use before diving into debugging.
---

# Error Analyzer Skill

Before debugging: classify the error. Knowing the category tells you where to look.

---

## Step 1: Identify Error Category

Read the error message and classify:

| Category | Signatures | Where to look |
|----------|-----------|---------------|
| **Connection** | ECONNREFUSED, ENOTFOUND, timeout, connection refused | DB/Redis config, env vars, services running? |
| **Auth/Permission** | 401, 403, JWT expired, invalid signature | Auth middleware, token generation, env vars |
| **Validation** | 400, required field, invalid type, schema mismatch | Request validators, Zod/Joi schemas |
| **Not Found** | 404, record not found, null reference | IDs, query logic, soft delete filters |
| **Type Error** | TypeError, is not a function, undefined is not | Null checks, async/await, wrong import |
| **Import/Module** | Cannot find module, not exported, ERR_MODULE | File path, package installed?, named export |
| **Schema/Migration** | table does not exist, column missing, constraint | Pending migration, schema drift |
| **Environment** | process.env is undefined, missing required | .env file, env var not set, secret missing |
| **Async** | UnhandledPromiseRejection, callback called twice | Missing await, double callback, race condition |
| **Memory/Resource** | ENOMEM, OOM, heap out of memory | Memory leak, large query, N+1 |

---

## Step 2: Read the Full Stack Trace

```
# Key info in a stack trace:
Line 1: Error type + message → the symptom
Lines 2-5: Your code files → where to look  (lines with src/)
Lines 6+: Framework/library code → usually not your bug
```

Focus on the **first line of YOUR code** in the stack trace. That's where to start.

---

## Step 3: Error-Specific Diagnosis

### ECONNREFUSED / Connection Errors

```bash
# Is the service running?
redis-cli ping
psql $DATABASE_URL -c "SELECT 1"

# Is the env var set and correct?
echo $DATABASE_URL
echo $REDIS_URL

# Is the port right?
netstat -tlpn | grep [port]
```

### JWT / Auth Errors

```bash
# Is JWT_SECRET set?
node -e "console.log(process.env.JWT_SECRET?.length > 0 ? 'set' : 'MISSING')"

# Decode the token to check expiry
node -e "
const jwt = require('jsonwebtoken');
const token = '[paste token]';
const decoded = jwt.decode(token);
console.log(decoded);
console.log('Expires:', new Date(decoded.exp * 1000));
"
```

### Cannot Find Module

```bash
# Check if package is installed
cat package.json | grep [package-name]
ls node_modules/[package-name] 2>/dev/null && echo "Installed" || echo "MISSING"

# Check file path
ls src/path/to/file.js 2>/dev/null || echo "File doesn't exist at this path"

# Check export name
grep "export" src/path/to/file.js | head -5
```

### Prisma / Schema Errors

```bash
# Check migration status
npx prisma migrate status

# Check if schema matches DB
npx prisma db push --dry-run 2>&1 | head -10

# Regenerate client after schema change
npx prisma generate
```

### TypeErrors (undefined, not a function)

```javascript
// Pattern: value might be undefined
// WRONG: thing.property  →  cannot read property of undefined
// RIGHT: thing?.property  OR  if (!thing) return;

// Pattern: async function not awaited
// WRONG: const result = getUser(id);  → result is Promise, not user
// RIGHT: const result = await getUser(id);
```

---

## Step 4: Root Cause Template

Before writing any fix:

```
ERROR: [exact error message]
STACK TRACE POINTS TO: [file:line]
CATEGORY: [connection / auth / validation / type / etc.]

ROOT CAUSE: [why is this actually happening?]
NOT THE CAUSE: [what false leads did you rule out and why]
FIX: [exactly what to change — file and line]
VERIFICATION: [how to confirm it's fixed]
```

---

## Step 5: Write a Lesson

If this error took more than 5 minutes to diagnose, it goes in `lessons.md`.

Use `lessons-writer` skill for proper formatting.

---

> Rule: Don't change code until you know the root cause. Blind fixes create new bugs.
> Rule: If "I don't know why this works now" — you haven't found the root cause. Keep digging.
