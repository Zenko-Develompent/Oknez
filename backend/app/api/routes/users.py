from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, status
from fastapi.exceptions import HTTPException
from jose import JWTError, jwt
from sqlmodel import Session, select

from app.db import get_session
from app.models.users import Profile, Role, User, UserAuth

router = APIRouter(prefix="/users", tags=["users"])
SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"


def create_token(username: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": username, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_id(authorization: str = Header(...)):
    # Ожидаем формат "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(username)
    except (JWTError, IndexError, ValueError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@router.post("/register")
def register_user(user: User, session: Session = Depends(get_session)):
    stmt = select(User).where(
        User.email == user.email or User.username == user.username
    )
    db_user = session.exec(stmt).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with such email or user name already exists",
        )
    session.add(user)
    session.commit()
    session.refresh(user)
    profile = Profile(user_id=user.id)
    session.add(profile)
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


@router.put("/{id}/profile")
def update_user_profile(
    user_id: int, profile: Profile, session: Session = Depends(get_session)
):
    stmt = select(Profile).where(Profile.user_id == user_id)
    db_profile = session.exec(stmt).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User with such id not found"
        )
    update_data = profile.model_dump(exclude_unset=True)
    db_profile.sqlmodel_update(update_data)
    session.add(update_data)
    session.commit()


@router.get("/{id}/profile")
def get_user_profile(user_id: int, session: Session = Depends(get_session)):
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = session.exec(stmt).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.get("/login")
def login(userAuth: UserAuth, session: Session = Depends(get_session)):
    stmt = select(User).where(User.username == userAuth.username)
    user = session.exec(stmt).first()

    if not user or user.password != userAuth.password:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Wrong password or username"
        )

    access_token = create_token(user.username)
    return {"access_token": access_token}
