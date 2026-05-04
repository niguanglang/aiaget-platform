# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform settings page.

Project context:
- Product/module: 企业 AI Agent 平台，通知策略审计与变更影响预览。
- Page/route: 设置中心 `/settings`，通知策略分类。
- Target users/roles: 租户管理员、监控运营、安全管理员。
- Business goal: 在保存通知策略前展示影响范围和风险提示，并在右侧展示最近策略变更审计摘要。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、React Query。

Interface contract that must appear in the UI:
- API/service functions: `previewNotificationPolicySettingChange`, `getNotificationPolicyAudit`, `updateSystemSetting`.
- Main data: 当前值、待保存值、影响级别、预计待重试变化、当前失败/部分成功投递、最近任务表现、最近变更人、变更时间、变更字段。
- Impact values: `LOW`, `MEDIUM`, `HIGH`.
- User actions: 编辑策略、查看预览、保存、恢复默认。
- Required states: 无变更、预览加载、高风险提示、最近审计为空、保存成功。

Design requirements:
- Make it look like a production enterprise configuration console.
- Add compact impact preview inside each notification policy setting card.
- Right governance panel should include recent audit summary and last changes.
- Use restrained warning styling; high impact must be visible but not noisy.
- All visible labels must be Chinese except technical keys.

Avoid:
- new page or modal-heavy workflow
- fake approval workflow
- over-detailed charts
- decorative clutter, glow, emoji
