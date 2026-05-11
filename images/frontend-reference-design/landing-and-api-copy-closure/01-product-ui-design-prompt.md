# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise Agent Platform landing entry and API reference center.

Project context:
- Product/module: 企业 AIAgent 平台
- Page/route: 首页 `/` and 开放接口文档中心 `/api-reference`
- Target users/roles: 企业管理员、Agent 运营、开发者
- Business goal: 首页展示当前生产化控制台入口；API 文档展示真实可用的外部 Agent 调用、SSE 流式、会话续聊和 Webhook 回调能力。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style Button/Card/StatusBadge.

Interface contract:
- Home actions: 登录 `/login`, 打开控制台 `/dashboard`
- API reference actions: 复制接口、管理 API Key、打开 Swagger
- Status badges: 平台控制台、权限闭环、运行监控、开放接口、SSE 流式、会话续聊、Webhook 回调
- Required states: no obsolete milestone copy, no mock badge for production features.

Design requirements:
- Minimal enterprise SaaS style, clean hierarchy, restrained glass card, Chinese labels.
- Do not invent new product modules or external APIs.
- Make the first screen feel like a real product entry, not an M01 demo page.
