# Enterprise Agent Platform AI Build Prompt

你是一名资深全栈架构师和工程实现 Agent。请基于本文档从空仓库开始，按阶段实现一个可演示、可扩展、可私有化部署的企业级 Agent 平台。

目标不是一次性堆出所有高级能力，而是先完成稳定的 MVP 骨架，再逐步替换为生产级实现。每一步都必须保留清晰边界、接口契约和扩展点，后续可以平滑接入真实模型、RAG、Temporal、OpenTelemetry、Kubernetes、企业权限和插件生态。

## 1. 总体目标

构建一个 Enterprise Agent Platform，用于统一管理企业内部智能体、模型、提示词、知识库、工具调用、会话运行、监控审计和多租户权限。

核心目标：

1. 企业可以创建、配置、测试、发布 Agent。
2. Agent 可以绑定模型、提示词、知识库、工具。
3. Agent 可以通过 RAG 查询企业文档。
4. Agent 可以调用企业内部 HTTP API 工具。
5. 平台记录完整运行日志、调用链、Token 消耗、工具调用、RAG 引用。
6. 平台支持多租户、RBAC、审计、安全策略和私有化部署。

## 2. 技术栈固定

前端：

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
Monaco Editor
React Flow
```

控制面后端：

```text
NestJS
TypeScript
Prisma 或 TypeORM，优先 Prisma
PostgreSQL
Redis
JWT
Passport
class-validator
OpenAPI / Swagger
```

Agent Runtime：

```text
Python
FastAPI
LangGraph
Pydantic
SSE
Redis
Qdrant Client
OpenSearch Client
Temporal Python SDK
OpenTelemetry SDK
```

基础设施：

```text
PostgreSQL
Redis
MinIO
Qdrant
OpenSearch
Temporal
Prometheus
Grafana
Loki
Docker Compose
Kubernetes，后续产品化阶段
```

## 3. 架构原则

必须按四个核心平面拆分：

```text
1. Web Console：企业后台控制台。
2. Control Plane：租户、权限、配置、日志、审计、API Key、元数据。
3. Agent Runtime：Agent 执行、模型调用、RAG、工具调用、流式响应。
4. Observability Plane：指标、日志、Trace、成本、审计。
```

架构边界要求：

1. 前端只调用 Control Plane，不直接访问数据库、Qdrant、MinIO、Temporal。
2. Control Plane 负责认证、授权、配置管理、运行记录，不直接实现复杂 AI 编排。
3. Runtime 通过 Control Plane 提供的配置执行 Agent，不直接管理租户后台配置。
4. Tool Gateway 第一版可内置在 Runtime 或 Control Plane，但接口必须独立，后续能拆成 Go 服务。
5. 所有核心数据必须包含 `tenant_id`，后续支持租户隔离。
6. 所有外部服务访问必须通过 adapter/provider 抽象，避免业务代码直接依赖具体 SDK。

## 4. 仓库结构

从空仓库开始生成以下结构：

```text
apps/
  web/
  control-api/
  agent-runtime/
packages/
  shared-types/
  eslint-config/
  tsconfig/
deploy/
  docker-compose.yml
  env/
  nginx/
docs/
  architecture/
  api/
  database/
  product/
