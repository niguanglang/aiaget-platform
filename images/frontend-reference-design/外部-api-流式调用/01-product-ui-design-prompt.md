# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 开放接口文档中心 / 外部 SSE 流式调用
- Page/route: 开放接口文档中心 at `/api-reference`
- Target users/roles: 租户管理员、API Key 管理员、外部系统接入研发、运维和审计人员
- Business goal: 让外部系统清楚区分非流式 Agent 调用和 SSE 流式 Agent 调用，理解鉴权、scope、事件格式、安全校验和观测入口
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 企业控制台布局，左侧导航 + 顶部栏，内容区使用 Bento/Dashboard 文档布局

Interface contract that must appear in the UI:
- Endpoints:
  - `POST /api/v1/external/agents/{agentId}/chat`
  - `POST /api/v1/external/agents/{agentId}/chat/stream`
- Auth: `Authorization: Bearer ak_xxx` and `x-api-key: ak_xxx`
- Request fields: `message`, `title`
- Stream events: `start`, `delta`, `done`, `error`
- Required scope: non-stream uses `external:agent:chat`; stream uses `external:agent:stream`
- API Key policy fields: `allow_stream`, Agent 白名单、IP 白名单、分钟限流、每日额度、过期时间
- Observability fields: `conversation_id`, `run_id`, `trace_id`, request id, audit link

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use a top comparison band for non-stream vs stream endpoints.
- Use cards for auth, stream event lifecycle, code examples, security checks, common errors, and observability links.
- Keep the visual style minimal, technical, premium, and highly readable.
- Include subtle borders, soft shadows, glass-like cards, restrained gradient mesh background, and clean spacing.
- Show Chinese interface copy only.

Avoid:
- fake backend fields not listed above
- excessive glow or decorative gradients
- unreadable tiny text
- invented workflow builders or unrelated modules
