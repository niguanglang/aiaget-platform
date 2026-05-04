# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心
- Page/route: M107 通知任务自愈闭环审计归档删除审批 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 对 M106 生成的自愈闭环审计归档执行删除申请、审批、审计时间线和对象存储删除生效，保证审计归档删除可追踪。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui 风格组件, existing `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`.
- Existing page shell/layout: 安全中心内的通知任务中心卡片，卡片内包含审计检索、归档下载和删除审批面板。

Interface contract that must appear in the UI:
- API/service functions:
  - request archive delete approval
  - list approval overview
  - list approval items
  - fetch approval detail
  - approve deletion
  - reject deletion
- Main entities and fields:
  - archive file name, archive key, archive size, last modified
  - approval id, archive id, status, reason, requested_by, reviewed_by, requested_at, reviewed_at
  - audit timeline: event type, title, note, actor, request_id, trace_id, occurred_at
- Status values/enums: PENDING, APPROVED, REJECTED, APPLIED
- User actions: 申请删除, 刷新审批, 筛选审批状态, 只看待审批, 导出当前审批筛选, 查看审批详情, 批准, 拒绝, 输入审批意见, 跳转审计中心, 跳转 Trace
- Required states: loading, empty, error, disabled, success, approval pending, detail loading

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing page.
- Use compact enterprise dashboard layout with clear hierarchy and Chinese labels.
- Primary workflow: choose archive -> request deletion approval -> security reviewer sees pending approval -> opens detail timeline -> approves or rejects -> object deletion is marked applied.
- Include an archive table on top and a deletion approval center below.
- Include metrics for pending, approved, rejected, applied.
- Use subtle borders, restrained shadows, glass-like card backgrounds, and consistent spacing.
- Keep motion implied through hover and loading states only; avoid exaggerated effects.

Avoid:
- fake fields not listed above
- unrelated charts or decorative blobs
- English UI labels
- visual clutter or over-bright gradients
