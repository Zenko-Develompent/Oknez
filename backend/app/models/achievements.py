from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

from app.models.users import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


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

    users: list["UserAchievement"] = Relationship(back_populates="achievement")


class UserAchievement(SQLModel, table=True):
    __tablename__ = "user_achievements"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    achievement_id: int = Field(
        foreign_key="achievements.id", index=True, nullable=False
    )
    awarded_at: datetime = Field(default_factory=utc_now, nullable=False)
    progress: int = Field(default=0, ge=0, nullable=False)
    is_completed: bool = Field(default=False, nullable=False)

    user: "User" = Relationship(back_populates="achievements")
    achievement: "Achievement" = Relationship(back_populates="users")
