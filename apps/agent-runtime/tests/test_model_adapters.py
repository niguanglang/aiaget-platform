import json
import os
import urllib.request

os.environ.setdefault("RUNTIME_CORS_ORIGIN", "http://localhost:3000")
os.environ.setdefault("RUNTIME_CONTROL_API_BASE_URL", "http://localhost:3001")
os.environ.setdefault("RUNTIME_INTERNAL_TOKEN", "test-runtime-token")
os.environ.setdefault("RUNTIME_TEMPORAL_ADDRESS", "localhost:7233")
os.environ.setdefault("RUNTIME_TEMPORAL_NAMESPACE", "default")
os.environ.setdefault("RUNTIME_TEMPORAL_TASK_QUEUE", "test")

from app.runtime.contracts import RuntimeConversationRequest, RuntimeModelConfig
from app.runtime.execution import execute_openai_compatible_chat


class FakeHttpResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


def make_request(provider_type: str, base_url: str = "https://api.example.com/v1"):
    return RuntimeConversationRequest(
        agent_name="测试智能体",
        agent_code="test_agent",
        user_message="你好",
        model_config=RuntimeModelConfig(
            provider_type=provider_type,
            base_url=base_url,
            api_key="secret",
            model="test-model",
            temperature=0.2,
        ),
    )


def test_azure_openai_uses_configured_api_version(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        return FakeHttpResponse({
            "model": "gpt-4o",
            "choices": [{"message": {"content": "Azure OK"}}],
        })

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    request = make_request("AZURE_OPENAI", "https://azure.example.com/openai/deployments/prod-gpt")
    request.runtime_model_config.api_version = "2025-01-01-preview"

    result = execute_openai_compatible_chat(request, "a" * 32)

    assert result.status == "SUCCESS"
    assert captured["url"] == "https://azure.example.com/openai/deployments/prod-gpt/chat/completions?api-version=2025-01-01-preview"


def test_anthropic_uses_configured_max_output_tokens(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeHttpResponse({
            "model": "claude-3-5-sonnet",
            "content": [{"type": "text", "text": "Claude 已响应。"}],
            "usage": {"input_tokens": 12, "output_tokens": 7},
        })

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    request = make_request("ANTHROPIC", "https://api.anthropic.com/v1")
    request.runtime_model_config.max_output_tokens = 4096

    result = execute_openai_compatible_chat(request, "b" * 32)

    assert result.status == "SUCCESS"
    assert captured["body"]["max_tokens"] == 4096


def test_deepseek_uses_openai_compatible_protocol(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeHttpResponse({
            "model": "deepseek-chat",
            "choices": [{"message": {"content": "你好，已接入 DeepSeek。"}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        })

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    result = execute_openai_compatible_chat(make_request("DEEPSEEK"), "0" * 32)

    assert result.status == "SUCCESS"
    assert result.response_summary["adapter"] == "OPENAI_COMPATIBLE"
    assert captured["url"] == "https://api.example.com/v1/chat/completions"
    assert captured["body"]["stream"] is False
    assert captured["headers"]["Authorization"] == "Bearer secret"


def test_azure_openai_uses_deployment_url_and_api_key_header(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeHttpResponse({
            "model": "gpt-4o",
            "choices": [{"message": {"content": "Azure OK"}}],
        })

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    result = execute_openai_compatible_chat(
        make_request("AZURE_OPENAI", "https://azure.example.com/openai/deployments/prod-gpt"),
        "1" * 32,
    )

    assert result.status == "SUCCESS"
    assert result.response_summary["adapter"] == "AZURE_OPENAI"
    assert captured["url"] == "https://azure.example.com/openai/deployments/prod-gpt/chat/completions?api-version=2024-06-01"
    assert captured["headers"]["Api-key"] == "secret"
    assert "Authorization" not in captured["headers"]
    assert captured["body"]["model"] == "test-model"


def test_anthropic_message_response_is_normalized(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeHttpResponse({
            "model": "claude-3-5-sonnet",
            "content": [{"type": "text", "text": "Claude 已响应。"}],
            "usage": {"input_tokens": 12, "output_tokens": 7},
        })

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    result = execute_openai_compatible_chat(make_request("ANTHROPIC", "https://api.anthropic.com/v1"), "2" * 32)

    assert result.status == "SUCCESS"
    assert result.request_model == "claude-3-5-sonnet"
    assert result.response_summary["adapter"] == "ANTHROPIC"
    assert result.response_summary["output_text"] == "Claude 已响应。"
    assert result.prompt_tokens == 12
    assert result.completion_tokens == 7
    assert result.total_tokens == 19
    assert captured["url"] == "https://api.anthropic.com/v1/messages"
    assert captured["headers"]["X-api-key"] == "secret"
    assert captured["headers"]["Anthropic-version"] == "2023-06-01"
    assert captured["body"]["max_tokens"] == 2048
