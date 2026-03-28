import argparse
import json
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.core.db import create_db_and_tables, engine
from app.models.models import Course, CourseCategory, Module, Task, TaskType, Topic


CONTENT_DIR = Path(__file__).resolve().parents[2] / "content" / "courses"


def normalize_correct_answers(raw_value: Any) -> str | None:
    if raw_value is None:
        return None

    if isinstance(raw_value, str):
        return raw_value

    return json.dumps(raw_value, ensure_ascii=False)


def normalize_answer_options(raw_value: Any) -> str | None:
    if raw_value is None:
        return None

    if isinstance(raw_value, str):
        normalized = raw_value.strip()
        if not normalized:
            return None
        return normalized

    if isinstance(raw_value, list):
        options = [str(item).strip() for item in raw_value if str(item).strip()]
        if not options:
            return None
        return json.dumps(options, ensure_ascii=False)

    return json.dumps(raw_value, ensure_ascii=False)


def normalize_optional_text(raw_value: Any) -> str | None:
    if raw_value is None:
        return None

    value = str(raw_value).strip()
    return value if value else None


def get_or_create_category(session: Session, title: str) -> CourseCategory:
    category = session.exec(
        select(CourseCategory).where(CourseCategory.title == title)
    ).first()

    if not category:
        category = CourseCategory(title=title)

    category.title = title
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def get_or_create_course(
    session: Session,
    *,
    title: str,
    description: str | None,
    category_id: int | None,
    is_published: bool,
) -> Course:
    course = session.exec(select(Course).where(Course.title == title)).first()

    if not course:
        course = Course(
            title=title,
            description=description,
            category_id=category_id,
            is_published=is_published,
        )

    course.title = title
    course.description = description
    course.category_id = category_id
    course.is_published = is_published

    session.add(course)
    session.commit()
    session.refresh(course)
    return course


def get_or_create_module(
    session: Session,
    *,
    course_id: int,
    title: str,
    description: str | None,
    order_index: int,
) -> Module:
    module = session.exec(
        select(Module).where(Module.course_id == course_id, Module.title == title)
    ).first()

    if not module:
        module = Module(
            course_id=course_id,
            title=title,
            description=description,
            order_index=order_index,
        )

    module.title = title
    module.description = description
    module.order_index = order_index
    session.add(module)
    session.commit()
    session.refresh(module)
    return module


def get_or_create_topic(
    session: Session,
    *,
    module_id: int,
    title: str,
    description: str | None,
    order_index: int,
) -> Topic:
    topic = session.exec(
        select(Topic).where(Topic.module_id == module_id, Topic.title == title)
    ).first()

    if not topic:
        topic = Topic(
            module_id=module_id,
            title=title,
            description=description,
            order_index=order_index,
        )

    topic.title = title
    topic.description = description
    topic.order_index = order_index
    session.add(topic)
    session.commit()
    session.refresh(topic)
    return topic


