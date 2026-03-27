from contextlib import asynccontextmanager

from fastapi import FastAPI

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


app.include_router(users_router)
app.include_router(courses_router)


@app.get("/health", tags=["health"])
def root():
    return {"status": "ok"}
