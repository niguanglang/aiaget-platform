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
- `idempotency_key` 请求体透传，用于外部系统重试去重
- `AbortSignal`
- SSE `start` / `delta` / `done` / `error` 事件解析
- 统一错误类型 `AiagetExternalApiError`
- Webhook `sha256=` 签名校验，包含默认 300 秒时间窗

## 示例文件

```text
packages/external-api-sdk/examples/basic-chat.ts
packages/external-api-sdk/examples/stream-chat.ts
packages/external-api-sdk/examples/idempotency-chat.ts
packages/external-api-sdk/examples/webhook-verify.ts
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
- SDK 已整理为可发布 npm 包形态，运行时不依赖 monorepo workspace 包，并提供 `build`、`prepack` 和 `pack:check` 发布前校验命令。
- SDK 发布质量门禁覆盖行为测试、示例类型检查、npm dry-run 打包检查和包元数据校验。
- 正式发布流水线仍由仓库 CI 或人工 release 流程触发；本模块只提供离线可验证的打包契约，不自动执行 npm publish。
- 示例文件是接入样例，不会在默认服务启动中运行。

## 发布前检查

```bash
pnpm --filter @aiaget/external-api-sdk test
pnpm --filter @aiaget/external-api-sdk typecheck
pnpm --filter @aiaget/external-api-sdk typecheck:examples
pnpm --filter @aiaget/external-api-sdk build
pnpm --filter @aiaget/external-api-sdk pack:check
node --test scripts/tests/validate-external-sdk-package.test.mjs
pnpm verify:sdk-release
```

版本策略：

```text
PATCH：兼容修复、文档或内部实现调整。
MINOR：新增兼容 API、事件字段或辅助函数。
MAJOR：移除或改变公开类型、方法签名、鉴权语义或错误结构。
```

## 验证

- `pnpm --filter @aiaget/external-api-sdk typecheck`
- `pnpm --filter @aiaget/external-api-sdk test`
- `pnpm --filter @aiaget/external-api-sdk typecheck:examples`
- `pnpm --filter @aiaget/external-api-sdk pack:check`
- `node --test scripts/tests/validate-external-sdk-package.test.mjs`
- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
