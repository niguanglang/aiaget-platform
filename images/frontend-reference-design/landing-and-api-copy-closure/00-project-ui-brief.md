# Project UI Brief

- Page: Landing and API Copy Closure
- Route: / and /api-reference
- Feature goal: 首页与开放接口中心生产化文案一致性修复
- Target users/permissions: 企业后台管理员、Agent 运营、开发者；登录入口公开，控制台功能由既有权限系统控制。
- APIs/services: 首页只提供 `/login`、`/dashboard` 路由入口；开放接口中心展示现有 `externalEndpoints`、`streamEventFields`、Webhook 字段和 API Key 管理入口。
- Entities/fields/statuses: Agent 外部调用、SSE 流式、新建会话、续聊、Webhook 回调、API Key scope、Trace、错误码。
- Existing components/design system: Next.js App Router、Tailwind CSS、`Button`、`Card`、`StatusBadge`、`MetricCard`、控制台渐变背景语义。
- Required states: 首页避免旧里程碑/演示文案；API 文档把已落地能力标记为 ready/healthy，不再使用 mock 语义。
- Constraints: 不改路由和接口契约；保持中文文案；只做信息一致性和状态语义修复。
