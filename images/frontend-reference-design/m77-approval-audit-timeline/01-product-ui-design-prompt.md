# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform approval center.

Project context:
- Product/module: 企业 AI Agent 平台 / 审批中心
- Page/route: 审批中心 at `/approvals`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 在处理工具审批和通知策略审批时，直接看到统一审批审计时间线，支持追溯创建、提交、批准、拒绝、生效、失败等关键事件。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components, `Card`, `Button`, `StatusBadge`, `MetricCard`, `EmptyState`, `motion/react`
- Existing layout: SaaS 控制台，左侧导航 + 顶部栏，内容区为审批队列和右侧详情面板。

Interface contract that must appear:
- Approval type switch: 工具审批 / 通知策略
- Queue table: 时间、对象、动作、审批状态、影响/来源、申请人、上下文
- Detail panel:
  - Basic approval facts
  - Decision note textarea
  - 批准 / 拒绝 action buttons
  - New audit timeline section
- Audit timeline fields:
  - 事件类型：创建、提交、批准、拒绝、生效、执行失败
  - 事件状态：INFO / SUCCESS / FAILED / WARNING
  - 操作人、备注、请求 ID、Trace ID、发生时间
  - metadata JSON preview

Design requirements:
- Production SaaS/admin look, restrained and operational.
- Use Bento/Dashboard-style hierarchy but avoid overpacked cards.
- Add a timeline rail inside the detail panel with subtle borders, soft shadow, and clear event ordering.
- Use Chinese UI text only.
- Keep interactions natural: hover feedback, smooth transitions, restrained reveal animation.
- High impact and rejected events should be visible but not flashy.

Avoid:
- decorative charts unrelated to approval audit
- fake fields outside the listed contract
- excessive gradients, cheap glow, oversized rounded blobs
