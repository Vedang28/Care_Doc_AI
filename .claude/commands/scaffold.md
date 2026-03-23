---
name: scaffold
description: Generate production-ready boilerplate for a feature. Pass a feature name like /scaffold auth, /scaffold crud:post, /scaffold payment, /scaffold upload.
---

# /scaffold — Feature Boilerplate Generator

Generate starting points for common features. Always review and customize the output.

---

## Usage

```
/scaffold auth              → Full auth system (register, login, refresh, logout, forgot-password)
/scaffold crud [resource]   → CRUD for a resource (e.g. /scaffold crud post)
/scaffold payment           → Stripe payment integration
/scaffold upload            → File upload with S3/local storage
/scaffold notification      → Email + in-app notifications
/scaffold search [resource] → Full-text search for a resource
/scaffold websocket         → Real-time with Socket.io / WebSocket
/scaffold rbac              → Role-based access control
/scaffold rate-limit        → Rate limiting per route/user
/scaffold cache [resource]  → Redis caching layer for a resource
```

---

## Step 1: Identify Stack

```bash
# Read stack from CLAUDE.md or detect from package.json / pyproject.toml
grep "Backend\|Runtime\|ORM" .claude/CLAUDE.md | head -5
cat package.json 2>/dev/null | grep -E '"express|"fastapi|"next|"fiber' | head -5
```

---

## Step 2: Generate Files

### `/scaffold auth` on Express + Prisma generates:

**Backend:**
- `src/routes/authRoutes.js` — POST /register, POST /login, POST /refresh, POST /logout, POST /forgot-password, POST /reset-password
- `src/controllers/authController.js` — thin HTTP layer
- `src/services/authService.js` — business logic, JWT, bcrypt/argon2
- `src/middleware/authenticate.js` — JWT verification, attaches req.user
- `src/middleware/requireRole.js` — role-based guard
- `src/utils/tokens.js` — JWT generation + verification helpers

**Database:**
- Prisma schema additions: `User`, `RefreshToken`, `PasswordReset` models

**Tests:**
- `tests/unit/authService.test.js`
- `tests/integration/auth.test.js`

**Config:**
- `.env.example` additions: JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN

---

### `/scaffold crud [resource]` on Express + Prisma generates:

**Backend:**
- `src/routes/[resource]Routes.js` — GET list (paginated), GET :id, POST, PATCH :id, DELETE :id
- `src/controllers/[resource]Controller.js`
- `src/services/[resource]Service.js`
- `src/validators/[resource]Validators.js` — Zod/Joi schemas

**Database:**
- Prisma schema: `[Resource]` model with id, createdAt, updatedAt, deletedAt (soft delete)

**Tests:**
- `tests/integration/[resource].test.js` — CRUD scenarios

---

### `/scaffold payment` on Express generates:

- `src/routes/paymentRoutes.js` — POST /checkout, POST /webhook, GET /billing
- `src/services/paymentService.js` — Stripe integration
- `src/middleware/validateWebhook.js` — Stripe webhook signature verification
- `.env.example` additions: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID

---

## Step 3: Register Routes

Automatically detect and update the main app file:

```javascript
// Detect src/app.js, src/index.js, or src/server.js
// Add route registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/[resource]', [resource]Routes);
```

---

## Step 4: Post-Scaffold Checklist

```
✅ SCAFFOLD COMPLETE: [feature]
─────────────────────────────────
Files created:
  [list of files]

Required actions:
  [ ] Run migration: npx prisma migrate dev --name add-[feature]
  [ ] Add env vars from .env.example to .env
  [ ] Run: npm test tests/integration/[feature].test.js
  [ ] Review and customize generated code for your domain logic
  [ ] Remove any unused generated endpoints
─────────────────────────────────
```

---

> Rule: Scaffold generates starting points, not final code. Generated code is a first draft.
> Rule: Always run generated tests immediately to verify the scaffold is wired correctly.
> Rule: Delete generated endpoints you don't need — don't ship unused routes.
