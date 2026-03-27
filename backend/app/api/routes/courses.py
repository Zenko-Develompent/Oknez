from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Field, SQLModel, Session, select

from app.db import get_session
from app.models.courses import Course, CourseCategory, Module, Task, TaskType, Topic


router = APIRouter(prefix="/api", tags=["courses"])


class CategoryPublicResponse(SQLModel, table=False):
    id: int
    title: str


class CourseShortPublicResponse(SQLModel, table=False):
    id: int
    title: str
    description: str | None = None
    category_id: int | None = None
    category: CategoryPublicResponse | None = None


class CoursePublicResponse(CourseShortPublicResponse, table=False):
    category: CategoryPublicResponse | None = None


class TaskPublicResponse(SQLModel, table=False):
    id: int
    topic_id: int
    title: str
    description: str | None = None
    task_type: TaskType
    order_index: int
    json_path: str | None = None
    xp_reward: int


class TopicPublicResponse(SQLModel, table=False):
    id: int
    module_id: int
    title: str
    description: str | None = None
    order_index: int


class TopicTreePublicResponse(TopicPublicResponse, table=False):
    tasks: list[TaskPublicResponse] = Field(default_factory=list)


class ModulePublicResponse(SQLModel, table=False):
    id: int
    course_id: int
    title: str
    description: str | None = None
    order_index: int


class ModuleTreePublicResponse(ModulePublicResponse, table=False):
    topics: list[TopicTreePublicResponse] = Field(default_factory=list)


class CourseTreePublicResponse(CoursePublicResponse, table=False):
    modules: list[ModuleTreePublicResponse] = Field(default_factory=list)


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _serialize_category(category: CourseCategory) -> CategoryPublicResponse:
    return CategoryPublicResponse(id=category.id, title=category.title)


def _serialize_course(
    course: Course,
    *,
    category: CourseCategory | None = None,
) -> CoursePublicResponse:
    return CoursePublicResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        category_id=course.category_id,
        category=_serialize_category(category) if category is not None else None,
    )


def _serialize_course_short(course: Course) -> CourseShortPublicResponse:
    return CourseShortPublicResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        category_id=course.category_id,
        category=None,
    )


def _serialize_module(module: Module) -> ModulePublicResponse:
    return ModulePublicResponse(
        id=module.id,
        course_id=module.course_id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
    )


def _serialize_topic(topic: Topic) -> TopicPublicResponse:
    return TopicPublicResponse(
        id=topic.id,
        module_id=topic.module_id,
        title=topic.title,
        description=topic.description,
        order_index=topic.order_index,
    )


def _serialize_task(task: Task) -> TaskPublicResponse:
    return TaskPublicResponse(
        id=task.id,
        topic_id=task.topic_id,
        title=task.title,
        description=task.description,
        task_type=task.task_type,
        order_index=task.order_index,
        json_path=task.json_path,
        xp_reward=task.xp_reward,
    )


def _get_categories_map(
    session: Session,
    category_ids: list[int],
) -> dict[int, CourseCategory]:
    if not category_ids:
        return {}

    statement = select(CourseCategory).where(CourseCategory.id.in_(category_ids))
    categories = session.exec(statement).all()
    return {category.id: category for category in categories}


def _get_published_course_or_404(session: Session, course_id: int) -> Course:
    statement = select(Course).where(
        Course.id == course_id,
        Course.is_published.is_(True),
    )
    course = session.exec(statement).first()
    if course is None:
        raise _not_found("Курс не найден")
    return course


def _get_published_module_or_404(session: Session, module_id: int) -> Module:
    statement = (
        select(Module)
        .join(Course, Module.course_id == Course.id)
        .where(
            Module.id == module_id,
            Module.is_published.is_(True),
            Course.is_published.is_(True),
        )
    )
    module = session.exec(statement).first()
    if module is None:
        raise _not_found("Модуль не найден")
    return module


