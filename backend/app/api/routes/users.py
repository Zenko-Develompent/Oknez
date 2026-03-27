from sqlmodel import Session, select
from sqlmodel import Field, Relationship, SQLModel
from app.core.db import get_session
from app.models.models import Role, User
from app.services.auth import create_tokens, refresh_user_id
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import (
    create_tokens,
    get_current_user_id,
    refresh_user_id,
    verify_password,
    hash_password,
)
from app.models.models import User

router = APIRouter(prefix="/users", tags=["users"])


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




@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, session: Session = Depends(get_session)):
    existing_user = session.exec(
        select(User).where(User.mail == payload.mail)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        mail=payload.mail,
        password=hash_password(payload.password),
        role_id=1,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


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

    return user


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


