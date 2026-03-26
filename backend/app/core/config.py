from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_url: str = "default"
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
