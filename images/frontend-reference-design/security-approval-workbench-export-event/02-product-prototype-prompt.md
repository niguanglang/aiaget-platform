# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 来源筛选选择审批工作台 -> 搜索导出事件 -> 打开详情 -> 查看导出数量和筛选条件 -> 复制链路 ID 或跳转监控
- API/service contract: security center events list, security center event detail
- Data entities and fields: `source`, `title`, `reason`, `request_id`, `trace_id`, `occurred_at`, `resource_type`, `resource_id`, `request_summary`, `operator`
- Actions and states: 来源筛选、关键词搜索、时间窗口、只看可追踪、详情、复制、跳转监控；加载、空、错误、无 Trace

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout:
  - Security event card title and description.
  - Filter row with keyword, source select including 审批工作台, window, trace-only checkbox.
  - Event table where approval export rows show source chip 审批工作台.
  - Detail drawer with export summary tiles, request/trace controls, JSON panels.
- Make component boundaries obvious so implementation can map to existing React components.

Avoid:
- Invented backend fields.
- New route or unrelated modules.
- Marketing hero layout.
