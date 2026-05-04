# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the M63-23 report snapshot version comparison area.

Main flow:
1. 用户进入 `/channels` 并选择一个发布渠道。
2. 用户在“渠道发布复盘与变更报告”中查看当前报告和历史快照。
3. 用户在快照列表中点击“设为基准”选择旧版本。
4. 用户点击“设为对比”选择新版本。
5. 系统加载版本对比结果。
6. 用户查看差异统计、摘要字段差异、指标差异、风险建议差异和时间线差异。
7. 用户可以继续切换基准或对比快照，不离开当前页面。

Layout:
- Existing report panel header stays unchanged:
  - left: status badges and title
  - right: 刷新报告, 归档快照
- Archive area:
  - left card: 报告快照归档
    - snapshot row
    - 查看 button
    - 设为基准 button
    - 设为对比 button
  - right card: 快照详情
    - metadata rows
    - markdown preview
- Compare area:
  - full-width card titled 版本对比
  - summary metric cards: 变更, 新增, 移除, 严重差异
  - selector summary line: 基准快照 -> 对比快照
  - four grouped diff lists

States:
- no snapshots
- only one snapshot, cannot compare
- no base selected
- no target selected
- same snapshot selected
- compare loading
- compare error
- no differences
- permission denied for archiving but comparison still viewable with `channel:publish:view`

Component mapping:
- `Card`
- `Button`
- `StatusBadge`
- `MetricCard`
- `EmptyState`
- `DetailRow`
- `pre`

Avoid:
- Unsupported export controls
- New route
- Fake editable fields
- Side navigation changes
