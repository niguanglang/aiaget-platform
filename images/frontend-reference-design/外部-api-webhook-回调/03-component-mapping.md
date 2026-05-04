# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面壳与标题区 | `apps/web/src/components/api-keys/api-key-content.tsx` / `ApiKeyContent` | `/api-keys` route | 复用当前页面，不新增路由 |
| 指标 Bento Grid | `MetricCard` | `listTenantApiKeys` + 前端聚合 | 新增 Webhook 启用数量指标 |
| 外部调用入口 | `EndpointCard` | `getExternalAgentChatEndpoint` | 保持现有请求示例 |
| 创建密钥表单 | `CreateKeyCard` + `Input` + 原生 `select/textarea/checkbox` | `CreateTenantApiKeyInput` | 增加 Webhook 开关、URL、签名密钥、事件订阅 |
| 外部调用观测 | `ExternalObservabilitySection` | `getExternalApiObservability` | 不改现有观测结构 |
| 密钥清单行 | `ApiKeyRow` + `StatusBadge` + `DetailRow` | `TenantApiKeyListItem` | 展示 Webhook 启用、签名、最近投递状态/错误/时间 |
| 治理侧栏 | `GovernanceCard` | 权限状态 | 增加 Webhook 签名、异步投递说明 |
| 反馈状态 | `notice/errorMessage` + `EmptyState` | React Query / mutation state | 保持中文成功、错误、空状态 |
