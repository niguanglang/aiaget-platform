# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS documentation page.

Project context:
- Product/module: 企业 Agent 平台 / 开放接口文档中心 / 外部 API 会话续聊
- Page/route: `/api-reference`
- Target users/roles: 外部系统接入研发、租户管理员、API Key 管理员、运维和审计人员
- Business goal: 让外部系统理解如何用 `conversation_id` 继续同一 Agent 会话，支持非流式和 SSE 流式两种模式
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件

Interface contract that must appear:
- New conversation:
  - `POST /api/v1/external/agents/{agentId}/chat`
  - `POST /api/v1/external/agents/{agentId}/chat/stream`
- Continue conversation:
  - `POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages`
  - `POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages/stream`
- Request fields: `message`, `title` for new conversation only
- Response/stream done fields: `conversation_id`, `run_id`, `trace_id`, `answer`, `usage`
- Security: API Key, Agent whitelist, conversation belongs to Agent, data scope, Resource ACL, quota

Design requirements:
- Show a clear flow: create conversation -> store conversation_id -> continue conversation -> trace/audit.
- Use endpoint comparison cards, code examples, schema tables, and security chain cards.
- Keep minimal, technical, premium, clean product feel.
- Chinese text only.

Avoid:
- unrelated fake modules
- decorative charts
- excessive glow or gradients
