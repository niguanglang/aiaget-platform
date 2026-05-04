# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台，全渠道发布中心
- Page/route: M63-14 渠道发布流水线与发布批次 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、审计员
- Business goal: Turn channel release actions into a visible release batch pipeline, showing approval, gray rollout, full rollout and rollback/abort status in one operational panel.
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style primitives. Existing components include Card, Button, Input, MetricCard, StatusBadge, EmptyState.
- Existing page shell/layout: Console dashboard page with channel list and stacked operational panels.

Interface contract that must appear in the UI:
- API/service functions:
  - getChannelReleasePipeline(channelId)
  - startChannelReleaseBatch(channelId, input)
  - markChannelReleaseFull(channelId, input)
  - abortChannelReleaseBatch(channelId, input)
- Main entities and fields:
  - ChannelReleaseBatch: batch_id, title, status, target_rollout_percentage, started_by, started_at, completed_at, aborted_at, rollback_at, note
  - ChannelReleasePipelineStep: key, name, status, description, occurred_at, event_type
  - ChannelReleasePipeline: current_batch, steps, recent_batches, recent_events, updated_at
- Status values:
  - IDLE, PENDING_APPROVAL, APPROVED, GRAY, FULL, ROLLED_BACK, ABORTED
  - WAITING, CURRENT, DONE, FAILED, SKIPPED
- User actions:
  - start release batch
  - mark full rollout
  - abort batch
  - refresh pipeline
- Required states: loading, empty, error, disabled, permission read-only, success after actions

Design requirements:
- Add a polished "发布流水线与发布批次" panel to the existing channel dashboard.
- Use Bento/dashboard layout:
  - top metric cards for current batch, target rollout, pipeline status, last update
  - horizontal or vertical step timeline for "创建批次 -> 发起审批 -> 审批通过 -> 灰度发布 -> 全量发布 -> 回滚/终止"
  - side card for batch action form
  - recent batches and recent release events list
- Use Chinese labels only.
- Use restrained enterprise styling: subtle borders, soft shadow, backdrop blur, clear status badges.
- The interface should look operational and production-ready, not like a generic template.

Avoid:
- invented unrelated release systems
- oversized decorative gradients, emojis, cheap glow
- tiny unreadable text, fake charts, marketing hero layout
