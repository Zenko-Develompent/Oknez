from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskType(str, Enum):
    LECTURE = "lecture"
    PRACTICE = "practice"
    QUIZ = "quiz"


class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    title: str
    description: str | None = None
    is_published: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    course_id: int = Field(foreign_key="course.id", index=True)

    title: str
    description: str | None = None
    order_index: int = Field(default=1, index=True)

    is_published: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Topic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    module_id: int = Field(foreign_key="module.id", index=True)

    title: str
    description: str | None = None
    order_index: int = Field(default=1, index=True)
    is_published: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    topic_id: int = Field(foreign_key="topic.id", index=True)

    title: str
    description: str | None = None
    task_type: TaskType = Field(index=True)
    order_index: int = Field(default=1, index=True)
    json_path: str | None = None
    correct_answers: str | None = None
    xp_reward: int = Field(default=0)

    is_published: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)