'use client';

import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Code2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { resolveControlApiBaseUrl } from '@/lib/control-api-base-url';

const controlApiBaseUrl = resolveControlApiBaseUrl();
const externalChatEndpoint = `${controlApiBaseUrl}/external/agents/{agentId}/chat`;
const externalStreamEndpoint = `${controlApiBaseUrl}/external/agents/{agentId}/chat/stream`;
const externalContinueEndpoint = `${controlApiBaseUrl}/external/agents/{agentId}/conversations/{conversationId}/messages`;
const externalContinueStreamEndpoint = `${controlApiBaseUrl}/external/agents/{agentId}/conversations/{conversationId}/messages/stream`;
const swaggerUrl = controlApiBaseUrl.replace(/\/api\/v1\/?$/, '/api/docs');
const sdkInstallExample = `pnpm add @aiaget/external-api-sdk

import { createAiagetExternalApiClient } from "@aiaget/external-api-sdk";

const client = createAiagetExternalApiClient({
  baseUrl: "${controlApiBaseUrl}",
  apiKey: process.env.AIAGET_API_KEY!
});

const result = await client.chat({
  agentId: "agent-id",
  message: "请总结今天的运行异常"
});`;

const sdkResources = [
  {
    title: 'SDK 包文档',
    path: 'packages/external-api-sdk/README.md',
    href: 'https://gitee.com/yufei_4/aiagent/blob/master/packages/external-api-sdk/README.md',
    meta: '安装与调用',
  },
  {
    title: '接口集成文档',
    path: 'docs/api/external-api-sdk.md',
    href: 'https://gitee.com/yufei_4/aiagent/blob/master/docs/api/external-api-sdk.md',
    meta: '接口与错误码',
  },
  {
    title: '发布前校验',
    path: 'pnpm --filter @aiaget/external-api-sdk pack:check',
    href: 'https://gitee.com/yufei_4/aiagent/blob/master/packages/external-api-sdk/package.json',
    meta: 'typecheck / build / pack',
  },
];

const curlExample = `curl -X POST "${externalChatEndpoint}" \\
  -H "Authorization: Bearer ak_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "请根据知识库总结今天的运行异常",
    "title": "外部系统调用"
  }'`;

const typescriptExample = `const response = await fetch("${externalChatEndpoint}", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": process.env.AIAGET_API_KEY!
  },
  body: JSON.stringify({
    message: "请根据知识库总结今天的运行异常",
    title: "外部系统调用"
  })
});

if (!response.ok) {
  throw new Error(\`Agent 调用失败：\${response.status}\`);
}

const result = await response.json();
console.log(result.answer, result.trace_id);`;

const streamCurlExample = `curl -N -X POST "${externalStreamEndpoint}" \\
  -H "Authorization: Bearer ak_xxx" \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "请流式总结今天的运行异常",
    "title": "外部系统流式调用"
  }'`;

const streamTypescriptExample = `const response = await fetch("${externalStreamEndpoint}", {
  method: "POST",
  headers: {
    "accept": "text/event-stream",
    "content-type": "application/json",
    "x-api-key": process.env.AIAGET_API_KEY!
  },
  body: JSON.stringify({
    message: "请流式总结今天的运行异常",
    title: "外部系统流式调用"
  })
});

if (!response.ok || !response.body) {
  throw new Error(\`Agent 流式调用失败：\${response.status}\`);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  for (;;) {
    const boundary = buffer.indexOf("\\n\\n");
    if (boundary < 0) break;

    const rawEvent = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 2);
    const data = rawEvent
      .split("\\n")
      .find((line) => line.startsWith("data:"))
      ?.slice(5)
      .trim();

    if (!data) continue;
    const event = JSON.parse(data);
    if (event.type === "delta") process.stdout.write(event.delta);
    if (event.type === "done") console.log("\\nTrace:", event.result.trace_id);
  }
}`;

const continueCurlExample = `curl -X POST "${externalContinueEndpoint}" \\
  -H "Authorization: Bearer ak_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "请基于刚才的结论继续给出处理建议"
  }'`;

const continueStreamCurlExample = `curl -N -X POST "${externalContinueStreamEndpoint}" \\
  -H "Authorization: Bearer ak_xxx" \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "请继续流式生成处置步骤"
  }'`;

