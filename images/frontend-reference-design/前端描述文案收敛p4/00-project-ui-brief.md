# Project UI Brief

- Page: 前端描述文案收敛p4
- Route: /console
- Feature goal: 移除控制台页面中过多说明性文案，保留可执行操作、状态和真实错误提示
- APIs/services: 不改接口，仅保留现有查询、筛选、创建、审批、重试、导出、下载等真实操作。
- Entities/fields/statuses: 数据权限、Agent 团队、渠道发布、知识库、插件、安全中心、平台用量、告警通知。
- Existing components/design system: Next.js app router、React、TypeScript、Tailwind CSS、`Button`、`Card`、`EmptyState`、`StatusBadge`、各模块已有表格和表单。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Copy constraints: 删除页面头部解释、卡片副说明和长空状态描述；保留标题、状态、字段标签、按钮、错误提示、权限提示、确认弹窗和真实数据。
- Interaction constraints: 不移动路由，不改 API 合约，不删除操作按钮；共享组件只减少描述文本渲染，不改变业务状态。
