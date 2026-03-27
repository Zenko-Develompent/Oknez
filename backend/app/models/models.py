from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True, index=True)
    users: list["User"] = Relationship(back_populates="role")

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    password: str = Field(max_length=255)
    level: int = Field(default=1, ge=1)
    total_xp: int = Field(default=0, ge=0)
    role_id: int = Field(foreign_key="roles.id", index=True)
    mail: str = Field(index=True, unique=True, max_length=255)

    role: "Role" = Relationship(back_populates="users")
    user_courses: list["UserCourse"] = Relationship(back_populates="user")
    user_answers: list["UserAnswer"] = Relationship(back_populates="user")
    achievement_links: list["AchievementUser"] = Relationship(back_populates="user")

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class UserAnswer(SQLModel, table=True):
    __tablename__ = "user_answers"

    id: int | None = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="tasks.id", index=True)
    answer_body: str
    user_id: int = Field(foreign_key="users.id", index=True)
    is_correct: bool | None = Field(default=None)
    score: int = Field(default=0, ge=0)
    awarded_xp: int = Field(default=0, ge=0)
    is_correct: bool
    attempt: int = Field(default=1, ge=1)
    checked_at: datetime | None = Field(default=None)

    task: "Task" = Relationship(back_populates="user_answers")
    user: "User" = Relationship(back_populates="user_answers")
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class AchievementUser(SQLModel, table=True):
    __tablename__ = "achievement_users"

    id: int | None = Field(default=None, primary_key=True)
    achievement_id: int = Field(foreign_key="achievements.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)

    achievement: "Achievement" = Relationship(back_populates="user_links")
    user: "User" = Relationship(back_populates="achievement_links")


class UserCourseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class UserCourse(SQLModel, table=True):
    __tablename__ = "user_courses"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="courses.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    status: UserCourseStatus = Field(default=UserCourseStatus.NOT_STARTED, index=True)
    progress_percent: float = Field(default=0, ge=0, le=100)
    xp_earned: int = Field(default=0, ge=0)

    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)

    course: "Course" = Relationship(back_populates="user_courses")
    user: "User" = Relationship(back_populates="user_courses")


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
    category_id: int | None = Field(
        default=None, foreign_key="course_categories.id", index=True
    )
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    user_courses: list["UserCourse"] = Relationship(back_populates="course")
    category: "CourseCategory" = Relationship(back_populates="courses")
    modules: list["Module"] = Relationship(back_populates="course")


class Module(SQLModel, table=True):
    __tablename__ = "modules"

    id: int | None = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="courses.id", index=True)
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    order_index: int = Field(default=1, ge=1, index=True)

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
    md_path: str | None = Field(default=None, max_length=500)
    correct_answers: str | None = Field(default=None, max_length=2000)
    xp_reward: int = Field(default=0, ge=0)
    is_published: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    user_answers: list["UserAnswer"] = Relationship(back_populates="task")
    topic: "Topic" = Relationship(back_populates="tasks")


class Achievement(SQLModel, table=True):
    __tablename__ = "achievements"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True, unique=True, max_length=255, nullable=False)
    description: str | None = Field(default=None, max_length=1000)
    icon_url: str | None = Field(default=None, max_length=500)
    xp_reward: int = Field(default=0, ge=0, nullable=False)
    is_active: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    user_links: list["AchievementUser"] = Relationship(back_populates="achievement")
