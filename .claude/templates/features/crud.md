---
name: crud
description: Full CRUD feature template with pagination, filtering, soft deletes, and ownership checks. Generic — fill in [Resource] with your resource name.
---

# Feature Template: CRUD

## What This Creates

Full CRUD for `[Resource]` with:
- Paginated list with filtering + sorting
- Get by ID with ownership check
- Create with validation
- Partial update (PATCH)
- Soft delete
- Ownership: users can only modify their own resources

## Files to Create

```
src/
├── routes/[resource]Routes.js
├── controllers/[resource]Controller.js
├── services/[resource]Service.js
└── validators/[resource]Validators.js

prisma/schema.prisma  ← add [Resource] model
tests/integration/[resource].test.js
```

## Prisma Schema

```prisma
model [Resource] {
  id        String    @id @default(cuid())
  name      String
  // Add your fields here
  status    String    @default("active")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

## Routes

```
GET    /api/v1/[resource]         → list (paginated, filtered, sorted)
GET    /api/v1/[resource]/:id     → get one (ownership checked)
POST   /api/v1/[resource]         → create
PATCH  /api/v1/[resource]/:id     → update (partial, ownership checked)
DELETE /api/v1/[resource]/:id     → soft delete (ownership checked)
```

## Service Functions

```javascript
list[Resource]s({ userId, page, limit, status, sort, order })
get[Resource]ById(id, userId)        // throws 403 if not owner
create[Resource](data, userId)
update[Resource](id, data, userId)   // throws 403 if not owner
delete[Resource](id, userId)         // soft delete, throws 403 if not owner
```

## Pagination Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Ownership Check Pattern

```javascript
const resource = await prisma[resource].findFirst({
  where: { id, deletedAt: null }
});
if (!resource) throw new AppError('Not found', 404, 'NOT_FOUND');
if (resource.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
```

## Validation Schema (Zod)

```javascript
export const createSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  // add your fields
});

export const updateSchema = createSchema.partial();  // all fields optional for PATCH

export const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['createdAt', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
});
```

## Tests to Write

```javascript
// Integration tests for each route:
// POST /[resource] — with valid data → 201
// POST /[resource] — missing required fields → 400
// POST /[resource] — without auth → 401
// GET /[resource] — returns paginated list
// GET /[resource]/:id — returns item
// GET /[resource]/:id — other user's item → 403
// GET /[resource]/:id — non-existent → 404
// PATCH /[resource]/:id — partial update → 200
// PATCH /[resource]/:id — other user's item → 403
// DELETE /[resource]/:id — soft deletes → 200
// DELETE /[resource]/:id — then GET → 404
```
