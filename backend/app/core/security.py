from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException, status
from jose import JWTError, jwt
from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"
SECRET_KEY = "your-secret-key"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_tokens(user_id: int) -> tuple[str, str]:
    access_expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = jwt.encode(
        {
            "sub": str(user_id),
            "type": "access",
            "exp": access_expire,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    refresh_expire = datetime.now(timezone.utc) + timedelta(
        days=REFRESH_TOKEN_EXPIRE_DAYS
    )
    refresh_token = jwt.encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "exp": refresh_expire,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return access_token, refresh_token


def get_current_user_id(
    access_token: str | None = Header(default=None, alias="ACCESS_TOKEN"),
) -> int:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing ACCESS_TOKEN header",
        )

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        return int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def refresh_user_id(
    refresh_token: str | None = Header(default=None, alias="REFRESH_TOKEN"),
) -> int:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing REFRESH_TOKEN header",
        )

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        return int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )