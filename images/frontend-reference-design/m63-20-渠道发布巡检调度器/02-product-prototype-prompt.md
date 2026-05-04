# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the M63-20 channel release scheduler panel inside `/channels`.

Main task flow:
1. 管理员查看巡检是否启用。
2. 查看推进候选、自愈候选、最近派发数量。
3. 查看 workflow 模式和最近运行。
4. 点击“立即巡检”手动派发一次。
5. 查看每个渠道的派发结果。

API contract:
- `getChannelReleaseSchedulerOverview()`
- `runChannelReleaseSchedulerOnce()`

Data regions:
- Header: M63-20、巡检状态、运行状态、最近结果、刷新、立即巡检
- Metrics: 扫描范围、推进候选、自愈候选、最近派发
- Left panel: 巡检开关、运行状态、最近扫描、扫描间隔、推进模式、自愈模式、活跃批次、可回滚渠道
- Right panel: 最近运行摘要 + 渠道派发结果列表
- Bottom state: 权限提示、空状态、错误状态

Prototype requirements:
- Use component boundaries that map to existing `Card`, `MetricCard`, `StatusBadge`, `InfoRow`, `DetailRow`, `EmptyState`.
- Keep labels Chinese.
- Keep layout consistent with the existing channel detail dashboard.
- Show loading, empty, error, and permission-denied placeholders.

Avoid:
- Inventing scheduler configuration forms; this module is read-only plus manual run.
- New navigation or standalone page.
- Backend fields not in the contract.
