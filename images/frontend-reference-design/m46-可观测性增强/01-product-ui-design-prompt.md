# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS observability page.

Project context:
- Product/module: 企业 Agent 平台控制台，监控中心。
- Page/route: M46 可观测性增强 at `/monitor`.
- Target users/roles: 租户管理员、运营、安全管理员、审计员；读取权限 `monitor:log:view`。
- Business goal: 在现有监控中心中增强 Trace 链路下钻、传播质量、慢链路和错误链路定位能力，让 Agent、模型、知识库、工具、会话运行能形成可观测性闭环。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + local shadcn-style Button/Card/MetricCard/StatusBadge/EmptyState, motion/react, lucide icons.
- Existing layout: 控制台左侧导航 + 顶部栏；页面主体使用响应式 Dashboard/Bento Grid，不做营销页。

Interface contract that must appear in the UI:
- Existing APIs:
  - `GET /api/v1/monitor/overview`
  - `GET /api/v1/monitor/events`
  - `GET /api/v1/monitor/events/:eventId`
- New M46 APIs:
  - `GET /api/v1/monitor/traces/:traceId`
  - `GET /api/v1/monitor/observability`
- Main entities and fields:
  - Trace detail: trace_id, root_event, events, timeline, metrics, propagation, errors.
  - Timeline item: event_id, module, source_type, step_type, status, title, started_at, duration_ms, span_id, parent_span_id.
  - Observability overview: trace_coverage, linked_trace_count, orphan_event_count, error_trace_count, slow_trace_count, top_error_modules, slow_traces, recent_error_traces.
- Status values: SUCCESS 成功、DEGRADED 降级、FAILED 失败。
- User actions: 刷新数据、筛选事件、选择事件、下钻 Trace、复制 trace id、查看慢链路和错误链路。
- Required states: loading, empty, error, selected trace missing, no trace id, partial trace data.

Design requirements:
- Chinese visible text only.
- Header badges should show “M46”, “Trace 下钻”, “观测质量”.
- Top observability row: Trace 覆盖率、已关联 Trace、孤儿事件、错误 Trace、慢 Trace.
- Main region: left unified event stream, right Trace detail panel with timeline, root event, propagation quality and error list.
- Secondary region: cards for top error modules, slow traces, recent error traces.
- Timeline design should look operational and precise: vertical steps with status badges, duration, module/source labels, span id snippets, parent relation hints.
- Use subtle border, soft shadow, clean white/glass surface, small restrained animation hints.
- Keep the interface dense but readable, realistic for enterprise troubleshooting.

Avoid:
- fake observability vendors or unrelated dashboards
- English UI labels
- giant decorative charts, excessive gradients, glowing blobs, emoji
- any design that cannot map to the listed API fields
