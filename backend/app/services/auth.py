from datetime import datetime, timedelta

from fastapi import Header, HTTPException
from jose import JWTError, jwt

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"
SECRET_KEY = "your-secret-key"


def create_tokens(user_id: int):
    # Access Token
    access_expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode(
        {"sub": str(user_id), "type": "access", "exp": access_expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    # Refresh Token
    refresh_expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = jwt.encode(
        {"sub": str(user_id), "type": "refresh", "exp": refresh_expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return access_token, refresh_token


def get_current_user_id(access_token: str = Header(None, alias="ACCESS_TOKEN")):
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing ACCESS_TOKEN header")

    try:
        # В таком варианте обычно передают чистый токен без слова "Bearer"
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        return int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def refresh_user_id(token: str = Header(None, alias="REFRESH_TOKEN")):
    if not token:
        raise HTTPException(status_code=401, detail="Missing REFRESH_TOKEN header")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        return int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
