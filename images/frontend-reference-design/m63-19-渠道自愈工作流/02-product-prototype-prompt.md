# Product Prototype / Wireframe Prompt

Create a mid-fidelity product wireframe for the existing `/channels` admin page.

Project context:
- Page/route: 渠道详情页 `/channels`
- Users/roles: 渠道管理员、Agent 管理员、安全管理员、审计员
- Main task flow: 选择渠道 -> 查看发布自愈评估 -> 保存策略 -> 通过 workflow 执行一次 -> 查看运行结果和最近事件
- API/service contract:
  - `GET /channels/:channelId/release-self-healing`
  - `PUT /channels/:channelId/release-self-healing`
  - `POST /channels/:channelId/release-self-healing/run`
  - `POST /runtime/workflows/channel-release-self-healing/start`
  - `POST /api/v1/runtime/internal/channel-release-self-healing/run`
- Data entities and fields:
  - Policy: `enabled`, `dry_run`, `auto_rollback_enabled`, `max_error_requests`, `min_allowed_rate`, `observation_window_hours`, `cooldown_minutes`
  - Evaluation: `decision`, `reason`, `rollback_recommended`, `rollback_available`, `metrics`, `current_batch`, `last_automation_run`, `evaluated_at`
  - Last run: `run_id`, `workflow_id`, `workflow_backend`, `batch_id`, `decision`, `rolled_back`, `started_at`, `finished_at`
  - Overview: `workflow_mode`, `workflow_backend`, `next_allowed_at`, `recent_events`
- Actions and states: 刷新、自愈执行、保存策略、加载、错误、空状态、权限不足、冷却禁用

Prototype requirements:
- Use clear component boundaries for:
  - Header with badges and action buttons
  - Four metric cards
  - Left strategy form
  - Right evaluation and last-run panel
  - Recent event feed
  - Permission hint row
- Show workflow mode and execution backend as first-class operational details.
- Use Chinese labels throughout.
- Keep realistic admin density and responsive behavior.

Avoid:
- Standalone page navigation that does not exist in the repo
- Backend fields not listed above
- Decorative elements that do not map to existing components
