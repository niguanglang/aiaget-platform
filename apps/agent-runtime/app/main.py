from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.settings import settings


class HealthResponse(BaseModel):
    service: str
    status: Literal["healthy", "degraded", "unavailable"]
    timestamp: str
    version: str


app = FastAPI(
    title="Enterprise Agent Platform Runtime",
    description="Agent execution runtime for model calls, RAG, tools, and streaming.",
    version=settings.version,
    docs_url="/runtime/docs",
    openapi_url="/runtime/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origin.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/runtime/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        service="agent-runtime",
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.version,
    )

