from datetime import datetime
from app.services.user_progress import update_user_level
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, SQLModel, select, Field
import json
from app.services.give_achievement import check_and_award_level_achievements
from sqlmodel import Session, SQLModel, select
from app.models.models import Achievement, AchievementUser, User
from datetime import timezone
from app.core.db import get_session
from app.core.security import get_current_user_id
from app.models.models import (
    Course,
    Module,
    Task,
    Topic,
    User,
    UserAnswer,
    UserCourse,
    UserCourseStatus,
)

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


class TaskAnswerResponse(SQLModel):
    task_id: int
    is_correct: bool
    score: int
    awarded_xp: int
    attempt: int
    progress_percent: float
    total_xp: int
    message: str

router = APIRouter(prefix="/tasks", tags=["tasks"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_text(value: str) -> str:
    return value.strip().lower()


def check_task_answer(task: Task, answer_body: str) -> bool:
    if not task.correct_answers:
        return False

    raw = task.correct_answers.strip()

    try:
        parsed = json.loads(raw)

        if isinstance(parsed, list):
            valid_answers = [normalize_text(str(item)) for item in parsed]
            return normalize_text(answer_body) in valid_answers

        if isinstance(parsed, str):
            return normalize_text(answer_body) == normalize_text(parsed)

    except json.JSONDecodeError:
        pass

    return normalize_text(answer_body) == normalize_text(raw)

def recalculate_user_course_progress(
    session: Session,
    user_id: int,
    course_id: int,
) -> float:
    tasks = session.exec(
        select(Task)
        .join(Topic, Topic.id == Task.topic_id)
        .join(Module, Module.id == Topic.module_id)
        .where(
            Module.course_id == course_id,
            Task.is_published.is_(True),
        )
    ).all()

    total_tasks = len(tasks)

    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course_id,
        )
    ).first()

    if not user_course:
        return 0

    if total_tasks == 0:
        user_course.progress_percent = 0
        user_course.status = UserCourseStatus.NOT_STARTED
        session.add(user_course)
        return 0

    task_ids = [task.id for task in tasks]

    correct_answers = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == user_id,
            UserAnswer.task_id.in_(task_ids),
            UserAnswer.is_correct.is_(True),
        )
    ).all()

    solved_task_ids = {answer.task_id for answer in correct_answers}
    progress_percent = round(len(solved_task_ids) / total_tasks * 100, 2)

    user_course.progress_percent = progress_percent

    if progress_percent <= 0:
        user_course.status = UserCourseStatus.NOT_STARTED
    elif progress_percent >= 100:
        user_course.status = UserCourseStatus.COMPLETED
        if not user_course.completed_at:
            user_course.completed_at = utc_now()
        if not user_course.started_at:
            user_course.started_at = utc_now()
    else:
        user_course.status = UserCourseStatus.IN_PROGRESS
        if not user_course.started_at:
            user_course.started_at = utc_now()

    session.add(user_course)
    return progress_percent

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

    if task.task_type.value == "lecture":
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
    awarded_xp = 0

    if is_correct and not already_solved:
        awarded_xp = task.xp_reward

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

        awarded_achievements = check_and_award_level_achievements(
            session=session,
            user=user,
        )

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
    session.refresh(user_course)

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