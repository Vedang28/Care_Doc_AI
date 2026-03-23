---
name: migrate
description: Safe database migration management. Create, preview, run, and rollback migrations for any ORM (Prisma, SQLAlchemy, GORM, Drizzle). Always creates a rollback plan before applying.
---

# /migrate — Database Migration Management

Every migration is reversible. Every migration is reviewed. Never run blind.

---

## Usage

```
/migrate create [name]    → Create new migration (dry-run first, review SQL)
/migrate run              → Apply all pending migrations
/migrate rollback         → Rollback last applied migration
/migrate status           → Show migration state
/migrate reset            → Reset DB (dev only — destroys all data!)
/migrate squash           → Squash multiple dev migrations into one
```

---

## /migrate create [name]

```bash
# 1. Review current schema
cat prisma/schema.prisma  # or: cat alembic/versions/ | head

# 2. Create migration (dry-run first — don't apply yet)
# Prisma:
npx prisma migrate dev --name [name] --create-only

# Alembic (Python):
# alembic revision --autogenerate -m "[name]"

# Drizzle:
# npx drizzle-kit generate:pg

# 3. Review the generated SQL — MANDATORY
cat prisma/migrations/[latest]/migration.sql

# 4. Document rollback SQL before applying
echo "# Rollback for: [name]" >> .claude/ADR.md
```

**Before applying, verify:**
- [ ] Migration SQL is what you intended
- [ ] No accidental data drops
- [ ] NOT NULL columns have defaults (for existing rows)
- [ ] Rollback SQL is documented
- [ ] Foreign key constraints are correct

---

## /migrate run

```bash
# 1. Backup production DB first (production only)
# pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Check current state
npx prisma migrate status  # or: alembic current

# 3. Apply
npx prisma migrate deploy  # or: alembic upgrade head

# 4. Verify schema is in sync
npx prisma db push --dry-run 2>&1 | head -5

# 5. Smoke test
npm test -- --testPathPattern=smoke 2>&1 | tail -10
```

---

## /migrate rollback

Prisma doesn't support automatic rollback — use this procedure:

```bash
# 1. Find the rollback SQL you documented (ADR.md or migration file)

# 2. Execute rollback SQL
npx prisma db execute --file rollback.sql
# or: alembic downgrade -1
# or: go run migrations/rollback.go

# 3. Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# 4. Verify state
npx prisma migrate status
```

---

## /migrate status

```bash
npx prisma migrate status
# alembic history --verbose | head -20
# goose -dir ./migrations status
```

---

## Safety Rules

1. **Never run migrations in production without a backup**
2. **Always review generated SQL before applying** — ORMs can be surprising
3. **Write rollback SQL before applying** — document in ADR.md
4. **Run on staging first**, then production
5. **Large tables** → use batched migrations, not single ALTER TABLE
6. **Adding NOT NULL** → always add a DEFAULT or backfill first
7. **Enum changes** → test on a copy of production data first

---

> Rule: A migration without a documented rollback is a migration that will break production at the worst time.
