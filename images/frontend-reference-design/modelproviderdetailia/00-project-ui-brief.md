# Project UI Brief

- Page: ModelProviderDetailIA
- Route: /models/[id]
- Feature goal: 模型供应商详情页信息架构拆分与配置卡片重组
- Target users/permissions: 租户管理员或拥有 `model:config:manage` 权限的模型管理员可编辑；无权限用户只读。
- APIs/services: `getModelProvider`, `enableModelProvider`, `disableModelProvider`, `createModelConfig`, `updateModelConfig`, `deleteModelConfig`, `enableModelConfig`, `disableModelConfig`, `createModelApiKey`, `deleteModelApiKey`, `testModelProvider`.
- Entities/fields/statuses: `ModelProviderDetail` 包含供应商基础信息、`models`、`api_keys`、`cost_rules`、`call_logs`；状态使用 `ACTIVE`、`DISABLED`、`DELETED` 和测试状态 `SUCCESS`、`FAILED`。
- Existing components/design system: Next.js App Router、React Query、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`，背景复用 `ModelCenterBackground`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- IA constraints: 详情页负责完整查看和当前供应商下的配置维护；供应商基础编辑进入 `/models/[id]/edit`；列表页删除供应商，详情页不放假删除动作；API Key 只允许写入一次并只展示 `masked_key`。
