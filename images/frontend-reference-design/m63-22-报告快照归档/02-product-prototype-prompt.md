# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the M63-22 report snapshot archive area.

Main flow:
1. 用户查看当前复盘报告。
2. 点击“归档快照”。
3. 快照出现在快照列表。
4. 用户选择一个快照。
5. 右侧展示快照详情和归档时的 Markdown 报告正文。

Layout:
- Existing report panel header with “归档快照” button.
- Archive section:
  - Left: snapshot list
  - Right: snapshot detail
- States:
  - no snapshots
  - selected snapshot
  - detail loading
  - missing permission
  - error banner

Component mapping:
- `Card`
- `Button`
- `StatusBadge`
- `EmptyState`
- `DetailRow`
- `pre`

Avoid:
- Unsupported export controls
- New routes
- Fake editable fields