scripts/
```

说明：

1. `apps/web` 是 Next.js 控制台。
2. `apps/control-api` 是 NestJS 控制面 API。
3. `apps/agent-runtime` 是 FastAPI Runtime。
4. `packages/shared-types` 存放前后端共享枚举、接口类型、错误码。
5. `deploy` 存放本地开发和私有化部署配置。
6. `docs` 存放设计文档、接口文档、数据库设计、页面说明。

## 5. 全局开发规则

实现时必须遵守：

1. 每完成一个阶段都要能启动、能登录、能访问核心页面、能跑基础测试。
2. 不允许把大量逻辑写在 Controller 或页面组件里，必须拆到 service、repository、adapter、hook、component。
3. DTO、Schema、Entity、Migration、OpenAPI 文档必须同步维护。
4. 所有列表页必须支持分页、搜索、状态筛选、创建、编辑、删除、详情查看。
5. 所有详情页必须展示基础信息、配置区、关联资源、运行记录、审计记录。
6. 所有删除必须优先软删除，除非是临时开发数据或明确的物理删除接口。
7. 所有敏感字段必须脱敏返回，例如 API Key、Secret、Token、Webhook Secret。
8. 所有跨模块绑定都要使用 binding 表，不要把数组塞进主表。
9. 所有运行类数据必须有 `trace_id`、`run_id`、`status`、`started_at`、`ended_at`、`error_message`。
10. 第一版可以用 mock provider，但 provider 接口必须按真实服务设计。

## 6. 阶段 M00：项目初始化

目标：生成可维护的 monorepo 基础工程。

任务：

1. 初始化 pnpm workspace。
2. 创建 Next.js 前端应用。
3. 创建 NestJS 控制面应用。
4. 创建 FastAPI Runtime 应用。
5. 配置 TypeScript、ESLint、Prettier。
6. 配置 Docker Compose，包含 PostgreSQL、Redis、MinIO、Qdrant、OpenSearch、Temporal。
7. 创建 `.env.example`，不要提交真实密钥。
8. 创建基础 README，写明本地启动步骤。

验收：

```text
pnpm install
pnpm lint
pnpm typecheck
docker compose -f deploy/docker-compose.yml config
```

## 7. 阶段 M01：基础框架与导航

目标：完成 Web Console、Control API、Runtime 的基础连通。

前端页面：

```text
/login
/dashboard
/agents
/prompts
/models
/knowledge
/tools
/conversations
/monitor
/audit
/settings
```

任务：

1. 实现登录页、主布局、左侧导航、顶部栏。
2. 实现 API Client、鉴权 Token 注入、错误处理、Loading 状态。
3. 实现 Control API 健康检查。
4. 实现 Runtime 健康检查。
5. Dashboard 展示 mock 指标卡片和趋势图骨架。

扩展要求：

1. 导航菜单从配置生成，后续可按权限动态过滤。
2. API Client 支持统一请求 ID 和错误码处理。
3. 前端路由保护抽象成独立组件。

验收：

```text
GET /api/v1/health
GET /runtime/health
打开 /dashboard 能看到控制台布局
```

## 8. 阶段 M02：租户、用户与认证

目标：建立多租户和权限基础。

数据表：

```text
tenant
user
role
permission
user_role
api_key
login_log
operation_log
```

后端接口：

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
GET  /api/v1/tenants
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id
DELETE /api/v1/users/:id
```

任务：

1. 实现 JWT 登录、刷新、登出。
2. 密码必须使用 bcrypt 或 argon2 哈希。
3. 用户表必须包含 `tenant_id`。
4. 实现默认租户和默认管理员 seed。
5. 实现 RBAC 基础 Guard。
6. 登录成功写入 `login_log`。
7. 写入基础操作日志拦截器。

扩展要求：

1. Guard 必须预留 ABAC 上下文。
2. API Key 表必须支持后续机器调用和 Key 轮换。
3. 所有接口通过 request context 获取当前 tenant 和 user。

验收：

```text
可以用默认管理员登录
刷新页面后仍能保持登录状态
不同 tenant 的数据查询必须隔离
```

## 9. 阶段 M03：Agent 配置中心

目标：完成 Agent 从创建到发布的配置闭环。

数据表：

```text
agent
agent_version
agent_category
agent_model_binding
agent_prompt_binding
agent_knowledge_binding
agent_tool_binding
agent_publish_channel
agent_audit_log
```

列表页 `/agents`：

```text
1. 指标区：总数、已发布、草稿、已停用。
2. 搜索：名称、编码、描述。
3. 筛选：状态、分类、负责人。
4. 表格列：名称、编码、状态、版本、默认模型、更新时间、负责人、操作。
5. 操作：新建、编辑、复制、启用、停用、删除、进入详情。
```

详情页 `/agents/[id]`：

```text
1. 顶部：Agent 名称、状态、版本、发布按钮、停用按钮、复制按钮。
2. 基础信息：名称、编码、描述、头像、分类、负责人。
3. 运行配置：temperature、max_context_tokens、enable_stream、enable_log。
4. 模型绑定：选择默认模型、备用模型。
5. Prompt 绑定：选择系统 Prompt 和用户 Prompt。
6. 知识库绑定：绑定、解绑、权重、召回数量。
7. 工具绑定：绑定、解绑、是否需要审批。
8. 版本管理：版本列表、创建版本、发布版本、回滚版本、版本对比。
9. 会话测试：输入问题、查看回答、查看引用、查看工具调用链。
10. 审计记录：配置变更、发布、停用、删除。
```

状态流转：

