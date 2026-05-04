# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design image for the M63-23 report snapshot version comparison area inside `/channels`.

Project context:
- Product/module: 企业 AI Agent 平台，渠道发布中心。
- Page/route: `/channels`，嵌入现有“渠道发布复盘与变更报告”面板。
- Target users: 渠道管理员、安全管理员、审计员、租户管理员。
- Business goal: 对两个已归档的渠道发布复盘报告快照进行审计对比，快速识别风险等级、核心指标、风险建议和发布事件时间线的变化。

Interface contract:
- APIs:
  - `GET /channels/:channelId/release-report/snapshots`
  - `GET /channels/:channelId/release-report/snapshots/:snapshotId`
  - `GET /channels/:channelId/release-report/snapshots/:baseSnapshotId/compare/:targetSnapshotId`
- Snapshot fields:
  - 快照 ID、渠道名、风险等级、结论、归档时间、归档人、事件 ID、Trace。
- Compare fields:
  - `changed_count`
  - `added_count`
  - `removed_count`
  - `critical_change_count`
  - `summary_diffs`
  - `metric_diffs`
  - `risk_diffs`
  - `timeline_diffs`
- Actions:
  - 选择快照详情
  - 设为基准
  - 设为对比
  - 刷新报告
  - 归档快照

Design requirements:
- Chinese labels only.
- Use a clean enterprise product style with fine borders, soft shadows, subtle backdrop blur and restrained contrast.
- Keep the layout dense enough for audit review but with clear information hierarchy.
- Show a snapshot list on the left with small controls for “查看”“设为基准”“设为对比”.
- Show snapshot detail on the right.
- Add a “版本对比” panel below or beside the archive section:
  - top summary metrics: 变更、新增、移除、严重差异
  - baseline and target snapshot chips
  - grouped difference sections: 摘要差异、指标差异、风险建议差异、时间线差异
  - each diff row displays field label, change type, before value, after value, severity badge
- Use subtle red/amber accents only for severe or warning differences.
- Empty state should explain that two different快照 must be selected.

Avoid:
- Export/download buttons not backed by this milestone.
- New standalone route or modal-only design.
- Editable fields for archived snapshots.
- Decorative charts unrelated to comparison.
- Overdone gradients, glow, emoji, or large rounded blobs.
