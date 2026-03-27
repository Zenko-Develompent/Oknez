from fastapi import FastAPI

from app.api.routes.courses import router as courses_router
from app.db import create_db_and_tables

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(courses_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=5555, reload=True)
