from sqlmodel import Session, SQLModel, create_engine

from app import models  # noqa: F401
from app.core.config import settings

engine = create_engine(settings.db_url, echo=False)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
