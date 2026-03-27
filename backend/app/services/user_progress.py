from app.models.models import User

def calculate_level(total_xp: int) -> int:
    return total_xp // 100 + 1

def update_user_level(user: User) -> None:
    user.level = calculate_level(user.total_xp)