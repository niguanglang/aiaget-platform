# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台 / API Key 管理中心
- Page/route: 外部 API Webhook 回调 at `/api-keys`
- Target users/roles: 租户管理员、系统管理员、外部集成运维人员；没有 `system:api_key:manage` 权限时只读
- Business goal: 在 API Key 创建和治理页面里，为外部系统配置 Agent 运行完成通知，展示最近 Webhook 投递状态，帮助外部系统可靠接收异步结果
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格本地组件；使用 Card、Button、Input、MetricCard、StatusBadge、EmptyState、motion/react
- Existing page shell/layout: `/api-keys` 控制台页面，顶部标题与操作按钮，指标 Bento Grid，外部调用入口卡片，创建密钥表单，外部调用观测，密钥清单和治理侧栏

Interface contract that must appear in the UI:
- API/service functions: `listTenantApiKeys`、`createTenantApiKey`、`deleteTenantApiKey`、`getExternalApiObservability`、`getExternalAgentChatEndpoint`
- Main entities and fields: API Key 名称、脱敏密钥、状态、调用范围、Agent 白名单、IP 白名单、分钟限流、每日额度、流式权限、Webhook 启用状态、Webhook URL、订阅事件 `agent.run.completed`、签名密钥是否已配置、最近投递状态、最近投递错误、最近投递时间
- Status values/enums: API Key `ACTIVE/DISABLED/DELETED`；Webhook 投递 `SUCCESS/FAILED/SKIPPED`；额度风险 `NORMAL/WARNING/CRITICAL/UNLIMITED`
- User actions: 创建密钥、复制密钥、复制调用地址、填写 Webhook URL、填写签名密钥、启用 Webhook、查看最近投递状态、删除密钥、刷新观测
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production enterprise admin product, not a generic template.
- Show Webhook settings as a compact advanced integration panel inside the existing create-key form.
- Show Webhook delivery status in each API Key row with a small status badge and timestamp.
- Keep all visible text in Chinese.
- Use crisp borders, soft shadow, subtle backdrop blur, and restrained gradient mesh background.
- Use a Bento/Dashboard layout with clear information hierarchy and enough whitespace.
- The Webhook section should feel technical and operational: callback URL, event type, signature secret, delivery health.
- Avoid excessive gradients, cheap glow, oversized rounded cards, decorative clutter, and unreadable tiny text.

Output should be a product UI design reference image suitable for implementation in the existing `/api-keys` page.
