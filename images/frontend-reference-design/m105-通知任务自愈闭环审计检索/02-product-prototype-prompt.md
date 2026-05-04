# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the real `/security` page section.

Scope:
- Module: 安全中心 / 通知任务中心 / 自愈闭环审计
- Milestone: M105
- Placement: below M101 “任务执行历史与审计检索”.

Wireframe layout:
1. Section header: “自愈闭环审计检索”.
2. Badges: `M105` and total record status.
3. Summary metric cards: 闭环记录、已确认、已忽略、已处理、最近处理.
4. Filter toolbar:
   - action select: 全部动作 / 确认 / 忽略 / 标记已处理
   - status select: 全部状态 / 已确认 / 已忽略 / 已处理
   - reason select: 全部原因 / Webhook 未配置 / Webhook 投递失败 / 自动通知关闭 / 自动重试关闭 / 连续失败 / 失败率偏高
   - keyword input
   - 清空筛选 button
   - 刷新审计 button
5. Table columns:
   - 建议
   - 原因 / 风险
   - 动作 / 状态
   - 备注
   - 请求 / 链路
   - 处理时间
   - 操作
6. Empty state if no rows match filters.

Interaction flow:
- Changing filters refreshes query.
- Clear resets all filters.
- 审计 link opens `/audit?keyword=request_id`.
- 链路 link opens `/monitor?keyword=trace_id`.

Constraints:
- Read-only list.
- No automatic repair.
- Chinese labels only.
