# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 开放接口文档中心 at `/api-reference`
- Users/roles: 租户管理员、API Key 管理员、外部系统接入研发、运维和审计人员
- Main task flow: 选择调用模式 -> 复制 endpoint -> 理解鉴权和 scope -> 查看请求/响应/stream 事件 -> 复制代码示例 -> 进入 API Key 管理或观测排查
- API/service contract:
  - `POST /api/v1/external/agents/{agentId}/chat`
  - `POST /api/v1/external/agents/{agentId}/chat/stream`
  - `GET /api/v1/api-keys/external-observability?window=24h|7d`
- Data entities and fields:
  - API Key: `allow_stream`, scopes, whitelist, quota
  - Request: `message`, `title`
  - Stream events: `start`, `delta`, `done`, `error`
  - Trace: `conversation_id`, `run_id`, `trace_id`

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Show clear regions:
  - hero/status bar
  - endpoint comparison cards
  - auth and policy requirements
  - request fields
  - stream lifecycle/event schema
  - curl/fetch examples
  - errors and observability links
- Keep component boundaries obvious so a frontend engineer can map each region to existing `Card`, `Button`, `MetricCard`, and `StatusBadge`.
- Include copy states and permission notes.

Avoid:
- decorative rendering
- invented API fields
- unrealistic navigation or unrelated actions
