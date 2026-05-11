# Product UI Design Image Prompt

```text
Create a high-fidelity product UI design image for the following real frontend pages.

Project context:
- Product/module: 企业 AI Agent 平台 / 全渠道发布治理
- Page/routes:
  - 自动推进 at /channels/release/automation
  - 发布自愈 at /channels/release/self-healing
  - 发布巡检调度 at /channels/release/scheduler
- Target users/roles: 发布治理运营、平台运维、安全审计；查看需要 channel:publish:view，运行动作需要 channel:publish:deploy，策略保存需要 channel:publish:manage。
- Business goal: 把 Runtime / Temporal 派发后的 workflow ID 与 workflow run ID 清晰展示在控制面，方便用户从渠道发布页面定位异步工作流。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-like Card/Button/Badge primitives, lucide icons.
- Existing page shell/layout: centered max-width console page, ChannelReleaseHeader, channel picker, Card-based dashboard sections, DetailGrid key-value cards, StatusBadge, confirmation dialog.

Interface contract that must appear in the UI:
- API/service functions:
  - getChannelReleaseAutomation, runChannelReleaseAutomation, updateChannelReleaseAutomation
  - getChannelReleaseSelfHealing, runChannelReleaseSelfHealing, updateChannelReleaseSelfHealing
  - getChannelReleaseSchedulerOverview, runChannelReleaseSchedulerOnce
- Main entities and fields:
  - workflow_mode, workflow_backend, workflow_id, workflow_run_id
  - last_run.run_id, last_run.decision, last_run.workflow_backend, last_run.workflow_id, last_run.workflow_run_id
  - scheduler last_run.results: channel_name, task, status, decision, workflow_backend, workflow_id, workflow_run_id, error_message
- Status values/enums: SUCCESS, FAILED, SKIPPED, LOCAL, LOCAL_FALLBACK, TEMPORAL, automation/self-healing decisions.
- User actions: run automation, save automation policy, run self-healing, save self-healing policy, run scheduler, refresh.
- Required states: loading/refreshing, empty, error alert, disabled actions when permission is missing, missing workflow IDs shown as “-” or “暂无”.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing dashboard.
- Use Chinese text only.
- Use the existing data fields and actions; do not invent unrelated modules.
- Show the primary workflow clearly: choose channel, inspect workflow mode/backend/IDs, run action, inspect latest workflow tracking identifiers.
- In automation and self-healing pages, add a compact “工作流追踪” information band near status/recent decision, with mode/backend/workflow ID/run ID.
- In scheduler page, keep the recent run list compact and show per-result backend/workflow ID/run ID without turning it into a full detail page.
- Use subtle borders, soft shadows, restrained glass-like cards, clear spacing, and a clean enterprise console style.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to existing Card/DetailGrid/StatusBadge components
- large hero sections, excessive gradients, unreadable tiny text, random charts
- mixing full run details or logs into the scheduler list
```
