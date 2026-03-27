from sqlmodel import Session, select
from sqlmodel import Field, Relationship, SQLModel
from app.core.db import get_session
from app.models.models import Role, User
from app.services.auth import create_tokens, refresh_user_id
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from app.models.models import AchievementUser
from app.core.db import get_session
from app.core.security import (
    create_tokens,
    get_current_user_id,
    refresh_user_id,
    verify_password,
    hash_password,
)
from app.models.models import User, UserCourse

router = APIRouter(prefix="/users", tags=["users"])

class UserAchievementPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    icon_url: str | None = None
    xp_reward: int
    received_at: datetime

class CategoryPublic(SQLModel):
    id: int
    title: str


class MyCoursePublic(SQLModel):
    course_id: int
    title: str
    description: str | None = None
    is_published: bool
    progress_percent: float
    xp_earned: int
    status: str
    category: CategoryPublic | None = None


class UserPublic(SQLModel):
    id: int
    first_name: str
    last_name: str | None = None
    mail: str
    level: int
    total_xp: int
    role_id: int
    courses: list[MyCoursePublic] = Field(default_factory=list)



class UserRegister(SQLModel):
    first_name: str
    last_name: str | None = None
    mail: str
    password: str


class UserLogin(SQLModel):
    mail: str
    password: str


class UserPublic(SQLModel):
    id: int
    first_name: str
    last_name: str | None = None
    mail: str
    level: int
    total_xp: int
    role_id: int




@router.post("/register")
def register_user(payload: UserRegister, session: Session = Depends(get_session)):
    existing_user = session.exec(
        select(User).where(User.mail == payload.mail)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user_role = session.exec(
        select(Role).where(Role.name == "user")
    ).first()

    if not user_role:
        user_role = Role(name="user")
        session.add(user_role)
        session.commit()
        session.refresh(user_role)

    new_user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        mail=payload.mail,
        password=hash_password(payload.password),
        role_id=user_role.id,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user



@router.post("/login")
def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.mail == payload.mail)
    ).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong password or username",
        )

    access_token, refresh_token = create_tokens(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }




@router.get("/me", response_model=UserPublic)
def get_my_profile(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user_courses = session.exec(
        select(UserCourse).where(UserCourse.user_id == user_id)
    ).all()

    courses = []

    for user_course in user_courses:
        course = user_course.course

        if not course or not course.is_published:
            continue

        courses.append(
            MyCoursePublic(
                course_id=course.id,
                title=course.title,
                description=course.description,
                is_published=course.is_published,
                progress_percent=user_course.progress_percent,
                xp_earned=user_course.xp_earned,
                status=user_course.status.value,
                category=CategoryPublic(
                    id=course.category.id,
                    title=course.category.title,
                ) if course.category else None,
            )
        )

    return UserPublic(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        mail=user.mail,
        level=user.level,
        total_xp=user.total_xp,
        role_id=user.role_id,
        courses=courses,
    )




@router.get("/refresh")
def refresh_user(user_id: int = Depends(refresh_user_id)):
    access_token, refresh_token = create_tokens(user_id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


class RolePublic(SQLModel):
    id: int
    name: str


@router.get("/roles", response_model=list[RolePublic])
def get_roles(session: Session = Depends(get_session)):
    roles = session.exec(
        select(Role).order_by(Role.id)
    ).all()

    return roles


@router.get("/me/achievements", response_model=list[UserAchievementPublic])
def get_my_achievements(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    achievement_links = session.exec(
        select(AchievementUser)
        .where(AchievementUser.user_id == user_id)
        .order_by(AchievementUser.created_at.desc())
    ).all()

    result = []

    for link in achievement_links:
        achievement = link.achievement

        if not achievement:
            continue

        result.append(
            UserAchievementPublic(
                id=achievement.id,
                title=achievement.title,
                description=achievement.description,
                icon_url=achievement.icon_url,
                xp_reward=achievement.xp_reward,
                received_at=link.created_at,
            )
        )

    return result