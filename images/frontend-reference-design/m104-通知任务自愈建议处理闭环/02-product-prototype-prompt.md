# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the real `/security` page section.

Scope:
- Module: 安全中心 / 审批与归档运营 / 通知任务自愈建议
- Milestone: M104 通知任务自愈建议处理闭环
- Placement: extends the existing M103 recommendation card grid.

Wireframe layout:
1. Parent section header: “通知任务自愈建议”.
2. Badges: `M104` + total open count or “已闭环”.
3. Two-column recommendation card grid.
4. Each card contains:
   - top row: severity badge, reason label, lifecycle status badge
   - title and description
   - evidence line
   - last action line: 最近处理、备注、时间
   - link row: primary troubleshooting link and secondary troubleshooting link
   - action row: 确认 / 忽略 / 标记已处理
5. Empty state when no suggestions exist.
6. Inline error area can appear above cards using existing page error style.

Interaction flow:
- 点击确认 -> POST action `ACKNOWLEDGE`, card shows 已确认.
- 点击忽略 -> POST action `IGNORE`, card shows 已忽略.
- 点击标记已处理 -> POST action `RESOLVE`, card shows 已处理.
- Success refreshes overview and keeps latest local result visible.
- Disabled/pending state shows “处理中”.

Constraints:
- Buttons do not change system settings.
- Action only records lifecycle event in `platform_event`.
- Chinese labels only.
- Keep dense, clean enterprise dashboard composition.
