# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform settings page.

Project context:
- Product/module: 企业 AI Agent 平台，通知策略版本快照与回滚审批预留。
- Page/route: 设置中心 `/settings`，通知策略分类。
- Target users/roles: 租户管理员、监控运营、安全管理员。
- Business goal: 保存、恢复默认、回滚通知策略时自动留下版本快照，运营人员可以在同一设置页查看最近版本并执行受控回滚。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、React Query。
- Existing page shell/layout: 三栏设置页，左侧参数分类，中间系统参数卡片，右侧配置治理与审计面板。

Interface contract that must appear in the UI:
- API/service functions: `listNotificationPolicySnapshots`, `rollbackNotificationPolicySnapshot`, `updateSystemSetting`, `resetSystemSetting`, `getNotificationPolicyAudit`.
- Main entities and fields: setting_name, setting_key, version, action, previous_value, next_value, previous_status, next_status, approval_status, created_by, created_at, rollback_count.
- Status values/enums: action = UPDATE / RESET / ROLLBACK，approval_status = NOT_REQUIRED / RESERVED / PENDING / APPROVED / REJECTED。
- User actions: 查看快照、查看前后值、回滚到该版本、确认回滚、刷新列表。
- Required states: 加载中、暂无快照、加载失败、无管理权限、回滚中、回滚成功。

Design requirements:
- Make it look like a production enterprise configuration console.
- Keep the existing notification policy setting cards and M74 impact preview.
- Add a compact “版本快照” section in the right governance panel below audit summary.
- Snapshot items should look operational: version badge, action badge, actor/time, previous -> next values, rollback button.
- Approval status should be visible as “审批预留”，but do not show a fake approval workflow.
- Use restrained enterprise styling: subtle borders, soft shadows, enough whitespace, Chinese labels.
- High-risk rollback should be visually clear but not noisy.

Avoid:
- new route or full-page version management
- fake approval center workflow
- decorative charts, glow, emoji
- invented backend fields not listed above
