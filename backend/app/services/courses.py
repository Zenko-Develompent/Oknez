from __future__ import annotations

from datetime import datetime, timezone
from typing import TypeVar

from sqlmodel import SQLModel, Session, select

from app.models.courses import Course, CourseCategory, Module, Task, TaskType, Topic


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


T = TypeVar("T", bound=SQLModel)
_UNSET = object()


class ServiceError(Exception):
    pass


class NotFoundError(ServiceError):
    pass


class ConflictError(ServiceError):
    pass


class ValidationError(ServiceError):
    pass


class CoursesService:
    def __init__(self, session: Session):
        self.session = session

    # =========================
    # Общие вспомогательные методы
    # =========================

    def _touch(self, obj: SQLModel) -> None:
        if hasattr(obj, "updated_at"):
            setattr(obj, "updated_at", utc_now())

    def _save(self, obj: SQLModel):
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def _delete(self, obj: SQLModel) -> None:
        self.session.delete(obj)
        self.session.commit()

    def _get_or_raise(self, model: type[T], obj_id: int, entity_name: str) -> T:
        obj = self.session.get(model, obj_id)
        if obj is None:
            raise NotFoundError(f"{entity_name} с id={obj_id} не найден")
        return obj

    def _validate_title(self, title: str, field_name: str = "Название") -> str:
        value = title.strip()
        if not value:
            raise ValidationError(f"{field_name} не может быть пустым")
        if len(value) > 255:
            raise ValidationError(f"{field_name} не должно быть длиннее 255 символов")
        return value

    def _validate_description(self, description: str | None) -> str | None:
        if description is None:
            return None
        value = description.strip()
        if len(value) > 2000:
            raise ValidationError("Описание не должно быть длиннее 2000 символов")
        return value or None

    def _validate_json_path(self, json_path: str | None) -> str | None:
        if json_path is None:
            return None
        value = json_path.strip()
        if len(value) > 500:
            raise ValidationError("Путь к JSON не должен быть длиннее 500 символов")
        return value or None

    def _validate_correct_answers(self, correct_answers: str | None) -> str | None:
        if correct_answers is None:
            return None
        value = correct_answers.strip()
        if len(value) > 2000:
            raise ValidationError("Поле correct_answers не должно быть длиннее 2000 символов")
        return value or None

    def _validate_order_index(self, order_index: int) -> int:
        if order_index < 1:
            raise ValidationError("Порядковый номер должен быть не меньше 1")
        return order_index

    def _validate_xp_reward(self, xp_reward: int) -> int:
        if xp_reward < 0:
            raise ValidationError("Награда XP не может быть отрицательной")
        return xp_reward

    def _get_category(self, category_id: int) -> CourseCategory:
        return self._get_or_raise(CourseCategory, category_id, "Категория")

    def _get_course(self, course_id: int) -> Course:
        return self._get_or_raise(Course, course_id, "Курс")

    def _get_module(self, module_id: int) -> Module:
        return self._get_or_raise(Module, module_id, "Модуль")

    def _get_topic(self, topic_id: int) -> Topic:
        return self._get_or_raise(Topic, topic_id, "Тема")

    def _get_task(self, task_id: int) -> Task:
        return self._get_or_raise(Task, task_id, "Задача")

    def _ensure_category_title_unique(self, title: str, exclude_id: int | None = None) -> None:
        categories = self.session.exec(select(CourseCategory)).all()
        normalized = title.casefold()

        for category in categories:
            if category.title.casefold() == normalized and category.id != exclude_id:
                raise ConflictError(f"Категория '{title}' уже существует")

    # Категории

    def create_category(self, *, title: str) -> CourseCategory:
        title = self._validate_title(title, "Название категории")
        self._ensure_category_title_unique(title)

        category = CourseCategory(title=title)
        return self._save(category)

    def get_category(self, category_id: int) -> CourseCategory:
        return self._get_category(category_id)

    def list_categories(self) -> list[CourseCategory]:
        categories = list(self.session.exec(select(CourseCategory)).all())
        categories.sort(key=lambda item: (item.title.casefold(), item.id or 0))
        return categories

    def update_category(
        self,
        category_id: int,
        *,
        title: str | object = _UNSET,
    ) -> CourseCategory:
        category = self._get_category(category_id)

        if title is not _UNSET:
            if not isinstance(title, str):
                raise ValidationError("Название категории должно быть строкой")
            validated_title = self._validate_title(title, "Название категории")
            self._ensure_category_title_unique(validated_title, exclude_id=category.id)
            category.title = validated_title

        self._touch(category)
        return self._save(category)

    def delete_category(self, category_id: int) -> None:
        category = self._get_category(category_id)

        courses = self.session.exec(
            select(Course).where(Course.category_id == category_id)
        ).all()
        if courses:
            raise ConflictError("Нельзя удалить категорию, пока к ней привязаны курсы")

        self._delete(category)

    # Курсы

    def create_course(
        self,
        *,
        title: str,
        description: str | None = None,
        category_id: int | None = None,
        is_published: bool = False,
    ) -> Course:
        validated_title = self._validate_title(title, "Название курса")
        validated_description = self._validate_description(description)

        if category_id is not None:
            self._get_category(category_id)

        course = Course(
            title=validated_title,
            description=validated_description,
            category_id=category_id,
            is_published=is_published,
        )
        return self._save(course)

    def get_course(self, course_id: int) -> Course:
        return self._get_course(course_id)

    def list_courses(
        self,
        *,
        category_id: int | None = None,
        is_published: bool | None = None,
    ) -> list[Course]:
        courses = list(self.session.exec(select(Course)).all())

        if category_id is not None:
            courses = [course for course in courses if course.category_id == category_id]

        if is_published is not None:
            courses = [course for course in courses if course.is_published == is_published]

        courses.sort(key=lambda item: (-(item.id or 0)))
        return courses

    def update_course(
        self,
        course_id: int,
        *,
        title: str | object = _UNSET,
        description: str | None | object = _UNSET,
        category_id: int | None | object = _UNSET,
        is_published: bool | object = _UNSET,
    ) -> Course:
        course = self._get_course(course_id)

        if title is not _UNSET:
            if not isinstance(title, str):
                raise ValidationError("Название курса должно быть строкой")
            course.title = self._validate_title(title, "Название курса")

        if description is not _UNSET:
            if description is not None and not isinstance(description, str):
                raise ValidationError("Описание курса должно быть строкой или null")
            course.description = self._validate_description(description)

        if category_id is not _UNSET:
            if category_id is not None:
                if not isinstance(category_id, int):
                    raise ValidationError("Идентификатор категории должен быть числом")
                self._get_category(category_id)
            course.category_id = category_id

        if is_published is not _UNSET:
            if not isinstance(is_published, bool):
                raise ValidationError("Флаг публикации должен быть булевым значением")
            course.is_published = is_published

        self._touch(course)
        return self._save(course)

    def publish_course(self, course_id: int) -> Course:
        return self.update_course(course_id, is_published=True)

    def unpublish_course(self, course_id: int) -> Course:
        return self.update_course(course_id, is_published=False)

    def clear_course_category(self, course_id: int) -> Course:
        return self.update_course(course_id, category_id=None)

    def delete_course(self, course_id: int) -> None:
        course = self._get_course(course_id)

        modules = self.session.exec(
            select(Module).where(Module.course_id == course_id)
        ).all()
        if modules:
            raise ConflictError("Нельзя удалить курс, пока в нем есть модули")

        self._delete(course)

    # Модули

    def create_module(
        self,
        *,
        course_id: int,
        title: str,
        description: str | None = None,
        order_index: int = 1,
        is_published: bool = False,
    ) -> Module:
        self._get_course(course_id)

        module = Module(
            course_id=course_id,
            title=self._validate_title(title, "Название модуля"),
            description=self._validate_description(description),
            order_index=self._validate_order_index(order_index),
            is_published=is_published,
        )
        return self._save(module)

    def get_module(self, module_id: int) -> Module:
        return self._get_module(module_id)

    def list_modules(
        self,
        *,
        course_id: int,
        is_published: bool | None = None,
    ) -> list[Module]:
        self._get_course(course_id)

        modules = list(
            self.session.exec(select(Module).where(Module.course_id == course_id)).all()
        )

        if is_published is not None:
            modules = [module for module in modules if module.is_published == is_published]

        modules.sort(key=lambda item: (item.order_index, item.id or 0))
        return modules

    def update_module(
        self,
        module_id: int,
        *,
        title: str | object = _UNSET,
        description: str | None | object = _UNSET,
        order_index: int | object = _UNSET,
        is_published: bool | object = _UNSET,
    ) -> Module:
        module = self._get_module(module_id)

        if title is not _UNSET:
            if not isinstance(title, str):
                raise ValidationError("Название модуля должно быть строкой")
            module.title = self._validate_title(title, "Название модуля")

        if description is not _UNSET:
            if description is not None and not isinstance(description, str):
                raise ValidationError("Описание модуля должно быть строкой или null")
            module.description = self._validate_description(description)

        if order_index is not _UNSET:
            if not isinstance(order_index, int):
                raise ValidationError("Порядковый номер должен быть числом")
            module.order_index = self._validate_order_index(order_index)

        if is_published is not _UNSET:
            if not isinstance(is_published, bool):
                raise ValidationError("Флаг публикации должен быть булевым значением")
            module.is_published = is_published

        self._touch(module)
        return self._save(module)

    def delete_module(self, module_id: int) -> None:
        module = self._get_module(module_id)

        topics = self.session.exec(
            select(Topic).where(Topic.module_id == module_id)
        ).all()
        if topics:
            raise ConflictError("Нельзя удалить модуль, пока в нем есть темы")

        self._delete(module)

    # Темы

    def create_topic(
        self,
        *,
        module_id: int,
        title: str,
        description: str | None = None,
        order_index: int = 1,
        is_published: bool = False,
    ) -> Topic:
        self._get_module(module_id)

        topic = Topic(
            module_id=module_id,
            title=self._validate_title(title, "Название темы"),
            description=self._validate_description(description),
            order_index=self._validate_order_index(order_index),
            is_published=is_published,
        )
        return self._save(topic)

    def get_topic(self, topic_id: int) -> Topic:
        return self._get_topic(topic_id)

    def list_topics(
        self,
        *,
        module_id: int,
        is_published: bool | None = None,
    ) -> list[Topic]:
        self._get_module(module_id)

        topics = list(
            self.session.exec(select(Topic).where(Topic.module_id == module_id)).all()
        )

        if is_published is not None:
            topics = [topic for topic in topics if topic.is_published == is_published]

        topics.sort(key=lambda item: (item.order_index, item.id or 0))
        return topics

    def update_topic(
        self,
        topic_id: int,
        *,
        title: str | object = _UNSET,
        description: str | None | object = _UNSET,
        order_index: int | object = _UNSET,
        is_published: bool | object = _UNSET,
    ) -> Topic:
        topic = self._get_topic(topic_id)

        if title is not _UNSET:
            if not isinstance(title, str):
                raise ValidationError("Название темы должно быть строкой")
            topic.title = self._validate_title(title, "Название темы")

        if description is not _UNSET:
            if description is not None and not isinstance(description, str):
                raise ValidationError("Описание темы должно быть строкой или null")
            topic.description = self._validate_description(description)

        if order_index is not _UNSET:
            if not isinstance(order_index, int):
                raise ValidationError("Порядковый номер должен быть числом")
            topic.order_index = self._validate_order_index(order_index)

        if is_published is not _UNSET:
            if not isinstance(is_published, bool):
                raise ValidationError("Флаг публикации должен быть булевым значением")
            topic.is_published = is_published

        self._touch(topic)
        return self._save(topic)

    def delete_topic(self, topic_id: int) -> None:
        topic = self._get_topic(topic_id)

        tasks = self.session.exec(
            select(Task).where(Task.topic_id == topic_id)
        ).all()
        if tasks:
            raise ConflictError("Нельзя удалить тему, пока в ней есть задачи")

        self._delete(topic)

    # Задачи

    def create_task(
        self,
        *,
        topic_id: int,
        title: str,
        task_type: TaskType,
        description: str | None = None,
        order_index: int = 1,
        json_path: str | None = None,
        correct_answers: str | None = None,
        xp_reward: int = 0,
        is_published: bool = False,
    ) -> Task:
        self._get_topic(topic_id)

        if not isinstance(task_type, TaskType):
            raise ValidationError("Тип задачи указан некорректно")

        task = Task(
            topic_id=topic_id,
            title=self._validate_title(title, "Название задачи"),
            task_type=task_type,
            description=self._validate_description(description),
            order_index=self._validate_order_index(order_index),
            json_path=self._validate_json_path(json_path),
            correct_answers=self._validate_correct_answers(correct_answers),
            xp_reward=self._validate_xp_reward(xp_reward),
            is_published=is_published,
        )
        return self._save(task)

    def get_task(self, task_id: int) -> Task:
        return self._get_task(task_id)

    def list_tasks(
        self,
        *,
        topic_id: int,
        is_published: bool | None = None,
        task_type: TaskType | None = None,
    ) -> list[Task]:
        self._get_topic(topic_id)

        tasks = list(
            self.session.exec(select(Task).where(Task.topic_id == topic_id)).all()
        )

        if is_published is not None:
            tasks = [task for task in tasks if task.is_published == is_published]

        if task_type is not None:
            tasks = [task for task in tasks if task.task_type == task_type]

        tasks.sort(key=lambda item: (item.order_index, item.id or 0))
        return tasks

    def update_task(
        self,
        task_id: int,
        *,
        title: str | object = _UNSET,
        task_type: TaskType | object = _UNSET,
        description: str | None | object = _UNSET,
        order_index: int | object = _UNSET,
        json_path: str | None | object = _UNSET,
        correct_answers: str | None | object = _UNSET,
        xp_reward: int | object = _UNSET,
        is_published: bool | object = _UNSET,
    ) -> Task:
        task = self._get_task(task_id)

        if title is not _UNSET:
            if not isinstance(title, str):
                raise ValidationError("Название задачи должно быть строкой")
            task.title = self._validate_title(title, "Название задачи")

        if task_type is not _UNSET:
            if not isinstance(task_type, TaskType):
                raise ValidationError("Тип задачи указан некорректно")
            task.task_type = task_type

        if description is not _UNSET:
            if description is not None and not isinstance(description, str):
                raise ValidationError("Описание задачи должно быть строкой или null")
            task.description = self._validate_description(description)

        if order_index is not _UNSET:
            if not isinstance(order_index, int):
                raise ValidationError("Порядковый номер должен быть числом")
            task.order_index = self._validate_order_index(order_index)

        if json_path is not _UNSET:
            if json_path is not None and not isinstance(json_path, str):
                raise ValidationError("Путь к JSON должен быть строкой или null")
            task.json_path = self._validate_json_path(json_path)

        if correct_answers is not _UNSET:
            if correct_answers is not None and not isinstance(correct_answers, str):
                raise ValidationError("Ответы должны быть строкой или null")
            task.correct_answers = self._validate_correct_answers(correct_answers)

        if xp_reward is not _UNSET:
            if not isinstance(xp_reward, int):
                raise ValidationError("Награда XP должна быть числом")
            task.xp_reward = self._validate_xp_reward(xp_reward)

        if is_published is not _UNSET:
            if not isinstance(is_published, bool):
                raise ValidationError("Флаг публикации должен быть булевым значением")
            task.is_published = is_published

        self._touch(task)
        return self._save(task)

    def delete_task(self, task_id: int) -> None:
        task = self._get_task(task_id)
        self._delete(task)

    # Дерево курса

    def get_course_tree(self, course_id: int) -> Course:
        course = self._get_course(course_id)

        _ = course.category
        _ = course.modules

        course.modules.sort(key=lambda item: (item.order_index, item.id or 0))
        for module in course.modules:
            _ = module.topics
            module.topics.sort(key=lambda item: (item.order_index, item.id or 0))

            for topic in module.topics:
                _ = topic.tasks
                topic.tasks.sort(key=lambda item: (item.order_index, item.id or 0))

        return course
