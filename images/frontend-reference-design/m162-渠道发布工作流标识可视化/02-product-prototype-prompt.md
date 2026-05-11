# Product Prototype / Wireframe Prompt

```text
Create a product prototype / wireframe image for the same real frontend pages.

Project context:
- Page/routes:
  - 自动推进 at /channels/release/automation
  - 发布自愈 at /channels/release/self-healing
  - 发布巡检调度 at /channels/release/scheduler
- Users/roles: 发布治理运营、平台运维、安全审计。
- Main task flow: 选择渠道 -> 查看发布治理状态 -> 查看 workflow mode/backend/workflow ID/run ID -> 运行自动推进、自愈或巡检 -> 刷新并确认最近运行标识。
- API/service contract:
  - getChannelReleaseAutomation / runChannelReleaseAutomation / updateChannelReleaseAutomation
  - getChannelReleaseSelfHealing / runChannelReleaseSelfHealing / updateChannelReleaseSelfHealing
  - getChannelReleaseSchedulerOverview / runChannelReleaseSchedulerOnce
- Data entities and fields:
  - overview workflow_mode, workflow_backend, workflow_id, workflow_run_id
  - last_run run_id, decision, workflow_backend, workflow_id, workflow_run_id
  - scheduler result channel_name, task, status, decision, workflow_backend, workflow_id, workflow_run_id
- Actions and states: run, save policy, refresh, confirmation dialog, loading, empty, error, permission disabled.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, not decoration.
- Show the shared page structure: header, channel picker, status card, workflow tracking card, policy card, recent run card.
- For scheduler, show a recent run summary and compact per-channel dispatch rows with workflow backend/id/run id.
- Make component boundaries obvious so implementation can map to ChannelReleaseHeader, Card, DetailGrid, EmptyState, StatusBadge, Button, ChannelActionConfirmDialog.
- Keep all labels in Chinese.
- Missing workflow identifiers should have an explicit empty placeholder.

Avoid:
- invented backend fields
- full log viewers or deep trace panels in the scheduler list
- complex charts or new navigation
```
