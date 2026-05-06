# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform model provider detail page.

Project context:
- Product/module: 企业 AI Agent 平台 / 模型中心
- Page/route: 模型供应商详情 at `/models/[id]`
- Target users/roles: 租户管理员、模型管理员、审计/只读用户
- Business goal: 查看模型供应商完整信息，并在详情页维护模型配置、接口密钥、兼容性测试、成本规则与调用日志
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/inputs/status badges
- Existing page shell/layout: Console content page, max-width 7xl, soft bordered cards, subtle shadow, glass background, Chinese UI text

Interface contract that must appear in the UI:
- API/service functions: getModelProvider, enableModelProvider, disableModelProvider, createModelConfig, updateModelConfig, deleteModelConfig, enableModelConfig, disableModelConfig, createModelApiKey, deleteModelApiKey, testModelProvider
- Main entities and fields: provider name/code/type/status/default/base_url/description, model count/enabled model count/api key count/last call time, model name/model/capabilities/context_length/input_price/output_price/rate_limit_rpm/status/default, api key name/masked_key/key_prefix/last_used_at, test result trace/status/request_model/tokens/cost/latency/output/error, cost rule currency/input/output/unit/status/effective_from, call log created_at/model/status/tokens/latency/cost/trace/error
- Status values/enums: ACTIVE, DISABLED, DELETED, SUCCESS, FAILED
- User actions: back to model center, edit provider via `/models/[id]/edit`, enable/disable provider, create/edit/delete/enable/disable model config, add/delete API key, run compatibility test
- Required states: loading, empty, error, validation, disabled, permission denied

Design requirements:
- Use a production SaaS admin layout with a concise provider header, metric cards, and focused bento cards.
- Split the detail page into clear regions: provider header, metric overview, model config card, API key card, compatibility test card, cost and log card.
- Keep detail density operational but readable. Do not place full provider edit form on this page.
- Chinese labels only. Avoid emoji.
- Visual style: minimal, advanced, product-like, subtle borders, soft shadows, restrained glass feel, no excessive gradients or cheap glow.

Avoid:
- invented backend fields
- supplier deletion action in the detail header
- showing raw API keys after save
- mixing API key creation and compatibility test into an unclear single form
