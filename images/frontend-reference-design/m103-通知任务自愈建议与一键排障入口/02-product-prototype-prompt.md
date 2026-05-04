# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the real `/security` page section.

Scope:
- Module: 企业 AI Agent 平台 / 安全中心 / 审批与归档运营
- Milestone: M103 通知任务自愈建议与一键排障入口
- Placement: directly below the existing “通知任务失败聚合” metric row and above “运营告警闭环”.

Information architecture:
1. Keep the existing parent card and page shell unchanged.
2. Add a compact section header: “通知任务自愈建议”.
3. Header includes two badges: `M103` and either `需要排障` or `暂无建议`.
4. Below header, show a responsive 2-column grid of recommendation cards.
5. Each recommendation card contains:
   - severity badge: 低风险 / 中风险 / 高风险
   - reason label: Webhook 未配置、Webhook 投递失败、自动通知关闭、自动重试关闭、连续失败、失败率偏高
   - title
   - one-line description
   - evidence line
   - primary action button
   - optional secondary action button
6. Empty state: centered panel with “暂无排障建议” and a small link to “查看任务历史”.

Interaction flow:
- Primary action routes to `/settings?category=INTEGRATION`, `/settings?category=NOTIFICATION`, `/security`, `/monitor`, or `/audit`.
- Secondary action routes to an adjacent evidence page.
- Buttons are links only; no action should imply automatic repair or configuration mutation.

Wireframe style:
- Chinese labels only.
- Dense enterprise dashboard layout.
- Simple boxes, labels, chips, and arrows.
- No decorative hero area, no marketing copy, no unrelated modules.
