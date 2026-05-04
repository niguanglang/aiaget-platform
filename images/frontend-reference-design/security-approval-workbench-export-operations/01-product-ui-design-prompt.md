# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 审批与归档运营
- Page/route: 安全中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 安全管理员可以在审批与归档运营看板看到审批工作台导出行为的 24 小时趋势和风险告警，快速识别导出量过大、短时间重复导出、高风险审批筛选导出。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 管理后台 Dashboard Layout，安全中心内的运营卡片包含指标组、风险提示、告警闭环操作

Interface contract that must appear in the UI:
- API/service functions: security center overview, operation alert notify, operation alert actions
- Main entities and fields: `approval_workbench_exports_24h`, `approval_workbench_exported_records_24h`, `approval_workbench_high_risk_exports_24h`, `approval_workbench_repeated_exports_24h`, `operational_alerts`
- Alert IDs: `approval-workbench-export-volume-risk`, `approval-workbench-export-high-risk-filter`, `approval-workbench-export-repeated-risk`
- User actions: 查看安全事件、发送通知、确认、升级、关闭
- Required states: 正常、风险、告警已确认、告警已升级、告警已关闭、通知发送中

Design requirements:
- Use Chinese visible copy only.
- Show a production SaaS/admin product, not a marketing page.
- Emphasize the primary workflow: 查看导出指标 -> 识别导出风险 -> 打开安全事件 -> 通知或处置告警。
- Use compact metric tiles and restrained alert cards; keep the existing dashboard layout stable.
- Use subtle borders, soft shadow, clean enterprise style.

Avoid:
- Fake API fields not listed above.
- New route, unrelated charts, decorative-only widgets, emoji, over-glow, or unreadable text.
