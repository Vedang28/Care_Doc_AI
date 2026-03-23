---
name: api-design
description: REST API design patterns. Resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting. Use when designing new endpoints or reviewing API consistency.
---

# API Design Skill — REST Patterns

Consistent APIs are predictable APIs. Predictable APIs are easy to use and hard to misuse.

---

## Resource Naming

```
# Collections — plural nouns
GET    /api/v1/posts          → list posts
POST   /api/v1/posts          → create post

# Individual resources — noun + ID
GET    /api/v1/posts/:id      → get post
PATCH  /api/v1/posts/:id      → update post (partial)
DELETE /api/v1/posts/:id      → delete post

# Nested resources — for strong ownership
GET    /api/v1/posts/:id/comments       → list comments on post
POST   /api/v1/posts/:id/comments       → add comment to post
DELETE /api/v1/posts/:postId/comments/:commentId

# Actions that don't fit CRUD — use verbs sparingly
POST   /api/v1/posts/:id/publish        → publish action
POST   /api/v1/auth/refresh             → refresh token
POST   /api/v1/users/:id/follow         → follow user
```

---

## HTTP Status Codes

| Code | When to use |
|------|-------------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 204 | Success with no body (DELETE when not returning data) |
| 400 | Bad request — invalid input, validation error |
| 401 | Unauthenticated — no/invalid token |
| 403 | Unauthorized — authenticated but no permission |
| 404 | Resource not found |
| 409 | Conflict — duplicate, already exists |
| 422 | Unprocessable — valid format but business rule violation |
| 429 | Rate limited |
| 500 | Server error — never expose internals |

---

## Response Shape (Consistent)

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Created successfully"
}

// List with pagination
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

// Error
{
  "success": false,
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": { "field": "validation detail" }  // optional
}
```

---

## Pagination

Always paginate lists. Never return unbounded results.

```javascript
// Cursor-based (preferred for large datasets)
GET /api/v1/posts?cursor=cuid123&limit=20

// Offset-based (simpler, fine for small datasets)
GET /api/v1/posts?page=2&limit=20
```

Default and max limits:
```javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, parseInt(req.query.limit) || 20);  // max 100
const offset = (page - 1) * limit;
```

---

## Filtering and Sorting

```
GET /api/v1/posts?status=published
GET /api/v1/posts?authorId=user-123
GET /api/v1/posts?sort=createdAt&order=desc
GET /api/v1/posts?search=hello+world
GET /api/v1/posts?from=2024-01-01&to=2024-12-31
```

```javascript
// Prisma filter building from query params
const where = {
  deletedAt: null,
  ...(status && { status }),
  ...(authorId && { authorId }),
  ...(search && {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  })
};
```

---

## Versioning

Always prefix routes with `/api/v1/`. When breaking changes are needed:
- Add `/api/v2/` routes
- Keep `/api/v1/` working until clients migrate
- Deprecation header: `Deprecation: true`, `Sunset: [date]`

---

## Error Codes (Machine-Readable)

```javascript
// Define as constants — never magic strings
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};
```

---

## Rate Limiting Headers

Always return:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640000000
```

---

## Idempotency

- GET, PUT, DELETE: idempotent by design
- POST: use idempotency keys for expensive operations

```
POST /api/v1/payments
Idempotency-Key: unique-client-key-123
```

---

> Rule: APIs are contracts. Once shipped, changing them breaks clients. Design carefully.
> Rule: When in doubt: more specific error codes, more explicit field names, more documentation.
