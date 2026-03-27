from contextlib import asynccontextmanager

import uvicorn
from app.api.routes import courses, users
from app.db import create_db_and_tables
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    print("База данных и таблицы созданы успешно")
    yield
    print("Приложение завершает работу")


app = FastAPI(lifespan=lifespan)


app.include_router(users)
app.include_router(courses)


@app.get("/hello")
def hello():
    return {"message": "hello"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5555)
