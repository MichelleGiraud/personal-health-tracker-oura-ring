from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql://app:app@localhost:5433/oura",
        validation_alias="DATABASE_URL",
    )
    port: int = Field(default=8000, validation_alias="PORT")
    host: str = Field(default="0.0.0.0", validation_alias="HOST")

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")


settings = Settings()
