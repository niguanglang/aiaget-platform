# Project UI Brief
# Project UI Brief

- 页面目标：将提示词中心从“列表 + 详情 + 表单 + 测试混合页”拆成清晰的产品后台信息架构。
- 路由边界：`/prompts` 为模板列表页，`/prompts/create` 为新建页，`/prompts/[id]` 为详情页，`/prompts/[id]/edit` 为编辑页。
- 目标用户：租户管理员、提示词管理员、Agent 管理员、审计/只读用户。
- 权限：写操作要求 `tenant_admin` 或 `prompt:template:manage`，列表和详情读取使用现有控制台鉴权。
- API：`listPromptTemplates`、`createPromptTemplate`、`getPromptTemplate`、`updatePromptTemplate`、`deletePromptTemplate`、`copyPromptTemplate`、`publishPromptTemplate`、`rollbackPromptTemplate`、`renderPromptTemplate`、`testPromptTemplate`、变量 CRUD、`listUsers`。
- 数据实体：`PromptTemplateListItem`、`PromptTemplateDetail`、`PromptVariableItem`、`PromptVersionItem`、`PromptTestRecordItem`、`PromptAgentReferenceItem`。
- 状态枚举：`DRAFT`、`PUBLISHED`、`DISABLED`、`ARCHIVED`；类型枚举：`SYSTEM`、`USER`、`ASSISTANT`、`TOOL`；测试状态：`SUCCESS`、`FAILED`。
- 列表页字段：模板名称/编码/预览、类型、状态、版本、变量数、测试数、智能体引用数、更新时间、行内操作。
- 详情页字段：基础资料、完整内容编辑器、变量、版本、渲染与测试、最近测试、智能体引用、审计活动。
- 页面状态：加载、空列表、接口错误、表单校验错误、无写权限禁用、删除二次确认。
- 组件库：Next.js App Router、React Query、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`。
- 视觉约束：企业 SaaS 后台，Bento/Dashboard 信息分区，细边框、轻阴影、backdrop blur，中文文案，克制动效。
- Page: Prompt Center IA
- Route: /prompts
- Feature goal: 提示词中心列表、详情、新增、编辑页面职责拆分
- APIs/services: TBD
- Entities/fields/statuses: TBD
- Existing components/design system: TBD
- Required states: loading, empty, error, validation, disabled, success, permission-denied
