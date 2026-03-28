import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Field, SQLModel, Session, select

from app.core.db import get_session
from app.core.security import get_current_user_id
from app.models.models import (
    Course,
    Module,
    Task,
    TaskType,
    Topic,
    User,
    UserAnswer,
    UserCourse,
)
from app.services.course_progress import recalculate_user_course_progress
from app.services.give_achievement import check_and_award_level_achievements
from app.services.user_progress import update_user_level

router = APIRouter(prefix="/tasks", tags=["tasks"])


class AwardedAchievementPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    icon_url: str | None = None
    xp_reward: int


class TaskAnswerResponse(SQLModel):
    task_id: int
    is_correct: bool
    score: int
    awarded_xp: int
    attempt: int
    progress_percent: float
    total_xp: int
    level: int
    message: str
    awarded_achievements: list[AwardedAchievementPublic] = Field(default_factory=list)


class TaskAnswerCreate(SQLModel):
    answer_body: str


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_text(value: str) -> str:
    return " ".join(value.strip().lower().split())


def check_task_answer(task: Task, answer_body: str) -> bool:
    if not task.correct_answers:
        return False

    raw = task.correct_answers.strip()
    normalized_answer = normalize_text(answer_body)

    try:
        parsed = json.loads(raw)

        if isinstance(parsed, list):
            valid_answers = [normalize_text(str(item)) for item in parsed]
            return normalized_answer in valid_answers

        if isinstance(parsed, str):
            return normalized_answer == normalize_text(parsed)
    except json.JSONDecodeError:
        pass

    return normalized_answer == normalize_text(raw)


@router.post("/{task_id}/answer", response_model=TaskAnswerResponse)
def submit_task_answer(
    task_id: int,
    payload: TaskAnswerCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    task = session.get(Task, task_id)
    if not task or not task.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if not payload.answer_body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer body cannot be empty",
        )

    if task.task_type == TaskType.LECTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lecture task does not support answers",
        )

    topic = session.get(Topic, task.topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    module = session.get(Module, topic.module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    course = session.get(Course, module.course_id)
    if not course or not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course.id,
        )
    ).first()
    if not user_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not enrolled in this course",
        )

    previous_answers = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == user_id,
            UserAnswer.task_id == task_id,
        )
    ).all()
    attempt_number = len(previous_answers) + 1
    already_solved = any(answer.is_correct for answer in previous_answers)

    is_correct = check_task_answer(task, payload.answer_body)
    awarded_xp = task.xp_reward if is_correct and not already_solved else 0

    answer = UserAnswer(
        task_id=task.id,
        user_id=user_id,
        answer_body=payload.answer_body,
        is_correct=is_correct,
        score=100 if is_correct else 0,
        awarded_xp=awarded_xp,
        attempt=attempt_number,
        checked_at=utc_now(),
    )
    session.add(answer)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    awarded_achievements = []

    if awarded_xp > 0:
        user.total_xp += awarded_xp
        user_course.xp_earned += awarded_xp
        update_user_level(user)
        awarded_achievements = check_and_award_level_achievements(session=session, user=user)
        session.add(user)
        session.add(user_course)

    progress_percent = recalculate_user_course_progress(
        session=session,
        user_id=user_id,
        course_id=course.id,
    )

    session.commit()
    session.refresh(answer)
    session.refresh(user)

    return TaskAnswerResponse(
        task_id=task.id,
        is_correct=is_correct,
        score=answer.score,
        awarded_xp=awarded_xp,
        attempt=attempt_number,
        progress_percent=progress_percent,
        total_xp=user.total_xp,
        level=user.level,
        message="Correct answer" if is_correct else "Wrong answer",
        awarded_achievements=[
            AwardedAchievementPublic(
                id=achievement.id,
                title=achievement.title,
                description=achievement.description,
                icon_url=achievement.icon_url,
                xp_reward=achievement.xp_reward,
            )
            for achievement in awarded_achievements
        ],
    )


@router.post("/{task_id}/complete", response_model=TaskAnswerResponse)
def complete_task_activity(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    task = session.get(Task, task_id)
    if not task or not task.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    is_lecture_task = task.task_type == TaskType.LECTURE

    if not is_lecture_task and task.correct_answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task requires answer submission",
        )

    topic = session.get(Topic, task.topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    module = session.get(Module, topic.module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    course = session.get(Course, module.course_id)
    if not course or not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course.id,
        )
    ).first()
    if not user_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not enrolled in this course",
        )

    previous_answers = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == user_id,
            UserAnswer.task_id == task_id,
        )
    ).all()
    attempt_number = len(previous_answers) + 1
    already_solved = any(answer.is_correct for answer in previous_answers)
    awarded_xp = 0 if is_lecture_task else (task.xp_reward if not already_solved else 0)

    answer = UserAnswer(
        task_id=task.id,
        user_id=user_id,
        answer_body="lecture_viewed" if is_lecture_task else "completed",
        is_correct=True,
        score=100,
        awarded_xp=awarded_xp,
        attempt=attempt_number,
        checked_at=utc_now(),
    )
    session.add(answer)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    awarded_achievements = []

    if awarded_xp > 0:
        user.total_xp += awarded_xp
        user_course.xp_earned += awarded_xp
        update_user_level(user)
        awarded_achievements = check_and_award_level_achievements(session=session, user=user)
        session.add(user)
        session.add(user_course)

    progress_percent = recalculate_user_course_progress(
        session=session,
        user_id=user_id,
        course_id=course.id,
    )

    session.commit()
    session.refresh(answer)
    session.refresh(user)

    return TaskAnswerResponse(
        task_id=task.id,
        is_correct=True,
        score=answer.score,
        awarded_xp=awarded_xp,
        attempt=attempt_number,
        progress_percent=progress_percent,
        total_xp=user.total_xp,
        level=user.level,
        message="Lecture viewed" if is_lecture_task else "Completed",
        awarded_achievements=[
            AwardedAchievementPublic(
                id=achievement.id,
                title=achievement.title,
                description=achievement.description,
                icon_url=achievement.icon_url,
                xp_reward=achievement.xp_reward,
            )
            for achievement in awarded_achievements
        ],
    )
