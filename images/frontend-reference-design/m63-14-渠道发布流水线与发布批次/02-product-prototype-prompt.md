# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-14 渠道发布流水线与发布批次 at `/channels`
- Users/roles: 租户管理员、渠道管理员、审计员
- Main task flow: user selects a publish channel, starts a release batch with target rollout percentage and note, watches approval/gray/full steps, marks full release, or aborts the batch.
- API/service contract:
  - getChannelReleasePipeline(channelId)
  - startChannelReleaseBatch(channelId, input)
  - markChannelReleaseFull(channelId, input)
  - abortChannelReleaseBatch(channelId, input)
- Data entities and fields:
  - batch_id, title, status, target_rollout_percentage, started_at, completed_at, note
  - steps: key, name, status, description, occurred_at
  - recent_batches, recent_events
- Actions and states:
  - refresh pipeline
  - start batch
  - mark full
  - abort batch
  - loading, empty, error, disabled/read-only

Prototype requirements:
- Show clear component regions:
  - Header with M63-14 badge, current status and refresh button
  - Metrics row
  - Pipeline timeline
  - Batch action form
  - Recent batches list
  - Recent release events list
- Keep layout consistent with current `/channels` operational panels.
- Use wireframe labels in Chinese.
- Make permission-disabled and no-channel states visible.

Avoid:
- polished decorative rendering
- unsupported fields
- unrelated navigation or actions
