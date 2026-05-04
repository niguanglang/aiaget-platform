# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform approval center.

Project context:
- Product/module: 企业 AI Agent 平台，通知策略审批流接入安全中心。
- Page/route: 审批中心 `/approvals`。
- Target users/roles: 安全管理员、租户管理员、监控运营。
- Business goal: 在同一个审批中心里处理工具审批与通知策略高影响变更审批；高影响通知策略变更必须审批后才真正写入系统设置。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`MetricCard`、`EmptyState`、React Query、motion/react。
- Existing page shell/layout: 审批中心顶部指标、左侧审批队列、右侧详情处理面板。

Interface contract that must appear in the UI:
- API/service functions: `getToolApprovalOverview`, `listToolApprovals`, `listNotificationPolicyApprovalRequests`, `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval`, `getNotificationPolicyApproval`.
- Main entities and fields: approval type, setting_name, setting_key, version, action, previous_value, next_value, previous_status, next_status, impact_level, impact_summary, approval_status, created_by, created_at, decision_note.
- Status values/enums: notification approval status PENDING / APPROVED / REJECTED; action UPDATE / RESET / ROLLBACK; impact LOW / MEDIUM / HIGH.
- User actions: 切换审批类型、搜索、筛选状态、查看详情、填写审批备注、批准、拒绝、跳转设置中心。
- Required states: 加载中、无审批、加载失败、无处理权限、审批成功、审批失败。

Design requirements:
- Make it look like a production enterprise admin console.
- Keep the existing approval center structure but add an approval type segmented control: 工具审批 / 通知策略。
- Notification policy approval detail should show value diff, impact summary and why approval is required.
- Use restrained warning styling for high impact.
- All visible labels must be Chinese except technical keys.

Avoid:
- unrelated generic workflow builder
- fake multi-step approval chain
- new route or dashboard
- decorative glow, emoji, excessive gradients
