# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform report page enhancement.

Context:
- Module: 客户成功续约机会中心
- Route: /customer-success-opportunities/[id]/close-won-report
- Feature: 成交复盘报告 Markdown 导出
- Users: 客户成功负责人、财务运营、租户管理员、审计员
- Stack: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components

Interface contract:
- Existing report page shows: 成交复盘报告、客户价值复盘、来源链路、入账追踪、复盘要点、下一步动作。
- Add one restrained header action button: 导出报告。
- Button state: idle, exporting, export error notice.
- Exported file format: .md, content from current report data.
- Do not add edit forms, close-won actions, approval forms, or list-page widgets.

Design requirements:
- Chinese UI only.
- Enterprise SaaS report page, clean and operational.
- Keep button group in header aligned with 返回详情、调账记录、审计追踪。
- Use subtle border, soft shadow, adequate spacing, minimal motion language.
