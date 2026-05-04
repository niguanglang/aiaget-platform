# Project UI Brief

- Page: 安全中心 / 安全事件详情中心
- Route: `/security`
- Feature goal: 将统一安全审批工作台 CSV 导出事件纳入安全事件检索与详情抽屉，让审计员可以在安全中心按来源筛选、查看导出范围、导出数量、request_id 和 trace_id。
- Users: 租户管理员、安全管理员、审计员；查看需要 `security:rule:view`。
- APIs/services:
  - `GET /security-center/events`
  - `GET /security-center/events/:eventId`
  - 已有导出写入事件：`platform.security.approval_workbench.exported`
- Entities/fields/statuses:
  - `SecurityCenterEventSource`: 新增 `APPROVAL_WORKBENCH`
  - `SecurityCenterEventListItem`: `source`, `title`, `reason`, `resource_type`, `resource_id`, `action`, `request_id`, `trace_id`, `occurred_at`, `severity`
  - `SecurityCenterEventDetail`: `subject`, `resource`, `context`, `request_summary`, `operator`, `ip`, `user_agent`
  - platform event payload: `exported_count`, `filter`
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格；复用 `SecurityEventCenterCard`, `SecurityEventDetailDrawer`, `StatusBadge`, `SummaryTile`, `JsonReadonlyPanel`。
- Required states: loading, empty, error, disabled, detail loading, trace missing.
- Constraints: 前端可见文案使用中文；不新增路由、不新增数据库表、不新增中间件、不启动容器；复用现有安全事件中心，不新增独立页面。