const responseExample = `{
  "conversation_id": "8b1f...",
  "agent_id": "4f2a...",
  "agent_name": "运维排障助手",
  "agent_code": "ops_copilot",
  "message_id": "7c9e...",
  "run_id": "19a0...",
  "trace_id": "9f4c1b7e...",
  "status": "SUCCESS",
  "answer": "已根据知识库和运行记录生成分析结果。",
  "references": [],
  "tool_calls": [],
  "usage": {
    "prompt_tokens": 820,
    "completion_tokens": 180,
    "total_tokens": 1000,
    "latency_ms": 1260,
    "cost_total": 0.0032
  },
  "created_at": "2026-05-01T09:00:00.000Z"
}`;

const streamEventExample = `event: start
data: {"type":"start","trace_id":"9f4c...","request_model":"qwen-plus","steps":[],"references":[],"tool_calls":[]}

event: delta
data: {"type":"delta","delta":"已根据"}

event: delta
data: {"type":"delta","delta":"知识库生成分析结果。"}

event: done
data: {"type":"done","result":{"conversation_id":"8b1f...","run_id":"19a0...","trace_id":"9f4c...","answer":"已根据知识库生成分析结果。","usage":{"total_tokens":1000}}}`;

const requestFields = [
  { name: 'message', type: 'string', required: '是', limit: '1 到 4000 字符', description: '用户问题或外部系统传入的任务内容。' },
  { name: 'title', type: 'string | null', required: '否', limit: '最多 220 字符', description: '会话标题，仅新建会话时生效，用于会话中心识别来源。' },
];

const responseFields = [
  { name: 'conversation_id', type: 'string', description: '本次外部调用创建的会话 ID。' },
  { name: 'agent_id', type: 'string', description: '被调用的 Agent ID。' },
  { name: 'agent_name / agent_code', type: 'string', description: 'Agent 名称和编码快照。' },
  { name: 'message_id', type: 'string | null', description: '助手消息 ID。' },
  { name: 'run_id', type: 'string | null', description: 'Agent 运行记录 ID。' },
  { name: 'trace_id', type: 'string | null', description: '全链路追踪 ID，可用于监控和审计。' },
  { name: 'status', type: 'ConversationRunStatus | null', description: '运行状态，例如 SUCCESS、FAILED、APPROVAL_REQUIRED。' },
  { name: 'answer', type: 'string', description: 'Agent 返回的中文回答。' },
  { name: 'references', type: 'array', description: 'RAG 引用来源列表。' },
  { name: 'tool_calls', type: 'array', description: '工具调用摘要列表。' },
  { name: 'usage', type: 'object | null', description: '词元、延迟和成本信息。' },
  { name: 'created_at', type: 'string | null', description: '响应生成时间。' },
];

const streamEventFields = [
  { name: 'start', type: 'event', description: '流式执行开始，包含 trace_id、模型、预处理步骤、引用和工具调用摘要。' },
  { name: 'delta', type: 'event', description: '模型增量文本片段，客户端应按顺序追加 `delta`。' },
  { name: 'done', type: 'event', description: '流式执行完成，`result` 字段与非流式响应结构保持一致。' },
  { name: 'error', type: 'event', description: '流式执行过程中发生错误，包含中文错误信息。' },
];

const webhookFields = [
  { name: 'id', type: 'string', description: 'Webhook 投递事件 ID，对应 x-aiaget-delivery-id。' },
  { name: 'event', type: 'agent.run.completed', description: '事件类型，当前表示 Agent 运行完成。' },
  { name: 'created_at', type: 'string', description: '事件创建时间。' },
  { name: 'tenant_id / api_key_id', type: 'string', description: '租户和 API Key 标识。' },
  { name: 'agent_id / conversation_id / run_id', type: 'string | null', description: 'Agent、会话和运行记录标识。' },
  { name: 'trace_id', type: 'string | null', description: '全链路追踪 ID。' },
  { name: 'status', type: 'ConversationRunStatus | null', description: '运行状态。' },
  { name: 'result', type: 'ExternalAgentChatResponse', description: '与非流式响应一致的 Agent 调用结果。' },
];

const managementEndpoints = [
  { method: 'GET', path: '/api/v1/api-keys', permission: 'system:api_key:view', description: '脱敏列表与额度状态。' },
  { method: 'POST', path: '/api/v1/api-keys', permission: 'system:api_key:manage', description: '创建密钥；明文只返回一次。' },
  { method: 'DELETE', path: '/api/v1/api-keys/{id}', permission: 'system:api_key:manage', description: '删除后立即失效。' },
];

