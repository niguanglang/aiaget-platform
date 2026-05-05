# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an existing enterprise AI Agent Platform monitor page.

Project context:
- Product/module: 企业 Agent 平台 / 监控中心
- Page/route: 监控中心 at `/monitor`
- Target users/roles: 运维人员、平台管理员、审计员
- Business goal: 在工作流后端卡片里快速识别可恢复的失败任务，并对知识库任务、渠道自动推进、渠道发布自愈执行恢复重试
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components
- Existing page shell/layout: dashboard layout with operational cards, compact tables, Chinese labels, restrained SaaS styling

Interface contract that must appear in the UI:
- API/service functions: `GET /runtime/workflows/status`, `POST /runtime/workflows/retry`
- Main entities and fields: `task_type`, `task_id`, `workflow_task_type`, `status`, `title`, `channel_id`, `knowledge_base_id`, `document_id`, `error_message`, `updated_at`
- Status values/enums: backend status `READY` / `DISPATCH_FAILED`; task types `knowledge_task`, `channel_release_automation`, `channel_release_self_healing`
- User actions: refresh workflow status, retry a recoverable task
- Required states: loading, empty recoverable tasks, latest failure, retry disabled/spinning, success refresh

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing dashboard.
- Show the primary workflow clearly: operator sees backend status, scans failed tasks grouped by type, clicks 恢复重试 on one task.
- Use compact cards with subtle borders, soft shadow, restrained background, clean Chinese labels.
- Preserve operational clarity: task type badge, title, error message, timestamp/id metadata, right-aligned retry action.
- Keep visual language consistent with an enterprise monitor console.

Avoid:
- invented backend fields, decorative charts, random gradients, unreadable tiny text, emojis, excessive glow.
