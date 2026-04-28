from pydantic_settings import BaseSettings, SettingsConfigDict


class RuntimeSettings(BaseSettings):
    app_name: str = "Enterprise Agent Platform Runtime"
    port: int = 8000
    cors_origin: str = "http://localhost:3000"
    version: str = "0.1.0"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="RUNTIME_")


settings = RuntimeSettings()
