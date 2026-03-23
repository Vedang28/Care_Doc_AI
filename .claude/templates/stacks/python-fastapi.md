---
name: python-fastapi
description: Python FastAPI + SQLAlchemy + PostgreSQL + Celery + Redis. Async API with background tasks.
---

# Stack Template: Python FastAPI

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Runtime | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Queue | Celery + Redis |
| Auth | JWT (python-jose) + passlib |
| Validation | Pydantic v2 |
| Testing | Pytest + httpx |
| CI/CD | GitHub Actions → VPS / Railway |
```

## Folder Structure

```
project/
├── app/
│   ├── main.py           # FastAPI app, router registration
│   ├── config.py         # Settings via pydantic-settings
│   ├── database.py       # Async SQLAlchemy engine + session
│   ├── auth/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── dependencies.py  # get_current_user dependency
│   ├── [feature]/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── models.py     # SQLAlchemy models
│   │   └── schemas.py    # Pydantic schemas (request/response)
│   ├── middleware/
│   │   └── error_handler.py
│   └── workers/          # Celery tasks
├── alembic/
│   └── versions/
├── tests/
│   ├── conftest.py
│   └── test_[feature].py
├── docs/
│   └── plans/
├── pyproject.toml
└── .env
```

## Required Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-min-32-chars-long-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
```

## Initial Setup Commands

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

pip install fastapi uvicorn[standard] sqlalchemy asyncpg alembic
pip install pydantic-settings python-jose[cryptography] passlib[bcrypt]
pip install celery redis
pip install -D pytest pytest-asyncio httpx

# Init alembic
alembic init alembic
```

## API Route Pattern

```python
# app/posts/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.posts import service
from app.posts.schemas import PostCreate, PostResponse

router = APIRouter(prefix="/api/v1/posts", tags=["posts"])

@router.post("/", response_model=dict, status_code=201)
async def create_post(
    data: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await service.create_post(db, data, current_user.id)
    return {"success": True, "data": result, "message": "Created"}
```

## Response Shape

```python
# All responses follow the same shape
def success_response(data, message=""):
    return {"success": True, "data": data, "message": message}

def error_response(error: str, code: str):
    return {"success": False, "error": error, "code": code}
```

## Key Patterns

- Async everywhere: `async def` routes, `AsyncSession`
- Dependency injection for DB session and current user
- Pydantic models for request/response validation (auto-docs!)
- Alembic for migrations: `alembic revision --autogenerate -m "description"`
- Run with: `uvicorn app.main:app --reload --port 3000`
