from pydantic_settings import BaseSettings, SettingsConfigDict


class RuntimeSettings(BaseSettings):
    app_name: str = "Enterprise Agent Platform Runtime"
    port: int = 8000
    cors_origin: str = "http://localhost:3000"
    version: str = "0.1.0"
    control_api_base_url: str = "http://localhost:3001"
    internal_token: str = "dev-runtime-internal-token"
    temporal_address: str = "localhost:7233"
    temporal_namespace: str = "default"
    temporal_task_queue: str = "aiaget-knowledge-tasks"
    temporal_enabled: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_prefix="RUNTIME_", extra="ignore")


settings = RuntimeSettings()
