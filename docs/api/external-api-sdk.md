# 外部 API SDK

M60 提供 `@aiaget/external-api-sdk`，用于第三方服务端或前端系统调用企业 Agent 平台开放接口。

## 支持能力

- 新建 Agent 会话
- 新建 Agent 流式会话
- 使用 `conversation_id` 继续会话
- 使用 `conversation_id` 继续流式会话
- Bearer Token / `x-api-key` 鉴权
- SSE `start` / `delta` / `done` / `error` 事件解析
- Webhook 签名生成与校验辅助函数
- 统一错误类型 `AiagetExternalApiError`

## 基础用法

```ts
import { createAiagetExternalApiClient } from '@aiaget/external-api-sdk';

const client = createAiagetExternalApiClient({
  baseUrl: 'http://localhost:3001/api/v1',
  apiKey: process.env.AIAGET_API_KEY!,
});

const result = await client.chat('agent-id', {
  message: '请总结今天的运行异常',
  title: '外部系统调用',
});

console.log(result.answer);
```

## 发布前检查

SDK 包已经按 npm 发布形态整理，运行时不依赖 monorepo workspace 包。发布前执行：

```bash
pnpm --filter @aiaget/external-api-sdk typecheck
pnpm --filter @aiaget/external-api-sdk build
pnpm --filter @aiaget/external-api-sdk pack:check
```

正式发布时使用语义化版本：

```text
PATCH：兼容修复、文档或内部实现调整。
MINOR：新增兼容 API、事件字段或辅助函数。
MAJOR：移除或改变公开类型、方法签名、鉴权语义或错误结构。
```

## 续聊

```ts
const result = await client.continueChat('agent-id', 'conversation-id', {
  message: '请基于刚才的结论继续给出处理建议',
});

console.log(result.answer);
```

## 流式调用

```ts
await client.streamChat('agent-id', {
  message: '请流式生成分析结果',
}, {
  onDelta: (delta) => process.stdout.write(delta),
  onDone: (result) => console.log(result.trace_id),
});
```

## 流式续聊

```ts
await client.streamContinueChat('agent-id', 'conversation-id', {
  message: '请继续生成处置步骤',
}, {
  onDelta: (delta) => process.stdout.write(delta),
});
```

## 环境变量示例

```bash
AIAGET_BASE_URL=http://localhost:3001/api/v1
AIAGET_API_KEY=ak_xxx
AIAGET_AGENT_ID=agent-id
```

## 鉴权模式

默认使用 Bearer Token：

```ts
createAiagetExternalApiClient({
  baseUrl,
  apiKey,
  authMode: 'bearer',
});
```

也可以使用 `x-api-key`：

```ts
createAiagetExternalApiClient({
  baseUrl,
  apiKey,
  authMode: 'x-api-key',
});
```

## 错误处理

```ts
import { AiagetExternalApiError } from '@aiaget/external-api-sdk';

try {
  await client.chat('agent-id', { message: '测试' });
} catch (error) {
  if (error instanceof AiagetExternalApiError) {
    console.error(error.status, error.message, error.requestId);
  }
}
```

## Webhook 签名校验

M61 后，API Key 可配置运行完成回调。平台会在 Agent 调用完成后向回调地址发送 `agent.run.completed` 事件。

回调请求头：

```text
x-aiaget-event: agent.run.completed
x-aiaget-delivery-id: evt_xxx
x-aiaget-timestamp: 1767225600
x-aiaget-signature: sha256=<hmac>
```

服务端可以这样校验：

```ts
import { verifyAiagetWebhookSignature } from '@aiaget/external-api-sdk';

const rawBody = await request.text();
const valid = await verifyAiagetWebhookSignature({
  secret: process.env.AIAGET_WEBHOOK_SECRET!,
  timestamp: request.headers.get('x-aiaget-timestamp') ?? '',
  signature: request.headers.get('x-aiaget-signature'),
  body: rawBody,
});

if (!valid) {
  throw new Error('Webhook 签名无效');
}
```

## 权限要求

- 非流式调用需要 API Key scope 包含 `external:agent:chat`。
- 流式调用需要 API Key scope 包含 `external:agent:stream`，并开启 `allow_stream`。
- 续聊接口要求 `conversation_id` 属于当前租户和当前 Agent。
- Agent 白名单、IP 白名单、分钟限流、每日额度、数据范围和 Resource ACL 继续由后端强制校验。
- Webhook 投递失败不会影响外部 API 主调用响应，最近投递状态会记录在 API Key 列表中。
