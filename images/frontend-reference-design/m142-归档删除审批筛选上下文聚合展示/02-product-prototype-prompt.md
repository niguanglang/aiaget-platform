# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 归档删除审批 at /approvals/archive-deletions
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 进入审批中心子页面 -> 按来源过滤归档删除审批 -> 选择一条通知审计归档删除审批 -> 查看文件、申请原因和筛选上下文 -> 批准或拒绝。
- API/service contract: 聚合多个归档删除审批列表接口，使用统一详情接口 `getSecurityApprovalWorkbenchItem` 展示时间线；approve/reject mutation 只处理当前选中审批。
- Data entities and fields: sourceLabel、archiveFileName、archiveKey、archiveSizeBytes、status、reason、requestedBy、reviewedBy、requestedAt、reviewedAt、statusFilter、alertCategoryLabel、keyword。
- Actions and states: 来源筛选、刷新、查看详情、批准、拒绝、加载中、空队列、错误提示、处理中禁用、无处理权限禁用。

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout regions: header toolbar, metric cards, source filter, compact approval table, detail panel, timeline/operation section, decision action area.
- Mark filter-context chip group in both list row and detail panel: 筛选来源、筛选状态、筛选关键词。
- Make component boundaries obvious so implementation can map to `ApprovalPageShell`、`MetricCard`、`StatusBadge`、`DecisionActions`、`ApprovalAuditTimeline`。
- Keep table fields under 8 columns and place long text in detail panel.
- Include empty/error/loading placeholders.

Avoid:
- 不出现客户成功报告正文、通知审计原始列表、复杂图表或配置表单。
- 不把筛选上下文设计成独立宽表格列，使用标签组即可。