const externalEndpoints = [
  { method: 'POST', path: '/api/v1/external/agents/{agentId}/chat', mode: '新建会话', stream: '否', scope: 'external:agent:chat' },
  { method: 'POST', path: '/api/v1/external/agents/{agentId}/chat/stream', mode: '新建会话', stream: '是', scope: 'external:agent:stream' },
  { method: 'POST', path: '/api/v1/external/agents/{agentId}/conversations/{conversationId}/messages', mode: '继续会话', stream: '否', scope: 'external:agent:chat' },
  { method: 'POST', path: '/api/v1/external/agents/{agentId}/conversations/{conversationId}/messages/stream', mode: '继续会话', stream: '是', scope: 'external:agent:stream' },
];

const securityChecks = [
  '校验 API Key 哈希、状态和过期时间',
  '校验 scope，非流式调用需要 external:agent:chat，流式调用需要 external:agent:stream',
  '流式调用额外校验 allow_stream=true',
  '校验 Agent 白名单，空白名单仍会继续检查用户权限',
  '继续会话时校验 conversation_id 属于当前 Agent 和租户',
  '校验 IP 白名单、分钟限流和每日额度',
  '调用完成后按 API Key 配置异步投递 Webhook',
  '把 API Key 创建人还原成真实用户身份',
  '校验 system:api_key:invoke、conversation:chat:manage、agent:agent:use',
  '校验 Agent / Conversation 数据权限和 Resource ACL',
  '进入 Conversation / Runtime / RAG / Tool Gateway / Audit / Trace 链路',
];

const errorRows = [
  { status: '401', reason: 'Missing API key', handling: '检查 Authorization Bearer 或 x-api-key 请求头。' },
  { status: '401', reason: 'Invalid API key', handling: '确认密钥没有被删除，且使用的是创建时的一次性明文值。' },
  { status: '401', reason: 'Expired API key', handling: '重新创建或延长密钥过期时间。' },
  { status: '403', reason: 'API key scope denied', handling: '密钥 scope 需要包含 external:agent:chat。' },
  { status: '403', reason: 'API key does not allow streaming', handling: '开启密钥 allow_stream，并确保 scope 包含 external:agent:stream。' },
  { status: '403', reason: 'API key is not allowed to call this agent', handling: '检查 Agent 白名单是否包含当前 agentId。' },
  { status: '403', reason: 'External API conversation is unavailable', handling: '确认 conversationId 属于当前 agentId，并且会话未归档或删除。' },
  { status: '403', reason: 'API key IP allowlist denied', handling: '把调用方出口 IP 加入白名单，或清空白名单表示不限。' },
  { status: '429', reason: 'API key rate limit exceeded', handling: '降低调用频率或提高分钟限流。' },
  { status: '429', reason: 'API key daily quota exceeded', handling: '等待额度重置或提高每日额度。' },
];

const webhookExample = `POST https://example.com/aiaget/webhooks
x-aiaget-event: agent.run.completed
x-aiaget-delivery-id: evt_xxx
x-aiaget-timestamp: 1767225600
x-aiaget-signature: sha256=<hmac>
Content-Type: application/json

{
  "id": "evt_xxx",
  "event": "agent.run.completed",
  "created_at": "2026-05-01T09:00:00.000Z",
  "tenant_id": "tenant-id",
  "api_key_id": "api-key-id",
  "api_key_prefix": "ak_xxx",
  "agent_id": "agent-id",
  "conversation_id": "conversation-id",
  "run_id": "run-id",
  "trace_id": "trace-id",
  "status": "SUCCESS",
  "result": {
    "conversation_id": "conversation-id",
    "answer": "已根据知识库生成分析结果。"
  }
}`;

const webhookVerifyExample = `import { verifyAiagetWebhookSignature } from "@aiaget/external-api-sdk";

const rawBody = await request.text();
const isValid = await verifyAiagetWebhookSignature({
  secret: process.env.AIAGET_WEBHOOK_SECRET!,
  timestamp: request.headers.get("x-aiaget-timestamp") ?? "",
  signature: request.headers.get("x-aiaget-signature"),
  body: rawBody
});

if (!isValid) {
  throw new Error("Webhook 签名无效");
}`;