def get_or_create_task(
    session: Session,
    *,
    topic_id: int,
    title: str,
    description: str | None,
    task_type: TaskType,
    order_index: int,
    correct_answers: str | None,
    question_text: str | None,
    theory_content: str | None,
    answer_options: str | None,
    compiler_initial_code: str | None,
    xp_reward: int,
    md_path: str | None,
    is_published: bool,
) -> Task:
    task = session.exec(
        select(Task).where(Task.topic_id == topic_id, Task.title == title)
    ).first()

    if not task:
        task = Task(
            topic_id=topic_id,
            title=title,
            description=description,
            task_type=task_type,
            order_index=order_index,
            correct_answers=correct_answers,
            question_text=question_text,
            theory_content=theory_content,
            answer_options=answer_options,
            compiler_initial_code=compiler_initial_code,
            xp_reward=xp_reward,
            md_path=md_path,
            is_published=is_published,
        )

    task.title = title
    task.description = description
    task.task_type = task_type
    task.order_index = order_index
    task.correct_answers = correct_answers
    task.question_text = question_text
    task.theory_content = theory_content
    task.answer_options = answer_options
    task.compiler_initial_code = compiler_initial_code
    task.xp_reward = xp_reward
    task.md_path = md_path
    task.is_published = is_published
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def import_course_file(session: Session, file_path: Path) -> dict[str, int]:
    with file_path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    stats = {
        "courses": 0,
        "modules": 0,
        "topics": 0,
        "tasks": 0,
    }

    category_title = payload.get("category_title")
    category_id = None

    if category_title:
        category = get_or_create_category(session, category_title)
        category_id = category.id

    course_payload = payload["course"]
    course = get_or_create_course(
        session,
        title=course_payload["title"],
        description=course_payload.get("description"),
        category_id=category_id,
        is_published=course_payload.get("is_published", True),
    )
    stats["courses"] += 1

    for module_payload in payload.get("modules", []):
        module = get_or_create_module(
            session,
            course_id=course.id,
            title=module_payload["title"],
            description=module_payload.get("description"),
            order_index=int(module_payload.get("order_index", 1)),
        )
        stats["modules"] += 1

        for topic_payload in module_payload.get("topics", []):
            topic = get_or_create_topic(
                session,
                module_id=module.id,
                title=topic_payload["title"],
                description=topic_payload.get("description"),
                order_index=int(topic_payload.get("order_index", 1)),
            )
            stats["topics"] += 1

            for task_payload in topic_payload.get("tasks", []):
                get_or_create_task(
                    session,
                    topic_id=topic.id,
                    title=task_payload["title"],
                    description=task_payload.get("description"),
                    task_type=TaskType(task_payload["task_type"]),
                    order_index=int(task_payload.get("order_index", 1)),
                    correct_answers=normalize_correct_answers(
                        task_payload.get("correct_answers")
                    ),
                    question_text=normalize_optional_text(task_payload.get("question_text")),
                    theory_content=normalize_optional_text(task_payload.get("theory_content")),
                    answer_options=normalize_answer_options(
                        task_payload.get("answer_options")
                    ),
                    compiler_initial_code=normalize_optional_text(
                        task_payload.get("compiler_initial_code")
                    ),
                    xp_reward=int(task_payload.get("xp_reward", 0)),
                    md_path=task_payload.get("md_path"),
                    is_published=bool(task_payload.get("is_published", True)),
                )
                stats["tasks"] += 1

    return stats


def import_all_courses(content_dir: Path = CONTENT_DIR) -> dict[str, int]:
    files = sorted(content_dir.glob("*.json"))
    if not files:
        raise FileNotFoundError(f"No course files found in: {content_dir}")

    declared_course_titles: set[str] = set()
    for file_path in files:
        with file_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
        course_payload = payload.get("course") or {}
        title = str(course_payload.get("title") or "").strip()
        if title:
            declared_course_titles.add(title)

    totals = {
        "files": 0,
        "courses": 0,
        "modules": 0,
        "topics": 0,
        "tasks": 0,
    }

    create_db_and_tables()

    with Session(engine) as session:
        if declared_course_titles:
            existing_courses = session.exec(select(Course)).all()
            for existing_course in existing_courses:
                if existing_course.title not in declared_course_titles and existing_course.is_published:
                    existing_course.is_published = False
                    session.add(existing_course)
            session.commit()

        for file_path in files:
            stats = import_course_file(session, file_path)
            totals["files"] += 1
            totals["courses"] += stats["courses"]
            totals["modules"] += stats["modules"]
            totals["topics"] += stats["topics"]
            totals["tasks"] += stats["tasks"]
            print(f"Imported: {file_path.name}")

    return totals


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import courses from backend/content/courses/*.json"
    )
    parser.add_argument(
        "--content-dir",
        type=Path,
        default=CONTENT_DIR,
        help="Directory with course JSON files",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    totals = import_all_courses(args.content_dir)
    print(
        "Import completed. "
        f"files={totals['files']}, "
        f"courses={totals['courses']}, "
        f"modules={totals['modules']}, "
        f"topics={totals['topics']}, "
        f"tasks={totals['tasks']}"
    )


if __name__ == "__main__":
    main()
