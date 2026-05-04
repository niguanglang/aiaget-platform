# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page extension.

Project context:
- Product/module: 企业 Agent 平台 / 多 Agent 协作中心
- Page/route: 团队运行报告归档 at `/agent-teams`
- Target users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Business goal: 把单次团队运行报告保存到对象存储，提供归档列表、下载链接和删除审批闭环，满足企业审计留痕。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件；现有页面使用 `Card`、`StatusBadge`、`Button`、`EmptyState`、紧凑指标和分栏详情。
- Existing page shell/layout: 保持 `/agent-teams` 当前后台布局；归档入口放在运行工作区内，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: create archive, list archives, get archive download URL, request delete approval, list delete approvals, approve/reject delete approval.
- Main entities and fields: archive file name, size, last modified, team name, run objective, run id, created by, delete approval status, requested/reviewed actors, requested/reviewed time.
- Status values: archive delete approval `PENDING/APPROVED/REJECTED/APPLIED`。
- User actions: 生成归档、下载归档、申请删除、通过删除、拒绝删除、查看审批状态。
- Required states: empty archives, creating archive, downloading, delete pending, no approval permission, storage unavailable, archive already deleted.

Design requirements:
- Production SaaS/admin style, compact and operational.
- Add a “报告归档” panel under the run report export panel: coverage summary, create archive button, archive table/list, pending approval lane.
- Use Chinese labels and realistic enterprise audit wording.
- Use subtle borders, soft shadows, restrained badges, no marketing hero.
- Keep layout clear on desktop and mobile; avoid text overflow.

Avoid:
- PDF/template designer UI not supported by backend
- unrelated global archive center route
- decorative gradients, emoji, loud glow, oversized round blocks
