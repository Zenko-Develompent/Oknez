import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import achievements, rating, task
from app.api.routes.courses import router as courses_router
from app.api.routes.users import router as users_router
from app.core.db import create_db_and_tables
from app.scripts.import_courses_from_content import import_all_courses


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()

    auto_import_enabled = os.getenv("AUTO_IMPORT_COURSES_ON_STARTUP", "false").lower() in {
        "1",
        "true",
        "yes",
    }
    if auto_import_enabled:
        totals = import_all_courses()
        print(
            "AUTO_IMPORT_COURSES_ON_STARTUP: "
            f"files={totals['files']}, courses={totals['courses']}, "
            f"modules={totals['modules']}, topics={totals['topics']}, "
            f"tasks={totals['tasks']}"
        )

    print("SERVER_STARTUP_COMPLETE")
    yield
    print("SERVER_SHUTDOWN")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
