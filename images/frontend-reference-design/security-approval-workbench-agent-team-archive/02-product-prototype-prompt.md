# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a real enterprise SaaS admin page extension.

Project context:
- Page/route: 安全中心统一审批工作台 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 安全管理员打开安全中心 -> 在审批类型筛选中选择“团队运行报告归档删除” -> 查看待审批队列 -> 打开详情 -> 检查归档文件、团队、运行目标、对象路径和时间线 -> 填写备注 -> 通过或拒绝。
- API/service contract: existing workbench API functions `getSecurityApprovalWorkbenchOverview`, `listSecurityApprovalWorkbenchItems`, `getSecurityApprovalWorkbenchItem`, `reviewSecurityApprovalWorkbenchItem`; backend aggregates `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE` and forwards approve/reject to Agent Teams service.
- Data entities and fields: approval type/status/risk domain/risk level, target label, source module, requester/reviewer, requested/reviewed time, request_id, trace_id, archive file name, archive key, archive size, team name, run objective, run id, timeline events.
- Actions and states: search/filter, refresh, select row, approve, reject, loading, empty, error, no permission, disabled while reviewing.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show these regions: metrics header, filters, approval table, selected detail panel, metadata grid, timeline, approval action area.
- Add a row example for “团队运行报告归档删除” with pending state and critical/audit archive labels.
- Detail panel must include object path, team/run context, request/trace links, approve/reject controls.
- Make component boundaries obvious for mapping to existing React components.
- Keep layout realistic for current `/security` page and responsive admin dashboard density.

Avoid:
- polished decorative rendering
- invented backend fields
- unrelated navigation or batch approval actions
