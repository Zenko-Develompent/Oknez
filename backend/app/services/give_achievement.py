from sqlmodel import Session, select
from app.models.models import User, Achievement, AchievementUser

def give_achievement_if_not_exists(
    session: Session,
    user_id: int,
    achievement_title: str,
) -> Achievement | None:
    achievement = session.exec(
        select(Achievement).where(
            Achievement.title == achievement_title,
            Achievement.is_active.is_(True),
        )
    ).first()

    if not achievement:
        return None

    existing_link = session.exec(
        select(AchievementUser).where(
            AchievementUser.user_id == user_id,
            AchievementUser.achievement_id == achievement.id,
        )
    ).first()

    if existing_link:
        return None

    link = AchievementUser(
        user_id=user_id,
        achievement_id=achievement.id,
    )
    session.add(link)

    return achievement

def give_achievement_if_not_exists(
    session: Session,
    user_id: int,
    achievement_title: str,
) -> Achievement | None:
    achievement = session.exec(
        select(Achievement).where(
            Achievement.title == achievement_title,
            Achievement.is_active.is_(True),
        )
    ).first()

    if not achievement:
        return None

    existing_link = session.exec(
        select(AchievementUser).where(
            AchievementUser.user_id == user_id,
            AchievementUser.achievement_id == achievement.id,
        )
    ).first()

    if existing_link:
        return None

    link = AchievementUser(
        user_id=user_id,
        achievement_id=achievement.id,
    )
    session.add(link)

    return achievement

def check_and_award_level_achievements(
    session: Session,
    user: User,
) -> list[Achievement]:
    awarded = []

    if user.level >= 2:
        achievement = give_achievement_if_not_exists(
            session=session,
            user_id=user.id,
            achievement_title="Level 2 reached",
        )
        if achievement:
            awarded.append(achievement)

    if user.level >= 3:
        achievement = give_achievement_if_not_exists(
            session=session,
            user_id=user.id,
            achievement_title="Level 3 reached",
        )
        if achievement:
            awarded.append(achievement)

    if user.level >= 5:
        achievement = give_achievement_if_not_exists(
            session=session,
            user_id=user.id,
            achievement_title="Level 5 reached",
        )
        if achievement:
            awarded.append(achievement)

    return awarded