```text
DRAFT -> TESTING -> PENDING -> PUBLISHED
PUBLISHED -> DISABLED
DISABLED -> PUBLISHED
PUBLISHED -> ARCHIVED
```

扩展要求：

1. Agent 主表保存当前配置，版本表保存快照。
2. 发布必须生成不可变版本快照。
3. 绑定关系必须独立成表。
4. 会话测试必须走 Runtime 接口，第一版可使用 mock model。

验收：

```text
可以创建 Agent
可以编辑配置
可以创建版本
可以发布和回滚
可以进入会话测试
```

## 10. 阶段 M04：模型中心

目标：管理模型供应商、模型配置、Key、安全脱敏、调用测试。

数据表：

```text
model_provider
model_config
model_api_key
model_cost_rule
model_call_log
```

列表页 `/models`：

```text
1. 指标区：供应商数量、启用模型、今日调用、今日费用。
2. 供应商列表：名称、类型、Base URL、状态、默认标识。
3. 模型列表：模型名、能力、上下文长度、输入单价、输出单价、限流、状态。
4. 操作：新建供应商、新建模型、编辑、禁用、删除、测试。
```

详情页：

```text
1. 供应商基础信息。
2. API Key 管理，展示掩码，不返回完整密钥。
3. 模型能力配置：chat、embedding、rerank、vision、tool_call。
4. 成本规则配置。
5. 限流策略。
6. 调用测试面板。
7. 调用日志。
```

扩展要求：

1. 模型调用通过 `ModelProviderAdapter` 抽象。
2. 支持 OpenAI Compatible 作为第一版真实接入方式。
3. API Key 必须加密存储。
4. 前端永远不展示完整 Key。
5. 调用日志必须记录 token、耗时、状态、错误。

验收：

```text
可以配置 OpenAI Compatible 模型
可以测试一次模型调用
可以看到脱敏 Key 和调用日志
```

## 11. 阶段 M05：Prompt Center

目标：管理提示词模板、变量、版本、测试和回滚。

数据表：

```text
prompt_template
prompt_version
prompt_variable
prompt_test_record
```

列表页 `/prompts`：

```text
1. 指标区：模板数量、已发布、草稿、测试次数。
2. 搜索：名称、编码、内容。
3. 筛选：类型、状态、创建人。
4. 表格列：名称、编码、类型、状态、版本、更新时间、操作。
5. 操作：新建、编辑、复制、发布、回滚、删除、测试。
```

详情页：

```text
1. 基础信息：名称、编码、类型、描述、状态。
2. Monaco Editor 编辑 Prompt 内容。
3. 变量配置：变量名、类型、默认值、是否必填、说明。
4. 版本列表：版本号、发布人、发布时间、变更说明。
5. 测试面板：变量输入、渲染结果、模型测试。
6. 引用关系：被哪些 Agent 使用。
7. 审计记录。
```

扩展要求：

1. Prompt 发布生成不可变版本。
2. 变量使用 Zod 或 JSON Schema 校验。
3. Runtime 只能使用已发布版本，测试环境可使用草稿。
4. Prompt 渲染必须独立成 service。

验收：

```text
可以创建 Prompt
可以配置变量
可以发布版本
可以测试渲染结果
Agent 可以绑定 Prompt
```

## 12. 阶段 M06：知识库中心

目标：完成知识库、文档、切片、检索测试的闭环。

数据表：

```text
knowledge_base
knowledge_document
knowledge_segment
knowledge_embedding_task
knowledge_recall_log
```

列表页 `/knowledge`：

```text
1. 指标区：知识库数量、文档数量、切片数量、处理失败数。
2. 搜索：知识库名称、编码、描述。
3. 筛选：状态、可见范围、更新时间。
4. 表格列：名称、编码、文档数、切片数、状态、更新时间、操作。
5. 操作：新建、编辑、上传文档、检索测试、重建索引、删除。
```

详情页：

```text
1. 知识库基础信息：名称、编码、描述、可见范围、状态。
2. 文档列表：标题、类型、大小、状态、切片数、上传人、更新时间。
3. 文档上传：PDF、Word、Excel、Markdown、TXT、HTML、URL、FAQ。
4. 文档详情：原文预览、解析文本、切片列表、索引状态。
5. 切片管理：内容、token 数、向量状态、关键词、元数据。
6. 检索测试：输入 query，展示向量召回、关键词召回、混合排序、引用来源。
7. 处理任务：解析、切片、Embedding、入库、失败重试。
8. 绑定 Agent：展示使用该知识库的 Agent。
```

