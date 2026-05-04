# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台 / API Key 管理中心
- Page/route: Webhook 投递日志 at `/api-keys`
- Target users/roles: 租户管理员、审计员、系统管理员；查看日志需要 `system:api_key:view`，失败重试需要 `system:api_key:manage`
- Business goal: 让平台运营人员查看外部 Agent 调用完成后的 Webhook 投递明细、失败原因、响应状态和重试链路
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui；本地组件 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`，动效使用 `motion/react`
- Existing page shell/layout: 复用 `/api-keys` 页面布局，在 API Key 清单下方增加 Webhook 投递日志面板、详情面板和重试入口

Interface contract that must appear in the UI:
- API/service functions: `listWebhookDeliveries`、`getWebhookDelivery`、`retryWebhookDelivery`、`listTenantApiKeys`、`getExternalApiObservability`
- Main entities and fields: 投递 ID、父级投递 ID、API Key 名称、API Key 前缀、事件类型、目标地址、投递状态、响应状态码、响应正文摘要、耗时、重试次数、错误信息、投递时间、更新时间、请求头、payload
- Status values/enums: `SUCCESS`、`FAILED`、`PENDING`、`RETRYING`
- User actions: 按 API Key 过滤、搜索投递 ID、查看详情、复制投递 ID、重试失败记录、刷新列表
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production enterprise admin product, not a generic mockup.
- The main workflow should be troubleshooting and retrying failed webhook deliveries.
- Show a compact top summary, a dense list or table of deliveries, a detail drawer/side panel, and a retry action area.
- Keep all visible text in Chinese.
- Use crisp borders, soft shadow, subtle gradient mesh, and a clean dashboard layout.
- Prioritize operational clarity: show status, response code, latency, retry count, and last error clearly.
- Avoid decorative clutter, unnecessary charts, exaggerated gradients, or large empty spacing.

Output should be a product UI design reference image suitable for the existing API Key page.
