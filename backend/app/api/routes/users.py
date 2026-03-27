from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.models.models import Role, User
from app.services.auth import create_tokens, refresh_user_id

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register")
def register_user(user: User, session: Session = Depends(get_session)):
    session.add(user)
    session.commit()


@router.get("/roles")
def get_roles(session: Session = Depends(get_session)):
    stmt = select(Role)
    return session.exec(stmt).fetchall()


@router.get("/{id}")
def get_user_by_id(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.post("/login")
def login(mail: str, password: str, session: Session = Depends(get_session)):
    stmt = select(User).where(User.mail == mail)
    user = session.exec(stmt).first()
    if not user or user.password != password:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Wrong password or username"
        )

    access_token, refresh_token = create_tokens(user.id)
    return {"ACCESS_TOKEN": access_token, "REFRESH_TOKEN": refresh_token}


@router.get("/refresh")
def refresh_user(user_id: int = Depends(refresh_user_id)):
    access_token, refresh_token = create_tokens(user_id)
    return {"ACCESS_TOKEN": access_token, "REFRESH_TOKEN": refresh_token}
