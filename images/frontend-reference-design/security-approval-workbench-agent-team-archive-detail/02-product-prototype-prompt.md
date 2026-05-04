# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 筛选团队归档删除审批 -> 选择审批项 -> 查看团队运行上下文 -> 查看审批时间线 -> 填写意见 -> 通过或拒绝
- API/service contract: approval workbench overview, list, detail, review
- Data entities and fields: `type`, `status`, `target_label`, `archive_key`, `team_id`, `team_name`, `run_id`, `run_objective`, `request_id`, `trace_id`, `timeline`
- Actions and states: 刷新、搜索、筛选、分页、选择、跳转审计、跳转 Trace、审批通过、审批拒绝；加载、空、错误、无权限、按钮禁用

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout:
  - Top summary metrics and filter row.
  - Left approval list with team archive delete chip.
  - Right detail panel with four regions: base approval summary, team run context, archive object, audit timeline/review box.
  - Empty and permission-denied placeholders.
- Make component boundaries obvious so implementation can map to existing React components.

Avoid:
- Invented backend fields.
- New route or unrelated modules.
- Marketing hero layout.
