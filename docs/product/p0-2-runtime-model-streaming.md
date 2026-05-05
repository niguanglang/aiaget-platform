# P0-2 Runtime 多模型适配与真实流式输出

## 目标

P0-2 将 Runtime 从单一 OpenAI-compatible 非流式调用升级为可扩展模型适配边界，并把 `/runtime/conversations/respond-stream` 从“完整生成后切块”改成直接消费 provider SSE。

## 已完成

- Runtime 非流式模型调用支持 `OPENAI_COMPATIBLE`、`DEEPSEEK`、`QWEN`、`MOONSHOT`、`LOCAL`、`AZURE_OPENAI`、`ANTHROPIC`。
- DeepSeek、Qwen、Moonshot、本地模型统一走 OpenAI-compatible `/chat/completions` 协议。
- Azure OpenAI 使用部署级 base URL，自动追加 `api-version=2024-06-01`，并使用 `api-key` header。
- Anthropic 使用 `/messages` 协议，自动把 system 消息折叠到顶层 `system` 字段，响应归一化为平台统一的 assistant message、token usage 和 model call summary。
- Runtime 流式接口直接读取 provider SSE，每收到 provider 文本 delta 就转发 Runtime `delta` 事件，不再等待完整回答后本地切块。
- OpenAI-compatible 流式支持 `stream_options.include_usage=true`，可从 provider 流中读取 usage；缺失 usage 时保持估算兜底。
- Anthropic 流式支持 `content_block_delta` 文本增量和 `message_delta/message_start` usage 归一化。

## 流式事件合同

Runtime 对 Control API 保持原有 SSE 事件形态：

```text
event: start
event: delta
event: done
```

`start` 包含 trace、预处理步骤、知识引用和工具调用摘要；`delta` 包含 provider 原始文本增量；`done` 返回完整 `RuntimeConversationResponse`，用于 Control API 持久化消息、token、模型调用摘要和运行步骤。

## 测试覆盖

- `apps/agent-runtime/tests/test_model_adapters.py`
  - DeepSeek 使用 OpenAI-compatible URL、Bearer 鉴权和非流式 payload。
  - Azure OpenAI 使用部署 URL、`api-key` header 和 Azure adapter 标记。
  - Anthropic 使用 `/messages`、Anthropic headers，并归一化 content 与 usage。
- `apps/agent-runtime/tests/test_runtime_streaming.py`
  - Runtime 按 provider delta 输出，不把完整文本重新切块。
  - Runtime 能在 provider 流结束前输出首个 delta。
  - Anthropic `content_block_delta` 能转换为 Runtime delta，并在 done 中返回统一模型摘要。

## 后续边界

- Control API 仍保留旧的本地模型 fallback 路径，后续可逐步移除或复用 Runtime adapter。
- Anthropic 最大输出 token 当前使用 Runtime 默认值 `2048`，后续可从模型配置中扩展独立字段。
- Azure `api-version` 当前固定为 `2024-06-01`，后续可改为供应商配置项。