扩展要求：

1. 原始文件存 MinIO。
2. 元数据存 PostgreSQL。
3. 向量存 Qdrant，payload 必须包含 tenant、kb、document、security_level。
4. 关键词索引存 OpenSearch。
5. 第一版可以同步处理小文件，但处理任务表必须按异步工作流设计。
6. 后续可把文档处理迁移到 Temporal Worker。

验收：

```text
可以创建知识库
可以上传 TXT/Markdown 文档
可以生成切片
可以执行检索测试
Agent 可以绑定知识库并返回引用
```

## 13. 阶段 M07：工具中心

目标：完成 HTTP Tool 管理、测试、授权、调用日志和高危审批预留。

数据表：

```text
tool_definition
tool_param_schema
tool_auth_config
tool_permission
tool_call_log
tool_approval_record
```

列表页 `/tools`：

```text
1. 指标区：工具数量、启用工具、今日调用、失败率。
2. 搜索：名称、编码、URL。
3. 筛选：类型、状态、风险等级。
4. 表格列：名称、编码、类型、方法、风险等级、状态、更新时间、操作。
5. 操作：新建、编辑、复制、启用、停用、测试、删除。
```

详情页：

```text
1. 基础信息：名称、编码、描述、类型、风险等级、状态。
2. HTTP 配置：method、url、headers、query、body、timeout、retry。
3. 参数 Schema：JSON Schema 编辑器。
4. 输出 Schema：JSON Schema 编辑器。
5. 鉴权配置：None、Bearer、Basic、API Key、Custom Header。
6. 安全策略：是否高危、是否需要审批、调用频率限制。
7. 测试面板：输入参数、执行请求、展示响应。
8. Agent 绑定：哪些 Agent 可以调用。
9. 调用日志：请求摘要、响应摘要、耗时、状态、错误。
```

扩展要求：

1. 工具调用必须通过 `ToolExecutor` 抽象。
2. Runtime 不允许执行任意 Shell。
3. 所有参数必须按 JSON Schema 校验。
4. 高危工具第一版可以只记录审批状态，后续接 Temporal Human-in-the-loop。
5. Tool Gateway 接口独立，后续可迁移到 Go。

验收：

```text
可以创建 HTTP Tool
可以测试调用
Agent 只能调用已绑定工具
调用日志可查询
```

## 14. 阶段 M08：会话中心与 Runtime

目标：跑通 Agent Chat、SSE、运行轨迹、消息记录。

数据表：

```text
conversation
message
message_reference
agent_run
agent_run_step
agent_feedback
```

页面 `/conversations`：

```text
1. 会话列表：Agent、用户、标题、消息数、最后时间、状态。
2. 会话详情：消息流、引用来源、工具调用、运行步骤。
3. 新建会话：选择 Agent，输入问题。
4. 调试面板：Prompt、模型、知识库召回、工具调用链。
5. 用户反馈：点赞、点踩、反馈原因。
```

Runtime API：

```text
POST /runtime/agent/chat
POST /runtime/agent/chat/stream
POST /runtime/agent/run
GET  /runtime/runs/:runId
POST /runtime/runs/:runId/cancel
POST /runtime/tools/call
POST /runtime/rag/retrieve
```

扩展要求：

1. Chat 请求由 Control Plane 创建 run，再调用 Runtime。
2. Runtime 每个步骤都写入 `agent_run_step`。
3. SSE 必须支持增量内容、步骤事件、引用事件、错误事件、结束事件。
4. Runtime 的模型、RAG、工具都通过 provider/adapter 注入。
5. 第一版允许 mock LLM，但接口要兼容 OpenAI Compatible。

验收：

```text
可以在 Agent 详情页发起测试会话
可以在会话中心查看历史消息
可以看到 run step
可以看到 RAG 引用和工具调用结果
```

## 15. 阶段 M09：监控与审计

目标：提供基础运营监控、调用日志、审计查询。

数据表：

```text
audit_log
security_event
operation_log
model_call_log
tool_call_log
knowledge_recall_log
agent_run
agent_run_step
```

页面 `/monitor`：

