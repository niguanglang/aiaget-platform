# M58 外部 API 流式调用闭环

## 目标

M58 把外部 Agent 调用从“仅非流式 JSON 响应”扩展为“非流式 + SSE 流式响应”，让外部系统可以直接接入模型增量输出，同时继续复用 API Key、权限、数据范围、资源授权、审计和 Trace 链路。

## 已实现

- 新增外部 SSE 接口：

```http
POST /api/v1/external/agents/{agentId}/chat/stream
```

- 保留原有非流式接口：

```http
POST /api/v1/external/agents/{agentId}/chat
```

- 新增共享类型：
  - `ExternalAgentStreamStartEvent`
  - `ExternalAgentStreamDeltaEvent`
  - `ExternalAgentStreamDoneEvent`
  - `ExternalAgentStreamErrorEvent`
  - `ExternalAgentStreamEvent`
- `ConversationsService` 新增 `streamCreate`，支持创建会话后直接流式生成首轮助手回复。
- 外部流式调用复用内部会话流式执行链路：
  - Runtime SSE
  - Control API fallback
  - RAG 引用
  - Tool Gateway
  - Conversation Run
  - Model Call Log
- 外部流式 `done` 事件返回外部统一响应结构：

```json
{
  "type": "done",
  "result": {
    "conversation_id": "...",
    "run_id": "...",
    "trace_id": "...",
    "answer": "..."
  }
}
```

## SSE 事件

```text
start  执行开始，包含 trace_id、模型、预处理步骤、引用和工具调用摘要
delta  模型增量文本
done   执行完成，result 与非流式响应结构一致
error  执行过程错误
```

## 安全策略

流式调用会额外校验：

```text
allow_stream = true
scope 包含 external:agent:stream
```

并继续复用已有校验：

- API Key 哈希、状态和过期时间
- Agent 白名单
- IP 白名单
- 分钟限流
- 每日额度
- API Key 创建人权限
- `system:api_key:invoke`
- `conversation:chat:manage`
- `agent:agent:use`
- Data Scope
- Resource ACL

## 审计与观测

流式接口仍然走 `operation_log`：

- 有效 API Key 的拒绝请求会记录状态码、API Key 前缀、Agent ID、Request ID 和 Trace ID。
- 成功请求会在流式完成后补充 `external_conversation_id`、`external_run_id`、`external_trace_id`。
- M57 的 API Key 管理中心观测视图会按 `/external/agents/` 路径聚合外部调用，因此同时覆盖非流式和流式接口。

## 前端页面

更新页面：

```text
/api-reference
```

新增内容：

- 非流式 endpoint 和 SSE endpoint 对照
- SSE 事件结构
- SSE 事件示例
- 流式 curl 示例
- 流式 TypeScript fetch reader 示例
- 流式安全校验说明
- 流式常见错误处理

相关文案也同步从“后续 SSE 扩展”改为“允许外部 SSE 调用”：

- API Key 管理中心
- 系统设置中心
- 模块配置

## 参考设计资产

```text
images/frontend-reference-design/外部-api-流式调用/
```

包含：

- Project UI Brief
- 产品 UI 设计图提示词
- 产品原型图提示词
- 组件映射说明

## 当前边界

- M58 不新增数据库表。
- M58 不新增中间件、容器或外部依赖。
- 流式接口当前仅支持首轮创建会话并生成回复，后续如需“指定 conversation_id 继续流式对话”，应作为独立里程碑扩展。
- SSE error 事件用于执行阶段错误；鉴权、scope、白名单、IP、限流和额度等前置失败仍返回标准 HTTP 错误，便于外部系统按状态码处理。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
