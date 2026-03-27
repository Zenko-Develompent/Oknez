from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskType(str, Enum):
    LECTURE = "lecture"
    PRACTICE = "practice"
    QUIZ = "quiz"


class CourseCategory(SQLModel, table=True):
    __tablename__ = "course_categories"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True, unique=True, max_length=255)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    courses: list["Course"] = Relationship(back_populates="category")


class Course(SQLModel, table=True):
    __tablename__ = "courses"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_published: bool = Field(default=False)
    category_id: int | None = Field(default=None, foreign_key="course_categories.id", index=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    category: "CourseCategory | None" = Relationship(back_populates="courses")
    modules: list["Module"] = Relationship(back_populates="course")


class Module(SQLModel, table=True):
    __tablename__ = "modules"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="courses.id", index=True)
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    order_index: int = Field(default=1, ge=1, index=True)
    is_published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    course: "Course" = Relationship(back_populates="modules")
    topics: list["Topic"] = Relationship(back_populates="module")


class Topic(SQLModel, table=True):
    __tablename__ = "topics"

    id: int | None = Field(default=None, primary_key=True)
    module_id: int = Field(foreign_key="modules.id", index=True)
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    order_index: int = Field(default=1, ge=1, index=True)
    is_published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    module: "Module" = Relationship(back_populates="topics")
    tasks: list["Task"] = Relationship(back_populates="topic")


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    topic_id: int = Field(foreign_key="topics.id", index=True)
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    task_type: TaskType = Field(index=True)
    order_index: int = Field(default=1, ge=1, index=True)
    json_path: str | None = Field(default=None, max_length=500)
    correct_answers: str | None = Field(default=None, max_length=2000)
    xp_reward: int = Field(default=0, ge=0)
    is_published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    topic: "Topic" = Relationship(back_populates="tasks")
