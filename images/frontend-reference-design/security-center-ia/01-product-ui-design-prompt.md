# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a production SaaS/admin security governance center.

Project context:

- Product/module: AIAget 控制台安全中心
- Page/routes: `/security` overview entry, with focused routes `/security/policies`, `/security/events`, `/security/alerts`, `/security/recovery`
- Target users/roles: 租户管理员、安全管理员、运维运营人员；策略写入、审批查看、审批处理按现有权限禁用按钮或显示无权限状态
- Business goal: 把原安全中心大聚合页拆成可扫描的治理入口和四个聚焦工作台，减少单页信息拥挤，同时保留所有现有安全治理动作
- IA implementation goal: `/security/policies`, `/security/events`, `/security/alerts`, `/security/recovery` must feel like real route-level pages with their own data loading, filters, Chinese titles, empty/error/permission states, and operation entry points instead of thin wrappers around the overview component.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, React Query, shadcn-like `Button/Card/Input/MetricCard/StatusBadge/EmptyState`, Tailwind, lucide icons, motion
- Existing page shell/layout: 控制台内部页面，`main` 使用 `max-w-7xl px-4 py-6 lg:px-6`，低调运营后台风格，卡片半径小、表格密集、中文文案

Interface contract that must appear in the UI:

- Overview: security score, posture level, pending approvals, deny policies/resource ACL denials, 24h security events, guard chain, module summary cards, risk signals
- Policies route: policy metrics, policy list filters, create/edit/delete/enable/disable actions, ABAC simulation panel, evaluation log
- Events route: security event filters by keyword/source/window/trace-only, paginated event table, detail drawer with request ID, trace ID, subject/resource/context JSON
- Alerts route: approval workbench, operational alert lifecycle actions, manual notification/retry, notification audit export/archive/delete approval, SLA alert and dead-letter operations
- Recovery route: notification task failure aggregation, auto notify/retry task runs, recovery suggestions, recovery audit filters/export/archive/delete approval
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:

- Make `/security` feel like an entry dashboard: compact hero, metric row, four navigation cards, recent risks, no giant all-in-one workbench.
- Make each focused route feel like an operator workspace with dense filters, tables, details, status badges, and clear action groups.
- Keep Chinese UI labels and existing operational vocabulary: 安全治理总览、策略治理、安全事件、告警运营、自愈恢复、审批工作台、归档删除审批。
- Use teal/slate/emerald/amber/destructive tones only through existing badges and muted cards; avoid decorative gradients as the dominant visual.
- Show realistic tables and panels based only on the listed entities and actions.

Avoid:

- Inventing backend fields or unrelated security products
- Marketing hero sections, giant decorative cards, random charts, or placeholder lorem ipsum
- Replacing the existing shell/navigation or changing API contracts
