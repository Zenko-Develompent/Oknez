from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import achievements, rating, task
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешает ВСЕ домены и IP
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
