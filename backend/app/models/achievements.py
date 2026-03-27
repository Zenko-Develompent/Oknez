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

    user_links: list["AchievementUser"] = Relationship(back_populates="achievement")

