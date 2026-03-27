from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, SQLModel, select

from app.core.db import get_session
from app.models.models import Course, CourseCategory, UserCourse
from fastapi import Depends, HTTPException, Request
from jose import JWTError

from fastapi import APIRouter, Depends
from sqlmodel import Session, SQLModel, select
from app.models.models import (
    Achievement,
    AchievementUser,
    Course,
    Module,
    Task,
    Topic,
    User,
    UserAnswer,
    UserCourse,
    UserCourseStatus,
)
from app.core.db import get_session
from app.models.models import Course, UserCourse, UserCourseStatus, TaskType
from app.core.security import get_current_user_id

router = APIRouter(prefix="/courses", tags=["courses"])





class CategoryPublic(SQLModel):
    id: int
    title: str


class CourseDetailPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    is_published: bool
    category_id: int | None = None
    progress_percent: float | None = None
    created_at: datetime
    updated_at: datetime
    category: CategoryPublic | None = None


class CoursePreviewPublic(SQLModel):
    course_id: int
    title: str
    description: str | None = None
    progress_percent: float
    category: CategoryPublic | None = None


class HomeCoursesResponse(SQLModel):
    all_courses: list[CoursePreviewPublic]
    my_courses: list[CoursePreviewPublic]




class CategoryPublic(SQLModel):
    id: int
    title: str


class CourseDetailPublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    is_published: bool
    category_id: int | None = None
    progress_percent: float
    created_at: datetime
    updated_at: datetime
    category: CategoryPublic | None = None


class CategoryPublic(SQLModel):
    id: int
    title: str


class CoursePreviewPublic(SQLModel):
    course_id: int
    title: str
    description: str | None = None
    progress_percent: float
    category: CategoryPublic | None = None


class TaskTreePublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    task_type: TaskType
    order_index: int
    xp_reward: int
    is_published: bool


class TopicTreePublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    order_index: int
    tasks: list[TaskTreePublic]


class ModuleTreePublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    order_index: int
    topics: list[TopicTreePublic]


class CourseTreePublic(SQLModel):
    id: int
    title: str
    description: str | None = None
    is_published: bool
    progress_percent: float | None = None
    category: CategoryPublic | None = None
    modules: list[ModuleTreePublic]


@router.get("/home", response_model=HomeCoursesResponse)
def get_home_courses(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    courses = session.exec(
        select(Course)
        .where(Course.is_published.is_(True))
        .order_by(Course.id)
    ).all()

    user_courses = session.exec(
        select(UserCourse)
        .where(UserCourse.user_id == user_id)
        .order_by(UserCourse.id)
    ).all()

    progress_map = {
        user_course.course_id: user_course.progress_percent
        for user_course in user_courses
    }

    all_courses_result = []
    my_courses_result = []

    for course in courses:
        preview = CoursePreviewPublic(
            course_id=course.id,
            title=course.title,
            description=course.description,
            progress_percent=progress_map.get(course.id, 0),
            category=CategoryPublic(
                id=course.category.id,
                title=course.category.title,
            ) if course.category else None,
        )

        all_courses_result.append(preview)

    for user_course in user_courses:
        course = user_course.course

        if not course or not course.is_published:
            continue

        my_courses_result.append(
            CoursePreviewPublic(
                course_id=course.id,
                title=course.title,
                description=course.description,
                progress_percent=user_course.progress_percent,
                category=CategoryPublic(
                    id=course.category.id,
                    title=course.category.title,
                ) if course.category else None,
            )
        )

    return HomeCoursesResponse(
        all_courses=all_courses_result,
        my_courses=my_courses_result,
    )


@router.get("/{course_id}", response_model=CourseDetailPublic)
def get_course_by_id(
    course_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    course = session.exec(
        select(Course).where(
            Course.id == course_id,
            Course.is_published.is_(True),
        )
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course_id,
        )
    ).first()

    return CourseDetailPublic(
        id=course.id,
        title=course.title,
        description=course.description,
        is_published=course.is_published,
        category_id=course.category_id,
        progress_percent=user_course.progress_percent if user_course else None,
        created_at=course.created_at,
        updated_at=course.updated_at,
        category=CategoryPublic(
            id=course.category.id,
            title=course.category.title,
        ) if course.category else None,
    )





class EnrollCourseResponse(SQLModel):
    message: str
    course_id: int
    user_id: int
    status: str
    progress_percent: float
    xp_earned: int


@router.post("/{course_id}/enroll", response_model=EnrollCourseResponse)
def enroll_course(
    course_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    course = session.exec(
        select(Course).where(
            Course.id == course_id,
            Course.is_published.is_(True),
        )
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    existing_user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course_id,
        )
    ).first()

    if existing_user_course:
        return EnrollCourseResponse(
            message="User already enrolled in course",
            course_id=existing_user_course.course_id,
            user_id=existing_user_course.user_id,
            status=existing_user_course.status.value,
            progress_percent=existing_user_course.progress_percent,
            xp_earned=existing_user_course.xp_earned,
        )

    user_course = UserCourse(
        user_id=user_id,
        course_id=course_id,
        status=UserCourseStatus.NOT_STARTED,
        progress_percent=0,
        xp_earned=0,
    )

    session.add(user_course)
    session.commit()
    session.refresh(user_course)

    return EnrollCourseResponse(
        message="User enrolled successfully",
        course_id=user_course.course_id,
        user_id=user_course.user_id,
        status=user_course.status.value,
        progress_percent=user_course.progress_percent,
        xp_earned=user_course.xp_earned,
    )


@router.get("/{course_id}/tree", response_model=CourseTreePublic)
def get_course_tree(
    course_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):
    course = session.exec(
        select(Course).where(
            Course.id == course_id,
            Course.is_published.is_(True),
        )
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course_id,
        )
    ).first()

    modules = session.exec(
        select(Module)
        .where(Module.course_id == course_id)
        .order_by(Module.order_index, Module.id)
    ).all()

    modules_result = []

    for module in modules:
        topics = session.exec(
            select(Topic)
            .where(Topic.module_id == module.id)
            .order_by(Topic.order_index, Topic.id)
        ).all()

        topics_result = []

        for topic in topics:
            tasks = session.exec(
                select(Task)
                .where(
                    Task.topic_id == topic.id,
                    Task.is_published.is_(True),
                )
                .order_by(Task.order_index, Task.id)
            ).all()

            tasks_result = []

            for task in tasks:
                tasks_result.append(
                    TaskTreePublic(
                        id=task.id,
                        title=task.title,
                        description=task.description,
                        task_type=task.task_type,
                        order_index=task.order_index,
                        xp_reward=task.xp_reward,
                        is_published=task.is_published,
                    )
                )

            topics_result.append(
                TopicTreePublic(
                    id=topic.id,
                    title=topic.title,
                    description=topic.description,
                    order_index=topic.order_index,
                    tasks=tasks_result,
                )
            )

        modules_result.append(
            ModuleTreePublic(
                id=module.id,
                title=module.title,
                description=module.description,
                order_index=module.order_index,
                topics=topics_result,
            )
        )

    return CourseTreePublic(
        id=course.id,
        title=course.title,
        description=course.description,
        is_published=course.is_published,
        progress_percent=user_course.progress_percent if user_course else None,
        category=CategoryPublic(
            id=course.category.id,
            title=course.category.title,
        ) if course.category else None,
        modules=modules_result,
    )