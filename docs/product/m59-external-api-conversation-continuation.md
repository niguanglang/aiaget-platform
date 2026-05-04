# M59 外部 API 会话续聊

## 目标

M59 让外部系统可以复用已经创建的 `conversation_id` 继续同一 Agent 会话，而不是每次调用都新建会话。该能力同时支持非流式 JSON 响应和 SSE 流式响应。

## 已实现

新增外部续聊接口：

```http
POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages
POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages/stream
```

现有新建会话接口保持可用：

```http
POST /api/v1/external/agents/{agentId}/chat
POST /api/v1/external/agents/{agentId}/chat/stream
```

## 后端实现

- `ExternalApiController` 新增：
  - `continueChat`
  - `streamContinueChat`
- `ExternalApiService` 新增：
  - `continueChat`
  - `streamContinueChat`
- `ExternalApiKeyService` 新增：
  - `authenticateConversation`

续聊接口复用现有会话执行链路：

- `ConversationsService.sendMessage`
- `ConversationsService.streamMessage`
- Runtime / Control fallback
- RAG 引用
- Tool Gateway
- Conversation Run
- Model Call Log
- Operation Log
- Trace 上下文

## 权限与安全

续聊会执行以下校验：

- API Key 哈希、状态、过期时间
- scope：
  - 非流式续聊：`external:agent:chat`
  - 流式续聊：`external:agent:stream`
- 流式开关：`allow_stream = true`
- Agent 白名单
- IP 白名单
- 分钟限流
- 每日额度
- API Key 创建人有效性
- `system:api_key:invoke`
- `conversation:chat:manage`
- `agent:agent:use`
- Agent 数据范围
- Agent Resource ACL
- `conversation_id` 属于当前租户和当前 Agent
- Conversation 数据范围
- Conversation Resource ACL

## 审计与观测

续聊请求会继续写入 `operation_log`，并在完成后补充：

- `api_key_id`
- `api_key_prefix`
- `external_agent_id`
- `external_conversation_id`
- `external_run_id`
- `external_trace_id`

因此 M57 外部 API 调用观测视图会同时覆盖：

- 新建非流式调用
- 新建流式调用
- 续聊非流式调用
- 续聊流式调用

## 前端页面

更新页面：

```text
/api-reference
```

新增内容：

- 外部接口矩阵
- 新建会话 / 继续会话区分
- 续聊非流式 curl 示例
- 续聊流式 curl 示例
- `conversation_id` 保存与复用说明
- 续聊安全校验说明
- 续聊常见错误处理

## 参考设计资产

```text
images/frontend-reference-design/外部-api-会话续聊/
```

包含：

- Project UI Brief
- 产品 UI 设计图提示词
- 产品原型图提示词
- 组件映射说明

## 当前边界

- M59 不新增数据库表。
- M59 不新增中间件、容器或外部依赖。
- 续聊接口要求 URL 中的 `agentId` 与 `conversationId` 的所属 Agent 一致。
- `title` 字段只在新建会话时生效；续聊接口只使用 `message`。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
