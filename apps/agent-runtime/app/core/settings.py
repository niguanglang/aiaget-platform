from pydantic_settings import BaseSettings, SettingsConfigDict


class RuntimeSettings(BaseSettings):
    app_name: str = "Enterprise Agent Platform Runtime"
    port: int = 8000
    cors_origin: str
    version: str = "0.1.0"
    control_api_base_url: str
    internal_token: str
    temporal_address: str
    temporal_namespace: str
    temporal_task_queue: str
    temporal_enabled: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_prefix="RUNTIME_", extra="ignore")


settings = RuntimeSettings()