def _get_published_topic_or_404(session: Session, topic_id: int) -> Topic:
    statement = (
        select(Topic)
        .join(Module, Topic.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(
            Topic.id == topic_id,
            Topic.is_published.is_(True),
            Module.is_published.is_(True),
            Course.is_published.is_(True),
        )
    )
    topic = session.exec(statement).first()
    if topic is None:
        raise _not_found("Тема не найдена")
    return topic


def _list_published_modules(session: Session, course_id: int) -> list[Module]:
    statement = (
        select(Module)
        .where(
            Module.course_id == course_id,
            Module.is_published.is_(True),
        )
        .order_by(Module.order_index, Module.id)
    )
    return list(session.exec(statement).all())


def _list_published_topics(session: Session, module_id: int) -> list[Topic]:
    statement = (
        select(Topic)
        .where(
            Topic.module_id == module_id,
            Topic.is_published.is_(True),
        )
        .order_by(Topic.order_index, Topic.id)
    )
    return list(session.exec(statement).all())


def _list_published_tasks(session: Session, topic_id: int) -> list[Task]:
    statement = (
        select(Task)
        .where(
            Task.topic_id == topic_id,
            Task.is_published.is_(True),
        )
        .order_by(Task.order_index, Task.id)
    )
    return list(session.exec(statement).all())


@router.get("/courses", response_model=list[CourseShortPublicResponse])
def list_courses(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[CourseShortPublicResponse]:
    statement = (
        select(Course)
        .where(Course.is_published.is_(True))
        .order_by(Course.id.desc())
        .offset(offset)
        .limit(limit)
    )
    courses = session.exec(statement).all()
    categories_by_id = _get_categories_map(
        session,
        [course.category_id for course in courses if course.category_id is not None],
    )

    return [
        CourseShortPublicResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            category_id=course.category_id,
            category=(
                _serialize_category(categories_by_id[course.category_id])
                if course.category_id in categories_by_id
                else None
            ),
        )
        for course in courses
    ]


@router.get("/courses/{course_id}", response_model=CoursePublicResponse)
def get_course(
    course_id: int,
    session: Session = Depends(get_session),
) -> CoursePublicResponse:
    course = _get_published_course_or_404(session, course_id)
    category = session.get(CourseCategory, course.category_id) if course.category_id else None
    return _serialize_course(course, category=category)


@router.get("/courses/{course_id}/modules", response_model=list[ModulePublicResponse])
def list_course_modules(
    course_id: int,
    session: Session = Depends(get_session),
) -> list[ModulePublicResponse]:
    course = _get_published_course_or_404(session, course_id)
    modules = _list_published_modules(session, course.id)
    return [_serialize_module(module) for module in modules]


@router.get("/modules/{module_id}/topics", response_model=list[TopicPublicResponse])
def list_module_topics(
    module_id: int,
    session: Session = Depends(get_session),
) -> list[TopicPublicResponse]:
    module = _get_published_module_or_404(session, module_id)
    topics = _list_published_topics(session, module.id)
    return [_serialize_topic(topic) for topic in topics]


@router.get("/topics/{topic_id}/tasks", response_model=list[TaskPublicResponse])
def list_topic_tasks(
    topic_id: int,
    session: Session = Depends(get_session),
) -> list[TaskPublicResponse]:
    topic = _get_published_topic_or_404(session, topic_id)
    tasks = _list_published_tasks(session, topic.id)
    return [_serialize_task(task) for task in tasks]


@router.get("/courses/{course_id}/tree", response_model=CourseTreePublicResponse)
def get_course_tree(
    course_id: int,
    session: Session = Depends(get_session),
) -> CourseTreePublicResponse:
    course = _get_published_course_or_404(session, course_id)
    category = session.get(CourseCategory, course.category_id) if course.category_id else None

    modules = _list_published_modules(session, course.id)
    module_ids = [module.id for module in modules]

    topics_by_module_id: dict[int, list[Topic]] = defaultdict(list)
    tasks_by_topic_id: dict[int, list[Task]] = defaultdict(list)

    if module_ids:
        topics_statement = (
            select(Topic)
            .where(
                Topic.module_id.in_(module_ids),
                Topic.is_published.is_(True),
            )
            .order_by(Topic.order_index, Topic.id)
        )
        topics = session.exec(topics_statement).all()
        topic_ids = [topic.id for topic in topics]

        for topic in topics:
            topics_by_module_id[topic.module_id].append(topic)

        if topic_ids:
            tasks_statement = (
                select(Task)
                .where(
                    Task.topic_id.in_(topic_ids),
                    Task.is_published.is_(True),
                )
                .order_by(Task.order_index, Task.id)
            )
            tasks = session.exec(tasks_statement).all()
            for task in tasks:
                tasks_by_topic_id[task.topic_id].append(task)

    serialized_modules: list[ModuleTreePublicResponse] = []
    for module in modules:
        serialized_topics: list[TopicTreePublicResponse] = []
        for topic in topics_by_module_id.get(module.id, []):
            serialized_topics.append(
                TopicTreePublicResponse(
                    id=topic.id,
                    module_id=topic.module_id,
                    title=topic.title,
                    description=topic.description,
                    order_index=topic.order_index,
                    tasks=[_serialize_task(task) for task in tasks_by_topic_id.get(topic.id, [])],
                )
            )

        serialized_modules.append(
            ModuleTreePublicResponse(
                id=module.id,
                course_id=module.course_id,
                title=module.title,
                description=module.description,
                order_index=module.order_index,
                topics=serialized_topics,
            )
        )

    return CourseTreePublicResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        category_id=course.category_id,
        category=_serialize_category(category) if category is not None else None,
        modules=serialized_modules,
    )
