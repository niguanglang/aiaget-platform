# @aiaget/external-api-sdk

企业 Agent 平台外部 API 的轻量 TypeScript SDK，用于服务端或浏览器环境调用已授权 Agent。

## 安装

```bash
pnpm add @aiaget/external-api-sdk
```

当前仓库内使用 workspace 包：

```ts
import { createAiagetExternalApiClient } from '@aiaget/external-api-sdk';
```

## 创建客户端

```ts
const client = createAiagetExternalApiClient({
  baseUrl: 'http://localhost:3001/api/v1',
  apiKey: process.env.AIAGET_API_KEY!,
});
```

## 新建会话

```ts
const result = await client.chat('agent-id', {
  message: '请总结今天的运行异常',
  title: '外部系统调用',
});

console.log(result.answer, result.conversation_id, result.trace_id);
```

## 继续会话

```ts
const result = await client.continueChat('agent-id', 'conversation-id', {
  message: '基于刚才的结论继续给出处理建议',
});

console.log(result.answer);
```

## 流式新建会话

```ts
const stream = await client.streamChat('agent-id', {
  message: '请流式生成分析结果',
}, {
  onDelta: (delta) => process.stdout.write(delta),
  onDone: (result) => console.log('\nTrace:', result.trace_id),
});

console.log(stream.result?.conversation_id);
```

## 流式续聊

```ts
await client.streamContinueChat('agent-id', 'conversation-id', {
  message: '请继续流式生成处置步骤',
}, {
  onDelta: (delta) => process.stdout.write(delta),
});
```

## Webhook 签名校验

```ts
import { verifyAiagetWebhookSignature } from '@aiaget/external-api-sdk';

const rawBody = await request.text();
const isValid = await verifyAiagetWebhookSignature({
  secret: process.env.AIAGET_WEBHOOK_SECRET!,
  timestamp: request.headers.get('x-aiaget-timestamp') ?? '',
  signature: request.headers.get('x-aiaget-signature'),
  body: rawBody,
});
```

## 权限要求

- 非流式调用需要 `external:agent:chat` scope。
- 流式调用需要 `external:agent:stream` scope，并且 API Key 开启 `allow_stream`。
- 续聊接口要求 `conversation_id` 属于当前租户和当前 Agent。
- Agent 白名单、IP 白名单、限流、额度、数据权限和 Resource ACL 仍然由后端校验。
- Webhook 回调是异步投递，失败会记录到 API Key 最近投递状态，不阻塞主调用。
