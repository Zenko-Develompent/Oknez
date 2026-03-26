import colorama
import uvicorn
from fastapi import FastAPI

colorama.init()
app = FastAPI()


@app.get("/")
def hello():
    return {"messapge": "hello"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5555)
