from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_user: str = "default"
    db_password: str = "default"
    db_name: str = "default"
    db_host: str = "default"
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    def get_db_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:5432/{self.db_name}"


settings = Settings()
