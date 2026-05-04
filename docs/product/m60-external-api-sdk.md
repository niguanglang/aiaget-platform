# M60 外部 API SDK / 示例包

## 目标

M60 把已完成的外部 Agent 调用能力沉淀为可复用 TypeScript SDK，方便第三方服务端、自动化任务和前端系统集成企业 Agent 平台。

## 已实现

新增 workspace 包：

```text
packages/external-api-sdk
```

包名：

```text
@aiaget/external-api-sdk
```

## SDK 能力

- 新建 Agent 会话：`client.chat(agentId, input)`
- 继续 Agent 会话：`client.continueChat(agentId, conversationId, input)`
- 新建 Agent 流式会话：`client.streamChat(agentId, input, callbacks)`
- 继续 Agent 流式会话：`client.streamContinueChat(agentId, conversationId, input, callbacks)`
- Bearer Token / `x-api-key` 鉴权
- `x-request-id` / `x-trace-id` / 自定义 headers
- `AbortSignal`
- SSE `start` / `delta` / `done` / `error` 事件解析
- 统一错误类型 `AiagetExternalApiError`

## 示例文件

```text
packages/external-api-sdk/examples/basic-chat.ts
packages/external-api-sdk/examples/stream-chat.ts
```

示例使用环境变量：

```bash
AIAGET_BASE_URL=http://localhost:3001/api/v1
AIAGET_API_KEY=ak_xxx
AIAGET_AGENT_ID=agent-id
```

## 文档

新增 API 文档：

```text
docs/api/external-api-sdk.md
```

包内文档：

```text
packages/external-api-sdk/README.md
```

## 当前边界

- M60 不新增数据库表。
- M60 不新增中间件、容器或外部依赖。
- SDK 当前是 workspace 内部包，后续如需发布 npm，需要补正式 build 输出、版本策略和发布流水线。
- 示例文件是接入样例，不会在默认服务启动中运行。

## 验证

- `pnpm --filter @aiaget/external-api-sdk typecheck`
- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
