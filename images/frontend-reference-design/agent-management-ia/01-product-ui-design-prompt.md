# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a production Enterprise Agent Platform console.

Project context:
- Product/module: 企业 Agent 平台 / Agent 管理
- Page/route: Agent 列表 at `/agents`
- Target users/roles: 租户管理员、Agent 管理员、只读查看用户
- Business goal: 快速查询、筛选、识别 Agent 状态，并进入详情、新建或编辑；列表页不承载完整详情。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style components, lucide icons, subtle card borders and restrained SaaS dashboard styling.
- Existing page shell/layout: 控制台左侧导航 + 顶部栏；页面宽度 `max-w-7xl`；白色卡片、细边框、轻阴影。

Interface contract that must appear in the UI:
- API/service functions: `listAgents`, `listAgentCategories`, `listUsers`, `deleteAgent`
- Main fields: Agent 名称、编码、状态、分类、版本、默认模型、负责人、更新时间、操作
- Status values: 草稿、测试中、待审核、已发布、已停用、已归档
- User actions: 新建 Agent、搜索、按状态/分类/负责人筛选、清空筛选、查看详情、编辑、删除
- Required states: loading, empty, error, disabled, permission-denied for write buttons

Design requirements:
- 列表页只做查询、筛选、概览、行内操作和进入详情/编辑。
- 顶部展示 4 个核心指标：智能体总数、已发布、草稿、已停用。
- 表格字段控制在核心识别字段与状态字段，不显示长文本详情、资源绑定、审计、版本详情。
- 行内按钮使用图标：查看、编辑、删除；生命周期、版本、资源绑定、调试和审计留到详情页。
- 删除智能体必须显示中文二次确认，不允许行内按钮直接触发删除接口。
- 详情页的发布、停用、归档、回滚必须使用确认弹窗，弹窗说明对调用、授权用户或当前配置的影响。
- 视觉风格极简、科技、企业级产品感；使用轻边框、soft shadow、克制动效。

Avoid: 把详情页、版本、资源绑定、审计日志或调试面板塞进列表页；过度渐变、廉价发光、大面积装饰；英文 UI 文案。
