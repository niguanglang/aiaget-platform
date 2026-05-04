# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design image for the report snapshot archive area inside `/channels`.

Project context:
- Product/module: 企业 AI Agent 平台，渠道发布中心
- Page/route: `/channels`
- Target users: 渠道管理员、安全管理员、审计员、租户管理员
- Business goal: 将渠道发布复盘报告归档为不可变快照，用于审计留痕和变更复盘。

Interface contract:
- APIs:
  - `GET /channels/:channelId/release-report/snapshots`
  - `POST /channels/:channelId/release-report/snapshots`
  - `GET /channels/:channelId/release-report/snapshots/:snapshotId`
- Fields:
  - 快照 ID、渠道名、风险等级、结论、归档时间、归档人、事件 ID、Trace
  - 快照详情中的 `report.markdown`
- Actions:
  - 归档快照
  - 选择快照
  - 刷新报告
- States:
  - loading, empty, error, permission-denied, selected snapshot

Design requirements:
- Chinese labels only.
- Looks like a real audit/admin product.
- Use fine borders, soft shadows, subtle backdrop blur.
- Keep the archive area visually connected to the release report panel.
- Show snapshot list on the left and immutable report body on the right.

Avoid:
- Export/download buttons not backed by this milestone.
- New standalone route.
- Decorative charts unrelated to snapshots.
- Overdone gradients or glow.
