# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for this real frontend page.

Project context:
- Page/route: M63-10 渠道投递策略中心 inside `/channels`
- Users/roles: 租户管理员、渠道管理员、运维人员、审计人员
- Main task flow:
  1. User selects a publish channel.
  2. Page loads current sender policy from channel config.
  3. User edits manual retry, auto retry, max retry count, backoff, retry status codes, alert and retention.
  4. User saves policy.
  5. Failed delivery retry buttons reflect policy status.
- API/service contract:
  - `GET /channels/:channelId/sender-policy`
  - `PUT /channels/:channelId/sender-policy`
  - existing sender delivery list/detail/retry APIs
- Data fields:
  - `auto_retry_enabled`
  - `manual_retry_enabled`
  - `max_retry_count`
  - `retry_backoff_seconds`
  - `retry_on_statuses`
  - `alert_on_failure`
  - `retention_days`

Prototype requirements:
- Low/mid fidelity wireframe.
- Show current channel summary at top of policy card.
- Show policy controls grouped into retry, alert, retention.
- Include validation feedback under number/status inputs.
- Show permission-disabled and no-channel empty states.
- Show link/relationship to sender delivery records, especially retry disabled when manual retry is off.

Avoid:
- standalone route layout
- invented infrastructure settings
- decorative-only elements
