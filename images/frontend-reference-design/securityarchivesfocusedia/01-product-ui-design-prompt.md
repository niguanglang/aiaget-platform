# Product UI Design Image Prompt

Create a high-fidelity Chinese enterprise SaaS admin screen for "安全中心 - 归档治理" at `/security/archives`.

Layout: dashboard admin page with a concise header, route subtitle, action buttons, source tabs for "告警通知归档", "自愈审计归档", "SLA 死信归档". Use four metric cards: 归档文件, 归档容量, 删除待审, 删除生效. Below, split into a focused archive list and a focused delete-approval queue. The archive list shows only file name, folder, size, last modified, and row actions. The approval queue shows status, file name, requester, reviewer, requested time, and high signal details.

Visual style: minimal technical product UI, Tailwind/shadcn-like cards, subtle borders, soft shadow, backdrop blur, restrained blue/emerald/amber/red status accents, no emoji, no cheap glow, no overloaded details. 8px radius or less.

Interactions to imply: source tab switch, row hover, delete confirmation, disabled approve/reject buttons if no permission, refresh, empty/error/loading states. Chinese labels only.
