# Product UI Design Image Prompt

```text
Create a high-fidelity product UI design image for a real enterprise model center.

Product context:
- Product/module: 企业 Agent 平台 / 模型中心
- Page/route: 模型供应商管理 at /models
- Target users/roles: 租户管理员、模型管理员、Agent 管理员、审计员、只读查看用户
- Business goal: 拆清模型供应商列表、供应商详情、供应商新增/编辑；模型配置、脱敏 API Key、成本规则、限流、兼容性测试和调用日志全部放在供应商详情页
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件 + motion/react + React Query
- Existing page shell/layout: console 后台布局，左侧导航 + 顶部栏，内容区为响应式 dashboard/admin layout

Interface contract that must appear in the UI:
- API/service functions: listModelProviders, createModelProvider, getModelProvider, updateModelProvider, deleteModelProvider, enableModelProvider, disableModelProvider, createModelApiKey, deleteModelApiKey, testModelProvider, createModelConfig, updateModelConfig, deleteModelConfig, enableModelConfig, disableModelConfig
- Main entities and fields:
  - 供应商名称、编码、供应商类型、基础 URL、状态、是否默认、模型总数、启用模型数、密钥数、最近调用时间、更新时间
  - 模型名称、模型 ID、能力、上下文长度、输入价格、输出价格、每分钟限流、状态、是否默认
  - API Key 名称、前缀、脱敏密钥、状态、最近使用时间
  - 成本规则币种、输入价格、输出价格、计费单位、生效时间
  - 调用日志 trace_id、请求模型、状态、词元、成本、延迟、错误信息
  - 测试结果状态、请求模型、延迟、词元、成本、输出内容
- Status values/enums: ACTIVE, DISABLED, DELETED, SUCCESS, FAILED, OPENAI_COMPATIBLE, AZURE_OPENAI, ANTHROPIC, LOCAL, chat, embedding, rerank, vision, tool_call
- User actions:
  - 搜索、筛选、清空筛选
  - 新建供应商、打开详情、编辑、启用/停用、删除
  - 新建模型、编辑模型、启用/停用模型、删除模型
  - 添加脱敏密钥、删除密钥
  - 运行兼容性测试
  - 查看调用日志和成本规则
- Required states: loading, empty, error, validation, disabled, success, permission-denied, no-models, no-api-keys, no-call-logs, test-running, test-failed, confirmation dialogs for provider/model enable-disable and delete actions

Design requirements:
- Make it look like a production SaaS/admin product, not a generic mockup.
- Use a clear two-level IA: list page for provider overview/table, provider detail page for all provider assets and operations.
- The /models list page should be dense but not overloaded: metrics, filters, provider table, row actions.
- The provider detail page should use grouped sections or tabs: 基础信息、模型配置、接口密钥、成本规则、调用测试、调用日志.
- Create/edit provider should be full-page forms for stronger separation.
- Keep model create/edit as detail-owned actions, shown as drawer or panel inside provider detail.
- Use a coherent component system: cards, table, status badges, forms, confirmation dialogs, test result panel, call log list.
- Provider/model enable-disable actions must open a confirmation dialog that explains impact on Agent bindings and model dispatch before mutating state.
- Use Chinese labels and clear enterprise admin copy.
- Visual language: subtle border, soft shadow, backdrop-blur, restrained gradient mesh, clean product-grade spacing.

Avoid:
- fake API fields not listed above
- random charts or irrelevant model marketplace visuals
- placing API key/test/log sections inside the provider list page
- direct provider/model enable-disable mutation without confirmation
- unreadable tiny text or excessive gradients
```
