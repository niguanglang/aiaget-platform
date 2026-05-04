# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 开放接口文档中心
- Page/route: 开放接口文档中心 at `/api-reference`
- Target users/roles: enterprise integration developers, tenant admins, API Key managers
- Business goal: Document how external systems call an authorized Agent using tenant API Key, including authentication, request/response schema, curl/TypeScript examples, error codes, and security checks.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, local shadcn-style components, lucide icons, motion.
- Existing page shell/layout: Enterprise console shell with left navigation, topbar, and protected auth guard. Build a focused documentation/product page with top hero, endpoint summary, code examples, schema cards, security chain, and next-step links.

Interface contract that must appear in the UI:
- Endpoint: `POST /api/v1/external/agents/{agentId}/chat`
- Headers: `Authorization: Bearer ak_xxx` or `x-api-key: ak_xxx`
- Request: `message` required string 1-4000 chars, `title` optional string max 220 chars
- Response: `conversation_id`, `agent_id`, `agent_name`, `agent_code`, `message_id`, `run_id`, `trace_id`, `status`, `answer`, `references`, `tool_calls`, `usage`, `created_at`
- API Key management endpoints: `GET /api/v1/api-keys`, `POST /api/v1/api-keys`, `DELETE /api/v1/api-keys/{id}`
- Security checks: key status, expiry, scope, Agent allowlist, IP allowlist, rate limit, daily quota, owner permissions, data scope, Resource ACL, audit/trace
- Navigation and permission: visible as module `api_reference` with route `/api-reference`, permission `system:api_key:view`, icon `BookOpen`

Design requirements:
- Make it look like production technical product documentation inside a modern enterprise SaaS.
- Use Chinese copy only.
- Use Bento/Dashboard layout: endpoint overview, auth methods, schema cards, code samples, security chain, error code table.
- Use subtle borders, soft shadows, restrained backdrop blur, clean hierarchy.
- Include copy buttons for endpoint, curl and TypeScript examples.
- Clearly say streaming external endpoint is not exposed yet.

Avoid:
- invented endpoints or fields
- fake SDK package names
- marketing landing page feel
- emojis, excessive gradients, cheap glow
