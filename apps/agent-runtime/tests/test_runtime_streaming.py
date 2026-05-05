import asyncio
import json
import os
import threading
import urllib.request

os.environ.setdefault("RUNTIME_CORS_ORIGIN", "http://localhost:3000")
os.environ.setdefault("RUNTIME_CONTROL_API_BASE_URL", "http://localhost:3001")
os.environ.setdefault("RUNTIME_INTERNAL_TOKEN", "test-runtime-token")
os.environ.setdefault("RUNTIME_TEMPORAL_ADDRESS", "localhost:7233")
os.environ.setdefault("RUNTIME_TEMPORAL_NAMESPACE", "default")
os.environ.setdefault("RUNTIME_TEMPORAL_TASK_QUEUE", "test")

from app.runtime.contracts import RuntimeConversationRequest, RuntimeModelConfig
from app.runtime.execution import stream_runtime_response_events


class FakeStreamingHttpResponse:
    def __init__(self, events: list[dict | str]):
        self.lines: list[bytes] = []
        for event in events:
            if event == "[DONE]":
                self.lines.append(b"data: [DONE]\n")
            else:
                self.lines.append(f"data: {json.dumps(event, ensure_ascii=False)}\n".encode("utf-8"))
            self.lines.append(b"\n")
        self.index = 0

    def readline(self):
        if self.index >= len(self.lines):
            return b""
        line = self.lines[self.index]
        self.index += 1
        return line

    def close(self):
        return None


def test_runtime_streams_provider_deltas_without_chunking(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeStreamingHttpResponse([
            {"model": "deepseek-chat", "choices": [{"delta": {"content": "你"}}]},
            {"choices": [{"delta": {"content": "好"}}]},
            {"usage": {"prompt_tokens": 9, "completion_tokens": 2, "total_tokens": 11}, "choices": [{"delta": {}}]},
            "[DONE]",
        ])

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    request = RuntimeConversationRequest(
        agent_name="测试智能体",
        agent_code="test_agent",
        user_message="打招呼",
        model_config=RuntimeModelConfig(
            provider_type="DEEPSEEK",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="deepseek-chat",
            temperature=0.2,
        ),
    )

    async def collect_events():
        events = []
        async for event in stream_runtime_response_events(request):
            events.append(event)
        return events

    events = asyncio.run(collect_events())
    delta_events = [event for event in events if event["event"] == "delta"]
    done_event = next(event for event in events if event["event"] == "done")

    assert captured["url"] == "https://api.example.com/v1/chat/completions"
    assert captured["body"]["stream"] is True
    assert captured["body"]["stream_options"] == {"include_usage": True}
    assert [event["data"]["delta"] for event in delta_events] == ["你", "好"]
    assert done_event["data"]["assistant_message"] == "你好"
    assert done_event["data"]["model_call"]["response_summary"]["streamed"] is True
    assert done_event["data"]["prompt_tokens"] == 9
    assert done_event["data"]["completion_tokens"] == 2


class FakeBlockingStreamingHttpResponse:
    def __init__(self, release_done: threading.Event):
        self.release_done = release_done
        self.lines = [
            'data: {"model":"deepseek-chat","choices":[{"delta":{"content":"先"}}]}\n'.encode("utf-8"),
            b"\n",
            b"data: [DONE]\n",
            b"\n",
            b"",
        ]
        self.index = 0

    def readline(self):
        if self.index >= 2:
            self.release_done.wait(timeout=2)
        line = self.lines[self.index]
        self.index += 1
        return line

    def close(self):
        return None


def test_runtime_yields_first_provider_delta_before_stream_finishes(monkeypatch):
    release_done = threading.Event()

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        return FakeBlockingStreamingHttpResponse(release_done)

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    request = RuntimeConversationRequest(
        agent_name="测试智能体",
        agent_code="test_agent",
        user_message="先返回一个字",
        model_config=RuntimeModelConfig(
            provider_type="DEEPSEEK",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="deepseek-chat",
        ),
    )

    async def collect_first_delta_before_done():
        generator = stream_runtime_response_events(request)
        await asyncio.wait_for(generator.__anext__(), timeout=1)
        try:
            return await asyncio.wait_for(generator.__anext__(), timeout=0.2)
        finally:
            release_done.set()
            await generator.aclose()

    first_delta = asyncio.run(collect_first_delta_before_done())

    assert first_delta["event"] == "delta"
    assert first_delta["data"]["delta"] == "先"


def test_runtime_streams_anthropic_content_block_deltas(monkeypatch):
    captured: dict[str, object] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: int):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return FakeStreamingHttpResponse([
            {"type": "message_start", "message": {"model": "claude-3-5-sonnet", "usage": {"input_tokens": 11, "output_tokens": 0}}},
            {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "你"}},
            {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "好"}},
            {"type": "message_delta", "usage": {"input_tokens": 11, "output_tokens": 3}},
            "[DONE]",
        ])

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    request = RuntimeConversationRequest(
        agent_name="测试智能体",
        agent_code="test_agent",
        user_message="打招呼",
        model_config=RuntimeModelConfig(
            provider_type="ANTHROPIC",
            base_url="https://api.anthropic.com/v1",
            api_key="secret",
            model="claude-3-5-sonnet",
        ),
    )

    async def collect_events():
        events = []
        async for event in stream_runtime_response_events(request):
            events.append(event)
        return events

    events = asyncio.run(collect_events())
    delta_events = [event for event in events if event["event"] == "delta"]
    done_event = next(event for event in events if event["event"] == "done")

    assert captured["url"] == "https://api.anthropic.com/v1/messages"
    assert captured["headers"]["X-api-key"] == "secret"
    assert captured["headers"]["Anthropic-version"] == "2023-06-01"
    assert captured["body"]["stream"] is True
    assert [event["data"]["delta"] for event in delta_events] == ["你", "好"]
    assert done_event["data"]["assistant_message"] == "你好"
    assert done_event["data"]["model_call"]["response_summary"]["adapter"] == "ANTHROPIC"
    assert done_event["data"]["prompt_tokens"] == 11
    assert done_event["data"]["completion_tokens"] == 3
