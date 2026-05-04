# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform settings page.

Project context:
- Product/module: 企业 AI Agent 平台，通知策略配置中心。
- Page/route: 系统设置中心 `/settings`，现有系统参数页面。
- Target users/roles: 租户管理员、监控运营、安全管理员；编辑需要 `system:settings:manage`。
- Business goal: 将 M72 告警通知自动重试策略从环境变量升级为租户级可配置策略。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前设置页面为 Dashboard/Layout + 参数卡片列表。

Interface contract that must appear in the UI:
- API/service functions: `listSystemSettings`, `updateSystemSetting`, `resetSystemSetting`.
- Main settings: 自动重试开关、扫描间隔、单批数量、最大重试次数、退避秒数、回看小时数。
- Status values: `ACTIVE`, `DISABLED`; value types `BOOLEAN`, `NUMBER`.
- User actions: 分类筛选、编辑数值、保存、恢复默认。
- Required states: 加载态、只读态、保存中、保存成功、校验错误、恢复默认确认。

Design requirements:
- Make it look like a production enterprise settings console.
- Add a notification policy category that feels integrated with the current settings page.
- Show concise guidance explaining these settings affect the alert notification auto retry task.
- All visible labels must be Chinese, except technical keys.
- Keep layout dense, readable, and consistent with existing system setting cards.

Avoid:
- new database schema UI
- cron builder or complex workflow editor
- fake notification channel marketplace
- decorative clutter, exaggerated glow, emoji
