from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CallGuide AI Backend"
    environment: str = "development"
    port: int = 8000
    cors_origins: Union[List[str], str] = ["http://localhost:3000"]

    # Supabase placeholders (for future phases)
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # LLM placeholders (for future phases)
    llm_api_key: str = ""
    llm_model: str = "gemini-2.5-flash"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
