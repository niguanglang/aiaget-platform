# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the `/security` page section "SLA 超时通知与订阅目标".

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow:
  1. User reviews SLA overdue alerts.
  2. User checks current subscription targets and channels.
  3. User triggers "通知超时项".
  4. User reviews notification summary and latest delivery audit rows.
- API/service contract:
  - `getSecurityOperationAlertSlaNotificationOverview()`
  - `notifySecurityOperationAlertSlaOverdue()`
  - response includes policy, summary, items, latest result.
- Data entities and fields:
  - Policy: enabled, channels, default targets, high risk targets, archive targets, webhook configured, source.
  - Summary: pending overdue, sent, partial, failed, skipped, last delivered.
  - Items: alert title, status, channels, targets, webhook status, delivered at.
  - Last result: scanned, notified, sent, failed, skipped, finished at.
- Actions and states:
  - 刷新通知
  - 通知超时项
  - loading placeholder
  - empty state
  - disabled state
  - partial/failed delivery state

Prototype requirements:
- Keep it inside the existing "告警 SLA 与超时升级" section.
- Use clear component boundaries: subscription policy panel, metrics grid, audit list, last result.
- Use Chinese labels for every visible text.
- Make mobile stacking obvious.

Avoid:
- new top-level route
- invented subscription table fields
- dense unreadable table
- decorative rendering
