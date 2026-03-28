import os

from dotenv import load_dotenv
from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    ensure_runtime_schema()


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "tasks" not in table_names:
        return

    task_columns = {column["name"] for column in inspector.get_columns("tasks")}
    statements = []

    if "question_text" not in task_columns:
        statements.append("ALTER TABLE tasks ADD COLUMN question_text TEXT")

    if "answer_options" not in task_columns:
        statements.append("ALTER TABLE tasks ADD COLUMN answer_options TEXT")

    if "compiler_initial_code" not in task_columns:
        statements.append("ALTER TABLE tasks ADD COLUMN compiler_initial_code TEXT")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def get_session():
    with Session(engine) as session:
        yield session
