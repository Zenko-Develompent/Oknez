# Backend starter

Base starter for:

- FastAPI
- SQLModel
- Redis
- Docker Compose

## Quick start

```powershell
docker compose up --build
```

## Test data (seed)

Run inside backend container:

```powershell
docker compose exec backend python -m app.scripts.seed
```

If you want to clear current data first:

```powershell
docker compose exec backend python -m app.scripts.seed --reset
```

The script also auto-fixes legacy `achievements` schema (`condition_type`, `condition_value`) before insert.

## Endpoints

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

