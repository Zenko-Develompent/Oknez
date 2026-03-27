from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, SQLModel, select

from app.core.db import get_session
from app.core.security import get_current_user_id
from app.models.models import Achievement, AchievementUser


router = APIRouter(prefix="/achievements", tags=["achievements"])


class AchievementPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    icon_url: str | None = None
    xp_reward: int
    is_active: bool


class UserAchievementPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    icon_url: str | None = None
    xp_reward: int
    received_at: datetime

@router.get("", response_model=list[AchievementPublic])
def get_achievements(session: Session = Depends(get_session)):
    achievements = session.exec(
        select(Achievement)
        .where(Achievement.is_active.is_(True))
        .order_by(Achievement.id)
    ).all()

    return [
        AchievementPublic(
            id=achievement.id,
            title=achievement.title,
            description=achievement.description,
            icon_url=achievement.icon_url,
            xp_reward=achievement.xp_reward,
            is_active=achievement.is_active,
        )
        for achievement in achievements
    ]