```text
1. 调用总览：今日调用、成功率、平均耗时、P95、P99。
2. Token 成本：输入 Token、输出 Token、费用趋势。
3. Agent 排行：调用量、失败率、平均耗时。
4. 模型监控：模型调用、错误率、成本。
5. 工具监控：调用次数、失败率、耗时。
6. RAG 监控：召回次数、命中率、平均 TopK 分数。
7. 错误列表：错误码、错误信息、Trace ID、发生时间。
```

页面 `/audit`：

```text
1. 登录日志。
2. 操作日志。
3. 安全事件。
4. 配置变更记录。
5. 筛选：用户、租户、模块、动作、时间范围、结果。
6. 详情：请求摘要、响应摘要、IP、User-Agent、Trace ID。
```

扩展要求：

1. 每个请求都生成 `request_id`。
2. 每次 Agent 调用都生成 `trace_id`。
3. OpenTelemetry 第一版可只接入 SDK 和 trace id 传播，后续接 Collector。
4. 审计日志必须结构化，便于后续写入 Loki/OpenSearch。

验收：

```text
可以查看 Agent 调用统计
可以按 trace_id 查询运行步骤
可以查询登录和操作审计
```

## 16. 阶段 M10：部署与交付

目标：让项目具备可演示、可部署、可持续迭代能力。

任务：

1. 完善 Dockerfile。
2. 完善 Docker Compose。
3. 增加数据库 migration 和 seed。
4. 增加本地启动脚本。
5. 增加健康检查。
6. 增加备份和恢复说明。
7. 增加部署文档。
8. 增加环境变量说明。

验收：

```text
docker compose -f deploy/docker-compose.yml up -d
Web Console 可访问
Control API 健康检查通过
Runtime 健康检查通过
默认管理员可以登录
基础 Agent 会话可以跑通
```

## 17. 阶段 M11：企业增强预留

目标：在 MVP 之后按需增强，不要提前复杂化 MVP。

增强项：

1. Temporal 文档处理工作流。
2. Temporal 高危工具审批工作流。
3. OpenTelemetry Collector、Prometheus、Grafana、Loki。
4. Qdrant 混合过滤优化。
5. OpenSearch 高级关键词检索。
6. 企业微信、钉钉、飞书发布渠道。
7. API Key 调用网关。
8. 成本中心和租户配额。
9. React Flow 工作流编排。
10. Kubernetes Helm Chart。

实现规则：

1. 每个增强项必须先补接口契约和数据库设计。
2. 增强项不得破坏 MVP 已有 API。
3. 高级能力通过 provider、adapter、worker、gateway 增量接入。

## 18. 数据库设计要求

所有核心表必须包含：

```sql
id uuid primary key
tenant_id uuid not null
created_at timestamp not null
updated_at timestamp not null
deleted_at timestamp null
created_by uuid null
updated_by uuid null
```

运行记录类表必须包含：

```sql
trace_id varchar(100)
run_id uuid
status varchar(30)
started_at timestamp
ended_at timestamp
duration_ms int
error_code varchar(100)
error_message text
```

索引要求：

```text
tenant_id
status
created_at
updated_at
deleted_at
业务 code 唯一索引，范围为 tenant_id + code
外键绑定表使用 tenant_id + source_id + target_id 组合索引
```

## 19. API 设计要求

统一响应格式：

```json
{
  "request_id": "req_xxx",
  "data": {},
  "error": null
}
```

统一错误格式：

```json
{
  "request_id": "req_xxx",
  "data": null,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found",
    "details": {}
  }
}
```

分页格式：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

接口规则：

1. 后端路径使用 `/api/v1`。
2. Runtime 路径使用 `/runtime`。
3. 列表接口统一支持 `page`、`page_size`、`keyword`、`status`。
4. 删除接口默认软删除。
5. 所有写接口必须记录操作日志。
6. OpenAPI 文档必须随接口更新。

## 20. 前端设计要求

控制台整体风格：

```text
企业级 SaaS 后台
左侧导航 + 顶部栏
紧凑表格
信息密度适中
白底为主
蓝色作为主色
状态色清晰
避免营销页风格
```

每个模块页面必须包含：

1. 顶部标题和主操作按钮。
2. 指标区。
3. 搜索和筛选区。
4. 数据表格。
5. 新建和编辑表单。
6. 删除确认。
7. 详情页。
8. 空状态。
9. 加载状态。
10. 错误状态。

组件抽象要求：

```text
DataTable
MetricCard
StatusBadge
ConfirmDialog
FormDrawer
JsonSchemaEditor
MonacoPromptEditor
RunTracePanel
ChatPanel
AuditTimeline
```

