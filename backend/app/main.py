from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import task, rating, achievements
from app.api.routes.courses import router as courses_router
from app.api.routes.users import router as users_router
from app.core.db import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    print("ГОРОД ПРОСЫПАЕТСЯ")
    yield
    print("ГОРОД ЗАСЫПАЕТ")


app = FastAPI(lifespan=lifespan)

cors_origins = os.getenv(
    "BACKEND_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(achievements.router)
app.include_router(rating.router)
app.include_router(task.router)
app.include_router(users_router)
app.include_router(courses_router)


@app.get("/health", tags=["health"])
def root():
    return {"status": "ok"}
