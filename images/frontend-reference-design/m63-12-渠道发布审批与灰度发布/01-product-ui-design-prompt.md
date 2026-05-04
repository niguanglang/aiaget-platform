# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: Enterprise AI Agent Platform / 全渠道发布中心
- Page/route: M63-12 渠道发布审批与灰度发布 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、安全管理员、审计人员
- Business goal: 为每个发布渠道提供上线审批、灰度比例控制、全量发布和回滚能力，让企业 Agent 渠道发布可审计、可控、可回退
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style Card/Button/Input/MetricCard/StatusBadge, lucide icons, React Query
- Existing page shell/layout: `/channels` already has channel list, detail panel, sender delivery, sender policy, sender task panel; add a new operational control panel without changing navigation

Interface contract that must appear in the UI:
- API/service functions:
  - `getChannelPublishControl(channelId)`
  - `updateChannelPublishControl(channelId, input)`
  - `requestChannelPublishApproval(channelId, input)`
  - `approveChannelPublish(channelId, input)`
  - `rejectChannelPublish(channelId, input)`
  - `updateChannelRollout(channelId, input)`
  - `rollbackChannelPublish(channelId, input)`
- Main entities and fields:
  - approval_required, approval_status, approval_note, requested_by, requested_at, reviewed_by, reviewed_at, decision_note
  - rollout_enabled, rollout_percentage, rollout_status
  - rollback_available, last_stable_status, last_stable_config, last_rollback_at, last_rollback_by
- Status values/enums:
  - approval: NOT_REQUIRED, PENDING, APPROVED, REJECTED
  - rollout: CLOSED, GRAY, FULL
- User actions:
  - save approval requirement
  - request approval
  - approve / reject
  - set rollout percentage
  - full release
  - rollback to stable config
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a real production SaaS/admin product.
- Use a Bento/Dashboard panel with four operational regions:
  - 审批状态 card
  - 灰度发布 card with percentage input or slider-like control
  - 回滚保护 card
  - 最近决策/审计摘要 card
- Show compact metrics: 审批状态, 灰度比例, 回滚状态, 最近决策时间.
- Use subtle borders, soft shadows, clean white glass panels, restrained blue/green/amber status accents.
- Use Chinese labels and realistic enterprise text.
- Keep visual style consistent with the current channel center page.

Avoid:
- fake fields not listed above
- unrelated channel marketplace, plugin store, or billing UI
- oversized hero section, excessive gradients, emoji, cheap glow
- unreadable dense text
