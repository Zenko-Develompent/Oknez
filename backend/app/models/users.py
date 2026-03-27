from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

from app.models.achievements import UserAchievement


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=100, nullable=False)
    email: str = Field(index=True, unique=True, max_length=255, nullable=False)
    password: str = Field(max_length=255, nullable=False)
    role_id: int = Field(foreign_key="roles.id", index=True, nullable=False)
    parent_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)

    role: "Role" = Relationship(back_populates="users")
    parent: "User | None" = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "User.id"},
    )
    children: list["User"] = Relationship(back_populates="parent")
    profile: "Profile | None" = Relationship(back_populates="user")
    achievements: list["UserAchievement"] = Relationship(back_populates="user")


class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=100, nullable=False)

    users: list[User] = Relationship(back_populates="role")


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id", unique=True, index=True, nullable=False
    )
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    info: str | None = Field(default=None, max_length=1000)
    picture_src: str | None = Field(default=None, max_length=500)

    user: User = Relationship(back_populates="profile")


class UserAuth(SQLModel):
    username: str
    password: str
