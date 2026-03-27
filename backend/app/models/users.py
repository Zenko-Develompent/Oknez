from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

from app.models.achievements import UserAchievement


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
    password_hash: str = Field(max_length=255)
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
    status: UserAnswerStatus = Field(default=UserAnswerStatus.SUBMITTED, index=True) 
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