export default function ApiReferencePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const metrics = useMemo(
    () => [
      { label: '开放接口', value: `${externalEndpoints.length}`, helper: '新建 + 续聊' },
      { label: '鉴权方式', value: '2', helper: 'Bearer / x-api-key' },
      { label: '请求字段', value: '2', helper: 'message + title' },
      { label: '流式事件', value: `${streamEventFields.length}`, helper: 'start/delta/done/error' },
    ],
    [],
  );

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-8 lg:px-6">
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 md:flex-row md:items-start">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">开放接口</StatusBadge>
            <StatusBadge tone="ready">SSE 流式</StatusBadge>
            <StatusBadge tone="ready">会话续聊</StatusBadge>
            <StatusBadge tone="healthy">Webhook 回调</StatusBadge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">开放接口文档中心</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void copyText('endpoint', externalStreamEndpoint)} type="button" variant="outline">
            <Clipboard className="size-4" />
            {copied === 'endpoint' ? '已复制' : '复制接口'}
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/api-keys">
              <KeyRound className="size-4" />
              管理 API Key
            </a>
          </Button>
          <Button asChild type="button">
            <a href={swaggerUrl} rel="noreferrer" target="_blank">
              Swagger
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm" key={metric.label}>
            <div className="text-xs font-medium text-muted-foreground">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" id="sdk-package">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="size-4 text-primary" />
            SDK 包文档
          </div>
          <div className="grid gap-3">
            {sdkResources.map((resource) => (
              <a
                className="group grid gap-2 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                href={resource.href}
                key={resource.path}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{resource.title}</span>
                  <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <div className="break-all font-mono text-xs text-muted-foreground">{resource.path}</div>
                <div className="text-xs text-muted-foreground">{resource.meta}</div>
              </a>
            ))}
          </div>
        </Card>

        <CodeCard
          code={sdkInstallExample}
          copied={copied === 'sdk-install'}
          icon={<Code2 className="size-4 text-primary" />}
          title="SDK 快速调用样例"
          onCopy={() => void copyText('sdk-install', sdkInstallExample)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TerminalSquare className="size-4 text-primary" />
            接口入口
          </div>
          <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
            <div className="text-xs font-medium text-muted-foreground">Endpoint</div>
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
              <span className="min-w-0 flex-1 break-all">POST {externalChatEndpoint}</span>
              <Button onClick={() => void copyText('endpoint-line', `POST ${externalChatEndpoint}`)} size="sm" type="button" variant="outline">
                {copied === 'endpoint-line' ? '已复制' : '复制'}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
            <div className="text-xs font-medium text-muted-foreground">SSE Endpoint</div>
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
              <span className="min-w-0 flex-1 break-all">POST {externalStreamEndpoint}</span>
              <Button onClick={() => void copyText('stream-endpoint-line', `POST ${externalStreamEndpoint}`)} size="sm" type="button" variant="outline">
                {copied === 'stream-endpoint-line' ? '已复制' : '复制'}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <AuthMethod title="Bearer Token" value="Authorization: Bearer ak_xxx" />
            <AuthMethod title="API Key Header" value="x-api-key: ak_xxx" />
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800">
            流式调用需要密钥开启 `allow_stream`，并包含 `external:agent:stream` scope；其他 Agent 白名单、IP 白名单、限流、额度和资源授权继续生效。
          </div>
        </Card>
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <TerminalSquare className="size-4 text-primary" />
          外部接口矩阵
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['方法', '路径', '模式', '流式', 'Scope'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {externalEndpoints.map((endpoint) => (
                <tr className="border-b last:border-0" key={endpoint.path}>
                  <td className="px-4 py-3"><StatusBadge tone="mock">{endpoint.method}</StatusBadge></td>
                  <td className="px-4 py-3 font-mono text-xs">{endpoint.path}</td>
                  <td className="px-4 py-3">{endpoint.mode}</td>
                  <td className="px-4 py-3">{endpoint.stream}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{endpoint.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <SchemaCard title="请求体字段" rows={requestFields} />
        <SchemaCard title="响应字段" rows={responseFields} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SchemaCard title="SSE 事件结构" rows={streamEventFields} />
        <CodeCard
          code={streamEventExample}
          copied={copied === 'stream-event'}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="SSE 事件样例"
          onCopy={() => void copyText('stream-event', streamEventExample)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <SchemaCard title="Webhook 事件结构" rows={webhookFields} />
        <div className="grid gap-4">
          <CodeCard
            code={webhookExample}
            copied={copied === 'webhook-example'}
            icon={<TerminalSquare className="size-4 text-primary" />}
            title="Webhook 投递样例"
            onCopy={() => void copyText('webhook-example', webhookExample)}
          />
          <CodeCard
            code={webhookVerifyExample}
            copied={copied === 'webhook-verify'}
            icon={<Code2 className="size-4 text-primary" />}
            title="Webhook 签名校验样例"
            onCopy={() => void copyText('webhook-verify', webhookVerifyExample)}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CodeCard
          code={curlExample}
          copied={copied === 'curl'}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="curl 请求样例"
          onCopy={() => void copyText('curl', curlExample)}
        />
        <CodeCard
          code={typescriptExample}
          copied={copied === 'typescript'}
          icon={<Code2 className="size-4 text-primary" />}
          title="TypeScript fetch 请求样例"
          onCopy={() => void copyText('typescript', typescriptExample)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CodeCard
          code={continueCurlExample}
          copied={copied === 'continue-curl'}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="续聊 curl 请求样例"
          onCopy={() => void copyText('continue-curl', continueCurlExample)}
        />
        <CodeCard
          code={continueStreamCurlExample}
          copied={copied === 'continue-stream-curl'}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="续聊流式 curl 请求样例"
          onCopy={() => void copyText('continue-stream-curl', continueStreamCurlExample)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CodeCard
          code={streamCurlExample}
          copied={copied === 'stream-curl'}
          icon={<TerminalSquare className="size-4 text-primary" />}
          title="流式 curl 请求样例"
          onCopy={() => void copyText('stream-curl', streamCurlExample)}
        />
        <CodeCard
          code={streamTypescriptExample}
          copied={copied === 'stream-typescript'}
          icon={<Code2 className="size-4 text-primary" />}
          title="流式 TypeScript 请求样例"
          onCopy={() => void copyText('stream-typescript', streamTypescriptExample)}
        />
      </section>

      <CodeCard
        code={responseExample}
        copied={copied === 'response'}
        icon={<CheckCircle2 className="size-4 text-primary" />}
        title="响应样例"
        onCopy={() => void copyText('response', responseExample)}
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-primary" />
            API Key 管理接口
          </div>
          <div className="grid gap-3">
            {managementEndpoints.map((endpoint) => (
              <div className="grid gap-2 rounded-md border bg-muted/20 p-3" key={`${endpoint.method}-${endpoint.path}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="mock">{endpoint.method}</StatusBadge>
                  <span className="font-mono text-xs">{endpoint.path}</span>
                </div>
                <div className="text-xs text-muted-foreground">权限：{endpoint.permission}</div>
                <p className="text-sm leading-6 text-muted-foreground">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            安全校验链路
          </div>
          <div className="grid gap-2">
            {securityChecks.map((item, index) => (
              <div className="flex gap-3 rounded-md border bg-background/90 px-3 py-2 text-sm" key={item}>
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="leading-6">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ArrowRight className="size-4 text-primary" />
          常见错误与处理
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['HTTP', '原因', '处理方式'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errorRows.map((row) => (
                <tr className="border-b last:border-0" key={`${row.status}-${row.reason}`}>
                  <td className="px-4 py-3 font-mono text-xs">{row.status}</td>
                  <td className="px-4 py-3 font-medium">{row.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.handling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function AuthMethod({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 break-all font-mono text-xs">{value}</div>
    </div>
  );
}

function SchemaCard({
  rows,
  title,
}: {
  rows: Array<{ name: string; type: string; required?: string; limit?: string; description: string }>;
  title: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {['字段', '类型', '约束', '说明'].map((column) => (
                <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b last:border-0" key={row.name}>
                <td className="px-4 py-3 font-mono text-xs">{row.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{[row.required ? `必填：${row.required}` : null, row.limit].filter(Boolean).join(' · ') || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CodeCard({
  code,
  copied,
  icon,
  title,
  onCopy,
}: {
  code: string;
  copied: boolean;
  icon: React.ReactNode;
  title: string;
  onCopy: () => void;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <Button onClick={onCopy} size="sm" type="button" variant="outline">
          <Clipboard className="size-4" />
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <pre className="max-h-[520px] overflow-auto rounded-md border bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </Card>
  );
}
