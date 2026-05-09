# Product Prototype / Wireframe Prompt

```text
Create a low- to mid-fidelity product prototype / wireframe for an enterprise model center.

Project context:
- Page/route: 模型供应商管理 at /models
- Users/roles: 租户管理员、模型管理员、Agent 管理员、审计员、只读查看用户
- Main task flow:
  1. 在 /models 列表页搜索和筛选供应商
  2. 打开 /models/:id 查看供应商详情
  3. 在详情页管理模型配置、脱敏接口密钥、成本规则、兼容性测试和调用日志
  4. 使用 /models/create 创建供应商
  5. 使用 /models/:id/edit 编辑供应商基础信息
- API/service contract: listModelProviders, createModelProvider, getModelProvider, updateModelProvider, deleteModelProvider, enableModelProvider, disableModelProvider, createModelApiKey, deleteModelApiKey, testModelProvider, createModelConfig, updateModelConfig, deleteModelConfig, enableModelConfig, disableModelConfig
- Data entities and fields:
  - provider list fields: name, code, provider_type, base_url, status, is_default, model_count, enabled_model_count, api_key_count, last_call_at, updated_at
  - provider detail fields: models, api_keys, cost_rules, call_logs
  - model fields: name, model, capabilities, context_length, input_price, output_price, rate_limit_rpm, status, is_default
  - key fields: name, masked_key, last_used_at
  - test fields: prompt, status, output_text, latency_ms, total_tokens, total_cost
  - log fields: trace_id, request_model, status, total_tokens, total_cost, latency_ms, created_at
- Actions and states:
  - list/search/filter/clear filters
  - create/edit/delete provider
  - enable/disable provider with confirmation
  - create/edit/delete/enable/disable model config with confirmation for status and delete actions
  - add/delete masked API key
  - run compatibility test
  - loading, empty, error, validation, disabled, success, permission-denied

Prototype requirements:
- Show the list page as a toolbar + metric cards + filter strip + provider table + row actions.
- Show create/edit provider as route-level full-page forms, not embedded in the list.
- Show provider detail as grouped blocks or tabs: 基础信息, 模型配置, 接口密钥, 成本规则, 调用测试, 调用日志.
- Keep model create/edit as detail-owned drawer/panel actions.
- Show confirmation dialogs for provider/model enable-disable actions with impact copy.
- Make component boundaries obvious for implementation.
- Keep layout realistic for the current console shell.

Avoid:
- decorative-only mockups
- invented backend fields
- putting provider detail/test/API key blocks inside the list page
- direct enable-disable state mutation without a confirmation step
```
