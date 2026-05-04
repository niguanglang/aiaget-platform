# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台，渠道发布中心
- Page/route: 渠道详情页 `/channels`
- Target users/roles: 渠道管理员、Agent 管理员、安全管理员、审计员
- Business goal: 让管理员在渠道发布后查看失败自愈评估，并通过 Runtime workflow / Temporal fallback 执行一次自愈或回滚演练。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like components, glass card dashboard style.
- Existing page shell/layout: 左侧渠道列表 + 右侧详情工作区，使用 Bento/Dashboard 卡片，中文界面。

Interface contract that must appear in the UI:
- API/service functions: `getChannelReleaseSelfHealing`, `updateChannelReleaseSelfHealing`, `runChannelReleaseSelfHealing`
- Main entities and fields:
  - 策略：启用发布自愈、演练模式、允许自动回滚、最大错误请求、最低放行率、观测窗口、自愈冷却
  - 评估：自愈结论、评估原因、建议回滚、回滚点、当前批次、最近自动推进、评估时间
  - 运行：运行 ID、工作流 ID、工作流后端、批次、结果、是否回滚、开始、完成
  - 工作流：工作流模式、执行后端
  - 最近事件：事件类型、状态、发生时间、Trace
- Status values/enums:
  - `HEALTHY`, `OBSERVE`, `ROLLBACK_RECOMMENDED`, `ROLLED_BACK`, `SKIPPED`, `DISABLED`, `FAILED`
  - `local`, `temporal_first`, `temporal`
  - `LOCAL`, `LOCAL_FALLBACK`, `TEMPORAL`
- User actions: 刷新自愈、执行一次、保存自愈策略
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a real production enterprise AI operations console, not a landing page.
- Use clean Chinese labels and realistic dense admin layout.
- Use fine borders, soft shadows, subtle backdrop blur, quiet glass texture, restrained gradient mesh background.
- Use cards for repeated operational blocks only; avoid cards inside cards except detail panels already present in the product.
- Primary workflow: 管理员查看自愈结论 -> 调整策略 -> 查看 workflow 模式/执行后端 -> 执行一次 -> 查看最近运行和事件。
- Keep hierarchy clear: top badges, metric cards, strategy panel, evaluation panel, event feed.
- Show the self-healing panel integrated into the existing channel detail page, not a standalone marketing screen.
- Include disabled button visual states for missing permission or cooldown.

Avoid:
- Fake fields not listed above
- English UI text
- Decorative charts unrelated to self-healing
- Overdone gradients, cheap glow, emoji, oversized rounded blobs
- Invented middleware/container controls
