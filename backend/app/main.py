from fastapi import FastAPI

from app.core.db import create_db_and_tables

# Импорт моделей нужен, чтобы SQLModel зарегистрировал все таблицы
from app.models.models import (
    Achievement,
    AchievementUser,
    Course,
    CourseCategory,
    Module,
    Role,
    Task,
    Topic,
    User,
    UserAnswer,
    UserCourse,
)

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/")
def root():
    return {"status": "ok"}