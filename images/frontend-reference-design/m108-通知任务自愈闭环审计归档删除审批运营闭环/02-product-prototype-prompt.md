# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M108 通知任务自愈闭环审计归档删除审批运营闭环 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 用户进入安全中心 -> 查看审批与归档运营总览 -> 识别通知任务自愈归档删除待审/拒绝风险 -> 点击查看归档删除审批 -> 处理审批或在运营告警卡片中确认、升级、关闭。
- API/service contract: `GET /security-center/overview` returns `SecurityCenterOverview.approval_operations` with self-healing audit archive delete counts and `operational_alerts[]`.
- Data entities and fields: pending/approved/rejected/applied counts, closure rate, alert title/description/severity/metric/status/action label.
- Actions and states: loading, no overview, empty alerts, pending backlog, rejected risk, action updating, storage degraded.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Keep the existing security center page shell; this is an enhancement inside the existing approval/archive operations card, not a new route.
- Show these regions clearly:
  1. Header: M82/M108 badges, status, storage badge, total pending count.
  2. Existing approval metric tiles.
  3. Existing SLA dead letter archive deletion operations section.
  4. New M108 section: title “通知任务自愈归档删除审批运营”, description, CTA “查看自愈归档删除审批”, four metric tiles.
  5. Existing notification task failure section.
  6. Operational alert closure cards with alert actions.
  7. Bottom summary row for tool approval, archive deletion, self-healing archive deletion, audit quality.
- Show empty state for zero alerts and risk state for rejected count higher than applied count.
- Make component boundaries obvious so implementation can reuse `OperationMetricTile`, `StatusBadge`, `Button`, `OperationAlertCard`, `EmptyState`.

Avoid:
- unrelated navigation redesign
- invented charts, filters, or backend fields
- complex modals in the prototype; approval detail already exists in M107 down-drill panel
