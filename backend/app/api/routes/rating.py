from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, SQLModel, select

from app.core.db import get_session
from app.models.models import User

router = APIRouter(prefix="/rating", tags=["rating"])


class RatingUserPublic(SQLModel):
    user_id: int
    first_name: str
    last_name: str | None = None
    total_xp: int
    level: int
    place: int


@router.get("/top", response_model=list[RatingUserPublic])
def get_rating_top(
    limit: int = 10,
    session: Session = Depends(get_session),
):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 100",
        )

    users = session.exec(
        select(User).order_by(User.total_xp.desc(), User.id.asc())
    ).all()

    result = []

    for index, user in enumerate(users[:limit], start=1):
        result.append(
            RatingUserPublic(
                user_id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                total_xp=user.total_xp,
                level=user.level,
                place=index,
            )
        )

    return result
