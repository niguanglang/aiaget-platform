# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a real enterprise SaaS admin page extension.

Project context:
- Page/route: 安全中心审批与归档运营 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 安全管理员打开安全中心 -> 查看审批与归档运营摘要 -> 发现团队运行报告归档删除待审或拒绝风险 -> 点击查看统一审批工作台 -> 处理对应审批。
- API/service contract: `getSecurityOverview` returns `approval_operations`; frontend renders `ApprovalArchiveOperationsCard` with existing tiles and operation alert cards.
- Data entities and fields: `agent_team_report_archive_delete_pending/approved/rejected/applied`, pending oldest timestamp, operational alerts, status badges, closure rate.
- Actions and states: refresh security overview, open `/security` unified approval workbench, open `/approval-audits`, loading, empty, warning alert state.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show regions: status header, summary metrics, team report archive delete operation band, SLA dead letter band, notification task recovery band, operational alerts list.
- Make the new band visibly separate but consistent with existing cards.
- Include empty/no-risk state and warning state examples.
- Keep component boundaries obvious for mapping to existing React components.

Avoid:
- polished decorative rendering
- invented backend fields
- unrelated navigation or batch actions
