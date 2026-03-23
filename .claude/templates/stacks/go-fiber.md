---
name: go-fiber
description: Go + Fiber + GORM + PostgreSQL + Redis. High-performance API backend.
---

# Stack Template: Go + Fiber

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Language | Go 1.22+ |
| Framework | Fiber v2 |
| ORM | GORM |
| Migrations | golang-migrate |
| Database | PostgreSQL 16 |
| Cache | Redis (go-redis) |
| Auth | JWT (golang-jwt) + bcrypt |
| Validation | go-playground/validator |
| Testing | testify + httptest |
| CI/CD | GitHub Actions |
```

## Folder Structure

```
project/
├── cmd/
│   └── api/
│       └── main.go         # Entry point
├── internal/
│   ├── config/             # App config from env
│   ├── database/           # DB connection, migrations
│   ├── middleware/         # Auth, logger, rate limit
│   ├── [feature]/
│   │   ├── handler.go      # HTTP handlers
│   │   ├── service.go      # Business logic
│   │   ├── repository.go   # DB operations
│   │   └── model.go        # GORM models + DTOs
│   └── utils/              # JWT, helpers
├── migrations/             # SQL migration files
├── tests/
├── docs/
│   └── plans/
├── go.mod
└── .env
```

## Required Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-min-32-chars-long-here
JWT_EXPIRE_HOURS=24
PORT=3000
ENV=development
```

## Initial Setup Commands

```bash
go mod init github.com/[user]/[project]
go get github.com/gofiber/fiber/v2
go get gorm.io/gorm gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
go get github.com/go-playground/validator/v10
go get github.com/redis/go-redis/v9
go get github.com/golang-migrate/migrate/v4
go get github.com/joho/godotenv
```

## Handler Pattern

```go
// internal/posts/handler.go
func (h *Handler) CreatePost(c *fiber.Ctx) error {
    userID := c.Locals("userID").(string)

    var req CreatePostRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false, "error": "Invalid request body", "code": "VALIDATION_ERROR",
        })
    }
    if err := h.validate.Struct(req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false, "error": err.Error(), "code": "VALIDATION_ERROR",
        })
    }

    post, err := h.service.CreatePost(c.Context(), req, userID)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false, "error": "Internal error", "code": "INTERNAL_ERROR",
        })
    }

    return c.Status(201).JSON(fiber.Map{"success": true, "data": post})
}
```

## Auth Middleware

```go
// internal/middleware/auth.go
func AuthMiddleware(jwtSecret string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        token := c.Get("Authorization")
        if token == "" || !strings.HasPrefix(token, "Bearer ") {
            return c.Status(401).JSON(fiber.Map{"success": false, "error": "Unauthorized"})
        }
        // Validate JWT, set c.Locals("userID", claims.Subject)
        return c.Next()
    }
}
```

## Key Patterns

- Response shape: `fiber.Map{"success": true/false, "data": ..., "error": ...}`
- Error handling: explicit return in every handler
- Dependency injection: inject DB/Redis into handlers via struct
- Migrations: `migrate -path migrations -database $DATABASE_URL up`
- Build: `go build -o ./bin/api ./cmd/api && ./bin/api`
