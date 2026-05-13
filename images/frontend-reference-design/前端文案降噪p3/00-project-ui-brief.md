# Project UI Brief

- Page: 前端文案降噪p3
- Route: /console
- Feature goal: 清理剩余后台页面内部里程碑、列表职责解释和示例式占位文案
- APIs/services: 不变更接口，仅沿用各页面现有 `@/lib/api-client` 查询、创建、编辑、删除、重试和校验方法。
- Entities/fields/statuses: API Key、开放接口、Agent、Prompt、Tool、Model Provider、Knowledge Base、Resource ACL、Audit、Tenant、Department、Storage、Plugin、Invoice、Channel Account、Role Scenario。
- Existing components/design system: Next.js app router、React、TypeScript、Tailwind CSS、`Button`、`Card`、`MetricCard`、`StatusBadge`、各模块现有表单和列表组件。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Copy constraints: 页面文案保持中文，删除 Mxx 里程碑、内部 IA 解释、营销化词汇和占位式空状态；保留代码样例、真实禁用态、权限提示和业务操作说明。
- Interaction constraints: 不移动路由，不改 API 合约，不删除功能按钮；无权限的新建或编辑入口继续按既有权限策略处理。
