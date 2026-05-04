# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 设置审批筛选 -> 查看命中数量 -> 导出当前筛选 CSV -> 选择审批项 -> 查看详情和审计链路
- API/service contract: approval workbench overview, list, export, detail, review
- Data entities and fields: `keyword`, `type`, `status`, `risk_domain`, `total`, `id`, `source_id`, `target_label`, `request_id`, `trace_id`
- Actions and states: 刷新、导出、搜索、筛选、分页、选择、跳转审计、跳转 Trace、审批通过、审批拒绝；加载、空、错误、无权限、按钮禁用、导出中、导出成功、导出失败

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout:
  - Top summary metrics.
  - Filter row with keyword, type, status, risk domain.
  - Action cluster with 刷新 and 导出当前筛选.
  - Inline export state text below actions.
  - Approval list and detail split panel unchanged.
  - Permission-denied and empty placeholders.
- Make component boundaries obvious so implementation can map to existing React components.

Avoid:
- Invented backend fields.
- New route or unrelated modules.
- Marketing hero layout.
