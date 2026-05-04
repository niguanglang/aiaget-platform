# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全事件详情中心 inside `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 查看安全态势 -> 筛选拒绝事件 -> 打开详情抽屉 -> 检查主体/资源/上下文 -> 跳转 trace
- API/service contract: `GET /security-center/overview`, `GET /security-center/events`, `GET /security-center/events/:eventId`
- Data entities and fields: source, title, reason, resource_type, resource_id, action, method, path, status_code, request_id, trace_id, occurred_at, subject, resource, context, matched_code
- Actions and states: search, source filter, time window filter, trace-only toggle, details drawer, loading, empty, error, disabled trace action

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and interaction states.
- Show page regions:
  1. top safety posture metrics
  2. existing module/risk overview
  3. security event toolbar
  4. paginated security event table
  5. right-side detail drawer with summary and JSON panels
  6. empty/error/loading placeholders
- Make component boundaries obvious for mapping to existing React components.
- Keep all labels in Chinese.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
