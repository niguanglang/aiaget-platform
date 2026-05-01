# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台控制台，成本与额度中心。
- Page/route: M47 成本与额度中心 at `/billing`.
- Target users/roles: 租户管理员、运营管理员、模型管理员、审计员；读取权限 `monitor:log:view`。
- Business goal: 聚合模型调用成本、运行步骤成本、Token 用量、API Key 日额度和限流风险，让企业租户能监控 AI 成本并发现额度风险。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + local shadcn-style Card/Button/MetricCard/StatusBadge/EmptyState, motion/react, lucide icons.
- Existing page shell/layout: 控制台左侧导航 + 顶部栏；页面主体使用响应式 Bento Grid / Dashboard Layout。

Interface contract that must appear in the UI:
- API/service function: `GET /api/v1/billing/overview?window=24h|7d`.
- Data sources:
  - model_call_log: token and cost fields.
  - api_key: daily quota, used today, rate limit, status, expiration and last used.
  - conversation_run.steps: step-level cost and token usage.
- Main entities and fields:
  - Summary: 总成本、模型成本、步骤成本、Token、模型调用、月度预测、额度使用率、风险密钥。
  - Provider costs: provider name, call count, token count, cost, success rate.
  - Model costs: model name, provider, call count, token count, cost, average latency.
  - API key quota: name, masked key, status, daily quota, used today, remaining today, usage rate, rate limit, risk level.
  - Cost trend: time bucket, total cost, model cost, run step cost, token count.
- User actions: 切换 24h/7d 窗口、刷新、查看高风险密钥、查看供应商/模型成本排行。
- Required states: loading, empty, error, no quota configured, partial data.

Design requirements:
- Chinese visible text only.
- Header badges: “M47”, “成本”, “额度”.
- Top KPI row: 总成本、模型成本、步骤成本、Token、月度预测、额度风险.
- Main layout: left cost trend + provider/model cost tables, right quota risk panel and key usage list.
- Use restrained chart-like bars built from UI primitives, not a heavy charting library.
- Visual language: minimal, technical, premium product feel; subtle borders, soft shadow, light glass surface, clean spacing.
- Include realistic examples such as DeepSeek、Qwen、OpenAI Compatible, API Key 日额度 10000, 使用率 76%.

Avoid:
- fake billing payment pages or invoices
- English UI labels
- excessive gradients, glowing blobs, emoji, decorative-only charts
- fields not backed by the listed API contract
