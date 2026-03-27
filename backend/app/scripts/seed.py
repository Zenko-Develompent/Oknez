import argparse
from datetime import datetime, timezone

from sqlalchemy import text
from sqlmodel import Session, delete, select

from app.core.db import create_db_and_tables, engine
from app.core.security import hash_password
from app.models.models import (
    Achievement,
    AchievementConditionType,
    AchievementUser,
    Course,
    CourseCategory,
    Module,
    Role,
    Task,
    TaskType,
    Topic,
    User,
    UserAnswer,
    UserCourse,
    UserCourseStatus,
)
from app.services.user_progress import update_user_level

TEST_PASSWORD = "test1234"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def reset_database(session: Session) -> None:
    session.exec(delete(AchievementUser))
    session.exec(delete(UserAnswer))
    session.exec(delete(UserCourse))
    session.exec(delete(Task))
    session.exec(delete(Topic))
    session.exec(delete(Module))
    session.exec(delete(Course))
    session.exec(delete(CourseCategory))
    session.exec(delete(Achievement))
    session.exec(delete(User))
    session.exec(delete(Role))
    session.commit()


def ensure_legacy_schema_compatibility(session: Session) -> None:
    # Align old local databases with current models (without requiring Alembic).
    session.exec(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'achievementconditiontype'
                ) THEN
                    CREATE TYPE achievementconditiontype AS ENUM (
                        'TOTAL_XP',
                        'COMPLETED_COURSES',
                        'CORRECT_ANSWERS'
                    );
                END IF;
            END
            $$;
            """
        )
    )
    session.exec(
        text(
            """
            ALTER TABLE achievements
            ADD COLUMN IF NOT EXISTS condition_type achievementconditiontype;
            """
        )
    )
    session.exec(
        text(
            """
            ALTER TABLE achievements
            ADD COLUMN IF NOT EXISTS condition_value integer;
            """
        )
    )
    session.commit()


def get_or_create_role(session: Session, name: str) -> Role:
    role = session.exec(select(Role).where(Role.name == name)).first()
    if role:
        return role

    role = Role(name=name)
    session.add(role)
    session.commit()
    session.refresh(role)
    return role


def get_or_create_category(session: Session, title: str) -> CourseCategory:
    category = session.exec(select(CourseCategory).where(CourseCategory.title == title)).first()
    if category:
        return category

    category = CourseCategory(title=title)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def get_or_create_user(
    session: Session,
    *,
    first_name: str,
    last_name: str | None,
    mail: str,
    total_xp: int,
    role_id: int,
) -> User:
    user = session.exec(select(User).where(User.mail == mail)).first()

    if not user:
        user = User(
            first_name=first_name,
            last_name=last_name,
            mail=mail,
            password=hash_password(TEST_PASSWORD),
            role_id=role_id,
        )

    user.first_name = first_name
    user.last_name = last_name
    user.role_id = role_id
    user.total_xp = total_xp
    update_user_level(user)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def get_or_create_course(
    session: Session,
    *,
    title: str,
    description: str,
    category_id: int,
    is_published: bool = True,
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
    description: str,
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
    description: str,
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
    description: str,
    task_type: TaskType,
    order_index: int,
    correct_answers: str | None,
    xp_reward: int,
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
            xp_reward=xp_reward,
            is_published=True,
        )

    task.title = title
    task.description = description
    task.task_type = task_type
    task.order_index = order_index
    task.correct_answers = correct_answers
    task.xp_reward = xp_reward
    task.is_published = True

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_or_create_user_course(
    session: Session,
    *,
    user_id: int,
    course_id: int,
    progress_percent: float,
    xp_earned: int,
) -> UserCourse:
    user_course = session.exec(
        select(UserCourse).where(
            UserCourse.user_id == user_id,
            UserCourse.course_id == course_id,
        )
    ).first()

    if not user_course:
        user_course = UserCourse(
            user_id=user_id,
            course_id=course_id,
        )

    if progress_percent <= 0:
        status = UserCourseStatus.NOT_STARTED
    elif progress_percent >= 100:
        status = UserCourseStatus.COMPLETED
    else:
        status = UserCourseStatus.IN_PROGRESS

    user_course.progress_percent = progress_percent
    user_course.xp_earned = xp_earned
    user_course.status = status

    if status != UserCourseStatus.NOT_STARTED and not user_course.started_at:
        user_course.started_at = utc_now()

    if status == UserCourseStatus.COMPLETED and not user_course.completed_at:
        user_course.completed_at = utc_now()

    session.add(user_course)
    session.commit()
    session.refresh(user_course)
    return user_course


def get_or_create_achievement(
    session: Session,
    *,
    title: str,
    description: str,
    condition_value: int,
) -> Achievement:
    achievement = session.exec(
        select(Achievement).where(Achievement.title == title)
    ).first()

    if not achievement:
        achievement = Achievement(
            title=title,
            description=description,
            xp_reward=0,
            is_active=True,
            condition_type=AchievementConditionType.TOTAL_XP,
            condition_value=condition_value,
        )

    achievement.title = title
    achievement.description = description
    achievement.xp_reward = 0
    achievement.is_active = True
    achievement.condition_type = AchievementConditionType.TOTAL_XP
    achievement.condition_value = condition_value

    session.add(achievement)
    session.commit()
    session.refresh(achievement)
    return achievement


def link_achievement_to_user(
    session: Session,
    *,
    achievement_id: int,
    user_id: int,
) -> None:
    existing_link = session.exec(
        select(AchievementUser).where(
            AchievementUser.achievement_id == achievement_id,
            AchievementUser.user_id == user_id,
        )
    ).first()

    if existing_link:
        return

    link = AchievementUser(
        achievement_id=achievement_id,
        user_id=user_id,
    )
    session.add(link)
    session.commit()


def seed_data(reset: bool = False) -> None:
    create_db_and_tables()

    with Session(engine) as session:
        ensure_legacy_schema_compatibility(session)

        if reset:
            reset_database(session)

        user_role = get_or_create_role(session, "user")
        admin_role = get_or_create_role(session, "admin")

        users_data = [
            ("Alina", "Smirnova", "alina@example.com", 920),
            ("Timur", "Akhmetov", "timur@example.com", 840),
            ("Maria", "Petrova", "maria@example.com", 800),
            ("Arsen", "Imanov", "arsen@example.com", 760),
            ("Sofia", "Kim", "sofia@example.com", 720),
            ("Danil", "Volkov", "danil@example.com", 700),
            ("Nikita", "Kozlov", "nikita@example.com", 690),
            ("Eva", "Sokolova", "eva@example.com", 680),
            ("Roman", "Belyaev", "roman@example.com", 660),
            ("Omar", "Ibragimov", "omar@example.com", 640),
        ]

        users: list[User] = []
        for first_name, last_name, mail, total_xp in users_data:
            users.append(
                get_or_create_user(
                    session,
                    first_name=first_name,
                    last_name=last_name,
                    mail=mail,
                    total_xp=total_xp,
                    role_id=user_role.id,
                )
            )

        admin_user = get_or_create_user(
            session,
            first_name="Admin",
            last_name="User",
            mail="admin@example.com",
            total_xp=1200,
            role_id=admin_role.id,
        )
        users.append(admin_user)

        programming_category = get_or_create_category(session, "Программирование")
        digital_category = get_or_create_category(session, "Цифровая грамотность")

        python_course = get_or_create_course(
            session,
            title="Python для исследователей",
            description="Базовый курс Python для начинающих.",
            category_id=programming_category.id,
            is_published=True,
        )
        digital_course = get_or_create_course(
            session,
            title="Цифровая грамотность для школьников",
            description="Безопасная и эффективная работа в интернете.",
            category_id=digital_category.id,
            is_published=True,
        )

        module_python = get_or_create_module(
            session,
            course_id=python_course.id,
            title="Модуль 1. Основы Python",
            description="Переменные, ввод/вывод, условия.",
            order_index=1,
        )
        module_digital = get_or_create_module(
            session,
            course_id=digital_course.id,
            title="Модуль 1. Интернет и безопасность",
            description="Ключевые правила безопасного поведения в сети.",
            order_index=1,
        )

        topic_python_vars = get_or_create_topic(
            session,
            module_id=module_python.id,
            title="Тема 1. Переменные и вывод",
            description="Что такое переменные и как вывести данные.",
            order_index=1,
        )
        topic_python_logic = get_or_create_topic(
            session,
            module_id=module_python.id,
            title="Тема 2. Условия",
            description="Операторы сравнения и ветвления.",
            order_index=2,
        )
        topic_digital_passwords = get_or_create_topic(
            session,
            module_id=module_digital.id,
            title="Тема 1. Надежные пароли",
            description="Каким должен быть надежный пароль.",
            order_index=1,
        )

        get_or_create_task(
            session,
            topic_id=topic_python_vars.id,
            title="Лекция: что такое переменная",
            description="Изучи примеры переменных в Python.",
            task_type=TaskType.LECTURE,
            order_index=1,
            correct_answers=None,
            xp_reward=0,
        )
        get_or_create_task(
            session,
            topic_id=topic_python_vars.id,
            title="Квиз: команда вывода",
            description="Какая команда выводит текст?",
            task_type=TaskType.QUIZ,
            order_index=2,
            correct_answers='["print()", "print"]',
            xp_reward=20,
        )
        get_or_create_task(
            session,
            topic_id=topic_python_logic.id,
            title="Практика: оператор равенства",
            description="Какой оператор проверяет равенство?",
            task_type=TaskType.PRACTICE,
            order_index=1,
            correct_answers='["=="]',
            xp_reward=25,
        )
        get_or_create_task(
            session,
            topic_id=topic_digital_passwords.id,
            title="Лекция: правила паролей",
            description="Прочитай рекомендации по созданию паролей.",
            task_type=TaskType.LECTURE,
            order_index=1,
            correct_answers=None,
            xp_reward=0,
        )
        get_or_create_task(
            session,
            topic_id=topic_digital_passwords.id,
            title="Квиз: длина пароля",
            description="Минимальная безопасная длина пароля?",
            task_type=TaskType.QUIZ,
            order_index=2,
            correct_answers='["12", "не менее 12 символов", "12 символов"]',
            xp_reward=20,
        )

        get_or_create_user_course(
            session,
            user_id=users[0].id,
            course_id=python_course.id,
            progress_percent=100,
            xp_earned=180,
        )
        get_or_create_user_course(
            session,
            user_id=users[0].id,
            course_id=digital_course.id,
            progress_percent=45,
            xp_earned=60,
        )
        get_or_create_user_course(
            session,
            user_id=users[1].id,
            course_id=python_course.id,
            progress_percent=60,
            xp_earned=90,
        )
        get_or_create_user_course(
            session,
            user_id=users[2].id,
            course_id=python_course.id,
            progress_percent=30,
            xp_earned=40,
        )

        achievement_100 = get_or_create_achievement(
            session,
            title="Новичок",
            description="Набрать 100 XP",
            condition_value=100,
        )
        achievement_300 = get_or_create_achievement(
            session,
            title="Опытный",
            description="Набрать 300 XP",
            condition_value=300,
        )
        achievement_700 = get_or_create_achievement(
            session,
            title="Профи",
            description="Набрать 700 XP",
            condition_value=700,
        )

        link_achievement_to_user(
            session,
            achievement_id=achievement_100.id,
            user_id=users[0].id,
        )
        link_achievement_to_user(
            session,
            achievement_id=achievement_300.id,
            user_id=users[0].id,
        )
        link_achievement_to_user(
            session,
            achievement_id=achievement_700.id,
            user_id=users[0].id,
        )

        print("Seed completed successfully.")
        print(f"Test password for seeded users: {TEST_PASSWORD}")
        print("Sample users:")
        print("- alina@example.com")
        print("- nikita@example.com")
        print("- admin@example.com")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed database with test data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing data before seeding.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    seed_data(reset=args.reset)


if __name__ == "__main__":
    main()
