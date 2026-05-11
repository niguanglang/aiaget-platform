# Product UI Design Image Prompt

Design a high-fidelity Chinese enterprise SaaS security operations page for `/security/recovery`.

The page is titled "自愈恢复" and focuses on notification task recovery. Use a quiet dashboard layout with subtle borders, soft shadows, restrained glass surfaces, and compact density. The top header has page title, short description, refresh action, and a link to "告警运营". Below it show four metric cards: 待通知, 待重试, 任务失败率, 待处理建议.

Main content:
1. A "任务运行" card with scheduler status tiles and two contained action buttons: "运行自动通知" and "运行自动重试". Mutating buttons should look operational but not loud.
2. A "任务运行历史" list with filters for task, status, and keyword.
3. A "自愈建议" card listing suggestions with severity, failure source, status, last action/note, evidence, primary/secondary navigation links, and three small row actions: 确认, 忽略, 解决.
4. A "恢复审计" card with filters and header actions: "导出恢复审计" and "创建恢复审计归档".
5. A lower "归档审批" evidence card with archive metrics and recent archive/deletion approval summaries.

Use Tailwind/shadcn style, no emoji, no oversized hero, no decorative orb. Buttons must not crowd list rows; secondary actions can be outline buttons. Ensure Chinese labels fit.