## 21. 安全要求

必须实现：

1. 密码哈希存储。
2. JWT 过期和刷新。
3. 租户隔离。
4. RBAC Guard。
5. API Key 脱敏。
6. Secret 加密存储。
7. 操作日志。
8. 登录日志。
9. CORS 白名单。
10. 请求体大小限制。

必须预留：

1. ABAC 数据权限。
2. Prompt Injection 检测。
3. PII 检测。
4. 输出脱敏。
5. 高危工具审批。
6. 租户配额和限流。

## 22. Provider 与 Adapter 扩展点

必须定义以下接口：

```text
ModelProviderAdapter
EmbeddingProviderAdapter
RerankProviderAdapter
ObjectStorageAdapter
VectorStoreAdapter
SearchStoreAdapter
ToolExecutorAdapter
WorkflowAdapter
TelemetryAdapter
NotificationAdapter
```

第一版实现：

```text
OpenAICompatibleModelProvider
LocalMockEmbeddingProvider
MinioObjectStorageAdapter
QdrantVectorStoreAdapter
OpenSearchStoreAdapter
HttpToolExecutorAdapter
MockWorkflowAdapter
ConsoleTelemetryAdapter
```

扩展规则：

1. 业务 service 依赖接口，不依赖具体 SDK。
2. provider 配置从数据库读取，不硬编码。
3. adapter 错误必须转换成统一业务错误码。
4. adapter 调用必须记录耗时和 trace_id。

## 23. 测试要求

每个阶段至少包含：

1. 后端单元测试。
2. 关键 API 集成测试。
3. 前端 typecheck。
4. 前端关键组件 smoke test。
5. Docker Compose 配置校验。

关键测试场景：

```text
登录成功和失败
租户隔离
Agent CRUD
Agent 发布版本
Prompt 变量渲染
模型 Key 脱敏
知识库上传和检索
工具参数校验
会话运行记录
审计日志写入
```

## 24. AI 执行方式

请按以下方式执行，不要跳阶段：

```text
M00 项目初始化
M01 基础框架与导航
M02 租户、用户与认证
M03 Agent 配置中心
M04 模型中心
M05 Prompt Center
M06 知识库中心
M07 工具中心
M08 会话中心与 Runtime
M09 监控与审计
M10 部署与交付
M11 企业增强预留
```

每个阶段的输出必须包含：

1. 本阶段完成了什么。
2. 修改了哪些主要目录。
3. 新增了哪些 API。
4. 新增了哪些表或 migration。
5. 前端新增了哪些页面和交互。
6. 测试命令和测试结果。
7. 当前遗留问题。
8. 下一阶段建议。

如果遇到选择题，按以下优先级自行决策：

```text
1. 保证 MVP 可运行。
2. 保证架构边界清晰。
3. 保证后续可替换真实服务。
4. 保证安全底线。
5. 保证开发速度。
```

## 25. 禁止事项

禁止：

1. 把 Runtime、Control Plane、Web Console 混成一个不可拆单体。
2. 在前端硬编码真实密钥。
3. 在 Runtime 中执行任意 Shell。
4. 绕过租户隔离直接查询全局数据。
5. 让 Agent 调用未绑定工具。
6. 不生成 migration 直接改数据库。
7. 不写审计日志直接修改关键配置。
8. 用 mock 数据冒充真实接口完成验收。
9. 在没有接口抽象的情况下直接绑定具体厂商 SDK。
10. 把高级功能提前塞进 MVP 导致主流程无法运行。

## 26. 第一轮立即执行 Prompt

将下面这段作为第一次执行指令：

```text
你现在在一个空仓库中。请按 AI_BUILD_PROMPT.md 的要求开始执行 M00。

本轮只完成 M00 项目初始化：
1. 初始化 pnpm monorepo。
2. 创建 apps/web、apps/control-api、apps/agent-runtime。
3. 配置基础 lint、typecheck、format。
4. 配置 Docker Compose，包含 postgres、redis、minio、qdrant、opensearch、temporal。
5. 创建 .env.example。
6. 创建 README.md，写清本地启动方式。

要求：
1. 所有目录结构必须为后续 M01-M11 保留扩展性。
2. 不要实现业务功能。
3. 不要写死真实密钥。
4. 完成后运行可用的校验命令，并汇报结果。
```

